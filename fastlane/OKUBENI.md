# Fastlane Supply — Play Store Metadata Sync

Bu klasör, **Hu uygulamasının Play Store store listing bilgilerini** (başlık,
açıklama, screenshots, changelog) otomatik upload etmek için kullanılır.

EAS Build AAB üretir; Fastlane Supply AAB + metadata'yı tek komutla Play
Console'a yükler.

---

## Hızlı Başlangıç

### 0. Ön koşullar

- Ruby 3.3+ kurulu (`ruby --version` çalışmalı)
- Fastlane 2.236+ kurulu (`fastlane --version` çalışmalı)
- EAS CLI kurulu ve `eas login` yapılı
- **Google Play Console hesabı** açık + en az 1 manual upload yapılmış (ilk
  defa AAB upload Fastlane ile değil, Play Console UI'dan zorunlu)

### 1. Play Console Service Account JSON

Fastlane Play Console'a erişmek için **Service Account JSON** anahtarı ister.
Bu tek seferlik kurulumdur:

1. https://play.google.com/console → ayarlar (dişli) → **API access**
2. **Choose a project** → "Hu App" projesi yoksa otomatik oluşur, **Link**
3. **Service accounts** bölümü → **Create new service account** → Google Cloud
   Console açılır
4. Google Cloud Console'da:
   - **Service account name**: `fastlane-supply`
   - **Service account ID**: otomatik
   - **Create and continue** → role: **Service Account User** → **Done**
5. Açılan listede `fastlane-supply@...` satırına tıkla → **Keys** sekmesi →
   **Add Key** → **Create new key** → **JSON** → indir
6. İndirilen JSON dosyasını **`fastlane/play-key.json`** olarak repo'ya kopyala
   (gitignored, asla commit etme!)
7. Play Console'a geri dön → **Invite new user** → email olarak service
   account'un email'ini (`fastlane-supply@...iam.gserviceaccount.com`) ekle
8. Permissions: **Release Manager** (veya en az: View app info + Manage
   production/testing releases + Manage store presence)

### 2. AAB build çıkar

Hesap onayı sonrası:

```bash
eas build -p android --profile production --output app.aab
```

~15-20 dk, root'a `app.aab` indirir.

### 3. Validate (dry-run, upload yapmaz)

```bash
fastlane android validate
```

Metadata sınırları doğru mu, screenshots formatı OK mi kontrol eder. Hata
çıkarsa düzelt.

### 4. Internal testing'e gönder (önce)

```bash
fastlane android beta
```

Internal testers'a AAB + metadata gider. Telefonda test et.

### 5. Production'a gönder (kademeli)

```bash
fastlane android production
```

Production'a %5 rollout ile gönderir. Play Console'dan manuel %100'e çıkar.

---

## Dosya Yapısı

```
fastlane/
├── Appfile                       # package name + json key path
├── Fastfile                      # lane'ler (validate, metadata, beta, production)
├── play-key.json                 # GİZLİ, gitignored
└── metadata/
    └── android/
        ├── tr-TR/                # Türkçe (varsayılan)
        │   ├── title.txt
        │   ├── short_description.txt
        │   ├── full_description.txt
        │   ├── changelogs/
        │   │   └── 4.txt         # versionCode 4 için release notes
        │   └── images/
        │       ├── icon/
        │       │   └── 1.png     # 512x512 PNG
        │       ├── featureGraphic/
        │       │   └── 1.png     # 1024x500 PNG/JPG
        │       └── phoneScreenshots/
        │           ├── 1_anaekran.png
        │           ├── 2_isminsirri.png
        │           └── ...       # 7 frame önerilir
        └── en-US/                # İngilizce
            └── (aynı yapı)
```

---

## Screenshot Hazırlama

**Çözünürlük:** 1080×1920 (Full HD portrait) önerilir
**Min:** 320px kısa kenar
**Max:** 3840px kısa kenar
**Format:** PNG (tercih), JPG kabul

**7 frame sırası ve önerilen caption'lar `docs/store-assets.md` Bölüm 3'te.**

Telefondan Power + Volume Up ile ekran görüntüsü al:
1. AnaEkran
2. İsmin Sırrını Bul
3. EsmaDetay
4. Tesbihat
5. ManeviSureDetay (Yâsîn — besmele banner + mushaf + meal)
6. KısaZikirler
7. Kıble

Cihaz çekiminde Status bar görünür kalır (saat, pil, sinyal) — Play Store
sorun yapmıyor. Bildirim çubuğundaki ikonları temizle (rahatsız etme modu).

---

## Yararli Komutlar

```bash
# Mevcut Play Console listing'i yerel'e indir (mevcut state'i geriye al)
fastlane supply init

# Lane listesini gör
fastlane lanes

# Metadata sadece (AAB olmadan) upload
fastlane android metadata

# Production'da rollout yüzdesini değiştir
# Fastfile içinde rollout: "0.20" gibi düzenle
```

---

## Sorun olursa

- `fastlane action supply` → tüm parametreleri gör
- https://docs.fastlane.tools/actions/supply/
- https://github.com/fastlane/fastlane/issues
