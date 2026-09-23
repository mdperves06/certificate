import os
import shutil
import urllib.request

FONTS_DIR = os.path.join(os.path.dirname(__file__), "fonts")
os.makedirs(FONTS_DIR, exist_ok=True)

GOOGLE_FONTS = {
    "Inter-Regular.ttf": "https://github.com/googlefonts/inter/raw/master/docs/font-files/Inter-Regular.otf",
    "Montserrat-Regular.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/static/Montserrat-Regular.ttf",
    "Montserrat-Bold.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/static/Montserrat-Bold.ttf",
    "PlayfairDisplay-Bold.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/static/PlayfairDisplay-Bold.ttf",
    "NotoSansBengali-Regular.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansbengali/NotoSansBengali%5Bwdth%2Cwght%5D.ttf",
    "NotoSansBengali-Bold.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansbengali/NotoSansBengali%5Bwdth%2Cwght%5D.ttf",
}

WINDOWS_FALLBACKS = {
    "Inter-Regular.ttf": r"C:\Windows\Fonts\segoeui.ttf",
    "Montserrat-Regular.ttf": r"C:\Windows\Fonts\arial.ttf",
    "Montserrat-Bold.ttf": r"C:\Windows\Fonts\arialbd.ttf",
    "PlayfairDisplay-Bold.ttf": r"C:\Windows\Fonts\georgiab.ttf",
    "NotoSansBengali-Regular.ttf": r"C:\Windows\Fonts\vrinda.ttf",
    "NotoSansBengali-Bold.ttf": r"C:\Windows\Fonts\vrindab.ttf",
}

def setup_fonts():
    for filename, url in GOOGLE_FONTS.items():
        target = os.path.join(FONTS_DIR, filename)
        if os.path.exists(target) and os.path.getsize(target) > 1000:
            print(f"Font already exists: {filename}")
            continue
        try:
            print(f"Downloading {filename}...")
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp, open(target, "wb") as f:
                f.write(resp.read())
            print(f"Downloaded {filename} ({os.path.getsize(target)} bytes)")
        except Exception as e:
            print(f"Could not download {filename} ({e}), checking Windows fonts fallback...")
            fallback = WINDOWS_FALLBACKS.get(filename)
            if fallback and os.path.exists(fallback):
                shutil.copyfile(fallback, target)
                print(f"Copied fallback from {fallback} to {filename}")
            else:
                print(f"Warning: font {filename} could not be obtained.")

if __name__ == "__main__":
    setup_fonts()
