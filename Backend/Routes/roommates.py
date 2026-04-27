from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import Optional
from tables import *
from Schemas.roommateSchema import *
from helpers import *
from Utils.security import get_current_student
from Utils.roommate import build_group_card, build_group_detail, build_invite_response, build_listing_detail, build_request_response
from Utils.cloudinary import upload_image_to_cloudinary, delete_image_from_cloudinary

roommate_router = APIRouter()

REQUIRED_FIELDS = ["first_name", "last_name", "program", "year"]

# Profile check (popup flow)
@roommate_router.get("/profile-check", response_model=ProfileCompletionCheck)
def check_profile_completion(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    fields = {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "program": current_user.program,
        "year": current_user.year.value if current_user.year else None,
        "bio": current_user.bio,
        "profile_photo_url": current_user.profile_photo_url,
    }

    missing = [f for f in REQUIRED_FIELDS if not fields.get(f)]

    housing_prefs = db.query(UserHousingPreferences).filter(UserHousingPreferences.user_id == current_user.id).first()

    if housing_prefs and housing_prefs.budget:
        budget = float(housing_prefs.budget)
        if budget < 500:
            fields["suggested_budget_range"] = "under_500"
        elif budget < 650:
            fields["suggested_budget_range"] = "500_650"
        elif budget < 800:
            fields["suggested_budget_range"] = "650_800"
        else:
            fields["suggested_budget_range"] = "800_plus"

    return ProfileCompletionCheck(
        is_complete=len(missing) == 0,
        fields=fields,
        missing_fields=missing,
    )

@roommate_router.patch("/complete-profile", response_model=ProfileCompletionCheck)
def complete_profile_for_roommates(payload: ProfileCompletionSubmit, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    update_data = payload.model_dump(exclude_unset=True)

    if "year" in update_data and update_data["year"]:
        try:
            update_data["year"] = StudentYear(update_data["year"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid year value")

    for field, value in update_data.items():
        if value is not None:
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    fields = {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "program": current_user.program,
        "year": current_user.year.value if current_user.year else None,
        "bio": current_user.bio,
        "profile_photo_url": current_user.profile_photo_url,
    }

    missing = [f for f in REQUIRED_FIELDS if not fields.get(f)]

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Still missing: {', '.join(missing)}",
        )

    return ProfileCompletionCheck(
        is_complete=True,
        fields=fields,
        missing_fields=[],
    )

# Quiz
@roommate_router.post("/quiz", response_model=RoommateProfileResponse, status_code=status.HTTP_201_CREATED)
def submit_quiz(payload: QuizSubmit, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    if not current_user.year or not current_user.program:
        raise HTTPException(
            status_code=400,
            detail="Complete your profile first (year and program are required)",
        )

    profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == current_user.id).first()

    if profile:
        for field, value in payload.model_dump().items():
            setattr(profile, field, value)
        profile.quiz_completed = True
    else:
        profile = RoommateProfile(
            user_id=current_user.id,
            quiz_completed=True,
            **payload.model_dump(),
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)

    return RoommateProfileResponse.model_validate(profile)

@roommate_router.get("/quiz/me", response_model=RoommateProfileResponse)
def get_my_quiz(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == current_user.id).first()

    if not profile:
        return RoommateProfileResponse(
            id=0,
            user_id=current_user.id,
            is_visible=True,
            quiz_completed=False,
            lifestyle_tags=[],
            created_at=current_user.created_at,
        )

    return RoommateProfileResponse.model_validate(profile)

# Individual
@roommate_router.patch("/visibility")
def toggle_visibility (payload: VisibilityUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Take the quiz first")

    profile.is_visible = payload.is_visible
    db.commit()

    return {"is_visible": profile.is_visible}

# Groups
@roommate_router.post("/groups", response_model=GroupDetailResponse, status_code=status.HTTP_201_CREATED)
def create_group(payload: GroupCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == current_user.id,RoommateProfile.quiz_completed == True).first()

    if not profile:
        raise HTTPException(status_code=403, detail="Complete the quiz first")

    existing = db.query(RoommateGroup).filter(RoommateGroup.owner_id == current_user.id,RoommateGroup.is_active == True).first()

    if existing:
        raise HTTPException(status_code=409, detail="You already have an active group")

    group = RoommateGroup(
        owner_id=current_user.id,
        name=payload.name,
        description=payload.description,
        current_size=payload.current_size,
        spots_needed=payload.spots_needed,
        total_capacity=payload.current_size + payload.spots_needed,
        rent_per_person=payload.rent_per_person,
        utilities_included=payload.utilities_included,
        move_in_timing=payload.move_in_timing,
        gender_preference=payload.gender_preference,
        has_place=payload.has_place,
        address=payload.address,
    )
    db.add(group)
    db.flush()

    owner_member = RoommateGroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role=GroupMemberRole.OWNER,
    )
    db.add(owner_member)
    db.commit()
    db.refresh(group)

    return build_group_detail(group, db)

@roommate_router.patch("/groups/{group_id}", response_model=GroupDetailResponse)
def update_group(group_id: int, payload: GroupUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id, RoommateGroup.owner_id == current_user.id).first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    update_data = payload.model_dump(exclude_unset=True)

    if "spots_needed" in update_data:
        active_count = len([m for m in group.members if m.is_active])
        update_data["total_capacity"] = active_count + update_data["spots_needed"]

    for field, value in update_data.items():
        setattr(group, field, value)

    db.commit()
    db.refresh(group)

    return build_group_detail(group, db)

# Set group visibility (owner only)
@roommate_router.patch("/groups/{group_id}/visibility")
def set_group_visibility(group_id: int, payload: VisibilityUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id, RoommateGroup.owner_id == current_user.id).first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    group.is_visible = payload.is_visible
    db.commit()

    return {"is_visible": group.is_visible}

@roommate_router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id, RoommateGroup.owner_id == current_user.id).first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    db.delete(group)
    db.commit()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
 
# Upload group photo (owner only)
@roommate_router.post("/groups/{group_id}/photo", status_code=status.HTTP_200_OK)
async def upload_group_photo(group_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id, RoommateGroup.owner_id == current_user.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found or not yours")
 
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid image type. Allowed: JPEG, PNG, WebP")
 
    if group.group_photo_url:
        delete_image_from_cloudinary(group.group_photo_url)
 
    image_url = upload_image_to_cloudinary(file, folder=f"roommate-groups/{group_id}")
    group.group_photo_url = image_url
    db.commit()
 
    return {"group_photo_url": image_url}
 
# Delete group photo (owner only)
@roommate_router.delete("/groups/{group_id}/photo", status_code=status.HTTP_200_OK)
def delete_group_photo(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id, RoommateGroup.owner_id == current_user.id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found or not yours")
 
    if not group.group_photo_url:
        raise HTTPException(status_code=400, detail="No group photo to delete")
 
    delete_image_from_cloudinary(group.group_photo_url)
    group.group_photo_url = None
    db.commit()
 
    return {"message": "Group photo removed"}

@roommate_router.get("/groups/my/group", response_model=GroupDetailResponse)
def get_my_group(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.owner_id == current_user.id, RoommateGroup.is_active == True).first()

    if not group:
        member_record = db.query(RoommateGroupMember).filter(
            RoommateGroupMember.user_id == current_user.id,
            RoommateGroupMember.is_active == True,
        ).first()

        if member_record:
            group = db.query(RoommateGroup).filter(
                RoommateGroup.id == member_record.group_id,
                RoommateGroup.is_active == True,
            ).first()

    if not group:
        raise HTTPException(status_code=404, detail="You don't have an active group")

    return build_group_detail(group, db)

@roommate_router.get("/groups/browse", response_model=list[GroupCardResponse])
def browse_groups(
    gender: Optional[GenderHousingPref] = Query(None),
    timing: Optional[RoommateTiming] = Query(None),
    max_rent: Optional[float] = Query(None),
    has_place: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_landlord = isinstance(current_user, Landlord)
    profile = None

    if not is_landlord:
        profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == current_user.id, RoommateProfile.quiz_completed == True).first()
        if not profile:
            raise HTTPException(status_code=403, detail="Complete the quiz first")

    query = db.query(RoommateGroup).filter(RoommateGroup.is_active == True, RoommateGroup.is_visible == True)
    if not is_landlord:
        query = query.filter(RoommateGroup.owner_id != current_user.id)

    if gender:
        query = query.filter(RoommateGroup.gender_preference == gender)
    if timing:
        query = query.filter(RoommateGroup.move_in_timing == timing)
    if max_rent is not None:
        query = query.filter(RoommateGroup.rent_per_person <= max_rent)
    if has_place is not None:
        query = query.filter(RoommateGroup.has_place == has_place)

    groups = query.order_by(RoommateGroup.created_at.desc()).all()

    results = []
    for group in groups:
        if group.spots_remaining <= 0:
            continue

        is_member = any(m.user_id == current_user.id and m.is_active for m in group.members)
        if is_member:
            continue

        if not is_landlord:
            is_member = any(m.user_id == current_user.id and m.is_active for m in group.members)
            if is_member:
                continue

        card = build_group_card(group, db, profile)
        results.append(card)

    if not is_landlord:
        results.sort(key=lambda x: x.compatibility_score, reverse=True)
    return results

@roommate_router.get("/groups/{group_id}", response_model=GroupDetailResponse)
def get_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    return build_group_detail(group, db)

# Individuals
@roommate_router.get("/individuals", response_model=list[IndividualCardResponse])
def browse_individuals(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    my_profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == current_user.id, RoommateProfile.quiz_completed == True).first()

    if not my_profile:
        raise HTTPException(status_code=403, detail="Complete the quiz first")

    profiles = db.query(RoommateProfile).filter(
        RoommateProfile.user_id != current_user.id,
        RoommateProfile.quiz_completed == True,
        RoommateProfile.is_visible == True,
        RoommateProfile.search_type == RoommateSearchType.ON_MY_OWN.value,
    ).all()

    results = []
    for profile in profiles:
        user = db.query(User).filter(User.id == profile.user_id).first()
        if not user:
            continue

        score = calculate_compatibility(my_profile, profile)

        results.append(IndividualCardResponse(
            user_id=user.id,
            first_name=user.first_name,
            last_initial=user.last_name[0] + "." if user.last_name else "",
            year=user.year.value if user.year else None,
            program=user.program,
            bio=user.bio,
            budget_range=profile.budget_range,
            roommate_timing=profile.roommate_timing,
            lifestyle_tags=profile.lifestyle_tags,
            compatibility_score=score,
            profile_photo_url=user.profile_photo_url,
            sleep_schedule=profile.sleep_schedule.value if profile.sleep_schedule else None,
            cleanliness=profile.cleanliness.value if profile.cleanliness else None,
            noise_level=profile.noise_level.value if profile.noise_level else None,
            smoking=profile.smoking.value if profile.smoking else None,
            pets=profile.pets.value if profile.pets else None,
        ))

    results.sort(key=lambda x: x.compatibility_score, reverse=True)
    return results

@roommate_router.get("/individuals/search", response_model=list[IndividualCardResponse])
def search_individuals(
    search: Optional[str] = Query(None, description="Search by name or program"),
    budget: Optional[BudgetRange] = Query(None),
    timing: Optional[RoommateTiming] = Query(None),
    sleep: Optional[SleepSchedule] = Query(None),
    cleanliness: Optional[Cleanliness] = Query(None),
    noise: Optional[NoiseLevel] = Query(None),
    smoking: Optional[SmokingVaping] = Query(None),
    pets: Optional[PetPreference] = Query(None),
    gender_pref: Optional[GenderHousingPref] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    my_profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == current_user.id, RoommateProfile.quiz_completed == True).first()

    if not my_profile:
        raise HTTPException(status_code=403, detail="Complete the quiz first")

    query = db.query(RoommateProfile).filter(
        RoommateProfile.user_id != current_user.id,
        RoommateProfile.quiz_completed == True,
        RoommateProfile.is_visible == True,
        RoommateProfile.search_type == "on_my_own",
    )

    # Filter by quiz answers
    if budget:
        query = query.filter(RoommateProfile.budget_range == budget)
    if timing:
        query = query.filter(RoommateProfile.roommate_timing == timing)
    if sleep:
        query = query.filter(RoommateProfile.sleep_schedule == sleep)
    if cleanliness:
        query = query.filter(RoommateProfile.cleanliness == cleanliness)
    if noise:
        query = query.filter(RoommateProfile.noise_level == noise)
    if smoking:
        query = query.filter(RoommateProfile.smoking == smoking)
    if pets:
        query = query.filter(RoommateProfile.pets == pets)
    if gender_pref:
        query = query.filter(RoommateProfile.gender_housing_pref == gender_pref)

    profiles = query.all()

    results = []
    for profile in profiles:
        user = db.query(User).filter(User.id == profile.user_id).first()
        if not user:
            continue

        # Search by name or program
        if search:
            search_lower = search.lower()
            name_match = search_lower in user.first_name.lower()
            program_match = user.program and search_lower in user.program.lower()
            if not name_match and not program_match:
                continue

        score = calculate_compatibility(my_profile, profile)
        

        results.append(IndividualCardResponse(
            user_id=user.id,
            first_name=user.first_name,
            last_initial=user.last_name[0] + "." if user.last_name else "",
            year=user.year.value if user.year else None,
            program=user.program,
            bio=user.bio,
            budget_range=profile.budget_range,
            roommate_timing=profile.roommate_timing,
            lifestyle_tags=profile.lifestyle_tags,
            compatibility_score=score,
            profile_photo_url=user.profile_photo_url,
            sleep_schedule=profile.sleep_schedule.value if profile.sleep_schedule else None,
            cleanliness=profile.cleanliness.value if profile.cleanliness else None,
            noise_level=profile.noise_level.value if profile.noise_level else None,
            smoking=profile.smoking.value if profile.smoking else None,
            pets=profile.pets.value if profile.pets else None,
        ))

    results.sort(key=lambda x: x.compatibility_score, reverse=True)
    return results

@roommate_router.get("/individuals/{user_id}", response_model=IndividualDetailResponse)
def get_individual(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    my_profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == current_user.id, RoommateProfile.quiz_completed == True).first()
    if not my_profile:
        raise HTTPException(status_code=403, detail="Complete the quiz first")

    profile = db.query(RoommateProfile).filter(
        RoommateProfile.user_id == user_id,
        RoommateProfile.quiz_completed == True,
        RoommateProfile.is_visible == True,
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    user = db.query(User).filter(User.id == profile.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    score = calculate_compatibility(my_profile, profile)
    breakdown = calculate_compatibility_breakdown(my_profile, profile)

    return IndividualDetailResponse(
        user_id=user.id,
        first_name=user.first_name,
        last_initial=user.last_name[0] + "." if user.last_name else "",
        year=user.year.value if user.year else None,
        program=user.program,
        bio=user.bio,
        budget_range=profile.budget_range,
        roommate_timing=profile.roommate_timing,
        lifestyle_tags=profile.lifestyle_tags,
        compatibility_score=score,
        profile_photo_url=user.profile_photo_url,
        sleep_schedule=profile.sleep_schedule.value if profile.sleep_schedule else None,
        cleanliness=profile.cleanliness.value if profile.cleanliness else None,
        noise_level=profile.noise_level.value if profile.noise_level else None,
        guests=profile.guests.value if profile.guests else None,
        study_habits=profile.study_habits.value if profile.study_habits else None,
        smoking=profile.smoking.value if profile.smoking else None,
        pets=profile.pets.value if profile.pets else None,
        kitchen_use=profile.kitchen_use.value if profile.kitchen_use else None,
        gender_housing_pref=profile.gender_housing_pref.value if profile.gender_housing_pref else None,
        search_type=profile.search_type.value if profile.search_type else None,
        compatibility_breakdown=breakdown,
    )

# Invites
@roommate_router.post("/invites", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
def send_invite(payload: InviteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.owner_id == current_user.id, RoommateGroup.is_active == True).first()

    if not group:
        raise HTTPException(status_code=404, detail="You don't have an active group")

    if group.spots_remaining <= 0:
        raise HTTPException(status_code=400, detail="Group is full")

    if payload.invited_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Can't invite yourself")

    # Block if invitee is already in a group (owner or active member elsewhere)
    invitee_owned = db.query(RoommateGroup).filter(RoommateGroup.owner_id == payload.invited_user_id, RoommateGroup.is_active == True).first()
    invitee_member = db.query(RoommateGroupMember).filter(RoommateGroupMember.user_id == payload.invited_user_id, RoommateGroupMember.is_active == True, RoommateGroupMember.group_id != group.id).first()
    
    if invitee_owned or invitee_member:
        raise HTTPException(status_code=400, detail="That user is already in a group. They'd need to leave it first.")

    existing = db.query(RoommateInvite).filter(
        RoommateInvite.group_id == group.id,
        RoommateInvite.invited_user_id == payload.invited_user_id,
        RoommateInvite.status == InviteStatus.PENDING,
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Already invited")

    is_member = db.query(RoommateGroupMember).filter(
        RoommateGroupMember.group_id == group.id,
        RoommateGroupMember.user_id == payload.invited_user_id,
        RoommateGroupMember.is_active == True,
    ).first()

    if is_member:
        raise HTTPException(status_code=409, detail="Already a member")

    invite = RoommateInvite(
        group_id=group.id,
        invited_user_id=payload.invited_user_id,
        invited_by_id=current_user.id,
        message=payload.message,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    return build_invite_response(invite, db)

@roommate_router.patch("/invites/{invite_id}/accept", response_model=InviteResponse)
def accept_invite(invite_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    invite = db.query(RoommateInvite).filter(
        RoommateInvite.id == invite_id,
        RoommateInvite.invited_user_id == current_user.id,
        RoommateInvite.status == InviteStatus.PENDING,
    ).first()

    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    group = db.query(RoommateGroup).filter(RoommateGroup.id == invite.group_id).first()
    if group.spots_remaining <= 0:
        raise HTTPException(status_code=400, detail="Group is now full")
    
    other_owned = db.query(RoommateGroup).filter(RoommateGroup.owner_id == current_user.id, RoommateGroup.is_active == True).first()
    other_member = db.query(RoommateGroupMember).filter(RoommateGroupMember.user_id == current_user.id, RoommateGroupMember.is_active == True, RoommateGroupMember.group_id != invite.group_id).first()
    
    if other_owned or other_member:
        raise HTTPException(status_code=400, detail="You're already in a group. Leave it first to join another.")

    invite.status = InviteStatus.ACCEPTED

    existing_member = db.query(RoommateGroupMember).filter(RoommateGroupMember.group_id == invite.group_id, RoommateGroupMember.user_id == current_user.id).first()

    if existing_member:
        existing_member.is_active = True
        existing_member.joined_at = func.now()
    else:
        member = RoommateGroupMember(
            group_id=invite.group_id,
            user_id=current_user.id,
            role=GroupMemberRole.MEMBER,
        )
        db.add(member)

    db.commit()
    db.refresh(invite)

    return build_invite_response(invite, db)

@roommate_router.patch("/invites/{invite_id}/decline", response_model=InviteResponse)
def decline_invite(invite_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    invite = db.query(RoommateInvite).filter(
        RoommateInvite.id == invite_id,
        RoommateInvite.invited_user_id == current_user.id,
        RoommateInvite.status == InviteStatus.PENDING,
    ).first()

    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    invite.status = InviteStatus.DECLINED
    db.commit()
    db.refresh(invite)

    return build_invite_response(invite, db)

@roommate_router.get("/invites/received", response_model=list[InviteResponse])
def get_my_invites(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    invites = db.query(RoommateInvite).filter(RoommateInvite.invited_user_id == current_user.id).order_by(RoommateInvite.created_at.desc()).all()
    return [build_invite_response(inv, db) for inv in invites]

@roommate_router.get("/invites/sent", response_model=list[InviteResponse])
def get_sent_invites(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.owner_id == current_user.id, RoommateGroup.is_active == True).first()

    if not group:
        raise HTTPException(status_code=404, detail="You don't have an active group")

    invites = db.query(RoommateInvite).filter(RoommateInvite.group_id == group.id).order_by(RoommateInvite.created_at.desc()).all()

    return [build_invite_response(inv, db) for inv in invites]

# Requests
@roommate_router.post("/requests", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def send_request(payload: RequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == current_user.id, RoommateProfile.quiz_completed == True).first()

    if not profile:
        raise HTTPException(status_code=403, detail="Complete the quiz first")

    group = db.query(RoommateGroup).filter(RoommateGroup.id == payload.group_id, RoommateGroup.is_active == True).first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if group.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Can't request your own group")

    if group.spots_remaining <= 0:
        raise HTTPException(status_code=400, detail="Group is full")
    
    # Block if requester is already in a group elsewhere
    own_group = db.query(RoommateGroup).filter(RoommateGroup.owner_id == current_user.id, RoommateGroup.is_active == True).first()
    other_membership = db.query(RoommateGroupMember).filter(RoommateGroupMember.user_id == current_user.id, RoommateGroupMember.is_active == True, RoommateGroupMember.group_id != payload.group_id).first()
    
    if own_group or other_membership:
        raise HTTPException(status_code=400, detail="You're already in a group. Leave it first to request another.")

    existing = db.query(RoommateRequest).filter(
        RoommateRequest.group_id == payload.group_id,
        RoommateRequest.user_id == current_user.id,
        RoommateRequest.status == RequestStatus.PENDING,
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Already requested")

    request = RoommateRequest(
        group_id=payload.group_id,
        user_id=current_user.id,
        message=payload.message,
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    return build_request_response(request, db)

@roommate_router.patch("/requests/{request_id}/accept", response_model=RequestResponse)
def accept_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    req = db.query(RoommateRequest).filter(RoommateRequest.id == request_id, RoommateRequest.status == RequestStatus.PENDING).first()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    group = db.query(RoommateGroup).filter(RoommateGroup.id == req.group_id).first()
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the group owner can accept requests")

    if group.spots_remaining <= 0:
        raise HTTPException(status_code=400, detail="Group is full")
    
    # Block if requester has joined another group between sending and being accepted
    requester_other_owned = db.query(RoommateGroup).filter(RoommateGroup.owner_id == req.user_id, RoommateGroup.is_active == True).first()
    requester_other_member = db.query(RoommateGroupMember).filter(RoommateGroupMember.user_id == req.user_id, RoommateGroupMember.is_active == True, RoommateGroupMember.group_id != req.group_id).first()
    
    if requester_other_owned or requester_other_member:
        req.status = RequestStatus.DECLINED
        db.commit()
        raise HTTPException(status_code=409, detail="That user has joined another group since requesting. The request was auto-declined.")

    req.status = RequestStatus.ACCEPTED

    existing_member = db.query(RoommateGroupMember).filter(RoommateGroupMember.group_id == req.group_id, RoommateGroupMember.user_id == req.user_id).first()

    if existing_member:
        existing_member.is_active = True
        existing_member.joined_at = func.now()
    else:
        member = RoommateGroupMember(
            group_id=req.group_id,
            user_id=req.user_id,
            role=GroupMemberRole.MEMBER,
        )
        db.add(member)

    db.commit()
    db.refresh(req)

    return build_request_response(req, db)

@roommate_router.patch("/requests/{request_id}/decline", response_model=RequestResponse)
def decline_request(request_id: int, db: Session = Depends(get_db),current_user: User = Depends(get_current_student)):
    req = db.query(RoommateRequest).filter(RoommateRequest.id == request_id, RoommateRequest.status == RequestStatus.PENDING).first()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    group = db.query(RoommateGroup).filter(RoommateGroup.id == req.group_id).first()
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the group owner can decline requests")

    req.status = RequestStatus.DECLINED
    db.commit()
    db.refresh(req)

    return build_request_response(req, db)

@roommate_router.get("/requests/received", response_model=list[RequestResponse])
def get_group_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.owner_id == current_user.id, RoommateGroup.is_active == True).first()

    if not group:
        raise HTTPException(status_code=404, detail="You don't have an active group")

    requests = db.query(RoommateRequest).filter(RoommateRequest.group_id == group.id).order_by(RoommateRequest.created_at.desc()).all()

    return [build_request_response(req, db) for req in requests]

@roommate_router.get("/requests/sent", response_model=list[RequestResponse])
def get_my_sent_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    requests = db.query(RoommateRequest).filter(RoommateRequest.user_id == current_user.id).order_by(RoommateRequest.created_at.desc()).all()

    return [build_request_response(req, db) for req in requests]

# Member management
@roommate_router.delete("/groups/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(group_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id, RoommateGroup.owner_id == current_user.id).first()

    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Can't remove yourself. Delete the group instead.")

    member = db.query(RoommateGroupMember).filter(
        RoommateGroupMember.group_id == group_id,
        RoommateGroupMember.user_id == user_id,
        RoommateGroupMember.is_active == True,
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.is_active = False
    db.commit()

@roommate_router.delete("/groups/{group_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    group = db.query(RoommateGroup).filter(RoommateGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if group.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Owners can't leave. Delete the group instead.")

    member = db.query(RoommateGroupMember).filter(
        RoommateGroupMember.group_id == group_id,
        RoommateGroupMember.user_id == current_user.id,
        RoommateGroupMember.is_active == True,
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="You're not in this group")

    member.is_active = False
    db.commit()
