from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Certificate
from app.schemas.schemas import VerificationResponse

router = APIRouter(prefix="/api/verification", tags=["Verification"])

@router.get("/{certificate_id}", response_model=VerificationResponse)
def verify_certificate(certificate_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    if not cert:
        return {
            "is_valid": False,
            "status": "not_found",
            "certificate_id": certificate_id,
            "recipient_name": None,
            "course_name": None,
            "issue_date": None,
            "organization": None,
            "issued_at": None,
            "verification_hash": None
        }

    return {
        "is_valid": cert.status == "valid",
        "status": cert.status,
        "certificate_id": cert.certificate_id,
        "recipient_name": cert.recipient_name,
        "course_name": cert.course_name,
        "issue_date": cert.issue_date,
        "organization": cert.organization,
        "issued_at": cert.created_at,
        "verification_hash": cert.verification_hash
    }

@router.post("/{certificate_id}/revoke")
def revoke_certificate(certificate_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    cert.status = "revoked"
    db.commit()
    return {"message": f"Certificate {certificate_id} has been revoked."}
