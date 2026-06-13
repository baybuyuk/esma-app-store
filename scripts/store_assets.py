"""
Hu app Play Store gorsel asset uretici.

Uretir:
  - fastlane/metadata/android/tr-TR/images/featureGraphic/1.png  (1024x500)
  - fastlane/metadata/android/tr-TR/images/icon/1.png            (512x512)
  - fastlane/metadata/android/en-US/images/...                   (aynisi)

Spec: docs/store-assets.md
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

REPO = r'C:\Projeler\hu-app'

# Renk paleti (Hu marka)
KREM = (248, 245, 238, 255)
ALTIN = (176, 141, 46, 255)
KOYU_KAHVE = (44, 36, 24, 255)
ORTA_KAHVE = (92, 74, 46, 255)

# ----------- 1. FEATURE GRAPHIC (1024x500) -----------
W, H = 1024, 500
img = Image.new('RGBA', (W, H), KREM)
draw = ImageDraw.Draw(img)

# Sol-merkez: mevcut icon'dan "هو" hat alanini crop
icon_path = os.path.join(REPO, 'assets', 'icon.png')
icon = Image.open(icon_path).convert('RGBA')
ix, iy = icon.size

# Icon merkez 60% alanini al (hat + dekorlar)
margin = int(ix * 0.05)
crop_box = (margin, margin, ix - margin, iy - margin)
crop = icon.crop(crop_box)

# 360px boyutuna scale
hat_size = 360
crop_scaled = crop.resize((hat_size, hat_size), Image.LANCZOS)

# Sol-merkez yerlestir
hat_x = 70
hat_y = (H - hat_size) // 2
img.paste(crop_scaled, (hat_x, hat_y), crop_scaled)

# Saga "Hu" basligi + slogan
# Font dene (Windows arial.ttf)
def font_dene(path_listesi, boyut):
    for p in path_listesi:
        try:
            return ImageFont.truetype(p, boyut)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()

font_baslik = font_dene([
    r'C:\Windows\Fonts\arialbd.ttf',
    r'C:\Windows\Fonts\Arial.ttf',
], 140)

font_slogan = font_dene([
    r'C:\Windows\Fonts\Arial.ttf',
    r'C:\Windows\Fonts\arial.ttf',
], 22)

# Sag alan baslangic
sag_x = 470

# "Hu" buyuk
baslik = 'Hu'
bbox = draw.textbbox((0, 0), baslik, font=font_baslik)
b_w = bbox[2] - bbox[0]
b_h = bbox[3] - bbox[1]
draw.text((sag_x, (H - b_h) // 2 - 60), baslik, font=font_baslik, fill=KOYU_KAHVE)

# Altin ayrac
ayrac_y = (H // 2) + 30
draw.line([(sag_x, ayrac_y), (sag_x + 380, ayrac_y)], fill=ALTIN, width=2)

# Slogan
slogan = '99 ESMA  -  NAMAZ  -  ZIKIR  -  TILAVET'
draw.text((sag_x, ayrac_y + 18), slogan, font=font_slogan, fill=ORTA_KAHVE)

# Alt rozet
font_kucuk = font_dene([r'C:\Windows\Fonts\Arial.ttf'], 16)
draw.text((sag_x, ayrac_y + 60), 'Sade. Reklamsiz. Veri toplamaz.',
          font=font_kucuk, fill=ALTIN)

# Kaydet (TR + EN)
fg_paths = [
    os.path.join(REPO, 'fastlane', 'metadata', 'android', 'tr-TR', 'images', 'featureGraphic', '1.png'),
    os.path.join(REPO, 'fastlane', 'metadata', 'android', 'en-US', 'images', 'featureGraphic', '1.png'),
]
for p in fg_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p, 'PNG', optimize=True)
    print('FG saved:', p)

# ----------- 2. 512x512 ICON (Play Store) -----------
icon_512 = icon.resize((512, 512), Image.LANCZOS)
icon_paths = [
    os.path.join(REPO, 'fastlane', 'metadata', 'android', 'tr-TR', 'images', 'icon', '1.png'),
    os.path.join(REPO, 'fastlane', 'metadata', 'android', 'en-US', 'images', 'icon', '1.png'),
]
for p in icon_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    icon_512.save(p, 'PNG', optimize=True)
    print('ICON saved:', p)

# ----------- 3. phoneScreenshots klasoru icin README -----------
ss_paths = [
    os.path.join(REPO, 'fastlane', 'metadata', 'android', 'tr-TR', 'images', 'phoneScreenshots'),
    os.path.join(REPO, 'fastlane', 'metadata', 'android', 'en-US', 'images', 'phoneScreenshots'),
]
for p in ss_paths:
    os.makedirs(p, exist_ok=True)
    print('SS dir ready:', p)

print('DONE')
