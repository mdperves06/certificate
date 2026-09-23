import os
import io
import csv
import json
import uuid
import base64
import zipfile
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.models import Template, GenerationBatch, GenerationItem, Certificate, UploadedAsset
from app.schemas.schemas import PreviewRequest, PreviewResponse, BatchCreateRequest, BatchResponse
from app.rendering.pillow_renderer import render_certificate_image
from app.rendering.pdf_renderer import export_certificate

router = APIRouter(prefix="/api/generator", tags=["Generator"])

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage")
BATCHES_DIR = os.path.join(STORAGE_DIR, "batches")
UPLOADS_DIR = os.path.join(STORAGE_DIR, "uploads")

def get_template_dict(template: Template) -> Dict[str, Any]:
    return {
        "id": template.id,
        "name": template.name,
        "width": template.width,
        "height": template.height,
        "background_color": template.background_color,
        "border_style": template.border_style,
        "fields": [
            {
                "id": f.id,
                "name": f.name,
                "field_type": f.field_type,
                "x": f.x,
                "y": f.y,
                "width": f.width,
                "height": f.height,
                "rotation": f.rotation,
                "z_index": f.z_index,
                "font_family": f.font_family,
                "font_size": f.font_size,
                "font_weight": f.font_weight,
                "color": f.color,
                "align": f.align,
                "vertical_align": f.vertical_align,
                "auto_fit": f.auto_fit,
                "min_font_size": f.min_font_size,
                "wrap": f.wrap,
                "opacity": f.opacity,
                "mask_behind": f.mask_behind,
                "mask_color": f.mask_color,
                "default_value": f.default_value,
                "placeholder": f.placeholder,
                "extra_props": f.extra_props
            }
            for f in template.fields
        ]
    }

def get_bg_path(template: Template, db: Session) -> Optional[str]:
    if template.background_asset_id:
        asset = db.query(UploadedAsset).filter(UploadedAsset.id == template.background_asset_id).first()
        if asset and os.path.exists(asset.file_path):
            return asset.file_path
    return None

@router.post("/preview", response_model=PreviewResponse)
def generate_preview(req: PreviewRequest, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == req.template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    t_dict = get_template_dict(template)
    bg_path = get_bg_path(template, db)

    previews = []
    # Preview up to 5 rows
    sample_rows = req.data_rows[:5] if req.data_rows else [{"recipient_name": "Sample Recipient", "course_name": "Web Development", "date": "2026-09-23"}]

    for idx, row in enumerate(sample_rows):
        cert_id = row.get("certificate_id") or f"PREVIEW-{idx+1:03d}"
        row_copy = dict(row)
        row_copy["certificate_id"] = cert_id

        try:
            pil_img = render_certificate_image(
                template_data=t_dict,
                recipient_row=row_copy,
                background_image_path=bg_path
            )
            # Resize for responsive preview payload
            preview_thumb = pil_img.copy()
            preview_thumb.thumbnail((1200, 800))
            buf = io.BytesIO()
            preview_thumb.save(buf, format="JPEG", quality=85)
            b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")

            previews.append({
                "row_index": idx,
                "certificate_id": cert_id,
                "recipient_name": row_copy.get("recipient_name", row_copy.get("name", "Unknown")),
                "base64_image": f"data:image/jpeg;base64,{b64_str}"
            })
        except Exception as e:
            previews.append({
                "row_index": idx,
                "certificate_id": cert_id,
                "error": str(e)
            })

    return {"previews": previews}

def run_batch_job(
    batch_id: str,
    template_id: int,
    data_rows: List[Dict[str, Any]],
    output_format: str,
    id_prefix: str,
    filename_pattern: str
):
    """Background processor for generation batches without blocking request."""
    db = SessionLocal()
    try:
        batch = db.query(GenerationBatch).filter(GenerationBatch.id == batch_id).first()
        template = db.query(Template).filter(Template.id == template_id).first()
        if not batch or not template:
            return

        batch_folder = os.path.join(BATCHES_DIR, batch_id)
        pdf_folder = os.path.join(batch_folder, "pdf")
        png_folder = os.path.join(batch_folder, "png")
        os.makedirs(pdf_folder, exist_ok=True)
        os.makedirs(png_folder, exist_ok=True)

        t_dict = get_template_dict(template)
        bg_path = get_bg_path(template, db)

        success_count = 0
        failed_count = 0
        manifest_records = []

        for idx, row in enumerate(data_rows):
            name = str(row.get("recipient_name") or row.get("name") or "Unknown").strip()
            # Clean name for safe filename
            safe_name = "".join(c for c in name if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
            if not safe_name:
                safe_name = f"recipient_{idx+1}"

            cert_id = row.get("certificate_id") or f"{id_prefix}{idx+1:05d}"
            base_fname = filename_pattern.replace("{certificate_id}", cert_id).replace("{recipient_name}", safe_name)

            row_data = dict(row)
            row_data["certificate_id"] = cert_id
            row_data["recipient_name"] = name

            pdf_path = os.path.join(pdf_folder, f"{base_fname}.pdf") if output_format in ["pdf", "both"] else None
            png_path = os.path.join(png_folder, f"{base_fname}.png") if output_format in ["png", "both"] else None

            try:
                export_certificate(
                    template_data=t_dict,
                    recipient_row=row_data,
                    output_png_path=png_path,
                    output_pdf_path=pdf_path,
                    background_image_path=bg_path
                )

                # Record successful generation
                gen_item = GenerationItem(
                    batch_id=batch_id,
                    row_index=idx,
                    recipient_name=name,
                    certificate_id=cert_id,
                    status="success",
                    output_pdf_path=pdf_path,
                    output_png_path=png_path,
                    recipient_data=json.dumps(row, default=str)
                )
                db.add(gen_item)

                # Store or update Certificate record for QR verification
                existing_cert = db.query(Certificate).filter(Certificate.certificate_id == cert_id).first()
                if existing_cert:
                    existing_cert.batch_id = batch_id
                    existing_cert.template_id = template_id
                    existing_cert.recipient_name = name
                    existing_cert.recipient_email = str(row.get("email") or row.get("recipient_email") or "")
                    existing_cert.course_name = str(row.get("course") or row.get("course_name") or template.name)
                    existing_cert.issue_date = str(row.get("date") or row.get("issue_date") or datetime.date.today().isoformat())
                    existing_cert.status = "valid"
                else:
                    cert_record = Certificate(
                        certificate_id=cert_id,
                        batch_id=batch_id,
                        template_id=template_id,
                        recipient_name=name,
                        recipient_email=str(row.get("email") or row.get("recipient_email") or ""),
                        course_name=str(row.get("course") or row.get("course_name") or template.name),
                        issue_date=str(row.get("date") or row.get("issue_date") or datetime.date.today().isoformat()),
                        organization="Certificate Studio",
                        status="valid"
                    )
                    db.add(cert_record)

                success_count += 1
                manifest_records.append({
                    "certificate_id": cert_id,
                    "recipient_name": name,
                    "email": row.get("email", ""),
                    "status": "success",
                    "filename": f"{base_fname}.pdf" if output_format in ["pdf", "both"] else f"{base_fname}.png",
                    "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
                })

            except Exception as e:
                db.rollback()
                failed_count += 1
                gen_item = GenerationItem(
                    batch_id=batch_id,
                    row_index=idx,
                    recipient_name=name,
                    certificate_id=cert_id,
                    status="failed",
                    error_message=str(e),
                    recipient_data=json.dumps(row, default=str)
                )
                db.add(gen_item)
                manifest_records.append({
                    "certificate_id": cert_id,
                    "recipient_name": name,
                    "email": row.get("email", ""),
                    "status": "failed",
                    "filename": "",
                    "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
                })

            # Update batch counts every 10 items for responsive progress
            if (idx + 1) % 10 == 0 or (idx + 1) == len(data_rows):
                batch.success_count = success_count
                batch.failed_count = failed_count
                db.commit()

        # Write manifest.csv
        manifest_path = os.path.join(batch_folder, "manifest.csv")
        with open(manifest_path, "w", newline="", encoding="utf-8-sig") as mf:
            writer = csv.DictWriter(mf, fieldnames=["certificate_id", "recipient_name", "email", "status", "filename", "generated_at"])
            writer.writeheader()
            for rec in manifest_records:
                writer.writerow(rec)

        # Build ZIP archive
        zip_filename = f"certificate-batch-{batch_id}.zip"
        zip_path = os.path.join(batch_folder, zip_filename)

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            # Add manifest
            zipf.write(manifest_path, arcname="manifest.csv")
            # Add PDFs
            if output_format in ["pdf", "both"]:
                for root, _, files in os.walk(pdf_folder):
                    for file in files:
                        p = os.path.join(root, file)
                        zipf.write(p, arcname=os.path.join("pdf", file) if output_format == "both" else file)
            # Add PNGs
            if output_format in ["png", "both"]:
                for root, _, files in os.walk(png_folder):
                    for file in files:
                        p = os.path.join(root, file)
                        zipf.write(p, arcname=os.path.join("png", file) if output_format == "both" else file)

        batch.status = "completed"
        batch.success_count = success_count
        batch.failed_count = failed_count
        batch.zip_filename = zip_filename
        batch.zip_path = zip_path
        batch.completed_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()

    except Exception as e:
        if batch:
            batch.status = "failed"
            batch.error_message = str(e)
            db.commit()
    finally:
        db.close()

@router.post("/batch", response_model=BatchResponse)
def create_batch(
    req: BatchCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    template = db.query(Template).filter(Template.id == req.template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    batch_id = uuid.uuid4().hex[:12]
    batch = GenerationBatch(
        id=batch_id,
        name=req.name,
        template_id=template.id,
        template_version=template.version,
        total_count=len(req.data_rows),
        success_count=0,
        failed_count=0,
        status="processing",
        output_format=req.output_format
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    # Launch generation in background
    background_tasks.add_task(
        run_batch_job,
        batch_id=batch.id,
        template_id=template.id,
        data_rows=req.data_rows,
        output_format=req.output_format,
        id_prefix=req.id_prefix,
        filename_pattern=req.filename_pattern
    )

    return {
        "id": batch.id,
        "name": batch.name,
        "template_id": batch.template_id,
        "template_version": batch.template_version,
        "total_count": batch.total_count,
        "success_count": batch.success_count,
        "failed_count": batch.failed_count,
        "status": batch.status,
        "output_format": batch.output_format,
        "zip_filename": None,
        "zip_download_url": None,
        "error_message": None,
        "created_at": batch.created_at,
        "completed_at": None
    }

@router.get("/batch/{batch_id}", response_model=BatchResponse)
def get_batch_status(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(GenerationBatch).filter(GenerationBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    zip_url = f"/api/generator/batch/{batch.id}/download" if batch.zip_filename and os.path.exists(batch.zip_path or "") else None

    return {
        "id": batch.id,
        "name": batch.name,
        "template_id": batch.template_id,
        "template_version": batch.template_version,
        "total_count": batch.total_count,
        "success_count": batch.success_count,
        "failed_count": batch.failed_count,
        "status": batch.status,
        "output_format": batch.output_format,
        "zip_filename": batch.zip_filename,
        "zip_download_url": zip_url,
        "error_message": batch.error_message,
        "created_at": batch.created_at,
        "completed_at": batch.completed_at
    }

@router.get("/batch/{batch_id}/download")
def download_batch_zip(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(GenerationBatch).filter(GenerationBatch.id == batch_id).first()
    if not batch or not batch.zip_path or not os.path.exists(batch.zip_path):
        raise HTTPException(status_code=404, detail="Batch ZIP file not available")

    return FileResponse(
        path=batch.zip_path,
        filename=batch.zip_filename or f"certificates_{batch_id}.zip",
        media_type="application/zip"
    )

@router.get("/history", response_model=List[BatchResponse])
def get_batch_history(db: Session = Depends(get_db)):
    batches = db.query(GenerationBatch).order_by(GenerationBatch.created_at.desc()).all()
    results = []
    for b in batches:
        zip_url = f"/api/generator/batch/{b.id}/download" if b.zip_filename and os.path.exists(b.zip_path or "") else None
        results.append({
            "id": b.id,
            "name": b.name,
            "template_id": b.template_id,
            "template_version": b.template_version,
            "total_count": b.total_count,
            "success_count": b.success_count,
            "failed_count": b.failed_count,
            "status": b.status,
            "output_format": b.output_format,
            "zip_filename": b.zip_filename,
            "zip_download_url": zip_url,
            "error_message": b.error_message,
            "created_at": b.created_at,
            "completed_at": b.completed_at
        })
    return results
