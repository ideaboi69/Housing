from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from sqlalchemy import func, or_
import logging
from tables import get_db, Post, PostImage, User, Writer, PostVote, PostComment, PostCommentLike, StarredAuthor, NotificationPreferences

logger = logging.getLogger(__name__)
from Schemas.postSchema import PostCreate, PostUpdate, PostResponse, PostListResponse, PostCategory, PostStatus, PostImageResponse, PostImageReorder, CommentCreate, CommentResponse, CommentAuthor
from Utils.security import get_current_user, get_current_author, get_current_student, decode_access_token
from Utils.rate_limit import limiter
from Utils.cloudinary import upload_image_to_cloudinary, delete_image_from_cloudinary
from Utils.email import send_new_post_email
from helpers import generate_slug, get_owned_post, create_notification
from Utils.websocket import connection_manager
from Utils.cache import cached, invalidate
from config import settings

post_router = APIRouter()


def _get_optional_user_id(request: Request) -> Optional[int]:
    """Extract user_id from Bearer token if present, without raising on failure."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return None
    try:
        payload = decode_access_token(auth[7:])
        role = payload.get("role")
        if role == "student":
            return payload.get("user_id")
    except Exception:
        pass
    return None


def _attach_upvote_state(posts: list[Post], user_id: Optional[int], db: Session) -> list[dict]:
    """Serialize posts with upvote_count and user_has_upvoted."""
    voted_ids: set[int] = set()
    post_ids = [p.id for p in posts]
    if user_id:
        voted_ids = {
            row[0] for row in
            db.query(PostVote.post_id)
            .filter(PostVote.user_id == user_id, PostVote.post_id.in_(post_ids))
            .all()
        }

    comment_counts: dict[int, int] = {}
    top_comments: dict[int, str] = {}
    if post_ids:
        comment_counts = {
            post_id: count
            for post_id, count in (
                db.query(PostComment.post_id, func.count(PostComment.id))
                .filter(PostComment.post_id.in_(post_ids), PostComment.status == "active")
                .group_by(PostComment.post_id)
                .all()
            )
        }

        top_rows = (
            db.query(PostComment.post_id, PostComment.content, func.count(PostCommentLike.id).label("like_count"))
            .outerjoin(PostCommentLike, PostCommentLike.comment_id == PostComment.id)
            .filter(
                PostComment.post_id.in_(post_ids),
                PostComment.status == "active",
                PostComment.parent_comment_id.is_(None),
            )
            .group_by(PostComment.id, PostComment.post_id, PostComment.content, PostComment.created_at)
            .order_by(PostComment.post_id.asc(), func.count(PostCommentLike.id).desc(), PostComment.created_at.desc())
            .all()
        )
        for post_id, content, _ in top_rows:
            if post_id not in top_comments:
                top_comments[post_id] = content

    results = []
    for p in posts:
        data = PostListResponse.model_validate(p).model_dump()
        data["user_has_upvoted"] = p.id in voted_ids
        data["comment_count"] = comment_counts.get(p.id, 0)
        data["top_comment"] = top_comments.get(p.id)
        results.append(data)
    return results

# Create a post
@post_router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostCreate, db: Session = Depends(get_db), author=Depends(get_current_author)):
    post = Post(
        title=payload.title,
        slug=generate_slug(payload.title),
        content=payload.content,
        preview=payload.preview,
        category=payload.category,
        event_date=payload.event_date,
        event_location=payload.event_location,
        event_link=payload.event_link,
        deal_expires=payload.deal_expires,
        status=PostStatus.DRAFT,
    )

    if isinstance(author, User):
        post.user_id = author.id
    else:
        post.writer_id = author.id

    db.add(post)
    db.commit()
    db.refresh(post)

    return PostResponse.model_validate(post)

# Upload cover image
@post_router.post("/{post_id}/cover-image", response_model=PostResponse)
async def upload_cover_image(post_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), author=Depends(get_current_author)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if isinstance(author, User) and post.user_id != author.id:
        raise HTTPException(status_code=403, detail="Not your post")
    if isinstance(author, Writer) and post.writer_id != author.id:
        raise HTTPException(status_code=403, detail="Not your post")

    if post.cover_image_url:
        delete_image_from_cloudinary(post.cover_image_url)

    image_url = upload_image_to_cloudinary(file, folder=f"posts/{post_id}")
    post.cover_image_url = image_url
    db.commit()
    db.refresh(post)

    return PostResponse.model_validate(post)


def _assert_post_author(post: Post, author):
    """Raise 403 if the author doesn't own the post."""
    if isinstance(author, User) and post.user_id != author.id:
        raise HTTPException(status_code=403, detail="Not your post")
    if isinstance(author, Writer) and post.writer_id != author.id:
        raise HTTPException(status_code=403, detail="Not your post")


def _sync_cover_from_images(post: Post):
    """Mirror the primary gallery image (display_order 0) into cover_image_url so
    every existing cover render path keeps working. Clears it when no images remain."""
    primary = next((img for img in post.images if img.is_primary), None)
    if primary is None and post.images:
        primary = min(post.images, key=lambda i: i.display_order)
        primary.is_primary = True
    post.cover_image_url = primary.image_url if primary else None


# Upload one or more gallery images (the first uploaded becomes the cover)
@post_router.post("/{post_id}/images", status_code=status.HTTP_201_CREATED, response_model=list[PostImageResponse])
async def upload_post_images(post_id: int, files: list[UploadFile] = File(...), db: Session = Depends(get_db), author=Depends(get_current_author)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    _assert_post_author(post, author)

    existing_count = len(post.images)
    if existing_count + len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum 10 images allowed. You have {existing_count}, trying to add {len(files)}.",
        )

    created = []
    for i, file in enumerate(files):
        image_url = upload_image_to_cloudinary(file, folder=f"posts/{post_id}")
        image = PostImage(
            post_id=post.id,
            image_url=image_url,
            is_primary=(existing_count == 0 and i == 0),
            display_order=existing_count + i,
        )
        db.add(image)
        created.append(image)

    db.flush()
    db.refresh(post)
    _sync_cover_from_images(post)
    db.commit()
    for img in created:
        db.refresh(img)

    invalidate("posts:list")
    return [PostImageResponse.model_validate(img) for img in created]


# Reorder gallery images — pass every image id in the desired order; index 0 = cover
@post_router.patch("/{post_id}/images/reorder", response_model=list[PostImageResponse])
def reorder_post_images(post_id: int, payload: PostImageReorder, db: Session = Depends(get_db), author=Depends(get_current_author)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    _assert_post_author(post, author)

    images = db.query(PostImage).filter(PostImage.post_id == post.id).all()
    if {img.id for img in images} != set(payload.image_ids):
        raise HTTPException(
            status_code=400,
            detail="image_ids must contain every image on this post exactly once",
        )

    image_by_id = {img.id: img for img in images}
    for new_order, image_id in enumerate(payload.image_ids):
        img = image_by_id[image_id]
        img.display_order = new_order
        img.is_primary = (new_order == 0)

    db.refresh(post)
    _sync_cover_from_images(post)
    db.commit()

    ordered = sorted(images, key=lambda img: img.display_order)
    invalidate("posts:list")
    return [PostImageResponse.model_validate(img) for img in ordered]


# Delete a single gallery image
@post_router.delete("/{post_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post_image(post_id: int, image_id: int, db: Session = Depends(get_db), author=Depends(get_current_author)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    _assert_post_author(post, author)

    image = db.query(PostImage).filter(PostImage.id == image_id, PostImage.post_id == post.id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    delete_image_from_cloudinary(image.image_url)
    db.delete(image)
    db.flush()

    # Resequence remaining images and re-point the cover.
    remaining = sorted(
        (img for img in post.images if img.id != image_id),
        key=lambda i: i.display_order,
    )
    for order, img in enumerate(remaining):
        img.display_order = order
        img.is_primary = (order == 0)
    db.refresh(post)
    _sync_cover_from_images(post)
    db.commit()
    invalidate("posts:list")

# Get all published posts (public)
@post_router.get("/")
def get_all_posts(request: Request, category: Optional[PostCategory] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Post).filter(Post.status == PostStatus.PUBLISHED)

    if category:
        query = query.filter(Post.category == category)

    posts = query.order_by(Post.created_at.desc()).all()
    user_id = _get_optional_user_id(request)
    return _attach_upvote_state(posts, user_id, db)

@post_router.get("/featured", response_model=list[PostListResponse])
def get_featured_posts(request: Request, db: Session = Depends(get_db)):
    today = date.today()
    posts = (
        db.query(Post)
        .filter(
            Post.status == PostStatus.PUBLISHED,
            Post.is_featured == True,
            or_(Post.featured_until.is_(None), Post.featured_until >= today),
        )
        .order_by(Post.featured_order.asc().nullslast(), Post.created_at.desc())
        .limit(6)
        .all()
    )
    user_id = _get_optional_user_id(request)
    return _attach_upvote_state(posts, user_id, db)

# Get my posts (author's own posts)
@post_router.get("/my/posts", response_model=list[PostListResponse])
def get_my_posts(db: Session = Depends(get_db), author=Depends(get_current_author)):
    if isinstance(author, User):
        posts = db.query(Post).filter(Post.user_id == author.id)
    else:
        posts = db.query(Post).filter(Post.writer_id == author.id)

    posts = posts.order_by(Post.created_at.desc()).all()
    return [PostListResponse.model_validate(p) for p in posts]

# Get my draft posts
@post_router.get("/drafts/my", response_model=list[PostListResponse])
def get_my_draft_posts(db: Session = Depends(get_db), author=Depends(get_current_author)):
    if isinstance(author, User):
        posts = db.query(Post).filter(Post.user_id == author.id, Post.status == PostStatus.DRAFT)
    else:
        posts = db.query(Post).filter(Post.writer_id == author.id, Post.status == PostStatus.DRAFT)

    posts = posts.order_by(Post.created_at.desc()).all()
    return [PostListResponse.model_validate(p) for p in posts]

# Filter posts by status
@post_router.get("/my/published", response_model=list[PostListResponse])
def get_my_published_posts(db: Session = Depends(get_db), author = Depends(get_current_author)):
    if isinstance(author, User):
        posts = db.query(Post).filter(Post.user_id == author.id, Post.status == PostStatus.PUBLISHED)
    else:
        posts = db.query(Post).filter(Post.writer_id == author.id, Post.status == PostStatus.PUBLISHED)

    posts = posts.order_by(Post.created_at.desc()).all()
    return [PostListResponse.model_validate(p) for p in posts]

@post_router.get("/my/archived", response_model=list[PostListResponse])
def get_my_archived_posts(db: Session = Depends(get_db), author = Depends(get_current_author)):
    if isinstance(author, User):
        posts = db.query(Post).filter(Post.user_id == author.id, Post.status == PostStatus.ARCHIVED)
    else:
        posts = db.query(Post).filter(Post.writer_id == author.id, Post.status == PostStatus.ARCHIVED)

    posts = posts.order_by(Post.created_at.desc()).all()
    return [PostListResponse.model_validate(p) for p in posts]

# Stats
@post_router.get("/my/stats")
def get_my_post_stats(db: Session = Depends(get_db), author = Depends(get_current_author)):
    if isinstance(author, User):
        posts = db.query(Post).filter(Post.user_id == author.id).all()
    else:
        posts = db.query(Post).filter(Post.writer_id == author.id).all()

    drafts = [p for p in posts if p.status == PostStatus.DRAFT]
    published = [p for p in posts if p.status == PostStatus.PUBLISHED]
    archived = [p for p in posts if p.status == PostStatus.ARCHIVED]

    total_views = sum(p.view_count for p in posts)

    category_breakdown = {}
    for p in posts:
        cat = p.category.value if p.category else "other"
        if cat not in category_breakdown:
            category_breakdown[cat] = {"count": 0, "views": 0}
        category_breakdown[cat]["count"] += 1
        category_breakdown[cat]["views"] += p.view_count

    top_posts = sorted(published, key=lambda p: p.view_count, reverse=True)[:5]

    return {
        "total_posts": len(posts),
        "published": len(published),
        "drafts": len(drafts),
        "archived": len(archived),
        "total_views": total_views,
        "avg_views": round(total_views / len(published), 1) if published else 0,
        "category_breakdown": category_breakdown,
        "top_posts": [
            {
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "view_count": p.view_count,
                "category": p.category.value if p.category else None,
                "created_at": p.created_at.isoformat(),
            }
            for p in top_posts
        ],
    }

# Search posts
@post_router.get("/search/posts")
def search_posts(request: Request, q: str = Query(..., min_length=1), category: Optional[PostCategory] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Post).filter(Post.status == PostStatus.PUBLISHED, Post.title.ilike(f"%{q}%") | Post.content.ilike(f"%{q}%"))

    if category:
        query = query.filter(Post.category == category)

    posts = query.order_by(Post.created_at.desc()).all()
    user_id = _get_optional_user_id(request)
    return _attach_upvote_state(posts, user_id, db)

# Starred Authors
@post_router.post("/authors/student/{author_id}/star", status_code=status.HTTP_201_CREATED)
def star_student_author(author_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    if author_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't star yourself")
    author = db.query(User).filter(User.id == author_id, User.is_writable == True).first()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    existing = db.query(StarredAuthor).filter(StarredAuthor.user_id == current_user.id, StarredAuthor.author_user_id == author_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already starred")
    star = StarredAuthor(user_id=current_user.id, author_user_id=author_id)
    db.add(star)
    db.commit()
    return {"message": "Author starred", "author_type": "student", "author_id": author_id}

@post_router.delete("/authors/student/{author_id}/star", status_code=status.HTTP_200_OK)
def unstar_student_author(author_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    star = db.query(StarredAuthor).filter(StarredAuthor.user_id == current_user.id, StarredAuthor.author_user_id == author_id).first()
    if not star:
        raise HTTPException(status_code=404, detail="Not starred")
    db.delete(star)
    db.commit()
    return {"message": "Author unstarred", "author_type": "student", "author_id": author_id}

@post_router.post("/authors/writer/{author_id}/star", status_code=status.HTTP_201_CREATED)
def star_writer_author(author_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    author = db.query(Writer).filter(Writer.id == author_id).first()
    if not author:
        raise HTTPException(status_code=404, detail="Writer not found")
    existing = db.query(StarredAuthor).filter(StarredAuthor.user_id == current_user.id, StarredAuthor.author_writer_id == author_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already starred")
    star = StarredAuthor(user_id=current_user.id, author_writer_id=author_id)
    db.add(star)
    db.commit()
    return {"message": "Writer starred", "author_type": "writer", "author_id": author_id}

@post_router.delete("/authors/writer/{author_id}/star", status_code=status.HTTP_200_OK)
def unstar_writer_author(author_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    star = db.query(StarredAuthor).filter(StarredAuthor.user_id == current_user.id, StarredAuthor.author_writer_id == author_id).first()
    if not star:
        raise HTTPException(status_code=404, detail="Not starred")
    db.delete(star)
    db.commit()
    return {"message": "Writer unstarred", "author_type": "writer", "author_id": author_id}

@post_router.get("/authors/starred")
def get_starred_authors(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    stars = db.query(StarredAuthor).filter(StarredAuthor.user_id == current_user.id).all()
    result = []
    for s in stars:
        if s.author_user_id:
            author = s.author_user
            if author:
                result.append({
                    "id": s.id,
                    "author_type": "student",
                    "author_id": author.id,
                    "author_name": f"{author.first_name} {author.last_name}",
                    "profile_photo_url": author.profile_photo_url,
                    "starred_at": s.created_at.isoformat() if s.created_at else None,
                })
        elif s.author_writer_id:
            author = s.author_writer
            if author:
                result.append({
                    "id": s.id,
                    "author_type": "writer",
                    "author_id": author.id,
                    "author_name": f"{author.first_name} {author.last_name}",
                    "business_name": author.business_name,
                    "profile_photo_url": author.profile_photo_url,
                    "is_official": author.is_official,
                    "starred_at": s.created_at.isoformat() if s.created_at else None,
                })
    return result

# Get posts by author (If someone clicks on the writer's name to see their other posts)
@post_router.get("/author/student/{user_id}") # User
def get_posts_by_student(user_id: int, request: Request, db: Session = Depends(get_db)):
    posts = db.query(Post).filter(Post.user_id == user_id, Post.status == PostStatus.PUBLISHED).order_by(Post.created_at.desc()).all()
    current_user_id = _get_optional_user_id(request)
    return _attach_upvote_state(posts, current_user_id, db)

@post_router.get("/author/writer/{writer_id}") # External Writer
def get_posts_by_writer(writer_id: int, request: Request, db: Session = Depends(get_db)):
    posts = db.query(Post).filter(Post.writer_id == writer_id, Post.status == PostStatus.PUBLISHED).order_by(Post.created_at.desc()).all()
    current_user_id = _get_optional_user_id(request)
    return _attach_upvote_state(posts, current_user_id, db)

# Upvote a post
@post_router.post("/{post_id}/upvote", status_code=status.HTTP_201_CREATED)
def upvote_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    post = db.query(Post).filter(Post.id == post_id, Post.status == PostStatus.PUBLISHED).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.query(PostVote).filter(PostVote.post_id == post_id, PostVote.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already upvoted")

    vote = PostVote(post_id=post_id, user_id=current_user.id)
    db.add(vote)
    db.commit()

    count = db.query(func.count(PostVote.id)).filter(PostVote.post_id == post_id).scalar()
    return {"post_id": post_id, "upvote_count": count, "user_has_upvoted": True}

# Remove upvote
@post_router.delete("/{post_id}/upvote", status_code=status.HTTP_200_OK)
def remove_upvote(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    vote = db.query(PostVote).filter(PostVote.post_id == post_id, PostVote.user_id == current_user.id).first()
    if not vote:
        raise HTTPException(status_code=404, detail="You haven't upvoted this post")

    db.delete(vote)
    db.commit()

    count = db.query(func.count(PostVote.id)).filter(PostVote.post_id == post_id).scalar()
    return {"post_id": post_id, "upvote_count": count, "user_has_upvoted": False}

# Get post by slug (public)
@post_router.get("/{slug}")
def get_post_by_slug(slug: str, request: Request, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.view_count += 1
    db.commit()
    db.refresh(post)

    user_id = _get_optional_user_id(request)
    data = PostResponse.model_validate(post).model_dump()
    if user_id:
        has_voted = db.query(PostVote).filter(PostVote.post_id == post.id, PostVote.user_id == user_id).first() is not None
        data["user_has_upvoted"] = has_voted
    return data

# Update Post
@post_router.patch("/{post_id}", response_model=PostResponse)
def update_post(post_id: int, payload: PostUpdate, db: Session = Depends(get_db), author=Depends(get_current_author)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if isinstance(author, User) and post.user_id != author.id:
        raise HTTPException(status_code=403, detail="Not your post")
    if isinstance(author, Writer) and post.writer_id != author.id:
        raise HTTPException(status_code=403, detail="Not your post")

    update_data = payload.model_dump(exclude_unset=True)

    if "title" in update_data:
        post.slug = generate_slug(update_data["title"])

    for field, value in update_data.items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)

    invalidate("posts:list")
    return PostResponse.model_validate(post)

# Delete Post
@post_router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db), author=Depends(get_current_author)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if isinstance(author, User) and post.user_id != author.id:
        raise HTTPException(status_code=403, detail="Not your post")
    if isinstance(author, Writer) and post.writer_id != author.id:
        raise HTTPException(status_code=403, detail="Not your post")

    if post.cover_image_url:
        delete_image_from_cloudinary(post.cover_image_url)
    for image in post.images:
        delete_image_from_cloudinary(image.image_url)

    db.delete(post)
    db.commit()
    invalidate("posts:list")

# Publish
@post_router.patch("/{post_id}/publish", response_model=PostResponse)
def publish_post(post_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), author = Depends(get_current_author)):
    post = get_owned_post(post_id, author, db)

    if post.status != PostStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only drafts can be published")

    post.status = PostStatus.PUBLISHED
    db.commit()
    db.refresh(post)

    invalidate("posts:list")

    # Send notifications to starred followers + bubble toggle users for official writer
    notify_post_followers(post, author, db, background_tasks)

    return PostResponse.model_validate(post)


def notify_post_followers(post: Post, author, db: Session, background_tasks: BackgroundTasks):
    """Send email notifications for a newly published post."""
    try:
        author_name = f"{author.first_name} {author.last_name}"
        post_url = f"{settings.FRONTEND_URL}/the-bubble/{post.slug}"
        is_official_post = isinstance(author, Writer) and author.is_official

        logger.info(f"[notify] Post '{post.title}' by {author_name} (type={type(author).__name__}, id={author.id}, official={is_official_post})")

        user_ids_to_notify: set[int] = set()

        if isinstance(author, User):
            starred = db.query(StarredAuthor.user_id).filter(StarredAuthor.author_user_id == author.id).all()
        else:
            starred = db.query(StarredAuthor.user_id).filter(StarredAuthor.author_writer_id == author.id).all()
        for (uid,) in starred:
            user_ids_to_notify.add(uid)

        logger.info(f"[notify] Starred followers: {user_ids_to_notify}")

        if is_official_post:
            bubble_users = db.query(NotificationPreferences.user_id).filter(
                NotificationPreferences.notify_bubble_posts == True
            ).all()
            for (uid,) in bubble_users:
                user_ids_to_notify.add(uid)

        if not user_ids_to_notify:
            logger.info("[notify] No users to notify — exiting early (no starred followers)")
            return

        if isinstance(author, User):
            user_ids_to_notify.discard(author.id)

        if not is_official_post and user_ids_to_notify:
            # Remove users who explicitly opted out; users with no preferences row default to opted-in
            opted_out = db.query(NotificationPreferences.user_id).filter(
                NotificationPreferences.user_id.in_(user_ids_to_notify),
                NotificationPreferences.notify_bubble_posts == False
            ).all()
            opted_out_ids = {uid for (uid,) in opted_out}
            logger.info(f"[notify] Opted-out users: {opted_out_ids}")
            for uid in opted_out_ids:
                user_ids_to_notify.discard(uid)

        if not user_ids_to_notify:
            logger.info("[notify] No users to notify after opt-out filter")
            return

        # Fetch emails
        users = db.query(User).filter(User.id.in_(user_ids_to_notify), User.email_verified == True).all()
        logger.info(f"[notify] Sending emails to {len(users)} verified users: {[u.email for u in users]}")
        for user in users:
            background_tasks.add_task(
                send_new_post_email,
                to_email=user.email,
                recipient_name=user.first_name,
                author_name=author_name,
                post_title=post.title,
                post_url=post_url,
                is_official=is_official_post,
            )
    except Exception as e:
        logger.error(f"[notify] Error in notify_post_followers: {e}", exc_info=True)

# Unpublish
@post_router.patch("/{post_id}/unpublish", response_model=PostResponse)
def unpublish_post(post_id: int, db: Session = Depends(get_db), author = Depends(get_current_author)):
    post = get_owned_post(post_id, author, db)

    if post.status != PostStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Only published posts can be unpublished")

    post.status = PostStatus.DRAFT
    post.is_featured = False
    post.featured_order = None
    post.featured_until = None
    db.commit()
    db.refresh(post)

    invalidate("posts:list")
    return PostResponse.model_validate(post)

# Archive
@post_router.patch("/{post_id}/archive", response_model=PostResponse)
def archive_post( post_id: int, db: Session = Depends(get_db), author = Depends(get_current_author)):
    post = get_owned_post(post_id, author, db)

    if post.status == PostStatus.ARCHIVED:
        raise HTTPException(status_code=400, detail="Post is already archived")

    post.status = PostStatus.ARCHIVED
    post.is_featured = False
    post.featured_order = None
    post.featured_until = None
    db.commit()
    db.refresh(post)

    invalidate("posts:list")
    return PostResponse.model_validate(post)

# Unarchive
@post_router.patch("/{post_id}/unarchive", response_model=PostResponse)
def unarchive_post(post_id: int, db: Session = Depends(get_db), author = Depends(get_current_author)):
    post = get_owned_post(post_id, author, db)

    if post.status != PostStatus.ARCHIVED:
        raise HTTPException(status_code=400, detail="Post is not archived")

    post.status = PostStatus.PUBLISHED
    db.commit()
    db.refresh(post)

    invalidate("posts:list")
    return PostResponse.model_validate(post)


# ════════════════════════════════════════════════════════
# Comments (Bubble replies) + likes
# ════════════════════════════════════════════════════════

def _comment_author(u: Optional[User]) -> Optional[CommentAuthor]:
    if not u:
        return None
    return CommentAuthor(id=u.id, first_name=u.first_name, last_name=u.last_name, profile_photo_url=u.profile_photo_url, is_early_adopter=u.is_early_adopter)


def _serialize_comments(post_id: int, viewer_id: Optional[int], db: Session) -> list[CommentResponse]:
    comments = db.query(PostComment).filter(PostComment.post_id == post_id).order_by(PostComment.created_at.asc()).all()
    if not comments:
        return []
    ids = [c.id for c in comments]

    like_counts = {cid: n for cid, n in db.query(PostCommentLike.comment_id, func.count(PostCommentLike.id)).filter(PostCommentLike.comment_id.in_(ids)).group_by(PostCommentLike.comment_id).all()}
    liked: set[int] = set()
    if viewer_id:
        liked = {cid for (cid,) in db.query(PostCommentLike.comment_id).filter(PostCommentLike.user_id == viewer_id, PostCommentLike.comment_id.in_(ids)).all()}
    authors = {u.id: u for u in db.query(User).filter(User.id.in_({c.author_user_id for c in comments})).all()}

    children: dict[int, list] = {}
    tops = []
    for c in comments:
        if c.parent_comment_id:
            children.setdefault(c.parent_comment_id, []).append(c)
        else:
            tops.append(c)

    def node(c: PostComment) -> CommentResponse:
        deleted = c.status == "deleted"
        return CommentResponse(
            id=c.id,
            post_id=c.post_id,
            parent_comment_id=c.parent_comment_id,
            content="[deleted]" if deleted else c.content,
            created_at=c.created_at,
            author=None if deleted else _comment_author(authors.get(c.author_user_id)),
            like_count=0 if deleted else like_counts.get(c.id, 0),
            liked_by_me=False if deleted else (c.id in liked),
            reply_count=0,
            replies=[],
        )

    result: list[CommentResponse] = []
    for c in tops:
        active_replies = [r for r in children.get(c.id, []) if r.status != "deleted"]
        if c.status == "deleted" and not active_replies:
            continue  # drop deleted comments that have no surviving replies
        n = node(c)
        n.replies = [node(r) for r in active_replies]
        n.reply_count = len(n.replies)
        result.append(n)
    return result


@post_router.get("/{post_id}/comments", response_model=list[CommentResponse])
def list_post_comments(request: Request, post_id: int, db: Session = Depends(get_db)):
    viewer_id = _get_optional_user_id(request)
    return _serialize_comments(post_id, viewer_id, db)


@post_router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def create_post_comment(request: Request, post_id: int, payload: CommentCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment can't be empty")
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="Comment is too long (2000 characters max)")

    post = db.query(Post).filter(Post.id == post_id, Post.status == PostStatus.PUBLISHED).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    parent_id = payload.parent_comment_id
    replied_to_author = None  # who to notify for a reply (the comment they actually replied to)
    if parent_id is not None:
        parent = db.query(PostComment).filter(PostComment.id == parent_id, PostComment.post_id == post_id, PostComment.status == "active").first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        replied_to_author = parent.author_user_id
        # One level of nesting: a reply to a reply attaches to the top-level parent.
        if parent.parent_comment_id is not None:
            parent_id = parent.parent_comment_id

    comment = PostComment(post_id=post_id, author_user_id=current_user.id, parent_comment_id=parent_id, content=content)
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # In-app notifications (no email). Never notify yourself; notify each person once.
    actor = f"{current_user.first_name} {current_user.last_name}"
    link = f"/the-bubble/{post.slug}"
    preview = content[:120]
    notified: set[int] = {current_user.id}

    def _notify(uid, ntype, title):
        if uid is None or uid in notified:
            return
        notified.add(uid)
        create_notification(db, user_id=uid, type=ntype, title=title, body=preview, link=link, actor_name=actor)
        background_tasks.add_task(connection_manager.send_to_user, "student", uid, {"type": "notification"})

    if replied_to_author is not None:
        _notify(replied_to_author, "comment_reply", f"{actor} replied to your comment")
    # Post author (only student-authored posts land in the student feed)
    _notify(post.user_id, "post_comment", f"{actor} commented on your post")
    db.commit()

    return CommentResponse(
        id=comment.id,
        post_id=post_id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
        created_at=comment.created_at,
        author=_comment_author(current_user),
        like_count=0,
        liked_by_me=False,
        reply_count=0,
        replies=[],
    )


@post_router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post_comment(comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    comment = db.query(PostComment).filter(PostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comment")
    comment.status = "deleted"
    db.commit()


@post_router.post("/comments/{comment_id}/like")
@limiter.limit("60/minute")
def toggle_comment_like(request: Request, comment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    comment = db.query(PostComment).filter(PostComment.id == comment_id, PostComment.status == "active").first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    existing = db.query(PostCommentLike).filter(PostCommentLike.comment_id == comment_id, PostCommentLike.user_id == current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
        liked = False
    else:
        db.add(PostCommentLike(comment_id=comment_id, user_id=current_user.id))
        db.commit()
        liked = True
    count = db.query(func.count(PostCommentLike.id)).filter(PostCommentLike.comment_id == comment_id).scalar()
    return {"comment_id": comment_id, "like_count": count, "liked_by_me": liked}
