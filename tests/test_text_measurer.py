import pytest
from app.rendering.text_measurer import (
    is_bengali_text,
    get_font,
    measure_text,
    fit_text_to_box,
    calculate_text_coordinates
)

def test_bengali_text_detection():
    assert is_bengali_text("মোঃ পারভেজ আহমেদ") is True
    assert is_bengali_text("John Doe") is False
    assert is_bengali_text("Bangla (বাংলা)") is True

def test_font_loading():
    font = get_font("Inter", 32)
    assert font is not None
    # Measure text
    w, h = measure_text("John Doe", font)
    assert w > 0
    assert h > 0

def test_fit_text_to_box_short_name():
    res = fit_text_to_box(
        text="John Doe",
        font_family="Inter",
        initial_font_size=40,
        min_font_size=16,
        box_width=400,
        box_height=80,
        auto_fit=True
    )
    assert res["fits"] is True
    assert res["font_size"] == 40
    assert res["text_width"] <= 400

def test_fit_text_to_box_very_long_name():
    long_name = "Mohammad Abdul Karim Chowdhury"
    # Constrain box width to 300px
    res = fit_text_to_box(
        text=long_name,
        font_family="Inter",
        initial_font_size=50,
        min_font_size=14,
        box_width=300,
        box_height=60,
        auto_fit=True
    )
    assert res["fits"] is True
    assert res["font_size"] < 50
    assert res["text_width"] <= 300

def test_centering_coordinates():
    # If box is 600 wide starting at x=100, and text is 200 wide:
    # Center x should be 100 + (600 - 200)/2 = 300
    x, y = calculate_text_coordinates(
        field_x=100,
        field_y=50,
        field_width=600,
        field_height=100,
        text_width=200,
        text_height=40,
        align="center",
        vertical_align="middle"
    )
    assert x == 300.0
    assert y == 80.0
