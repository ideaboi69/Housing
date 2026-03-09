from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from Schemas.roommateSchema import *
from helpers import *
from tables import *

def build_group_card(group: RoommateGroup, db: Session, viewer_profile: RoommateProfile = None) -> GroupCardResponse:
    members = []
    for m in group.members:
        if not m.is_active:
            continue
        user = db.query(User).filter(User.id == m.user_id).first()
        members.append(GroupMemberResponse(
            user_id=user.id,
            first_name=user.first_name,
            last_initial=user.last_name[0] + "." if user.last_name else "",
            role=m.role.value,
            profile_photo_url=user.profile_photo_url,
            joined_at=m.joined_at,
        ))

    score = 0
    if viewer_profile:
        score = calculate_group_compatibility(viewer_profile, group, db)

    return GroupCardResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        current_size=group.current_size,
        total_capacity=group.total_capacity,
        spots_remaining=group.spots_remaining,
        rent_per_person=group.rent_per_person,
        utilities_included=group.utilities_included,
        move_in_timing=group.move_in_timing,
        gender_preference=group.gender_preference,
        has_place=group.has_place,
        address=group.address,
        is_verified=group.is_verified,
        members=members,
        compatibility_score=score,
        created_at=group.created_at,
    )


def build_group_detail(group: RoommateGroup, db: Session) -> GroupDetailResponse:
    card = build_group_card(group, db)
    return GroupDetailResponse(
        **card.model_dump(),
        owner_id=group.owner_id,
        is_active=group.is_active,
    )


def build_invite_response(invite: RoommateInvite, db: Session) -> InviteResponse:
    group = db.query(RoommateGroup).filter(RoommateGroup.id == invite.group_id).first()
    invited_user = db.query(User).filter(User.id == invite.invited_user_id).first()

    return InviteResponse(
        id=invite.id,
        group_id=invite.group_id,
        group_name=group.name,
        invited_user_id=invite.invited_user_id,
        invited_user_name=f"{invited_user.first_name} {invited_user.last_name[0]}.",
        invited_by_id=invite.invited_by_id,
        message=invite.message,
        status=invite.status,
        created_at=invite.created_at,
    )

def build_request_response(req: RoommateRequest, db: Session) -> RequestResponse:
    group = db.query(RoommateGroup).filter(RoommateGroup.id == req.group_id).first()
    user = db.query(User).filter(User.id == req.user_id).first()
    profile = db.query(RoommateProfile).filter(RoommateProfile.user_id == req.user_id).first()

    score = 0
    if profile and group:
        score = calculate_group_compatibility(profile, group, db)

    return RequestResponse(
        id=req.id,
        group_id=req.group_id,
        group_name=group.name,
        user_id=req.user_id,
        user_name=f"{user.first_name} {user.last_name[0]}.",
        message=req.message,
        status=req.status,
        lifestyle_tags=profile.lifestyle_tags if profile else [],
        compatibility_score=score,
        created_at=req.created_at,
    )