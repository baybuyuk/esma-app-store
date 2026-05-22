"""
Hadis ve ayet temizleyici.

Kullanim:
    python -X utf8 build_temizle.py

Girdi:
    assets/data/hadisler.json
    assets/data/ayetler.json
Cikti:
    assets/data/hadisler.json (uzeri yazilir, eski hali .bak ile saklanir)
    assets/data/ayetler.json (degisiklik gerekiyorsa)

Konsola sadece ASCII sayilar/etiketler yazilir.
"""
import json
import os
import re
import shutil
import sys

ASSET = "assets/data"

# Sona eklenmis referanslari kirpan kalip:
# Ornek: ". Tekrari: 4515 (Diger Tahric edenler: Muslim, Iman; Tirmizi, Iman)"
SUFFIX_PATTERNS = [
    # "Tekrar:" / "Tekrari:" basligi ile baslayip metnin sonuna kadar uzanan kuyruk
    re.compile(r"\s*[\.,]?\s*Tekrar[ıi]?\s*:.*$", re.IGNORECASE | re.DOTALL),
    # "Izah <num>" ile biten kuyruk
    re.compile(r"\s*[\.,]?\s*[İI]zah\s+\d+.*$", re.IGNORECASE | re.DOTALL),
    # "(Diger Tahric edenler: ...)" parantezleri
    re.compile(r"\s*\([Dd]i[ğg]er\s+Tahric[^)]*\)", re.IGNORECASE),
    # "(Bkz: ...)" parantezi
    re.compile(r"\s*\(Bkz[\.\s:][^)]*\)", re.IGNORECASE),
    # "[Buhari, ...]" / "[Muslim, ...]" kose parantez referanslari
    re.compile(r"\s*\[(Buh[âa]r[îi]|M[üu]slim|Tirmiz[îi]|Ebu\s*Davud|Nesai|Ibni\s*Mace)[^\]]*\]", re.IGNORECASE),
]

# Soft-strip: metni atmadan icindeki bu kaliplari sil
INLINE_STRIP = [
    re.compile(r"\(Bkz[\.\s:][^)]*\)", re.IGNORECASE),
    re.compile(r"\(Di[ğg]er\s+Tahric[^)]*\)", re.IGNORECASE),
]

# Bu kalip varsa hadis bagim degil, sadece referanstir -> tumden at
DROP_IF_PRESENT = [
    re.compile(r"\{[…\.]+\}"),                              # {...} yarim hadis isareti
    re.compile(r"numara\s+ile\s+gelecektir", re.IGNORECASE),
    re.compile(r"\d+\s*numaral[ıi]\s*[Hh]adis", re.IGNORECASE),
    re.compile(r"[Hh]adis\s+numaras[ıi]\s*:?\s*\d+", re.IGNORECASE),
    re.compile(r"yukar[ıi]da\s+ge[çc]ti", re.IGNORECASE),
    re.compile(r"yukar[ıi]da\s+ge[çc]en", re.IGNORECASE),
    re.compile(r"ge[çc]en\s+hadis", re.IGNORECASE),
    re.compile(r"\bhadisin\s+misli\b", re.IGNORECASE),
    re.compile(r"\bhad[îi]sin\s+mislini\b", re.IGNORECASE),
    re.compile(r"\bbiraz\s+[öo]nce\b", re.IGNORECASE),
    re.compile(r"\baz\s+[öo]nce\s+ge[çc]ti", re.IGNORECASE),
    re.compile(r"\bevvelce\s+ge[çc]ti", re.IGNORECASE),
    re.compile(r"\bdaha\s+[öo]nce\s+ge[çc]ti", re.IGNORECASE),
    re.compile(r"\b[İi]leride\s+ge[çc]ecek", re.IGNORECASE),
    re.compile(r"\brivayet\s+ettikleri\s+hadis", re.IGNORECASE),
    re.compile(r"rivayet\s+et(?:ti|miş)\s*\.\s*[İI]zah", re.IGNORECASE),
]

# Truncated / yari kesik isareti
ENDS_TRUNCATED = re.compile(r"(?:\.\.\.|…)\s*$")

# Muslim-tarzi uzun isnad gostergeleri
ISNAD_CUES = re.compile(
    r"(Bize\s+\w+.{0,40}rivayet\s+ett|"
    r"\(Dediki\)|"
    r"\(Demi[şs]ki\)|"
    r"L[âa]f[ıi]z\s+\w+'in[di]r|"
    r"naklen\s+rivayet)",
    re.IGNORECASE,
)

MIN_LEN = 100
MAX_LEN = 240

# Net bir soyleyis isareti: hadisi "ayakta tutan" bir fiil
SAYING_CUES = re.compile(
    r"(buyurdu|buyurmu[şs]|buyururdu|"
    r"[şs][öo]yle\s+dedi|[şs][öo]yle\s+demi[şs]|"
    r"şöyle\s+nakletmi[şs]|şöyle\s+nakledilmi[şs]|"
    r"sordu|cevab[ıi]n[ıi]\s+verdi)",
    re.IGNORECASE,
)

# Anlatici zinciri (isnad) tipik opening / arada gecen kaliplari
ISNAD_OPENERS = re.compile(
    r"^[\s\(\«\"]*(Bize|Bana)\s+\w",
    re.IGNORECASE,
)
ISNAD_INLINE = re.compile(
    r"\(\s*Bize\s+\w|\(\s*Bana\s+\w|"
    r"\(\s*Dedi[kK][iI]\s*\)|\(\s*Demi[şs][kK][iI]\s*\)|"
    r"L[âa]f[ıi]z\s+\w+'in[di]r|"
    r"naklen\s+rivayet|"
    r"rivayet\s+etti\.\s+\([DdSs]edi[kK][iI]\)|"
    r"o\s+da\s+\w+'den\s*,?\s*o\s+da",
    re.IGNORECASE,
)

# Belirsizlik isareti (hadis'i tartismaya acan ifadeler)
UNCERTAINTY = re.compile(
    r"\bolabilir\b|\bsanir[ıi]m\b|\bgalib[âa]\b|\bzannederim\b",
    re.IGNORECASE,
)

def temizle_tr(tr: str) -> str:
    s = tr.strip()
    # Once sondaki referans kuyruklarini kirp
    for pat in SUFFIX_PATTERNS:
        s = pat.sub("", s).rstrip()
    # Sonra metin icindeki kucuk referanslari sil
    for pat in INLINE_STRIP:
        s = pat.sub("", s)
    # Cift bosluklari ve sondaki cizgi/noktalama kaliklarini topla
    s = re.sub(r"\s{2,}", " ", s).strip()
    s = re.sub(r"[\s\.,;:]+$", "", s).strip()
    # Tek tirnak/cift tirnak acik kalmamis olsun
    if s.count('"') % 2 == 1:
        s = s.replace('"', "", 1) if s.startswith('"') else s.rstrip('"').rstrip()
    return s

def gecerli_mi(s: str) -> bool:
    if not s:
        return False
    if len(s) < MIN_LEN or len(s) > MAX_LEN:
        return False
    if ENDS_TRUNCATED.search(s):
        return False
    for pat in DROP_IF_PRESENT:
        if pat.search(s):
            return False
    if ISNAD_OPENERS.search(s):
        return False
    if ISNAD_INLINE.search(s):
        return False
    if not SAYING_CUES.search(s):
        return False
    return True

def temizle_hadis():
    yol = os.path.join(ASSET, "hadisler.json")
    bak = yol + ".bak"
    if not os.path.exists(bak):
        shutil.copy2(yol, bak)
    with open(yol, encoding="utf-8") as f:
        data = json.load(f)
    onceki = len(data)

    # Filtre + temizle
    yeni = []
    sayac_atilan_uzun = 0
    sayac_atilan_kisa = 0
    sayac_atilan_truncated = 0
    sayac_atilan_referans = 0
    sayac_atilan_isnad = 0
    sayac_atilan_saying = 0

    for x in data:
        tr = temizle_tr(x.get("tr", "") or "")
        if not tr:
            continue
        L = len(tr)
        if L > MAX_LEN:
            sayac_atilan_uzun += 1
            continue
        if L < MIN_LEN:
            sayac_atilan_kisa += 1
            continue
        if ENDS_TRUNCATED.search(tr):
            sayac_atilan_truncated += 1
            continue
        atildi = False
        for pat in DROP_IF_PRESENT:
            if pat.search(tr):
                sayac_atilan_referans += 1
                atildi = True
                break
        if atildi:
            continue
        if ISNAD_OPENERS.search(tr) or ISNAD_INLINE.search(tr):
            sayac_atilan_isnad += 1
            continue
        if UNCERTAINTY.search(tr):
            sayac_atilan_isnad += 1
            continue
        if not SAYING_CUES.search(tr):
            sayac_atilan_saying += 1
            continue
        yeni.append({
            "no": x.get("no"),
            "kaynak": x.get("kaynak"),
            "ar": x.get("ar", ""),
            "tr": tr,
        })

    # Dedup
    gorulen = set()
    benzersiz = []
    for x in yeni:
        anahtar = x["tr"][:120]
        if anahtar in gorulen:
            continue
        gorulen.add(anahtar)
        benzersiz.append(x)

    with open(yol, "w", encoding="utf-8") as f:
        json.dump(benzersiz, f, ensure_ascii=False, indent=2)

    print("HADIS RAPORU")
    print("  onceki:", onceki)
    print("  atilan_uzun:", sayac_atilan_uzun)
    print("  atilan_kisa:", sayac_atilan_kisa)
    print("  atilan_truncated:", sayac_atilan_truncated)
    print("  atilan_referans:", sayac_atilan_referans)
    print("  atilan_isnad:", sayac_atilan_isnad)
    print("  atilan_saying_yok:", sayac_atilan_saying)
    print("  dedup_oncesi:", len(yeni))
    print("  son:", len(benzersiz))

def temizle_ayet():
    yol = os.path.join(ASSET, "ayetler.json")
    bak = yol + ".bak"
    if not os.path.exists(bak):
        shutil.copy2(yol, bak)
    with open(yol, encoding="utf-8") as f:
        data = json.load(f)
    onceki = len(data)

    yeni = []
    drop_uzun = 0
    drop_kisa = 0
    drop_trunc = 0
    drop_paren = 0

    AYET_MIN = 40
    AYET_MAX = 350

    paren_ref = re.compile(r"\s*\([Bb]kz[\.\s:][^)]*\)")
    kose_ref = re.compile(r"\s*\[[^\]]{1,80}\]")
    multi_dot = re.compile(r"\s{2,}")

    for x in data:
        tr = (x.get("tr", "") or "").strip()
        tr = paren_ref.sub("", tr)
        tr = kose_ref.sub("", tr)
        tr = multi_dot.sub(" ", tr).strip()
        if not tr:
            continue
        L = len(tr)
        if L > AYET_MAX:
            drop_uzun += 1
            continue
        if L < AYET_MIN:
            drop_kisa += 1
            continue
        if ENDS_TRUNCATED.search(tr):
            drop_trunc += 1
            continue
        yeni.append({
            "sure_no": x.get("sure_no"),
            "sure_adi": x.get("sure_adi"),
            "ayet_no": x.get("ayet_no"),
            "ar": x.get("ar", ""),
            "tr": tr,
        })

    with open(yol, "w", encoding="utf-8") as f:
        json.dump(yeni, f, ensure_ascii=False, indent=2)

    print("AYET RAPORU")
    print("  onceki:", onceki)
    print("  atilan_uzun:", drop_uzun)
    print("  atilan_kisa:", drop_kisa)
    print("  atilan_truncated:", drop_trunc)
    print("  son:", len(yeni))


if __name__ == "__main__":
    temizle_hadis()
    print()
    temizle_ayet()
