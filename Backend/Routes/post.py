from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import func
from tables import get_db, Post, User, Writer, PostVote
from Schemas.postSchema import PostCreate, PostUpdate, PostResponse, PostListResponse, PostCategory, PostStatus
from Utils.security import get_current_user, get_current_author, get_current_student
from Utils.cloudinary import upload_image_to_cloudinary, delete_image_from_cloudinary
from helpers import generate_slug, get_owned_post
post_router = APIRouter()

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

# Get all published posts (public)
@post_router.get("/", response_model=list[PostListResponse])
def get_all_posts(category: Optional[PostCategory] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Post).filter(Post.status == PostStatus.PUBLISHED)

    if category:
        query = query.filter(Post.category == category)

    posts = query.order_by(Post.created_at.desc()).all()
    return [PostListResponse.model_validate(p) for p in posts]

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
@post_router.get("/search/posts", response_model=list[PostListResponse])
def search_posts(q: str = Query(..., min_length=1), category: Optional[PostCategory] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Post).filter(Post.status == PostStatus.PUBLISHED, Post.title.ilike(f"%{q}%") | Post.content.ilike(f"%{q}%"))

    if category:
        query = query.filter(Post.category == category)

    posts = query.order_by(Post.created_at.desc()).all()
    return [PostListResponse.model_validate(p) for p in posts]

# Get posts by author (If someone clicks on the writer's name to see their other posts)
@post_router.get("/author/student/{user_id}", response_model=list[PostListResponse]) # User
def get_posts_by_student(user_id: int, db: Session = Depends(get_db)):
    posts = db.query(Post).filter(Post.user_id == user_id, Post.status == PostStatus.PUBLISHED).order_by(Post.created_at.desc()).all()

    return [PostListResponse.model_validate(p) for p in posts]

@post_router.get("/author/writer/{writer_id}", response_model=list[PostListResponse]) # External Writer
def get_posts_by_writer(writer_id: int, db: Session = Depends(get_db)):
    posts = db.query(Post).filter(Post.writer_id == writer_id, Post.status == PostStatus.PUBLISHED).order_by(Post.created_at.desc()).all()

    return [PostListResponse.model_validate(p) for p in posts]

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
@post_router.get("/{slug}", response_model=PostResponse)
def get_post_by_slug(slug: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.view_count += 1
    db.commit()

    return PostResponse.model_validate(post)

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

    db.delete(post)
    db.commit()

# Publish
@post_router.patch("/{post_id}/publish", response_model=PostResponse)
def publish_post(post_id: int, db: Session = Depends(get_db), author = Depends(get_current_author)):
    post = get_owned_post(post_id, author, db)

    if post.status != PostStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only drafts can be published")

    post.status = PostStatus.PUBLISHED
    db.commit()
    db.refresh(post)

    return PostResponse.model_validate(post)

# Unpublish
@post_router.patch("/{post_id}/unpublish", response_model=PostResponse)
def unpublish_post(post_id: int, db: Session = Depends(get_db), author = Depends(get_current_author)):
    post = get_owned_post(post_id, author, db)

    if post.status != PostStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Only published posts can be unpublished")

    post.status = PostStatus.DRAFT
    db.commit()
    db.refresh(post)

    return PostResponse.model_validate(post)

# Archive
@post_router.patch("/{post_id}/archive", response_model=PostResponse)
def archive_post( post_id: int, db: Session = Depends(get_db), author = Depends(get_current_author)):
    post = get_owned_post(post_id, author, db)

    if post.status == PostStatus.ARCHIVED:
        raise HTTPException(status_code=400, detail="Post is already archived")

    post.status = PostStatus.ARCHIVED
    db.commit()
    db.refresh(post)

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

    return PostResponse.model_validate(post)