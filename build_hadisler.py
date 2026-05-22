"""
Hadis veri tabanı oluşturucu
GitHub: fawazahmed0/hadith-api (MIT lisanslı, açık kaynak)

Bu script'i internet bağlantınız varken çalıştırın.
İndirilen kaynaklar:
- tur-bukhari.json (Türkçe Buhârî)
- tur-muslim.json (Türkçe Müslim)  
- ara-bukhari.json (Arapça Buhârî)
- ara-muslim.json (Arapça Müslim)

Çıktı: hadisler.json — uygulamada offline çalışır
"""

import json
import urllib.request
import os

OUTPUT_DIR = '.'
os.makedirs(OUTPUT_DIR, exist_ok=True)

URLS = {
    'tur-bukhari': 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/tur-bukhari.json',
    'tur-muslim': 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/tur-muslim.json',
    'ara-bukhari': 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.json',
    'ara-muslim': 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-muslim.json',
}

def indir():
    """Tüm hadis JSON'larını GitHub CDN'inden indir"""
    veriler = {}
    for key, url in URLS.items():
        print(f"İndiriliyor: {key}...")
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                veriler[key] = json.loads(response.read().decode('utf-8'))
            print(f"  ✓ {key} indirildi ({len(veriler[key].get('hadiths', []))} hadis)")
        except Exception as e:
            print(f"  ✗ {key} indirilemedi: {e}")
            return None
    return veriler

def temizle_metin(metin):
    """Hadis metnini temizle - gereksiz işaretler, parantezler"""
    if not metin:
        return ""
    metin = metin.strip()
    # Çoklu boşlukları teke indir
    while '  ' in metin:
        metin = metin.replace('  ', ' ')
    return metin

def filtrele_ve_birlestir(veriler):
    """Türkçe + Arapça eşleştir, filtrele"""
    hadisler = []
    
    # Buhârî
    tur_b = veriler['tur-bukhari']['hadiths']
    ara_b = veriler['ara-bukhari']['hadiths']
    
    for i, tr in enumerate(tur_b):
        tr_metin = temizle_metin(tr.get('text', ''))
        if not tr_metin or len(tr_metin) < 50 or len(tr_metin) > 400:
            continue
        
        ar_metin = ''
        if i < len(ara_b):
            ar_metin = temizle_metin(ara_b[i].get('text', ''))
        
        hadisler.append({
            'no': tr.get('hadithnumber', i + 1),
            'kaynak': 'Buhârî',
            'ar': ar_metin,
            'tr': tr_metin
        })
    
    # Müslim
    tur_m = veriler['tur-muslim']['hadiths']
    ara_m = veriler['ara-muslim']['hadiths']
    
    for i, tr in enumerate(tur_m):
        tr_metin = temizle_metin(tr.get('text', ''))
        if not tr_metin or len(tr_metin) < 50 or len(tr_metin) > 400:
            continue
        
        ar_metin = ''
        if i < len(ara_m):
            ar_metin = temizle_metin(ara_m[i].get('text', ''))
        
        hadisler.append({
            'no': tr.get('hadithnumber', i + 1),
            'kaynak': 'Müslim',
            'ar': ar_metin,
            'tr': tr_metin
        })
    
    # Tartışmalı konuları filtrele (genel kullanım için)
    yasakli_kelimeler = ['mehdi', 'deccal', 'kıyamet alameti', 'fitne']
    hadisler_filtreli = []
    for h in hadisler:
        tr_lower = h['tr'].lower()
        if not any(kelime in tr_lower for kelime in yasakli_kelimeler):
            hadisler_filtreli.append(h)
    
    return hadisler_filtreli

def main():
    print("=" * 50)
    print("Hadis veri tabanı oluşturuluyor")
    print("Kaynak: fawazahmed0/hadith-api (MIT)")
    print("=" * 50)
    
    veriler = indir()
    if not veriler:
        print("\n✗ İndirme başarısız. İnternet bağlantınızı kontrol edin.")
        return
    
    hadisler = filtrele_ve_birlestir(veriler)
    
    cikti_yol = os.path.join(OUTPUT_DIR, 'hadisler.json')
    with open(cikti_yol, 'w', encoding='utf-8') as f:
        json.dump(hadisler, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Toplam {len(hadisler)} hadis hazırlandı")
    print(f"✓ Kayıt: {cikti_yol}")
    print(f"✓ Boyut: ~{os.path.getsize(cikti_yol) // 1024} KB")

if __name__ == '__main__':
    main()
