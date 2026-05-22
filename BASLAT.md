# 🚀 BAŞLAT — Hu App

> Önce bu dosyayı oku, sonra adımları takip et.

---

## 📦 BU PAKETTE NE VAR?

### Veri Dosyaları (uygulamaya gidecek)
- `esmalar.json` — 100 esma + ebced + fazilet + gün/saat
- `isimler.json` — 246 Türk ismi + Arapça yazılış + ebced
- `kisa_zikirler.json` — 10 sahih kısa zikir
- `hedefler.json` — 6 hedef kategori
- `anlik_zikirler.json` — 7 duygu durumu
- `haftalik_rotasyon.json` — Haftanın günlerine göre zikir

### Build Scriptleri (internet açıkken çalıştır)
- `build_hadisler.py` — GitHub'dan Buhârî+Müslim hadis indirir
- `build_ayetler.py` — Diyanet meali Kuran ayetlerini indirir

### Kod
- `esma-algoritmasi.js` — İsim→Esma eşleştirme fonksiyonu (test edildi)

### Doküman
- `CLAUDE-CODE-PROMPTS.md` — 13 adımlık Claude Code rehberi
- `BASLAT.md` — Bu dosya

---

## 🎯 NE YAPACAKSIN — Adım Adım

### Adım 1: Hadis ve Ayet Verilerini İndir

Terminal aç, bu klasöre git:

```bash
cd /path/to/hu-app
python3 build_hadisler.py
python3 build_ayetler.py
```

İlk script ~600 hadis, ikinci script ~700 ayet indirir.

Bittiğinde elinde şu dosyalar olur:
- `hadisler.json`
- `ayetler.json`

### Adım 2: Hu App Projesi İçin Klasör Aç

Bilgisayarında bir proje klasörü oluştur:

```bash
mkdir -p ~/Projects/hu-app
cd ~/Projects/hu-app
```

(Windows için: `C:\Projects\hu-app\` gibi)

### Adım 3: Claude Code'u Başlat

```bash
claude
```

İlk kez kullanıyorsan login yap.

### Adım 4: 13 Adımı Sırayla Uygula

`CLAUDE-CODE-PROMPTS.md` dosyasını aç. İçinde 14 prompt var (Adım 0'dan 13'e). Her birini sırayla Claude Code'a yapıştır.

**Önemli:**
- Adım 0'dan başla
- Her adım bittikten sonra **test et**
- Çalışıyorsa sonrakine geç
- Çalışmıyorsa Claude Code'a hatayı söyle, düzeltir

### Adım 5: Veri Dosyalarını Projeye Kopyala

Adım 0 bittikten sonra Claude Code `assets/data/` klasörünü oluşturmuş olacak. **Bu klasöre tüm JSON dosyalarını manuel olarak kopyala**:

```
assets/data/
├── esmalar.json
├── isimler.json
├── kisa_zikirler.json
├── hedefler.json
├── anlik_zikirler.json
├── haftalik_rotasyon.json
├── hadisler.json       ← build scriptinden gelen
└── ayetler.json        ← build scriptinden gelen
```

Sonra Adım 1'e devam et.

---

## ⏱️ TAHMİNİ SÜRE

| Adım | Süre |
|------|------|
| Veri indirme | 5 dakika |
| Adım 0 (kurulum) | 10 dakika |
| Adım 1-2 (veri + esma) | 30 dakika |
| Adım 3-4 (namaz + bildirim) | 1-2 saat |
| Adım 5 (onboarding) | 2-3 saat |
| Adım 6 (ana ekran) | 2-3 saat |
| Adım 7-10 (zikir, anlık, akşam) | 4-5 saat |
| Adım 11-12 (destek + polish) | 3-4 saat |
| Adım 13 (test + yayın) | 1-2 hafta |

**Toplam aktif kodlama:** ~15-20 saat
**Yayına kadar (test dahil):** 4-6 hafta

---

## 🆘 SORUN ÇIKARSA

1. **Claude Code anlamıyor:** Promptu daha net yaz, JSON yapısını göster
2. **Kod çalışmıyor:** Hata mesajını Claude Code'a kopyala-yapıştır
3. **Dosya bulunamıyor:** `pwd` ile dizini kontrol et
4. **npm hatası:** `node --version` (18+ olmalı), `npm cache clean --force` dene

---

## 📋 KONTROL LİSTESİ

İlerlerken bunları işaretle:

- [ ] build_hadisler.py çalıştı, hadisler.json oluştu
- [ ] build_ayetler.py çalıştı, ayetler.json oluştu
- [ ] Claude Code yüklü ve çalışıyor
- [ ] Proje klasörü oluştu
- [ ] Adım 0 bitti, proje kuruldu
- [ ] JSON dosyaları assets/data/ klasörüne kopyalandı
- [ ] Adım 1 bitti (veri import)
- [ ] Adım 2 bitti (esma algoritması test edildi)
- [ ] Adım 3 bitti (namaz vakitleri çalışıyor)
- [ ] Adım 4 bitti (bildirimler kuruldu)
- [ ] Adım 5 bitti (onboarding çalışıyor)
- [ ] Adım 6 bitti (ana ekran tamam)
- [ ] Adım 7 bitti (zikir sayacı)
- [ ] Adım 8 bitti (kısa zikirler)
- [ ] Adım 9 bitti (anlık zikir)
- [ ] Adım 10 bitti (akşam muhasebesi)
- [ ] Adım 11 bitti (destek ekranlar)
- [ ] Adım 12 bitti (polish)
- [ ] Adım 13 başladı (test)

---

## 🤲 NİYET

> Bu uygulama bir sadaka-i câriye niyetiyle yapılıyor.
> Kullanan her insanın çektiği her zikrin ecri, yapanlara da yazılır.
> Niyet halis olsun, gerisi yoluna girer.

Hayırlı olsun.
