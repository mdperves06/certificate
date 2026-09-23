import os
from typing import Dict, Any, Optional
from PIL import Image
from reportlab.lib.pagesizes import A4, landscape, letter
from reportlab.pdfgen import canvas
from app.rendering.pillow_renderer import render_certificate_image

def save_image_as_pdf(pil_image: Image.Image, output_path: str, dpi: float = 150.0):
    """
    Export high-resolution certificate image directly to PDF.
    This guarantees 100% exact visual parity with the PNG preview.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    # Save as PDF using PIL with print DPI resolution
    pil_image.save(output_path, "PDF", resolution=dpi, quality=95)

def export_certificate(
    template_data: Dict[str, Any],
    recipient_row: Dict[str, Any],
    output_png_path: Optional[str] = None,
    output_pdf_path: Optional[str] = None,
    background_image_path: Optional[str] = None,
    verification_base_url: str = "http://localhost:3000/verify",
    dpi: float = 150.0
):
    """
    Unified certificate export function:
    Produces both PNG and PDF deterministically from a single render pass.
    """
    img = render_certificate_image(
        template_data=template_data,
        recipient_row=recipient_row,
        background_image_path=background_image_path,
        verification_base_url=verification_base_url
    )

    if output_png_path:
        os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
        img.save(output_png_path, "PNG", optimize=True)

    if output_pdf_path:
        save_image_as_pdf(img, output_pdf_path, dpi=dpi)

    return img
