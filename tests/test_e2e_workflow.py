import os
import sys
import zipfile
import pytest
from fastapi.testclient import TestClient

# Ensure backend path is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend"))

from app.main import app
from app.database import init_db, SessionLocal
from app.template_engine.starter_templates import seed_starter_templates
from app.models.models import GenerationBatch, Certificate

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_db()
    db = SessionLocal()
    try:
        seed_starter_templates(db)
    finally:
        db.close()

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_get_starter_templates():
    res = client.get("/api/templates")
    assert res.status_code == 200
    templates = res.json()
    assert len(templates) >= 3
    # Check Bangla template presence
    bangla_tpl = next((t for t in templates if "Bangla" in t["name"]), None)
    assert bangla_tpl is not None

def test_e2e_mode_a_workflow():
    """
    Mode A: Create template from scratch -> import 12 difficult & Unicode names ->
    preview -> generate batch (PDF + PNG) -> verify ZIP archive & manifest.
    """
    # 1. Create a custom template
    template_payload = {
        "name": "E2E Master Certification",
        "description": "Comprehensive full stack certificate test",
        "category": "Academic",
        "orientation": "landscape",
        "width": 1920,
        "height": 1080,
        "background_color": "#F8FAFC",
        "border_style": "gold_double",
        "fields": [
            {
                "name": "cert_title",
                "field_type": "static_text",
                "x": 200, "y": 140, "width": 1520, "height": 70,
                "font_family": "Playfair Display", "font_size": 48, "font_weight": "bold",
                "color": "#926815", "align": "center", "default_value": "CERTIFICATE OF ACHIEVEMENT"
            },
            {
                "name": "recipient_name",
                "field_type": "dynamic_text",
                "x": 200, "y": 290, "width": 1520, "height": 130,
                "font_family": "Playfair Display", "font_size": 64, "font_weight": "bold",
                "color": "#111827", "align": "center", "auto_fit": True, "min_font_size": 24,
                "default_value": "Recipient Name"
            },
            {
                "name": "course_name",
                "field_type": "dynamic_text",
                "x": 250, "y": 480, "width": 1420, "height": 80,
                "font_family": "Montserrat", "font_size": 36, "font_weight": "bold",
                "color": "#1F2937", "align": "center", "auto_fit": True, "min_font_size": 20,
                "default_value": "Advanced Software Engineering"
            },
            {
                "name": "date",
                "field_type": "date",
                "x": 250, "y": 760, "width": 300, "height": 40,
                "font_family": "Inter", "font_size": 20, "color": "#334155",
                "align": "center", "default_value": "2026-09-23"
            },
            {
                "name": "qr_code",
                "field_type": "qr",
                "x": 890, "y": 720, "width": 140, "height": 140,
                "color": "#111827"
            },
            {
                "name": "certificate_id",
                "field_type": "cert_id",
                "x": 660, "y": 880, "width": 600, "height": 30,
                "font_family": "Inter", "font_size": 15, "font_weight": "bold",
                "color": "#64748B", "align": "center", "default_value": "CERT-2026-0001"
            }
        ]
    }

    create_res = client.post("/api/templates", json=template_payload)
    assert create_res.status_code == 200
    created_tpl = create_res.json()
    template_id = created_tpl["id"]
    assert template_id is not None

    # 2. Recipient data with difficult names
    test_recipients = [
        {"recipient_name": "John Doe", "course_name": "Full-Stack Web & AI", "date": "2026-09-23"},
        {"recipient_name": "Mohammad Abdul Karim Chowdhury", "course_name": "Full-Stack Web & AI", "date": "2026-09-23"},
        {"recipient_name": "Christopher Alexander Johnson", "course_name": "Full-Stack Web & AI", "date": "2026-09-23"},
        {"recipient_name": "Md. Perves Ahmed", "course_name": "Full-Stack Web & AI", "date": "2026-09-23"},
        {"recipient_name": "মোঃ পারভেজ আহমেদ", "course_name": "ফুল-স্ট্যাক ওয়েব ও এআই", "date": "২৩ সেপ্টেম্বর ২০২৬"},
        {"recipient_name": "Antara Humaira", "course_name": "Full-Stack Web & AI", "date": "2026-09-23"},
        {"recipient_name": "A", "course_name": "Full-Stack Web & AI", "date": "2026-09-23"}
    ]

    # 3. Test Preview generation
    preview_res = client.post("/api/generator/preview", json={
        "template_id": template_id,
        "data_rows": test_recipients[:3]
    })
    assert preview_res.status_code == 200
    previews = preview_res.json()["previews"]
    assert len(previews) == 3
    for p in previews:
        assert p["base64_image"].startswith("data:image/jpeg;base64,")

    # 4. Trigger Batch Generation
    batch_res = client.post("/api/generator/batch", json={
        "name": "E2E Test Batch",
        "template_id": template_id,
        "data_rows": test_recipients,
        "output_format": "both",
        "id_prefix": "E2E-CERT-",
        "filename_pattern": "{certificate_id}_{recipient_name}"
    })
    assert batch_res.status_code == 200
    batch_data = batch_res.json()
    batch_id = batch_data["id"]

    # 5. Check Batch Status
    import time
    for _ in range(30):
        time.sleep(0.5)
        st_res = client.get(f"/api/generator/batch/{batch_id}")
        assert st_res.status_code == 200
        st_data = st_res.json()
        if st_data["status"] in ["completed", "failed"]:
            break

    assert st_data["status"] == "completed"
    assert st_data["success_count"] == len(test_recipients)
    assert st_data["failed_count"] == 0
    assert st_data["zip_download_url"] is not None

    # 6. Test ZIP Download and inspect contents
    zip_res = client.get(f"/api/generator/batch/{batch_id}/download")
    assert zip_res.status_code == 200
    assert len(zip_res.content) > 5000

    import io
    with zipfile.ZipFile(io.BytesIO(zip_res.content), "r") as zf:
        file_list = zf.namelist()
        assert "manifest.csv" in file_list
        # Verify both pdf and png folders exist inside zip
        assert any(f.startswith("pdf/") and f.endswith(".pdf") for f in file_list)
        assert any(f.startswith("png/") and f.endswith(".png") for f in file_list)

    # 7. Test QR Verification endpoint for generated certificate
    first_cert_id = "E2E-CERT-00001"
    verify_res = client.get(f"/api/verification/{first_cert_id}")
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["is_valid"] is True
    assert v_data["recipient_name"] == "John Doe"

def test_e2e_mode_b_masking():
    """
    Mode B: Test template with mask_behind=True to erase previous name on demo certificate.
    """
    template_payload = {
        "name": "Demo Upload with Erase Mask",
        "category": "General",
        "orientation": "landscape",
        "width": 1920,
        "height": 1080,
        "background_color": "#FFFFFF",
        "border_style": "none",
        "fields": [
            {
                "name": "recipient_name",
                "field_type": "dynamic_text",
                "x": 300, "y": 400, "width": 1320, "height": 120,
                "mask_behind": True,
                "mask_color": "#FFFFFF",
                "font_family": "Montserrat", "font_size": 56, "font_weight": "bold",
                "color": "#111827", "align": "center", "auto_fit": True, "min_font_size": 24,
                "default_value": "Masked Recipient"
            }
        ]
    }
    create_res = client.post("/api/templates", json=template_payload)
    assert create_res.status_code == 200
    t_id = create_res.json()["id"]

    # Preview with long name
    preview_res = client.post("/api/generator/preview", json={
        "template_id": t_id,
        "data_rows": [{"recipient_name": "Mohammad Abdul Karim Chowdhury"}]
    })
    assert preview_res.status_code == 200
    assert len(preview_res.json()["previews"]) == 1
