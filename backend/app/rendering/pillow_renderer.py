import os
import json
import math
from typing import Dict, Any, List, Optional
from PIL import Image, ImageDraw, ImageOps
from app.rendering.text_measurer import fit_text_to_box, calculate_text_coordinates
from app.rendering.qr_generator import generate_qr_code

# Convert Hex to RGBA tuple
def hex_to_rgba(hex_color: str, opacity: float = 1.0) -> tuple:
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 6:
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        a = int(opacity * 255)
        return (r, g, b, a)
    elif len(hex_color) == 3:
        r, g, b = tuple(int(c * 2, 16) for c in hex_color)
        a = int(opacity * 255)
        return (r, g, b, a)
    return (0, 0, 0, int(opacity * 255))

def draw_decorative_border(draw: ImageDraw.ImageDraw, width: int, height: int, border_style: str):
    """Draw professional borders directly onto canvas."""
    if border_style == "gold_double":
        gold_color = (212, 175, 55, 255)
        dark_gold = (180, 140, 30, 255)
        # Outer thin border
        draw.rectangle([40, 40, width - 40, height - 40], outline=dark_gold, width=3)
        # Inner thick border
        draw.rectangle([60, 60, width - 60, height - 60], outline=gold_color, width=8)
        # Corner accent squares
        for cx, cy in [(60, 60), (width - 60, 60), (60, height - 60), (width - 60, height - 60)]:
            draw.rectangle([cx - 15, cy - 15, cx + 15, cy + 15], fill=gold_color, outline=dark_gold, width=2)
    elif border_style == "modern_thin":
        slate_color = (71, 85, 105, 255)
        draw.rectangle([50, 50, width - 50, height - 50], outline=slate_color, width=4)
        draw.rectangle([65, 65, width - 65, height - 65], outline=(148, 163, 184, 180), width=1)
    elif border_style == "navy_accent":
        navy = (15, 23, 42, 255)
        blue = (59, 130, 246, 255)
        draw.rectangle([40, 40, width - 40, height - 40], outline=navy, width=10)
        draw.rectangle([60, 60, width - 60, height - 60], outline=blue, width=2)
    elif border_style == "classic_ornate":
        accent = (30, 41, 59, 255)
        draw.rectangle([40, 40, width - 40, height - 40], outline=accent, width=6)
        draw.rectangle([52, 52, width - 52, height - 52], outline=(100, 116, 139, 200), width=2)
        draw.rectangle([64, 64, width - 64, height - 64], outline=accent, width=4)

def render_certificate_image(
    template_data: Dict[str, Any],
    recipient_row: Dict[str, Any],
    background_image_path: Optional[str] = None,
    verification_base_url: str = "http://localhost:3000/verify"
) -> Image.Image:
    """
    Renders a certificate deterministically using Pillow.
    Ensures identical coordinate space and centering for all recipient names.
    """
    width = int(template_data.get("width", 1920))
    height = int(template_data.get("height", 1080))
    bg_color = template_data.get("background_color", "#FFFFFF")
    border_style = template_data.get("border_style", "none")

    # 1. Base image canvas
    if background_image_path and os.path.exists(background_image_path):
        try:
            base_img = Image.open(background_image_path).convert("RGBA")
            if base_img.size != (width, height):
                base_img = base_img.resize((width, height), Image.Resampling.LANCZOS)
        except Exception:
            base_img = Image.new("RGBA", (width, height), hex_to_rgba(bg_color))
    else:
        base_img = Image.new("RGBA", (width, height), hex_to_rgba(bg_color))

    draw = ImageDraw.Draw(base_img, "RGBA")

    # 2. Draw border if specified
    if border_style != "none":
        draw_decorative_border(draw, width, height, border_style)

    # 3. Sort fields by z_index
    fields = template_data.get("fields", [])
    sorted_fields = sorted(fields, key=lambda f: f.get("z_index", 1))

    # 4. Render each field
    for field in sorted_fields:
        field_type = field.get("field_type", "dynamic_text")
        x = float(field.get("x", 0))
        y = float(field.get("y", 0))
        w = float(field.get("width", 300))
        h = float(field.get("height", 80))
        opacity = float(field.get("opacity", 1.0))
        color_hex = field.get("color", "#111827")
        rgba_color = hex_to_rgba(color_hex, opacity)

        # 4a. Masking / region erasure (for uploaded demo certificates)
        if field.get("mask_behind", False):
            mask_color = field.get("mask_color", "#FFFFFF")
            mask_rgba = hex_to_rgba(mask_color, 1.0)
            # Draw solid coverage rectangle over the previous text
            draw.rectangle([x, y, x + w, y + h], fill=mask_rgba)

        # 4b. Shape rendering
        if field_type == "shape":
            extra_props = {}
            if field.get("extra_props"):
                try:
                    extra_props = json.loads(field["extra_props"])
                except Exception:
                    pass
            shape_type = extra_props.get("shape_type", "rectangle")
            fill_color = hex_to_rgba(extra_props.get("fill_color", color_hex), opacity)
            outline_color = hex_to_rgba(extra_props.get("outline_color", color_hex), opacity)
            stroke_width = int(extra_props.get("stroke_width", 2))

            if shape_type == "rectangle":
                draw.rectangle([x, y, x + w, y + h], fill=fill_color, outline=outline_color, width=stroke_width)
            elif shape_type == "circle":
                draw.ellipse([x, y, x + w, y + h], fill=fill_color, outline=outline_color, width=stroke_width)
            elif shape_type == "line":
                draw.line([(x, y + h / 2), (x + w, y + h / 2)], fill=outline_color, width=stroke_width)
            continue

        # 4c. QR Code rendering
        if field_type == "qr":
            cert_id = recipient_row.get("certificate_id", "CERT-DEMO")
            verify_url = f"{verification_base_url.rstrip('/')}/{cert_id}"
            qr_size = min(int(w), int(h))
            qr_img = generate_qr_code(verify_url, size=qr_size, fill_color=color_hex)
            base_img.paste(qr_img, (int(x + (w - qr_size) / 2), int(y + (h - qr_size) / 2)), qr_img)
            continue

        # 4d. Certificate ID element
        if field_type == "cert_id":
            val = recipient_row.get("certificate_id", field.get("default_value", "CERT-2026-0001"))
            font_family = field.get("font_family", "Inter")
            font_size = float(field.get("font_size", 20))
            fit_res = fit_text_to_box(val, font_family, font_size, float(field.get("min_font_size", 12)), w, h, field.get("font_weight", "normal"), field.get("auto_fit", True))
            tx, ty = calculate_text_coordinates(x, y, w, h, fit_res["text_width"], fit_res["text_height"], field.get("align", "center"), field.get("vertical_align", "middle"))
            draw.text((tx, ty), val, font=fit_res["font"], fill=rgba_color)
            continue

        # 4e. Date element
        if field_type == "date":
            val = str(recipient_row.get("date", recipient_row.get("issue_date", field.get("default_value", "2026-09-23"))))
            font_family = field.get("font_family", "Inter")
            font_size = float(field.get("font_size", 22))
            fit_res = fit_text_to_box(val, font_family, font_size, float(field.get("min_font_size", 12)), w, h, field.get("font_weight", "normal"), field.get("auto_fit", True))
            tx, ty = calculate_text_coordinates(x, y, w, h, fit_res["text_width"], fit_res["text_height"], field.get("align", "center"), field.get("vertical_align", "middle"))
            draw.text((tx, ty), val, font=fit_res["font"], fill=rgba_color)
            continue

        # 4f. Static and Dynamic Text
        raw_text = ""
        field_name = field.get("name", "")
        if field_type == "static_text":
            raw_text = field.get("default_value", "")
        else:  # dynamic_text
            # Check row mapping for field_name, or look for template variables {{variable}}
            if field_name in recipient_row:
                raw_text = str(recipient_row[field_name])
            elif field_name == "recipient_name":
                raw_text = str(recipient_row.get("name", recipient_row.get("recipient_name", field.get("default_value", "Recipient Name"))))
            elif field_name == "course_name":
                raw_text = str(recipient_row.get("course", recipient_row.get("course_name", field.get("default_value", "Course Name"))))
            else:
                default_val = field.get("default_value", "")
                # Variable interpolation for strings like "This is presented to {{recipient_name}}"
                for k, v in recipient_row.items():
                    default_val = default_val.replace(f"{{{{{k}}}}}", str(v))
                raw_text = default_val if default_val else str(recipient_row.get(field_name, field.get("placeholder", "")))

        if raw_text:
            font_family = field.get("font_family", "Inter")
            font_size = float(field.get("font_size", 32))
            min_size = float(field.get("min_font_size", 16))
            weight = field.get("font_weight", "normal")
            auto_fit = field.get("auto_fit", True)
            align = field.get("align", "center")
            vertical_align = field.get("vertical_align", "middle")

            fit_res = fit_text_to_box(
                text=raw_text,
                font_family=font_family,
                initial_font_size=font_size,
                min_font_size=min_size,
                box_width=w,
                box_height=h,
                font_weight=weight,
                auto_fit=auto_fit
            )

            tx, ty = calculate_text_coordinates(
                x, y, w, h,
                fit_res["text_width"],
                fit_res["text_height"],
                align=align,
                vertical_align=vertical_align
            )

            draw.text((tx, ty), raw_text, font=fit_res["font"], fill=rgba_color)

    # Return RGB image ready for PNG or PDF
    return base_img.convert("RGB")
