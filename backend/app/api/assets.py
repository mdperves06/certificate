import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from PIL import Image
from app.database import get_db
from app.models.models import UploadedAsset

router = APIRouter(prefix="/api/assets", tags=["Assets"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage", "uploads")
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}
ALLOWED_MIMES = {"image/png", "image/jpeg", "image/webp", "application/pdf"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

@router.post("/upload")
async def upload_asset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: PNG, JPG, JPEG, WebP, PDF"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 25MB limit."
        )

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    target_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(target_path, "wb") as f:
        f.write(content)

    width, height = None, None
    if ext != ".pdf":
        try:
            with Image.open(target_path) as img:
                width, height = img.size
        except Exception:
            pass

    asset = UploadedAsset(
        original_filename=file.filename or "uploaded_asset",
        stored_filename=unique_filename,
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        width=width,
        height=height,
        file_path=target_path
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return {
        "id": asset.id,
        "filename": asset.stored_filename,
        "original_filename": asset.original_filename,
        "url": f"/storage/uploads/{asset.stored_filename}",
        "width": asset.width,
        "height": asset.height,
        "mime_type": asset.mime_type
    }
