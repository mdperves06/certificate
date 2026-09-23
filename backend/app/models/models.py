import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="General")
    orientation = Column(String(20), default="landscape")  # landscape or portrait
    width = Column(Integer, default=1920)
    height = Column(Integer, default=1080)
    background_asset_id = Column(Integer, nullable=True)
    background_color = Column(String(50), default="#FFFFFF")
    border_style = Column(String(100), default="none")
    version = Column(Integer, default=1)
    is_starter = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    fields = relationship("TemplateField", back_populates="template", cascade="all, delete-orphan")
    versions = relationship("TemplateVersion", back_populates="template", cascade="all, delete-orphan")
    batches = relationship("GenerationBatch", back_populates="template")


class TemplateVersion(Base):
    __tablename__ = "template_versions"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    schema_data = Column(Text, nullable=False)  # JSON representation of all fields and layout
    changelog = Column(String(255), default="Updated template")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    template = relationship("Template", back_populates="versions")


class TemplateField(Base):
    __tablename__ = "template_fields"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    name = Column(String(100), nullable=False)  # dynamic variable key e.g. recipient_name or static id
    field_type = Column(String(50), default="text")  # text, dynamic_text, image, shape, qr, cert_id, date
    x = Column(Float, default=100.0)
    y = Column(Float, default=100.0)
    width = Column(Float, default=400.0)
    height = Column(Float, default=80.0)
    rotation = Column(Float, default=0.0)
    z_index = Column(Integer, default=1)
    font_family = Column(String(100), default="Inter")
    font_size = Column(Float, default=32.0)
    font_weight = Column(String(50), default="normal")
    color = Column(String(50), default="#111827")
    align = Column(String(20), default="center")  # left, center, right
    vertical_align = Column(String(20), default="middle")  # top, middle, bottom
    auto_fit = Column(Boolean, default=True)
    min_font_size = Column(Float, default=16.0)
    wrap = Column(Boolean, default=False)
    line_spacing = Column(Float, default=1.2)
    letter_spacing = Column(Float, default=0.0)
    opacity = Column(Float, default=1.0)
    locked = Column(Boolean, default=False)
    mask_behind = Column(Boolean, default=False)
    mask_color = Column(String(50), default="#FFFFFF")
    default_value = Column(Text, default="")
    placeholder = Column(String(255), default="")
    extra_props = Column(Text, nullable=True)  # JSON for shapes, image URLs, borders

    template = relationship("Template", back_populates="fields")


class UploadedAsset(Base):
    __tablename__ = "uploaded_assets"

    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, default=0)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class GenerationBatch(Base):
    __tablename__ = "generation_batches"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=False)
    template_version = Column(Integer, default=1)
    total_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    status = Column(String(50), default="pending")  # pending, processing, completed, failed, cancelled
    output_format = Column(String(20), default="both")  # pdf, png, both
    zip_filename = Column(String(255), nullable=True)
    zip_path = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    template = relationship("Template", back_populates="batches")
    items = relationship("GenerationItem", back_populates="batch", cascade="all, delete-orphan")


class GenerationItem(Base):
    __tablename__ = "generation_items"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(50), ForeignKey("generation_batches.id"), nullable=False)
    row_index = Column(Integer, default=0)
    recipient_name = Column(String(255), nullable=False)
    certificate_id = Column(String(100), nullable=False, index=True)
    status = Column(String(50), default="pending")  # success, failed, skipped
    output_pdf_path = Column(String(500), nullable=True)
    output_png_path = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    recipient_data = Column(Text, nullable=True)  # JSON of input row
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    batch = relationship("GenerationBatch", back_populates="items")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(100), unique=True, index=True, nullable=False)
    batch_id = Column(String(50), nullable=True)
    template_id = Column(Integer, nullable=False)
    recipient_name = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=True)
    course_name = Column(String(255), nullable=True)
    issue_date = Column(String(50), nullable=True)
    organization = Column(String(255), default="Certificate Studio")
    verification_hash = Column(String(255), nullable=True)
    status = Column(String(50), default="valid")  # valid, revoked
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
