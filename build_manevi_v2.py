"""
Manevi sureler v2: Mishary Alafasy + word-level karaoke.
- Quran.com API'den 7 sure icin: tam sure mp3 + word segments
- ffmpeg ile 96kbps mono transcode
- manevi_sureler.json: tilavet_dosya (sure) + kelimeler:[{arapca,bas_ms,bit_ms}] (ayet)
- Eski 355 ayet mp3 silinir
"""
import json
import os
import sys
import subprocess
import urllib.request
import urllib.parse
import shutil
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
JSON_PATH = SCRIPT_DIR / "assets" / "data" / "manevi_sureler.json"
SES_DIR = SCRIPT_DIR / "assets" / "sounds" / "manevi"
TMP_DIR = SCRIPT_DIR / "tmp_manevi_v2"
TMP_DIR.mkdir(exist_ok=True)

RECITER_ID = 7  # Mishary Alafasy on quran.com
RECITER_NAME = "Mishary Rashid al-Afasy"

SURELER = [36, 55, 56, 67, 73, 78, 94]


def http_get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def http_get_bytes(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    Path(dest).write_bytes(data)
    return len(data)


def fetch_words(chap):
    """Quran.com verses endpoint -> her ayet icin words (text_uthmani + position)."""
    url = (
        f"https://api.quran.com/api/v4/verses/by_chapter/{chap}"
        f"?words=true&word_fields=text_uthmani&per_page=300&language=ar"
    )
    d = http_get_json(url)
    out = {}
    for v in d.get("verses", []):
        ayet_no = int(v["verse_key"].split(":")[1])
        kelimeler = []
        for w in v.get("words", []):
            if w.get("char_type_name") != "word":
                continue
            kelimeler.append({
                "position": w["position"],
                "text": w.get("text_uthmani") or w.get("text") or "",
            })
        out[ayet_no] = kelimeler
    return out


def fetch_segments(chap):
    """qurancdn audio_files endpoint -> her ayet icin word_pos -> (bas_ms, bit_ms)."""
    url = (
        f"https://api.qurancdn.com/api/qdc/audio/reciters/{RECITER_ID}"
        f"/audio_files?chapter={chap}&segments=true"
    )
    d = http_get_json(url)
    if not d.get("audio_files"):
        raise RuntimeError(f"chap {chap} audio_files bos")
    af = d["audio_files"][0]
    audio_url = af["audio_url"]
    out = {}
    for vt in af.get("verse_timings", []):
        ayet_no = int(vt["verse_key"].split(":")[1])
        seg_map = {}
        for seg in vt.get("segments", []):
            if len(seg) < 3:
                continue
            pos, bas, bit = int(seg[0]), int(seg[1]), int(seg[2])
            seg_map[pos] = (bas, bit)
        out[ayet_no] = seg_map
    return audio_url, out


def transcode_mp3(src, dst):
    """ffmpeg 96kbps mono 44100Hz transcode."""
    cmd = [
        "ffmpeg", "-y", "-i", str(src),
        "-ac", "1", "-ar", "44100", "-b:a", "96k",
        "-loglevel", "error",
        str(dst),
    ]
    subprocess.run(cmd, check=True)


def process_sure(chap):
    print(f"=== Sure {chap:03d} ===")
    words = fetch_words(chap)
    audio_url, segments = fetch_segments(chap)

    # birlestir
    ayetler_data = {}
    for ayet_no, kelime_list in words.items():
        seg_map = segments.get(ayet_no, {})
        out_kelimeler = []
        for k in kelime_list:
            pos = k["position"]
            t = seg_map.get(pos)
            if t is None:
                # eksik segment - 0 ms yer tut
                print(f"  WARN ayet {ayet_no} pos {pos} segment yok")
                out_kelimeler.append({"arapca": k["text"], "bas_ms": 0, "bit_ms": 0})
            else:
                out_kelimeler.append({"arapca": k["text"], "bas_ms": t[0], "bit_ms": t[1]})
        ayetler_data[ayet_no] = out_kelimeler

    # audio indir
    if not audio_url.startswith("http"):
        audio_url = "https://download.quranicaudio.com/" + audio_url.lstrip("/")
    tmp_src = TMP_DIR / f"{chap:03d}_src.mp3"
    print(f"  audio indir: {audio_url}")
    size = http_get_bytes(audio_url, tmp_src)
    print(f"  src boyut: {size/1024:.1f} KB")

    # transcode
    dst = SES_DIR / f"{chap:03d}.mp3"
    print(f"  transcode -> {dst.name}")
    transcode_mp3(tmp_src, dst)
    dst_size = dst.stat().st_size
    print(f"  cikti boyut: {dst_size/1024:.1f} KB (-{(1-dst_size/size)*100:.0f}%)")

    return ayetler_data


def main():
    # JSON yukle
    with open(JSON_PATH, encoding="utf-8") as f:
        veri = json.load(f)

    by_no = {s["no"]: s for s in veri}

    # toplam istatistik
    toplam_kelime = 0
    toplam_src_mb = 0.0
    toplam_dst_mb = 0.0

    for chap in SURELER:
        ayetler_data = process_sure(chap)
        sure = by_no[chap]
        sure["tilavet_dosya"] = f"{chap:03d}"
        sure["tilavet_kari"] = RECITER_NAME

        eslesmeyen = 0
        for ayet in sure["ayetler"]:
            kelimeler = ayetler_data.get(ayet["no"])
            if kelimeler is None:
                eslesmeyen += 1
                continue
            ayet["kelimeler"] = kelimeler
            toplam_kelime += len(kelimeler)
        if eslesmeyen:
            print(f"  WARN sure {chap}: {eslesmeyen} ayet kelime verisi yok")

        dst = SES_DIR / f"{chap:03d}.mp3"
        toplam_dst_mb += dst.stat().st_size / (1024 * 1024)

    # JSON kaydet
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(veri, f, ensure_ascii=False, indent=2)
    print(f"\nJSON guncellendi: {JSON_PATH}")
    print(f"Toplam kelime: {toplam_kelime}")
    print(f"Toplam ses (transcoded): {toplam_dst_mb:.1f} MB")

    # Eski 355 ayet mp3 sil (NNNAAA.mp3 6-haneli)
    silinen = 0
    for f in SES_DIR.iterdir():
        if f.is_file() and f.suffix == ".mp3" and len(f.stem) == 6 and f.stem.isdigit():
            f.unlink()
            silinen += 1
    print(f"Silinen eski ayet mp3: {silinen}")

    # TMP temizle
    shutil.rmtree(TMP_DIR, ignore_errors=True)
    print("Temp temizlendi.")


if __name__ == "__main__":
    main()
