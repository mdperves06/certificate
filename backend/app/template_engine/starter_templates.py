from sqlalchemy.orm import Session
from app.models.models import Template, TemplateField, TemplateVersion
import json

STARTER_TEMPLATES = [
    {
        "name": "Elegant Gold Excellence",
        "description": "Prestige gold double-bordered certificate suitable for honors, achievements, and awards.",
        "category": "Achievement",
        "orientation": "landscape",
        "width": 1920,
        "height": 1080,
        "background_color": "#FCFBF7",
        "border_style": "gold_double",
        "fields": [
            {
                "name": "cert_title",
                "field_type": "static_text",
                "x": 200, "y": 140, "width": 1520, "height": 70,
                "font_family": "Playfair Display", "font_size": 48, "font_weight": "bold",
                "color": "#926815", "align": "center", "default_value": "CERTIFICATE OF EXCELLENCE"
            },
            {
                "name": "subtitle",
                "field_type": "static_text",
                "x": 300, "y": 230, "width": 1320, "height": 40,
                "font_family": "Montserrat", "font_size": 20, "font_weight": "normal",
                "color": "#4B5563", "align": "center", "default_value": "THIS IS PROUDLY PRESENTED TO"
            },
            {
                "name": "recipient_name",
                "field_type": "dynamic_text",
                "x": 200, "y": 290, "width": 1520, "height": 130,
                "font_family": "Playfair Display", "font_size": 64, "font_weight": "bold",
                "color": "#111827", "align": "center", "auto_fit": True, "min_font_size": 28,
                "default_value": "Recipient Full Name"
            },
            {
                "name": "desc",
                "field_type": "static_text",
                "x": 350, "y": 440, "width": 1220, "height": 40,
                "font_family": "Inter", "font_size": 20, "font_weight": "normal",
                "color": "#4B5563", "align": "center", "default_value": "for outstanding performance and successful completion of"
            },
            {
                "name": "course_name",
                "field_type": "dynamic_text",
                "x": 250, "y": 490, "width": 1420, "height": 80,
                "font_family": "Montserrat", "font_size": 36, "font_weight": "bold",
                "color": "#1F2937", "align": "center", "auto_fit": True, "min_font_size": 20,
                "default_value": "Advanced Full-Stack Engineering Program"
            },
            {
                "name": "date_label",
                "field_type": "static_text",
                "x": 200, "y": 800, "width": 350, "height": 30,
                "font_family": "Inter", "font_size": 16, "font_weight": "normal",
                "color": "#6B7280", "align": "center", "default_value": "DATE OF ISSUANCE"
            },
            {
                "name": "date",
                "field_type": "date",
                "x": 200, "y": 750, "width": 350, "height": 45,
                "font_family": "Inter", "font_size": 22, "font_weight": "bold",
                "color": "#111827", "align": "center", "default_value": "2026-09-23"
            },
            {
                "name": "sig_line",
                "field_type": "shape",
                "x": 1370, "y": 780, "width": 350, "height": 4,
                "color": "#9CA3AF", "extra_props": json.dumps({"shape_type": "line", "stroke_width": 2})
            },
            {
                "name": "sig_label",
                "field_type": "static_text",
                "x": 1370, "y": 800, "width": 350, "height": 30,
                "font_family": "Inter", "font_size": 16, "font_weight": "normal",
                "color": "#6B7280", "align": "center", "default_value": "AUTHORIZED SIGNATURE"
            },
            {
                "name": "qr_code",
                "field_type": "qr",
                "x": 885, "y": 730, "width": 150, "height": 150,
                "color": "#111827"
            },
            {
                "name": "certificate_id",
                "field_type": "cert_id",
                "x": 660, "y": 900, "width": 600, "height": 30,
                "font_family": "Inter", "font_size": 15, "font_weight": "bold",
                "color": "#9CA3AF", "align": "center", "default_value": "CERT-2026-0001"
            }
        ]
    },
    {
        "name": "Modern Minimalist Tech",
        "description": "Clean, crisp typography with slate framing for workshops, hackathons, and certifications.",
        "category": "Workshop",
        "orientation": "landscape",
        "width": 1920,
        "height": 1080,
        "background_color": "#F8FAFC",
        "border_style": "modern_thin",
        "fields": [
            {
                "name": "cert_title",
                "field_type": "static_text",
                "x": 200, "y": 150, "width": 1520, "height": 60,
                "font_family": "Inter", "font_size": 42, "font_weight": "bold",
                "color": "#0F172A", "align": "center", "default_value": "CERTIFICATE OF COMPLETION"
            },
            {
                "name": "subtitle",
                "field_type": "static_text",
                "x": 300, "y": 230, "width": 1320, "height": 40,
                "font_family": "Inter", "font_size": 18, "font_weight": "normal",
                "color": "#64748B", "align": "center", "default_value": "PROUDLY AWARDED TO"
            },
            {
                "name": "recipient_name",
                "field_type": "dynamic_text",
                "x": 200, "y": 280, "width": 1520, "height": 120,
                "font_family": "Inter", "font_size": 60, "font_weight": "bold",
                "color": "#2563EB", "align": "center", "auto_fit": True, "min_font_size": 26,
                "default_value": "John Doe"
            },
            {
                "name": "desc",
                "field_type": "static_text",
                "x": 350, "y": 420, "width": 1220, "height": 40,
                "font_family": "Inter", "font_size": 18, "font_weight": "normal",
                "color": "#475569", "align": "center", "default_value": "has successfully demonstrated mastery and completed all requirements for"
            },
            {
                "name": "course_name",
                "field_type": "dynamic_text",
                "x": 250, "y": 480, "width": 1420, "height": 80,
                "font_family": "Inter", "font_size": 34, "font_weight": "bold",
                "color": "#0F172A", "align": "center", "auto_fit": True, "min_font_size": 20,
                "default_value": "Modern Web & AI Engineering"
            },
            {
                "name": "date",
                "field_type": "date",
                "x": 250, "y": 780, "width": 300, "height": 40,
                "font_family": "Inter", "font_size": 20, "font_weight": "normal",
                "color": "#334155", "align": "center", "default_value": "2026-09-23"
            },
            {
                "name": "qr_code",
                "field_type": "qr",
                "x": 890, "y": 740, "width": 140, "height": 140,
                "color": "#0F172A"
            },
            {
                "name": "certificate_id",
                "field_type": "cert_id",
                "x": 660, "y": 900, "width": 600, "height": 30,
                "font_family": "Inter", "font_size": 14, "font_weight": "normal",
                "color": "#94A3B8", "align": "center", "default_value": "ID: CERT-2026-0001"
            }
        ]
    },
    {
        "name": "Bangla Excellence (প্রশংসাপত্র)",
        "description": "Unicode Bengali certificate template featuring Noto Sans Bengali font for native Bengali names.",
        "category": "Academic",
        "orientation": "landscape",
        "width": 1920,
        "height": 1080,
        "background_color": "#FAF9F6",
        "border_style": "navy_accent",
        "fields": [
            {
                "name": "cert_title",
                "field_type": "static_text",
                "x": 200, "y": 140, "width": 1520, "height": 70,
                "font_family": "NotoSansBengali", "font_size": 52, "font_weight": "bold",
                "color": "#1E3A8A", "align": "center", "default_value": "সাফল্য ও প্রশংসাপত্র"
            },
            {
                "name": "subtitle",
                "field_type": "static_text",
                "x": 300, "y": 240, "width": 1320, "height": 40,
                "font_family": "NotoSansBengali", "font_size": 22, "font_weight": "normal",
                "color": "#475569", "align": "center", "default_value": "এই সনদপত্রটি প্রদান করা হলো"
            },
            {
                "name": "recipient_name",
                "field_type": "dynamic_text",
                "x": 200, "y": 300, "width": 1520, "height": 130,
                "font_family": "NotoSansBengali", "font_size": 64, "font_weight": "bold",
                "color": "#0F172A", "align": "center", "auto_fit": True, "min_font_size": 28,
                "default_value": "মোঃ পারভেজ আহমেদ"
            },
            {
                "name": "desc",
                "field_type": "static_text",
                "x": 350, "y": 450, "width": 1220, "height": 40,
                "font_family": "NotoSansBengali", "font_size": 20, "font_weight": "normal",
                "color": "#475569", "align": "center", "default_value": "যিনি অত্যন্ত সুনামের সাথে নিম্নে উল্লেখিত কোর্স সম্পন্ন করেছেন"
            },
            {
                "name": "course_name",
                "field_type": "dynamic_text",
                "x": 250, "y": 510, "width": 1420, "height": 80,
                "font_family": "NotoSansBengali", "font_size": 36, "font_weight": "bold",
                "color": "#1E3A8A", "align": "center", "auto_fit": True, "min_font_size": 22,
                "default_value": "উন্নত ফুল-স্ট্যাক সফটওয়্যার ইঞ্জিনিয়ারিং"
            },
            {
                "name": "date",
                "field_type": "date",
                "x": 250, "y": 770, "width": 300, "height": 40,
                "font_family": "NotoSansBengali", "font_size": 22, "font_weight": "normal",
                "color": "#334155", "align": "center", "default_value": "২৩ সেপ্টেম্বর ২০২৬"
            },
            {
                "name": "qr_code",
                "field_type": "qr",
                "x": 890, "y": 730, "width": 140, "height": 140,
                "color": "#1E3A8A"
            },
            {
                "name": "certificate_id",
                "field_type": "cert_id",
                "x": 660, "y": 890, "width": 600, "height": 30,
                "font_family": "Inter", "font_size": 15, "font_weight": "bold",
                "color": "#64748B", "align": "center", "default_value": "CERT-2026-BN001"
            }
        ]
    }
]

def seed_starter_templates(db: Session):
    """Seed starter templates if they don't already exist."""
    existing_count = db.query(Template).filter(Template.is_starter == True).count()
    if existing_count > 0:
        return

    for t_spec in STARTER_TEMPLATES:
        template = Template(
            name=t_spec["name"],
            description=t_spec["description"],
            category=t_spec["category"],
            orientation=t_spec["orientation"],
            width=t_spec["width"],
            height=t_spec["height"],
            background_color=t_spec["background_color"],
            border_style=t_spec["border_style"],
            version=1,
            is_starter=True
        )
        db.add(template)
        db.flush()

        for idx, f in enumerate(t_spec["fields"]):
            field = TemplateField(
                template_id=template.id,
                name=f["name"],
                field_type=f["field_type"],
                x=f["x"],
                y=f["y"],
                width=f["width"],
                height=f["height"],
                z_index=idx + 1,
                font_family=f.get("font_family", "Inter"),
                font_size=f.get("font_size", 32),
                font_weight=f.get("font_weight", "normal"),
                color=f.get("color", "#111827"),
                align=f.get("align", "center"),
                auto_fit=f.get("auto_fit", True),
                min_font_size=f.get("min_font_size", 16),
                default_value=f.get("default_value", ""),
                extra_props=f.get("extra_props")
            )
            db.add(field)

        version_record = TemplateVersion(
            template_id=template.id,
            version_number=1,
            schema_data=json.dumps(t_spec, default=str),
            changelog="Initial starter template"
        )
        db.add(version_record)

    db.commit()
