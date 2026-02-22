import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

def upload_image_to_cloudinary(file: UploadFile, folder: str) -> str:
    """Upload an image to Cloudinary and return the URL."""

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type '{file.content_type}'. Allowed: JPEG, PNG, WEBP",
        )

    contents = file.file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image exceeds 5 MB limit")
    file.file.seek(0)

    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            resource_type="image",
            transformation=[
                {"quality": "auto", "fetch_format": "auto"},
            ],
        )
        return result["secure_url"]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

def delete_image_from_cloudinary(image_url: str):
    """Delete an image from Cloudinary by its URL."""
    try:
        parts = image_url.split("/upload/")
        if len(parts) != 2:
            return

        public_id_with_ext = parts[1].split("/", 1)[-1] if "/" in parts[1] else parts[1]
        # Remove version prefix (v123456789/)
        if public_id_with_ext.startswith("v") and "/" in public_id_with_ext:
            public_id_with_ext = public_id_with_ext.split("/", 1)[1]

        public_id = public_id_with_ext.rsplit(".", 1)[0]  # remove extension

        cloudinary.uploader.destroy(public_id, resource_type="image")

    except Exception:
        pass  