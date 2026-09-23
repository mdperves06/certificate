import io
import csv
import re
from typing import Dict, Any, List, Tuple
import openpyxl

COMMON_MAPPINGS = {
    "recipient_name": ["name", "recipient", "recipient_name", "full_name", "fullname", "student", "attendee", "participant", "নাম"],
    "course_name": ["course", "course_name", "topic", "workshop", "event", "program", "training", "subject", "কোর্স"],
    "date": ["date", "issue_date", "completion_date", "awarded_date", "তারিখ"],
    "recipient_email": ["email", "e-mail", "mail", "recipient_email"],
    "certificate_id": ["id", "certificate_id", "cert_id", "serial", "code"],
    "score": ["score", "grade", "marks", "result", "gpa"],
    "organization": ["org", "organization", "company", "issuer", "institution"]
}

def auto_detect_mappings(headers: List[str]) -> Dict[str, str]:
    """Detect template field keys from table headers."""
    detected = {}
    lower_headers = {h.lower().strip().replace(" ", "_"): h for h in headers}

    for target_field, candidates in COMMON_MAPPINGS.items():
        for cand in candidates:
            for lk, orig_header in lower_headers.items():
                if cand == lk or cand in lk:
                    detected[target_field] = orig_header
                    break
            if target_field in detected:
                break
    return detected

def parse_csv_content(content: bytes) -> Tuple[List[str], List[Dict[str, Any]]]:
    """Parse CSV with robust encoding and delimiter detection."""
    # Attempt decoding with UTF-8-sig first, then utf-8, then latin1
    for enc in ["utf-8-sig", "utf-8", "latin1"]:
        try:
            text = content.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = content.decode("utf-8", errors="replace")

    # Detect delimiter
    sample = text[:2048]
    delimiter = ","
    if "\t" in sample and sample.count("\t") > sample.count(","):
        delimiter = "\t"
    elif ";" in sample and sample.count(";") > sample.count(","):
        delimiter = ";"

    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    rows = list(reader)
    if not rows:
        return [], []

    headers = [h.strip() for h in rows[0] if h.strip()]
    data_rows = []

    for r in rows[1:]:
        if not any(cell.strip() for cell in r):
            continue
        row_dict = {}
        for idx, h in enumerate(headers):
            val = r[idx].strip() if idx < len(r) else ""
            row_dict[h] = val
        data_rows.append(row_dict)

    return headers, data_rows

def parse_excel_content(content: bytes) -> Tuple[List[str], List[Dict[str, Any]]]:
    """Parse Excel (.xlsx) file contents."""
    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return [], []

    raw_headers = rows[0]
    headers = [str(h).strip() for h in raw_headers if h is not None and str(h).strip()]
    data_rows = []

    for r in rows[1:]:
        if not any(cell is not None and str(cell).strip() for cell in r):
            continue
        row_dict = {}
        for idx, h in enumerate(headers):
            val = ""
            if idx < len(r) and r[idx] is not None:
                val = str(r[idx]).strip()
            row_dict[h] = val
        data_rows.append(row_dict)

    return headers, data_rows

def parse_pasted_text(text: str) -> Tuple[List[str], List[Dict[str, Any]]]:
    """Parse clipboard text (comma, tab, or newline separated names)."""
    clean_text = text.strip()
    if not clean_text:
        return [], []

    lines = [line.strip() for line in clean_text.splitlines() if line.strip()]
    if not lines:
        return [], []

    first_line = lines[0]
    # Check if there is a header or if it's simply a list of names
    if "\t" in first_line or "," in first_line:
        # Delimited tabular text
        delim = "\t" if "\t" in first_line else ","
        reader = csv.reader(lines, delimiter=delim)
        parsed_rows = list(reader)
        headers = [h.strip() for h in parsed_rows[0] if h.strip()]
        data_rows = []
        for r in parsed_rows[1:]:
            if not any(c.strip() for c in r):
                continue
            row_dict = {}
            for idx, h in enumerate(headers):
                row_dict[h] = r[idx].strip() if idx < len(r) else ""
            data_rows.append(row_dict)
        return headers, data_rows
    else:
        # Simple list of recipient names!
        headers = ["recipient_name"]
        data_rows = [{"recipient_name": line} for line in lines]
        return headers, data_rows

def validate_recipient_data(
    rows: List[Dict[str, Any]],
    field_mappings: Dict[str, str]
) -> Dict[str, Any]:
    """
    Validate tabular recipient rows before batch generation.
    Checks for:
    - Missing recipient name
    - Duplicate names / rows
    - Invalid emails
    - Abnormally long names
    """
    name_col = field_mappings.get("recipient_name", "recipient_name")
    email_col = field_mappings.get("recipient_email", "email")

    issues = []
    seen_names = {}
    valid_count = 0

    for idx, row in enumerate(rows):
        row_num = idx + 1
        name = str(row.get(name_col, "")).strip()

        # Check empty name
        if not name:
            issues.append({
                "row_index": idx,
                "column": name_col,
                "message": f"Row {row_num}: Recipient name is missing or empty.",
                "level": "error"
            })
            continue

        # Check duplicate
        if name in seen_names:
            prev_row = seen_names[name]
            issues.append({
                "row_index": idx,
                "column": name_col,
                "message": f"Row {row_num}: Duplicate name '{name}' (previously on Row {prev_row}).",
                "level": "warning"
            })
        else:
            seen_names[name] = row_num

        # Check excessive length
        if len(name) > 100:
            issues.append({
                "row_index": idx,
                "column": name_col,
                "message": f"Row {row_num}: Name is unusually long ({len(name)} chars). May require downscaling.",
                "level": "warning"
            })

        # Check email format if column mapped and value present
        if email_col in row and row[email_col]:
            email_val = str(row[email_col]).strip()
            if not re.match(r"[^@]+@[^@]+\.[^@]+", email_val):
                issues.append({
                    "row_index": idx,
                    "column": email_col,
                    "message": f"Row {row_num}: Invalid email format '{email_val}'.",
                    "level": "warning"
                })

        valid_count += 1

    error_count = sum(1 for i in issues if i["level"] == "error")
    warning_count = sum(1 for i in issues if i["level"] == "warning")

    return {
        "is_valid": error_count == 0,
        "total_rows": len(rows),
        "valid_rows_count": valid_count,
        "errors_count": error_count,
        "warnings_count": warning_count,
        "issues": issues
    }
