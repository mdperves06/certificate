from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import datetime

class FieldSchema(BaseModel):
    id: Optional[int] = None
    name: str = "recipient_name"
    field_type: str = "dynamic_text"  # text, dynamic_text, image, shape, qr, cert_id, date
    x: float = 100.0
    y: float = 100.0
    width: float = 400.0
    height: float = 80.0
    rotation: float = 0.0
    z_index: int = 1
    font_family: str = "Inter"
    font_size: float = 32.0
    font_weight: str = "normal"
    color: str = "#111827"
    align: str = "center"  # left, center, right
    vertical_align: str = "middle"  # top, middle, bottom
    auto_fit: bool = True
    min_font_size: float = 16.0
    wrap: bool = False
    line_spacing: float = 1.2
    letter_spacing: float = 0.0
    opacity: float = 1.0
    locked: bool = False
    mask_behind: bool = False
    mask_color: str = "#FFFFFF"
    default_value: str = ""
    placeholder: str = ""
    extra_props: Optional[str] = None  # JSON string for shape types, images, borders

class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "General"
    orientation: str = "landscape"
    width: int = 1920
    height: int = 1080
    background_asset_id: Optional[int] = None
    background_color: str = "#FFFFFF"
    border_style: str = "none"

class TemplateCreate(TemplateBase):
    fields: List[FieldSchema] = []

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    orientation: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    background_asset_id: Optional[int] = None
    background_color: Optional[str] = None
    border_style: Optional[str] = None
    fields: Optional[List[FieldSchema]] = None
    changelog: Optional[str] = None

class TemplateResponse(TemplateBase):
    id: int
    version: int
    is_starter: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime
    fields: List[FieldSchema] = []

    model_config = ConfigDict(from_attributes=True)

class ImportPreviewResponse(BaseModel):
    headers: List[str]
    rows: List[Dict[str, Any]]
    total_rows: int
    detected_mappings: Dict[str, str]  # template field -> column name

class ValidateDataRequest(BaseModel):
    template_id: int
    mappings: Dict[str, str]  # template field -> column name
    rows: List[Dict[str, Any]]

class ValidationErrorItem(BaseModel):
    row_index: int
    column: str
    message: str
    level: str = "error"  # error, warning

class ValidationReport(BaseModel):
    is_valid: bool
    total_rows: int
    valid_rows_count: int
    errors_count: int
    warnings_count: int
    issues: List[ValidationErrorItem]

class PreviewRequest(BaseModel):
    template_id: int
    data_rows: List[Dict[str, Any]]  # first 1-3 rows
    format: str = "png"  # png or base64

class PreviewResponse(BaseModel):
    previews: List[Dict[str, Any]]  # list of { row_index, image_url, base64_image, certificate_id }

class BatchCreateRequest(BaseModel):
    name: str
    template_id: int
    data_rows: List[Dict[str, Any]]
    output_format: str = "both"  # pdf, png, both
    id_prefix: str = "CERT-2026-"
    id_type: str = "sequential"  # sequential, random, uuid
    filename_pattern: str = "{certificate_id}_{recipient_name}"

class BatchResponse(BaseModel):
    id: str
    name: str
    template_id: int
    template_version: int
    total_count: int
    success_count: int
    failed_count: int
    status: str
    output_format: str
    zip_filename: Optional[str] = None
    zip_download_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class VerificationResponse(BaseModel):
    is_valid: bool
    status: str  # valid, revoked, not_found
    certificate_id: str
    recipient_name: Optional[str] = None
    course_name: Optional[str] = None
    issue_date: Optional[str] = None
    organization: Optional[str] = None
    issued_at: Optional[datetime.datetime] = None
    verification_hash: Optional[str] = None
