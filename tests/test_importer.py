import pytest
from app.importers.importer import (
    parse_csv_content,
    parse_pasted_text,
    auto_detect_mappings,
    validate_recipient_data
)

def test_csv_parser():
    csv_bytes = b"recipient_name,email,course_name,date\nJohn Doe,john@example.com,Python,2026-09-23\nJane Smith,jane@example.com,Python,2026-09-23"
    headers, rows = parse_csv_content(csv_bytes)
    assert len(headers) == 4
    assert len(rows) == 2
    assert rows[0]["recipient_name"] == "John Doe"

def test_paste_names_only():
    text = "John Doe\nJane Smith\nMohammad Abdul Karim Chowdhury\n\xe0\xa6\xae\xe0\xa7\x8b\xc2\xa6 \xe0\xa6\xaa\xe0\xa6\xbe\xe0\xa6\xb0\xe0\xa6\xad\xe0\xa7\x87\xe0\xa6\x9c \xe0\xa6\x86\xe0\xa6\xb9\xe0\xa6\xae\xe0\xa7\x87\xe0\xa6\xa6"
    headers, rows = parse_pasted_text(text)
    assert headers == ["recipient_name"]
    assert len(rows) == 4

def test_auto_detect_mappings():
    headers = ["Student Name", "Email Address", "Completion Date", "Course Title"]
    mappings = auto_detect_mappings(headers)
    assert "recipient_name" in mappings
    assert mappings["recipient_name"] == "Student Name"
    assert "course_name" in mappings
    assert mappings["course_name"] == "Course Title"

def test_validate_data_with_missing_and_duplicates():
    rows = [
        {"name": "John Doe", "email": "john@example.com"},
        {"name": "", "email": "empty@example.com"},
        {"name": "John Doe", "email": "john2@example.com"}
    ]
    mappings = {"recipient_name": "name", "recipient_email": "email"}
    report = validate_recipient_data(rows, mappings)
    assert report["is_valid"] is False
    assert report["errors_count"] == 1  # 1 empty name
    assert report["warnings_count"] == 1  # 1 duplicate warning
