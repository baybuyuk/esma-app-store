"""
Manevi sureler builder:
1) 7 sure (36 Yâsîn, 55 Rahmân, 56 Vâkıa, 67 Mülk, 73 Müzzemmil, 78 Nebe, 94 İnşirah)
   Arabic (quran-uthmani) + Turkish (Süleyman Ateş, alquran.cloud)
2) 355 ayet mp3'ünü EveryAyah Ghamdi'den indir → assets/sounds/manevi/
3) Çıktı: assets/data/manevi_sureler.json + dosyalar

Tek seferlik build. Çalıştırma: python -X utf8 build_manevi.py
"""

import json
import os
import urllib.request
import concurrent.futures
import re
import time

OUT_JSON = 'assets/data/manevi_sureler.json'
SES_DIR = 'assets/sounds/manevi'
os.makedirs(SES_DIR, exist_ok=True)
os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)

SURELER = [
    {'no': 36, 'ad': 'Yâsîn', 'arapca_ad': 'يس', 'inis': 'Mekki',
     'kisa': "Kur'an'ın kalbi olarak anılan, hayat-ahiret muhasebesi yapan sure. Hastalık, vefat ve zorluk anlarında okunur.",
     'fazilet': "Hz. Peygamber (s.a.v.) 'Her şeyin bir kalbi vardır, Kur'an'ın kalbi de Yâsîn'dir' buyurmuştur (Tirmizî, Fedâilü'l-Kur'ân 7). Cuma sabahları okunması, hastalara ve vefat etmek üzere olanlara okunması sünnettir (Ebû Dâvûd, Cenâiz 24). Halk arasında 'Yâsîn-i Şerif' olarak bilinir."},
    {'no': 55, 'ad': 'Rahmân', 'arapca_ad': 'الرَّحْمٰن', 'inis': 'Medeni',
     'kisa': "Allah'ın nimetlerini sıralayan, 'Hangi nimeti yalanlayabilirsiniz?' sorusunu 31 kere tekrar eden sure.",
     'fazilet': "Hz. Peygamber (s.a.v.) Rahmân sûresi için 'Kur'an'ın gelini' lafzının da geçtiği rivayetler vardır (Beyhakî, Şuabu'l-Îmân). Allah'ın insana, cinne ve tabiata verdiği nimetler tek tek anılır. Cuma akşamları okumak âdetinde olanlar vardır."},
    {'no': 56, 'ad': 'Vâkıa', 'arapca_ad': 'الْوَاقِعَة', 'inis': 'Mekki',
     'kisa': "Kıyamet gününün hadiselerini ve üç sınıf insanı (öncekiler / sağdakiler / soldakiler) anlatır.",
     'fazilet': "Halk arasında 'rızık sûresi' olarak bilinir. Her gece okuyana fakirliğin uğramayacağına dair rivayet edilmiştir (Beyhakî, Şuab); ancak bu rivayetin sıhhati hakkında tartışmalar vardır. Yine de gece okumak müminler arasında köklü bir gelenek olmuştur."},
    {'no': 67, 'ad': 'Mülk', 'arapca_ad': 'الْمُلْك', 'inis': 'Mekki',
     'kisa': "'Tebâreke' diye de anılır. Her gece yatmadan önce okunduğunda kabir azabına karşı koruyucu olduğu rivayet edilir.",
     'fazilet': "Hz. Peygamber (s.a.v.) 'Kur'an'da otuz ayetli bir sûre vardır ki, sahibine şefaat eder ve günahları affedilinceye kadar onun için affedilmesini ister; o Tebâreke (Mülk) sûresidir' buyurmuştur (Tirmizî, Fedâilü'l-Kur'ân 9; Ebû Dâvûd, Tatavvu 21). Her gece yatmadan önce okunması sünnettir."},
    {'no': 73, 'ad': 'Müzzemmil', 'arapca_ad': 'الْمُزَّمِّل', 'inis': 'Mekki',
     'kisa': "Hz. Peygamber'e gece kalkıp namaz kılmayı emreden, ihlas ve sabır mesajları içeren sure.",
     'fazilet': "Gece namazına (teheccüd) çağrı içeren sûredir. Sıkıntı, gam ve hüzün anlarında okunması tavsiye edilmiştir. İsmi 'örtüsüne bürünen' anlamına gelir, vahyin ilk geliş anına gönderme yapar."},
    {'no': 78, 'ad': 'Nebe', 'arapca_ad': 'النَّبَأ', 'inis': 'Mekki',
     'kisa': "Amme cüzünün ilk sûresi. Mahşer gününün dehşeti, cennet ve cehennem manzaraları anlatılır.",
     'fazilet': "Halk arasında 'Amme sûresi' olarak bilinir; cüzün baş sûresidir. Mahşer sorgusuna, kıyamet alâmetlerine ve âhirete iman pekiştirmesine vesile olur. Sabah-akşam zikir vakitlerinde okumak gelenektir."},
    {'no': 94, 'ad': 'İnşirâh', 'arapca_ad': 'الْإِنْشِرَاح', 'inis': 'Mekki',
     'kisa': "Sıkıntı anlarında okunan, 'her zorlukla beraber bir kolaylık vardır' müjdesini içeren sûre.",
     'fazilet': "Hz. Peygamber'in (s.a.v.) göğsünün açılıp ferahlatılmasının anıldığı sûredir. Sıkıntı, daralma ve zorluk anlarında okumak gönle ferahlık verir. 'Şüphesiz güçlükle beraber bir kolaylık vardır' (5-6) ayetleri sıkıntı anlarında en çok hatırlanan ilahi müjdedir."},
]


def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))


def besmele_temizle(arapca):
    """quran-uthmani Yâsîn 1 vb. başında BESMELE var. Çıkar.
    Regex calismadi (kombinasyon karakterleri), exact string match kullaniyoruz."""
    BESMELE = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ "
    if arapca.startswith(BESMELE):
        return arapca[len(BESMELE):].strip()
    return arapca.strip()


def basit_okunus(arapca):
    """Ayet için tahmini Türkçe transliterasyon. Tam değil — bilgi amaçlı.
    UI'da gösterilir; kullanıcı için yardımcı. Sahih meal Türkçesi ayrı."""
    return ""  # şimdilik boş; UI 'okunus' yoksa o satırı render etmez


def sure_yukle(sure_no):
    print(f'[{sure_no}] Diyanet/Ateş ve uthmani indiriliyor...')
    tur = fetch_json(f'https://api.alquran.cloud/v1/surah/{sure_no}/tr.ates')
    ara = fetch_json(f'https://api.alquran.cloud/v1/surah/{sure_no}/quran-uthmani')
    tur_ayet = tur['data']['ayahs']
    ara_ayet = ara['data']['ayahs']
    assert len(tur_ayet) == len(ara_ayet), f'Ayet sayısı uyumsuz sure {sure_no}'
    return tur_ayet, ara_ayet


def mp3_indir(sure_no, ayet_no):
    """EveryAyah Ghamadi 40kbps."""
    fn = f'{sure_no:03d}{ayet_no:03d}.mp3'
    path = os.path.join(SES_DIR, fn)
    if os.path.exists(path) and os.path.getsize(path) > 100:
        return fn, True  # zaten var
    url = f'https://everyayah.com/data/Ghamadi_40kbps/{fn}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        with open(path, 'wb') as f:
            f.write(data)
        return fn, len(data) > 100
    except Exception as e:
        print(f'  HATA {fn}: {e}')
        return fn, False


def main():
    t0 = time.time()
    cikti = []
    indirilecek_tum_mp3 = []

    # 1) JSON build
    for sure_info in SURELER:
        sn = sure_info['no']
        try:
            tur_ayet, ara_ayet = sure_yukle(sn)
        except Exception as e:
            print(f'HATA sure {sn}: {e}')
            continue

        ayetler = []
        for tr, ar in zip(tur_ayet, ara_ayet):
            an = tr['numberInSurah']
            arapca = ar['text']
            if an == 1:
                arapca = besmele_temizle(arapca)
            ayetler.append({
                'no': an,
                'arapca': arapca,
                'okunus': basit_okunus(arapca),
                'meal': tr['text'],
                'ses_dosyasi': f'{sn:03d}{an:03d}',
            })
            indirilecek_tum_mp3.append((sn, an))

        cikti.append({
            'no': sn,
            'ad': sure_info['ad'],
            'arapca_ad': sure_info['arapca_ad'],
            'inis_yeri': sure_info['inis'],
            'ayet_sayisi': len(ayetler),
            'kategori': 'manevi',
            'tilavet_dosya': None,
            'tilavet_kari': 'Saad al-Ghamdi',
            'kisa_aciklama': sure_info['kisa'],
            'fazilet': sure_info['fazilet'],
            'ayetler': ayetler,
        })
        print(f'  -> {len(ayetler)} ayet hazirlandi')

    # sure no'ya göre sırala
    cikti.sort(key=lambda s: s['no'])

    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(cikti, f, ensure_ascii=False, indent=2)
    print(f'\n[JSON] yazildi: {OUT_JSON} ({os.path.getsize(OUT_JSON)/1024:.1f} KB)')
    print(f'  Toplam sure: {len(cikti)}, toplam ayet: {sum(s["ayet_sayisi"] for s in cikti)}')

    # 2) MP3 download paralel
    print(f'\n[MP3] {len(indirilecek_tum_mp3)} dosya indiriliyor (20 paralel)...')
    basari = 0
    fail = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
        futs = {ex.submit(mp3_indir, sn, an): (sn, an) for sn, an in indirilecek_tum_mp3}
        for fut in concurrent.futures.as_completed(futs):
            fn, ok = fut.result()
            if ok: basari += 1
            else: fail += 1
            if (basari + fail) % 50 == 0:
                print(f'  {basari + fail}/{len(indirilecek_tum_mp3)} ...')

    toplam_byte = sum(os.path.getsize(os.path.join(SES_DIR, f))
                      for f in os.listdir(SES_DIR) if f.endswith('.mp3'))
    print(f'\n[SONUC] basarili: {basari}, basarisiz: {fail}')
    print(f'  Toplam ses: {toplam_byte/1024/1024:.1f} MB')
    print(f'  Sure: {time.time()-t0:.1f} saniye')


if __name__ == '__main__':
    main()
