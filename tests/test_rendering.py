import os
import tempfile
import pytest
from app.rendering.pillow_renderer import render_certificate_image
from app.rendering.pdf_renderer import export_certificate
from app.template_engine.starter_templates import STARTER_TEMPLATES

def test_render_starter_template_image():
    t_spec = STARTER_TEMPLATES[0]  # Elegant Gold
    recipient = {
        "recipient_name": "Mohammad Abdul Karim Chowdhury",
        "course_name": "Advanced Full-Stack Engineering",
        "date": "2026-09-23",
        "certificate_id": "CERT-2026-TEST"
    }
    img = render_certificate_image(t_spec, recipient)
    assert img is not None
    assert img.size == (1920, 1080)

def test_render_bangla_certificate():
    t_spec = STARTER_TEMPLATES[2]  # Bangla Excellence
    recipient = {
        "recipient_name": "মোঃ পারভেজ আহমেদ",
        "course_name": "উন্নত ফুল-স্ট্যাক সফটওয়্যার ইঞ্জিনিয়ারিং",
        "date": "২৩ সেপ্টেম্বর ২০২৬",
        "certificate_id": "CERT-2026-BN01"
    }
    img = render_certificate_image(t_spec, recipient)
    assert img is not None
    assert img.size == (1920, 1080)

def test_export_pdf_and_png():
    t_spec = STARTER_TEMPLATES[1]  # Modern Tech
    recipient = {
        "recipient_name": "Christopher Alexander Johnson",
        "course_name": "Modern Web & AI Engineering",
        "date": "2026-09-23",
        "certificate_id": "CERT-2026-0099"
    }
    with tempfile.TemporaryDirectory() as tmpdir:
        png_path = os.path.join(tmpdir, "cert.png")
        pdf_path = os.path.join(tmpdir, "cert.pdf")
        export_certificate(
            template_data=t_spec,
            recipient_row=recipient,
            output_png_path=png_path,
            output_pdf_path=pdf_path
        )
        assert os.path.exists(png_path)
        assert os.path.getsize(png_path) > 1000
        assert os.path.exists(pdf_path)
        assert os.path.getsize(pdf_path) > 1000
