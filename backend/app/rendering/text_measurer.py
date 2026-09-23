import os
import re
from typing import Tuple, Dict, Any, Optional
from PIL import ImageFont, ImageDraw, Image

FONTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "fonts")

# In-memory font cache: (font_path, font_size) -> ImageFont
FONT_CACHE: Dict[Tuple[str, int], ImageFont.FreeTypeFont] = {}

def is_bengali_text(text: str) -> bool:
    """Check if string contains Bengali Unicode characters (U+0980 to U+09FF)."""
    return any(0x0980 <= ord(c) <= 0x09FF for c in text)

def resolve_font_path(font_family: str, font_weight: str = "normal", text: str = "") -> str:
    """Find the best matching TTF/OTF font file."""
    is_bold = "bold" in font_weight.lower() or "700" in font_weight or "800" in font_weight or "900" in font_weight
    
    # Check for Bengali characters
    if is_bengali_text(text):
        bengali_font = "NotoSansBengali-Bold.ttf" if is_bold else "NotoSansBengali-Regular.ttf"
        local_bengali = os.path.join(FONTS_DIR, bengali_font)
        if os.path.exists(local_bengali):
            return local_bengali
        # Windows fallback for Bengali
        vrinda_font = r"C:\Windows\Fonts\vrindab.ttf" if is_bold else r"C:\Windows\Fonts\vrinda.ttf"
        if os.path.exists(vrinda_font):
            return vrinda_font

    clean_family = font_family.lower().replace(" ", "").replace("-", "")
    
    candidates = []
    if "inter" in clean_family:
        candidates = ["Inter-Bold.ttf" if is_bold else "Inter-Regular.ttf", "Inter-Regular.otf", "segoeui.ttf"]
    elif "montserrat" in clean_family or "poppins" in clean_family:
        candidates = ["Montserrat-Bold.ttf" if is_bold else "Montserrat-Regular.ttf", "arialbd.ttf" if is_bold else "arial.ttf"]
    elif "playfair" in clean_family or "serif" in clean_family or "lora" in clean_family:
        candidates = ["PlayfairDisplay-Bold.ttf", "georgiab.ttf" if is_bold else "georgia.ttf", "timesbd.ttf" if is_bold else "times.ttf"]
    else:
        candidates = [
            f"{font_family}-Bold.ttf" if is_bold else f"{font_family}-Regular.ttf",
            "Inter-Bold.ttf" if is_bold else "Inter-Regular.ttf",
            "arialbd.ttf" if is_bold else "arial.ttf"
        ]

    # 1. Search in project fonts directory
    for cand in candidates:
        full_path = os.path.join(FONTS_DIR, cand)
        if os.path.exists(full_path):
            return full_path

    # 2. Search in Windows Fonts directory
    windows_fonts = r"C:\Windows\Fonts"
    for cand in candidates:
        full_path = os.path.join(windows_fonts, cand)
        if os.path.exists(full_path):
            return full_path

    # 3. Default fallback
    default_fallbacks = ["Inter-Regular.ttf", "segoeui.ttf", "arial.ttf"]
    for cand in default_fallbacks:
        p1 = os.path.join(FONTS_DIR, cand)
        if os.path.exists(p1):
            return p1
        p2 = os.path.join(windows_fonts, cand)
        if os.path.exists(p2):
            return p2

    return ""

def get_font(font_family: str, font_size: float, font_weight: str = "normal", text: str = "") -> ImageFont.FreeTypeFont:
    """Retrieve or load a TrueType font with caching."""
    int_size = max(8, int(round(font_size)))
    font_path = resolve_font_path(font_family, font_weight, text)
    
    cache_key = (font_path, int_size)
    if cache_key in FONT_CACHE:
        return FONT_CACHE[cache_key]

    try:
        if font_path and os.path.exists(font_path):
            font = ImageFont.truetype(font_path, size=int_size)
        else:
            font = ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    FONT_CACHE[cache_key] = font
    return font

def measure_text(text: str, font: ImageFont.FreeTypeFont) -> Tuple[float, float]:
    """Measure exact bounding box width and height for text using PIL."""
    if not text:
        return 0.0, 0.0
    try:
        bbox = font.getbbox(text)
        # bbox is (left, top, right, bottom)
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]
        return float(width), float(height)
    except Exception:
        # Fallback approximation
        return float(len(text) * 10), 20.0

def fit_text_to_box(
    text: str,
    font_family: str,
    initial_font_size: float,
    min_font_size: float,
    box_width: float,
    box_height: float,
    font_weight: str = "normal",
    auto_fit: bool = True
) -> Dict[str, Any]:
    """
    Downscale font size if text overflows field width.
    Returns: {
        'font': ImageFont,
        'font_size': float,
        'text_width': float,
        'text_height': float,
        'fits': bool,
        'warning': Optional[str]
    }
    """
    if not text:
        font = get_font(font_family, initial_font_size, font_weight, text)
        return {
            "font": font,
            "font_size": initial_font_size,
            "text_width": 0.0,
            "text_height": 0.0,
            "fits": True,
            "warning": None
        }

    current_size = initial_font_size
    min_size = max(8.0, min_font_size)
    
    font = get_font(font_family, current_size, font_weight, text)
    w, h = measure_text(text, font)

    if not auto_fit or (w <= box_width and h <= box_height):
        return {
            "font": font,
            "font_size": current_size,
            "text_width": w,
            "text_height": h,
            "fits": w <= box_width,
            "warning": None if w <= box_width else f"Text overflows field by {w - box_width:.1f}px"
        }

    # Iterative downscaling with binary/ratio search for speed and precision
    step_down = 1.0
    while current_size > min_size:
        # Ratio estimate
        ratio = box_width / max(1.0, w)
        if ratio < 0.95:
            current_size = max(min_size, current_size * ratio * 0.98)
        else:
            current_size = max(min_size, current_size - step_down)

        font = get_font(font_family, current_size, font_weight, text)
        w, h = measure_text(text, font)
        
        if w <= box_width:
            break

    fits = w <= box_width
    warning = None if fits else f"Text '{text}' exceeds box width even at min font size {min_size}px (width: {w:.1f}px > {box_width:.1f}px)"

    return {
        "font": font,
        "font_size": current_size,
        "text_width": w,
        "text_height": h,
        "fits": fits,
        "warning": warning
    }

def calculate_text_coordinates(
    field_x: float,
    field_y: float,
    field_width: float,
    field_height: float,
    text_width: float,
    text_height: float,
    align: str = "center",
    vertical_align: str = "middle"
) -> Tuple[float, float]:
    """
    Calculate top-left coordinate for text drawing inside bounding box.
    Guarantees that regardless of text length, centered text remains mathematically centered.
    """
    # Horizontal alignment
    if align == "left":
        x = field_x
    elif align == "right":
        x = field_x + field_width - text_width
    else:  # center
        x = field_x + (field_width - text_width) / 2.0

    # Vertical alignment
    if vertical_align == "top":
        y = field_y
    elif vertical_align == "bottom":
        y = field_y + field_height - text_height
    else:  # middle
        y = field_y + (field_height - text_height) / 2.0

    return x, y
