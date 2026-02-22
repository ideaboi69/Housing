import cloudinary
from config import settings

cloudinary.config(
    cloud_name=settings.CRIBB_CLOUDINARY_CLOUD_NAME,
    api_key=settings.CRIBB_CLOUDINARY_API_KEY,
    api_secret=settings.CRIBB_CLOUDINARY_API_SECRET,
)