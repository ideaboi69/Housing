import re
import os
from fastapi import UploadFile
import uuid
from PIL import Image
import requests
import io
from decimal import Decimal
from datetime import datetime
import resend
import uuid
import logging
import cloudinary
import cloudinary.uploader
import time
from fastapi import HTTPException
from sqlalchemy.orm import Session
from tables import User
from dotenv import load_dotenv
from sqlalchemy import text
from passlib.context import CryptContext

def check_uoguelph_email(email: str) -> bool:
    return email.lower().endswith("@uoguelph.ca")
