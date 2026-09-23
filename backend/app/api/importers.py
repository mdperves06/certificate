import os
from typing import Dict, Any, List
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from pydantic import BaseModel
from app.importers.importer import (
    parse_csv_content,
    parse_excel_content,
    parse_pasted_text,
    auto_detect_mappings,
    validate_recipient_data
)
from app.schemas.schemas import ImportPreviewResponse, ValidateDataRequest, ValidationReport

router = APIRouter(prefix="/api/importers", tags=["Importers"])

class PasteDataRequest(BaseModel):
    raw_text: str

@router.post("/upload", response_model=ImportPreviewResponse)
async def upload_recipient_file(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".csv", ".xlsx", ".xls", ".tsv", ".txt"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Please upload a CSV or Excel (.xlsx) file."
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file appears to be completely empty.")

    try:
        if ext in [".xlsx", ".xls"]:
            headers, rows = parse_excel_content(content)
        else:
            headers, rows = parse_csv_content(content)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse recipient file: {str(e)}. Please check file formatting."
        )

    if not headers or not rows:
        raise HTTPException(
            status_code=400,
            detail="Could not detect valid tabular recipient columns or rows in the file."
        )

    detected = auto_detect_mappings(headers)

    return {
        "headers": headers,
        "rows": rows[:100],  # Return up to first 100 rows for preview/edit
        "total_rows": len(rows),
        "detected_mappings": detected
    }

@router.post("/paste", response_model=ImportPreviewResponse)
def paste_recipient_data(data: PasteDataRequest):
    if not data.raw_text or not data.raw_text.strip():
        raise HTTPException(status_code=400, detail="Pasted text cannot be empty.")

    try:
        headers, rows = parse_pasted_text(data.raw_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse pasted text: {str(e)}")

    if not rows:
        raise HTTPException(status_code=400, detail="No valid recipient rows detected.")

    detected = auto_detect_mappings(headers)

    return {
        "headers": headers,
        "rows": rows[:100],
        "total_rows": len(rows),
        "detected_mappings": detected
    }

@router.post("/validate", response_model=ValidationReport)
def validate_data(data: ValidateDataRequest):
    report = validate_recipient_data(
        rows=data.rows,
        field_mappings=data.mappings
    )
    return report
