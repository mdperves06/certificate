import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Template, TemplateField, TemplateVersion
from app.schemas.schemas import TemplateCreate, TemplateUpdate, TemplateResponse, FieldSchema

router = APIRouter(prefix="/api/templates", tags=["Templates"])

def serialize_template(t: Template) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "category": t.category,
        "orientation": t.orientation,
        "width": t.width,
        "height": t.height,
        "background_asset_id": t.background_asset_id,
        "background_color": t.background_color,
        "border_style": t.border_style,
        "version": t.version,
        "is_starter": t.is_starter,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
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
                "line_spacing": f.line_spacing,
                "letter_spacing": f.letter_spacing,
                "opacity": f.opacity,
                "locked": f.locked,
                "mask_behind": f.mask_behind,
                "mask_color": f.mask_color,
                "default_value": f.default_value,
                "placeholder": f.placeholder,
                "extra_props": f.extra_props
            }
            for f in t.fields
        ]
    }

@router.get("", response_model=List[TemplateResponse])
def get_templates(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Template)
    if category and category != "All":
        query = query.filter(Template.category == category)
    if search:
        query = query.filter(Template.name.ilike(f"%{search}%"))
    templates = query.order_by(Template.updated_at.desc()).all()
    return [serialize_template(t) for t in templates]

@router.post("", response_model=TemplateResponse)
def create_template(data: TemplateCreate, db: Session = Depends(get_db)):
    template = Template(
        name=data.name,
        description=data.description,
        category=data.category,
        orientation=data.orientation,
        width=data.width,
        height=data.height,
        background_asset_id=data.background_asset_id,
        background_color=data.background_color,
        border_style=data.border_style,
        version=1,
        is_starter=False
    )
    db.add(template)
    db.flush()

    for idx, f in enumerate(data.fields):
        field = TemplateField(
            template_id=template.id,
            name=f.name,
            field_type=f.field_type,
            x=f.x,
            y=f.y,
            width=f.width,
            height=f.height,
            rotation=f.rotation,
            z_index=f.z_index if f.z_index is not None else idx + 1,
            font_family=f.font_family,
            font_size=f.font_size,
            font_weight=f.font_weight,
            color=f.color,
            align=f.align,
            vertical_align=f.vertical_align,
            auto_fit=f.auto_fit,
            min_font_size=f.min_font_size,
            wrap=f.wrap,
            line_spacing=f.line_spacing,
            letter_spacing=f.letter_spacing,
            opacity=f.opacity,
            locked=f.locked,
            mask_behind=f.mask_behind,
            mask_color=f.mask_color,
            default_value=f.default_value,
            placeholder=f.placeholder,
            extra_props=f.extra_props
        )
        db.add(field)

    # Save initial version
    version_record = TemplateVersion(
        template_id=template.id,
        version_number=1,
        schema_data=json.dumps(data.model_dump(), default=str),
        changelog="Initial template creation"
    )
    db.add(version_record)
    db.commit()
    db.refresh(template)
    return serialize_template(template)

@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return serialize_template(template)

@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(template_id: int, data: TemplateUpdate, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if data.name is not None:
        template.name = data.name
    if data.description is not None:
        template.description = data.description
    if data.category is not None:
        template.category = data.category
    if data.orientation is not None:
        template.orientation = data.orientation
    if data.width is not None:
        template.width = data.width
    if data.height is not None:
        template.height = data.height
    if data.background_asset_id is not None:
        template.background_asset_id = data.background_asset_id
    if data.background_color is not None:
        template.background_color = data.background_color
    if data.border_style is not None:
        template.border_style = data.border_style

    if data.fields is not None:
        # Remove existing fields
        db.query(TemplateField).filter(TemplateField.template_id == template_id).delete()
        for idx, f in enumerate(data.fields):
            field = TemplateField(
                template_id=template.id,
                name=f.name,
                field_type=f.field_type,
                x=f.x,
                y=f.y,
                width=f.width,
                height=f.height,
                rotation=f.rotation,
                z_index=f.z_index if f.z_index is not None else idx + 1,
                font_family=f.font_family,
                font_size=f.font_size,
                font_weight=f.font_weight,
                color=f.color,
                align=f.align,
                vertical_align=f.vertical_align,
                auto_fit=f.auto_fit,
                min_font_size=f.min_font_size,
                wrap=f.wrap,
                line_spacing=f.line_spacing,
                letter_spacing=f.letter_spacing,
                opacity=f.opacity,
                locked=f.locked,
                mask_behind=f.mask_behind,
                mask_color=f.mask_color,
                default_value=f.default_value,
                placeholder=f.placeholder,
                extra_props=f.extra_props
            )
            db.add(field)

    # Increment version
    template.version += 1
    version_record = TemplateVersion(
        template_id=template.id,
        version_number=template.version,
        schema_data=json.dumps(data.model_dump(), default=str),
        changelog=data.changelog or f"Version {template.version} update"
    )
    db.add(version_record)
    db.commit()
    db.refresh(template)
    return serialize_template(template)

@router.delete("/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}

@router.post("/{template_id}/duplicate", response_model=TemplateResponse)
def duplicate_template(template_id: int, db: Session = Depends(get_db)):
    source = db.query(Template).filter(Template.id == template_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Template not found")

    new_template = Template(
        name=f"{source.name} (Copy)",
        description=source.description,
        category=source.category,
        orientation=source.orientation,
        width=source.width,
        height=source.height,
        background_asset_id=source.background_asset_id,
        background_color=source.background_color,
        border_style=source.border_style,
        version=1,
        is_starter=False
    )
    db.add(new_template)
    db.flush()

    for f in source.fields:
        copied_field = TemplateField(
            template_id=new_template.id,
            name=f.name,
            field_type=f.field_type,
            x=f.x,
            y=f.y,
            width=f.width,
            height=f.height,
            rotation=f.rotation,
            z_index=f.z_index,
            font_family=f.font_family,
            font_size=f.font_size,
            font_weight=f.font_weight,
            color=f.color,
            align=f.align,
            vertical_align=f.vertical_align,
            auto_fit=f.auto_fit,
            min_font_size=f.min_font_size,
            wrap=f.wrap,
            line_spacing=f.line_spacing,
            letter_spacing=f.letter_spacing,
            opacity=f.opacity,
            locked=f.locked,
            mask_behind=f.mask_behind,
            mask_color=f.mask_color,
            default_value=f.default_value,
            placeholder=f.placeholder,
            extra_props=f.extra_props
        )
        db.add(copied_field)

    db.commit()
    db.refresh(new_template)
    return serialize_template(new_template)
