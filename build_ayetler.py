"""
Ayet veri tabanı oluşturucu
GitHub: fawazahmed0/quran-api (açık kaynak)

Bu script'i internet bağlantınız varken çalıştırın.
Çıktı: ayetler.json — uygulamada offline çalışır
"""

import json
import urllib.request
import os

OUTPUT_DIR = '.'
os.makedirs(OUTPUT_DIR, exist_ok=True)

URLS = {
    'tur-diyanet': 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/tur-diyanetisleri.json',
    'ara-quran': 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranindopak.json',
}

# Sure numarası -> Türkçe adı
SURE_ADLARI = {
    1: "Fâtiha", 2: "Bakara", 3: "Âl-i İmrân", 4: "Nisâ", 5: "Mâide",
    6: "En'âm", 7: "A'râf", 8: "Enfâl", 9: "Tevbe", 10: "Yûnus",
    11: "Hûd", 12: "Yûsuf", 13: "Ra'd", 14: "İbrâhim", 15: "Hicr",
    16: "Nahl", 17: "İsrâ", 18: "Kehf", 19: "Meryem", 20: "Tâhâ",
    21: "Enbiyâ", 22: "Hac", 23: "Mü'minûn", 24: "Nûr", 25: "Furkân",
    26: "Şuarâ", 27: "Neml", 28: "Kasas", 29: "Ankebût", 30: "Rûm",
    31: "Lokmân", 32: "Secde", 33: "Ahzâb", 34: "Sebe", 35: "Fâtır",
    36: "Yâsîn", 37: "Sâffât", 38: "Sâd", 39: "Zümer", 40: "Mü'min",
    41: "Fussilet", 42: "Şûrâ", 43: "Zuhruf", 44: "Duhân", 45: "Câsiye",
    46: "Ahkâf", 47: "Muhammed", 48: "Fetih", 49: "Hucurât", 50: "Kâf",
    51: "Zâriyât", 52: "Tûr", 53: "Necm", 54: "Kamer", 55: "Rahmân",
    56: "Vâkıa", 57: "Hadîd", 58: "Mücâdele", 59: "Haşr", 60: "Mümtehine",
    61: "Saf", 62: "Cuma", 63: "Münâfikûn", 64: "Tegâbun", 65: "Talâk",
    66: "Tahrîm", 67: "Mülk", 68: "Kalem", 69: "Hâkka", 70: "Meâric",
    71: "Nûh", 72: "Cin", 73: "Müzzemmil", 74: "Müddessir", 75: "Kıyâme",
    76: "İnsan", 77: "Mürselât", 78: "Nebe", 79: "Nâziât", 80: "Abese",
    81: "Tekvîr", 82: "İnfitâr", 83: "Mutaffifîn", 84: "İnşikâk", 85: "Bürûc",
    86: "Târık", 87: "A'lâ", 88: "Gâşiye", 89: "Fecr", 90: "Beled",
    91: "Şems", 92: "Leyl", 93: "Duhâ", 94: "İnşirâh", 95: "Tîn",
    96: "Alak", 97: "Kadr", 98: "Beyyine", 99: "Zilzâl", 100: "Âdiyât",
    101: "Kâria", 102: "Tekâsür", 103: "Asr", 104: "Hümeze", 105: "Fîl",
    106: "Kureyş", 107: "Mâûn", 108: "Kevser", 109: "Kâfirûn", 110: "Nasr",
    111: "Tebbet", 112: "İhlâs", 113: "Felâk", 114: "Nâs"
}

# Hikmet ayetleri - bağlamından kopuk okunduğunda da doğru/faydalı mesaj veren ayetler
# (Klasik vird kitaplarında en sık yer alan ayetler)
HIKMET_AYETLERI = {
    1: list(range(1, 8)),  # Fâtiha tamamı
    2: [21, 22, 152, 153, 155, 156, 163, 164, 165, 186, 201, 216, 255, 256, 257, 285, 286],
    3: [8, 18, 26, 27, 31, 92, 102, 103, 133, 134, 135, 136, 145, 159, 173, 185, 191, 200],
    4: [69, 80, 100, 103, 110, 114, 142, 146, 147],
    5: [3, 8, 9, 12, 35, 54, 105, 119],
    6: [12, 17, 51, 54, 59, 65, 162, 163],
    7: [23, 26, 31, 56, 156, 180, 199, 200, 201, 205],
    8: [2, 3, 4, 24, 29, 40, 46, 53, 62, 63],
    9: [40, 51, 71, 105, 111, 119, 128, 129],
    10: [25, 26, 57, 58, 62, 64, 107],
    11: [3, 6, 88, 90, 112, 114, 123],
    12: [18, 23, 53, 64, 83, 86, 87, 101, 111],
    13: [11, 22, 23, 24, 28, 29, 39],
    14: [7, 24, 25, 31, 32, 33, 34, 40, 41],
    15: [56, 97, 98, 99],
    16: [18, 30, 32, 90, 96, 97, 99, 125, 127, 128],
    17: [9, 19, 23, 24, 25, 36, 37, 53, 70, 80, 81, 84, 110, 111],
    18: [10, 23, 24, 28, 39, 46, 110],
    19: [3, 4, 5, 6, 96],
    20: [25, 26, 27, 28, 39, 44, 114, 130, 131, 132],
    21: [35, 83, 87, 88, 89, 90, 107],
    22: [40, 41, 46, 70, 77, 78],
    23: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 60, 96, 97, 98, 99, 115, 118],
    24: [21, 22, 35, 36, 37, 38, 39, 40, 41, 52, 55],
    25: [63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
    26: [78, 79, 80, 81, 82, 83, 84, 85, 87, 88, 89],
    27: [62, 79, 88, 89, 90, 93],
    28: [56, 77, 83, 88],
    29: [2, 3, 6, 45, 56, 57, 60, 64, 69],
    30: [7, 17, 18, 21, 30, 38, 41, 47, 60],
    31: [12, 13, 14, 15, 16, 17, 18, 19, 22, 23, 34],
    32: [15, 16, 17, 18],
    33: [21, 35, 41, 42, 43, 56, 70, 71],
    34: [13, 39, 47],
    35: [2, 3, 5, 15, 18, 22, 29, 30, 34, 35, 45],
    36: [12, 36, 38, 39, 40, 70, 78, 79, 80, 82, 83],
    37: [180, 181, 182],
    38: [27, 29, 35, 45, 46, 47, 48],
    39: [9, 10, 22, 23, 36, 38, 49, 53, 54, 66, 67, 73, 74, 75],
    40: [7, 8, 13, 14, 15, 44, 55, 60, 65],
    41: [30, 31, 32, 33, 34, 35, 36, 46, 53, 54],
    42: [11, 13, 19, 20, 23, 25, 26, 28, 30, 36, 40, 43, 49, 50, 52, 53],
    43: [9, 32, 67, 68, 69, 70, 71, 72],
    44: [42, 49, 51, 52, 53, 54, 55, 56, 57],
    45: [13, 14, 18, 36, 37],
    46: [13, 15, 16, 19, 35],
    47: [7, 19, 24, 31, 36, 38],
    48: [1, 2, 3, 4, 10, 27, 28, 29],
    49: [10, 11, 12, 13, 14, 15],
    50: [16, 22, 31, 32, 33, 34, 35, 39, 40, 45],
    51: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 50, 55, 56, 58],
    52: [21, 48, 49],
    53: [38, 39, 40, 41, 42, 43, 58, 62],
    54: [49, 50, 54, 55],
    55: list(range(1, 79)),  # Rahman tamamı
    56: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 88, 89, 90, 91],
    57: [1, 2, 3, 4, 5, 6, 11, 12, 13, 16, 18, 20, 21, 22, 23, 25, 28],
    58: [11, 22],
    59: [18, 19, 20, 21, 22, 23, 24],
    60: [4, 5, 8, 13],
    61: [10, 11, 12, 13],
    62: [1, 2, 3, 4, 9, 10, 11],
    63: [9, 10, 11],
    64: [11, 14, 15, 16, 17],
    65: [2, 3, 4, 5, 7],
    66: [6, 8, 10, 11, 12],
    67: [1, 2, 3, 4, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    68: [4, 17, 18, 19, 32, 34, 35, 36, 51, 52],
    69: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
    70: [4, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 40, 41],
    71: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 26, 27, 28],
    72: [13, 15, 16, 17, 18],
    73: [8, 9, 10, 11, 20],
    74: [3, 4, 5, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56],
    75: [22, 23, 24, 25, 36, 37, 38, 39, 40],
    76: [1, 2, 3, 7, 8, 9, 10, 11, 12, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
    77: [50],
    78: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
    79: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
    80: [33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
    81: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    82: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    83: [22, 23, 24, 25, 26, 27, 28],
    84: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    85: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    86: [11, 12, 13, 14, 15, 16, 17],
    87: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    88: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    89: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    90: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    91: list(range(1, 16)),
    92: [4, 5, 6, 7, 8, 9, 10, 11, 12, 17, 18, 19, 20, 21],
    93: list(range(1, 12)),
    94: list(range(1, 9)),  # İnşirah tamamı
    95: list(range(1, 9)),  # Tin tamamı
    96: [1, 2, 3, 4, 5],
    97: list(range(1, 6)),  # Kadr tamamı
    98: [6, 7, 8],
    99: list(range(1, 9)),  # Zilzâl tamamı
    100: [6, 7, 8, 9, 10, 11],
    101: list(range(1, 12)),
    102: list(range(1, 9)),
    103: list(range(1, 4)),  # Asr tamamı
    104: list(range(1, 10)),
    105: list(range(1, 6)),
    106: list(range(1, 5)),
    107: list(range(1, 8)),
    108: list(range(1, 4)),  # Kevser tamamı
    109: list(range(1, 7)),
    110: list(range(1, 4)),  # Nasr tamamı
    111: list(range(1, 6)),
    112: list(range(1, 5)),  # İhlâs tamamı
    113: list(range(1, 6)),  # Felâk tamamı
    114: list(range(1, 7))   # Nâs tamamı
}

def indir():
    veriler = {}
    for key, url in URLS.items():
        print(f"İndiriliyor: {key}...")
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                veriler[key] = json.loads(response.read().decode('utf-8'))
            print(f"  ✓ {key} indirildi")
        except Exception as e:
            print(f"  ✗ {key} indirilemedi: {e}")
            return None
    return veriler

def hazirla(veriler):
    diyanet = veriler['tur-diyanet']['quran']
    arapca = veriler['ara-quran']['quran']
    
    # Hızlı erişim için map oluştur: (sure, ayet) -> ayet
    ayet_map = {}
    for i, a in enumerate(diyanet):
        key = (a['chapter'], a['verse'])
        ar = ''
        if i < len(arapca):
            ar = arapca[i].get('text', '')
        ayet_map[key] = {
            'sure_no': a['chapter'],
            'sure_adi': SURE_ADLARI.get(a['chapter'], f"Sûre {a['chapter']}"),
            'ayet_no': a['verse'],
            'ar': ar,
            'tr': a['text']
        }
    
    # Hikmet ayetlerini topla
    ayetler = []
    for sure_no, ayet_nolari in HIKMET_AYETLERI.items():
        for ayet_no in ayet_nolari:
            key = (sure_no, ayet_no)
            if key in ayet_map:
                a = ayet_map[key]
                # Uzunluk filtresi
                if 30 <= len(a['tr']) <= 350:
                    ayetler.append(a)
    
    return ayetler

def main():
    print("=" * 50)
    print("Ayet veri tabanı oluşturuluyor")
    print("Kaynak: fawazahmed0/quran-api (Diyanet meali)")
    print("=" * 50)
    
    veriler = indir()
    if not veriler:
        print("\n✗ İndirme başarısız. İnternet bağlantınızı kontrol edin.")
        return
    
    ayetler = hazirla(veriler)
    
    cikti_yol = os.path.join(OUTPUT_DIR, 'ayetler.json')
    with open(cikti_yol, 'w', encoding='utf-8') as f:
        json.dump(ayetler, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Toplam {len(ayetler)} hikmet ayeti hazırlandı")
    print(f"✓ Kayıt: {cikti_yol}")
    print(f"✓ Boyut: ~{os.path.getsize(cikti_yol) // 1024} KB")

if __name__ == '__main__':
    main()
