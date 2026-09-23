import qrcode
from PIL import Image

def generate_qr_code(data: str, size: int = 150, fill_color: str = "#000000", back_color: str = "#ffffff") -> Image.Image:
    """Generate high-contrast QR code image."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=1,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fill_color, back_color=back_color).convert("RGBA")
    if img.size != (size, size):
        img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img
