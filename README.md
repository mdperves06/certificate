# Certificate Studio 🎓

> **A Production-Grade Certificate Design, Personalization, Batch Generation, and Verification Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13-blue?style=flat&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Pillow](https://img.shields.io/badge/Pillow-12.3-yellow?style=flat)](https://python-pillow.org/)
[![ReportLab](https://img.shields.io/badge/ReportLab-5.0-red?style=flat)](https://www.reportlab.com/)

---

## 🌟 Overview

**Certificate Studio** is an open-source, full-stack SaaS platform designed for institutions, universities, bootcamps, and organizations to design certificates, personalize thousands of credentials from spreadsheets or clipboard text, and export print-ready PDFs and web PNG packages.

### Core Workflows:
1. **Mode A — Design from Scratch**: Visual drag-and-drop canvas editor supporting dynamic text placeholders (`{{recipient_name}}`, `{{course_name}}`, `{{date}}`, `{{certificate_id}}`), shapes, decorative borders, logos, and QR codes.
2. **Mode B — Personalize Existing Certificate Demo**: Upload existing certificate artwork (PNG, JPG, PDF). Place dynamic fields and activate **Background Masking / Erase** to seamlessly cover the legacy recipient name.
3. **Simple Name-Only Mode**: Paste raw names directly from your clipboard without needing a spreadsheet.

---

## ✨ Key Features

- **🎯 Deterministic Rendering**: Pixel-accurate visual parity between browser preview canvas and exported high-DPI PDFs/PNGs.
- **📏 Smart Text Auto-Fitting**: Automatic downscaling font metrics for long names (`Mohammad Abdul Karim Chowdhury`, `Christopher Alexander Johnson`) ensuring text never overflows bounding boxes or overlaps borders.
- **🌐 Multilingual & Native Bangla Support**: Full Unicode support with bundled Google Fonts and Noto Sans Bengali (`মোঃ পারভেজ আহমেদ`).
- **🚀 Bulk Batch Generation**: Asynchronous background workers process hundreds or thousands of personalized documents with live progress tracking and zero browser freezing.
- **📦 Instant ZIP Packages**: 1-click bulk ZIP archive download with structured folder layout and `manifest.csv`.
- **🛡️ Public QR Verification**: Unique tamper-evident Certificate IDs and QR codes linking to `/verify/{certificate_id}`.
- **🎨 Starter Templates Included**: Pre-packaged templates: *Elegant Gold Excellence*, *Modern Minimalist Tech*, and *Bangla Excellence*.

---

## 🏗️ Architecture & Project Structure

Clean monorepo architecture:

```
certificate/
├── frontend/                     # Next.js 15+ App Router, React 19, TypeScript, Tailwind CSS
│   ├── app/                      # App router pages (dashboard, editor, generate, history, verify, settings)
│   ├── components/               # Navbar, Toast notifications, UI controls
│   └── lib/                      # Typed API client and canvas coordinate utilities
│
├── backend/                      # FastAPI Python 3.13 backend
│   ├── app/
│   │   ├── api/                  # REST endpoints (templates, assets, importers, generator, verification)
│   │   ├── models/               # SQLAlchemy ORM models (SQLite/PostgreSQL)
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── rendering/            # Pillow & ReportLab high-DPI deterministic render engine
│   │   ├── template_engine/      # Starter templates seeder and variable interpolation
│   │   └── importers/            # CSV, Excel (.xlsx), and clipboard paste parsers
│   ├── fonts/                    # High-quality Open/TrueType fonts (Inter, Montserrat, Noto Sans Bengali)
│   └── storage/                  # Structured local storage for uploads and batch ZIPs
│
├── sample_data/                  # Test CSV datasets with short, long, and Bengali names
├── tests/                        # Automated Pytest suite
├── docker/                       # Dockerfiles for frontend and backend
├── docker-compose.yml            # Multi-container local orchestration
└── .env.example                  # Environment configuration reference
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20+ or v24+
- **Python**: 3.10+ (tested on Python 3.13)
- **Git**

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be running on `http://127.0.0.1:8000` (Swagger docs available at `http://127.0.0.1:8000/docs`).

---

### 2. Frontend Setup

```bash
cd frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```
Frontend web application will be accessible on `http://localhost:3000`.

---

## 🐳 Docker Deployment

To spin up the entire application stack using Docker Compose:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 🧪 Running Automated Tests

Run backend unit and integration tests:

```bash
# Set PYTHONPATH and run pytest
pytest -v
```
Test suite verifies:
- Font metrics and bounding box calculation
- Short name, long name, and Bengali Unicode text fitting
- CSV and clipboard text parsing
- Data validation and missing field detection
- Pillow image rendering and ReportLab PDF export

---

## 🛡️ Security & Privacy

- **MIME & File Size Validation**: Uploads are restricted to verified image formats and PDF files under 25MB.
- **Filename Sanitization**: Uploaded files and generated archives are sanitized against path traversal vulnerabilities.
- **Privacy By Design**: Recipient lists and generated files are isolated in server storage with configurable retention periods.

---

## 📄 License & Disclaimer

Certificate Studio is open-source software. Users are responsible for ensuring they possess appropriate rights for uploaded logos, artwork, signatures, and fonts.