# Hu App — iOS App Store Teslim Dökümanı

Bu doküman, **iOS App Store'a yüklemek** için gereken tüm bilgileri içerir.
Android/Play Store tarafını Yusuf yapacak; sen sadece iOS ile ilgilen.

**Repo:** https://github.com/baybuyuk/esma-app-store
**Branch:** `master`
**Son commit (ship-ready):** `42c16a7` veya üstü

---

## 0. Önkoşullar

Senin bilgisayarında olması gerekenler:
- macOS (Xcode iOS simulator için; ama EAS bulut build kullanacağız, Xcode opsiyonel)
- Node.js 20+ ve npm
- Git
- Apple Developer hesabı (**$99/yıl**, kendi adınla aç — App Store'da senin görüneceksin)
- EAS hesabı (https://expo.dev — Yusuf'un mevcut hesabı `baybuyukk`, kullanmak istersen Yusuf paylaşır)

---

## 1. Repo'yu klonla ve kur

```bash
git clone https://github.com/baybuyuk/esma-app-store.git
cd esma-app-store
npm install
```

---

## 2. EAS CLI kur ve giriş yap

```bash
npm install -g eas-cli
eas login
# Email/şifre soracak — `baybuyukk` hesabıyla giriş yap (Yusuf paylaşır)
# Veya kendi hesabını kullan ve `app.json` içindeki `"owner": "baybuyukk"` satırını sil
```

---

## 3. iOS credentials kurulumu (tek seferlik)

```bash
eas credentials -p ios
```

Apple ID + Team ID + Distribution Certificate + Provisioning Profile sorulur.
Apple Developer hesabınla giriş yap — EAS otomatik halleder.

---

## 4. Build çıkar

**Önce simulator build** (test için, App Store'a gitmez):

```bash
eas build -p ios --profile preview
```

~20 dakika bulutta build. Bittiğinde `.app` dosyası link verilir, simulator'a yükle test et.

**Sonra production build** (App Store'a):

```bash
eas build -p ios --profile production
```

~25 dakika. `.ipa` dosyası üretilir, EAS otomatik App Store Connect'e upload eder
(`eas submit -p ios --latest` da çalıştırılabilir).

---

## 5. App Store Connect setup

https://appstoreconnect.apple.com → **My Apps** → **+** → **New App**

### Temel bilgiler

| Alan | Değer |
|---|---|
| Platform | iOS |
| Name | **Hu** |
| Primary Language | Turkish |
| Bundle ID | `com.baybuyukk.huapp` (otomatik görünür) |
| SKU | `hu-app-001` (serbest, sadece dahili) |
| User Access | Full Access |

### App Information

| Alan | Değer |
|---|---|
| **Category** | Birincil: **Lifestyle**, İkincil: **Reference** |
| **Content Rights** | "Does not use third-party content" işaretle |
| **Age Rating** | 4+ (anket dolduracaksın, hepsine "None" → 4+ çıkar) |
| **Privacy Policy URL** | `https://baybuyuk.github.io/esma-app-store/privacy.html` |
| **License Agreement** | Apple'ın standart EULA'sı (default) |

### Store metinleri

Tüm metinler hazır → `docs/store-listing.md` dosyasında.

- **Subtitle (29/30)**: `99 Esma, Namaz Vakti, Tesbihat`
- **Promotional Text (168/170)**: dosyadan kopyala (App Store Connect → App Information)
- **Description (1842/4000)**: dosyadan kopyala
- **Keywords (98/100)**: `esma,esmaülhüsna,namaz vakti,ezan,kıble,tesbihat,salavat,zikir,yasin,kuran,evrad,kandil,hicri,dua`
- **Support URL**: `https://baybuyuk.github.io/esma-app-store/`
- **Marketing URL**: `https://baybuyuk.github.io/esma-app-store/`

İngilizce metinler de `docs/store-listing.md` Bölüm 2'de — App Store Connect'te
"Add Language" → English → o metinleri yapıştır.

### App Privacy (Nutrition Label)

Apple en kritik form, **dikkatli doldur**:

- **Data Types**: hepsine **"No, we do not collect this data"** işaretle
- **Tracking**: **"No"**
- **App Tracking Transparency (ATT) prompt**: gösterilmez

Detay: `docs/store-listing.md` Bölüm 7.

### Screenshots

Yusuf çekecek ve sana gönderecek. Cihaz tipleri:

- **6.7" iPhone** (15/16 Pro Max) — zorunlu, min 3 frame
- **6.5" iPhone** (XS Max/11 Pro Max) — zorunlu, min 3 frame
- **5.5" iPhone** (8 Plus) — eski cihazlar için, zorunlu değil ama tavsiye

7 frame sırası ve caption'lar `docs/store-assets.md` dosyasında.

### App Preview (video) — opsiyonel

v1.0'da yapmıyoruz. Sonraki versiyonda eklenebilir.

---

## 6. App Review Information

App Store Connect → Version → App Review Information:

- **Sign-in required?** **No** (uygulama hesapsız çalışır)
- **Demo account**: gerek yok
- **Contact Info**:
  - First name: (kendi adın)
  - Last name: (kendi soyadın)
  - Phone: (kendi tel)
  - Email: (kendi email)
- **Notes (review notu)**: `docs/store-listing.md` Bölüm 9'dan kopyala

---

## 7. Submit for Review

Build seçili + tüm metadata tamam + screenshots yüklü → sağ üst **Add for Review** → **Submit for Review**.

İncelemenin ortalama 24-48 saat sürer. Reject gelirse Apple kategori belirtir
(genelde Guideline 2.1 işlevsel test, 4.0 tasarım, 5.1.1 gizlilik). Çözüm
genelde basit, küçük metadata değişikliği veya açıklama eklemek.

---

## 8. Yusuf'la iletişim

Yusuf'tan alman gerekenler:
- Screenshots (7 frame × 2-3 cihaz tipi)
- Feature graphic (gerekirse — App Store iOS'ta feature graphic istemez,
  sadece Play Store'da; iOS için icon yeter)
- Apple Developer hesabı yoksa karar: senin mi açacaksın yoksa Yusuf mu?

Yusuf'tan haber bekleyebileceğin:
- Mevcut versiyonda gözüne çarpan bir bug
- Submit edilmeden önce son onay

---

## 9. Yararli komutlar (reference)

```bash
# Mevcut build'ları listele
eas build:list -p ios

# Belirli build'ı App Store Connect'e gönder
eas submit -p ios --id <BUILD_ID>

# Son production build'ı submit et
eas submit -p ios --latest

# Bundle identifier kontrol
cat app.json | grep bundleIdentifier

# Versiyon güncelleme (gelecek sprint)
# app.json -> "version": "1.0.1" + "ios.buildNumber": "2"
```

---

## Soru/Sorun olursa

- Yusuf: `myusufcl7@gmail.com`
- Repo Issues: https://github.com/baybuyuk/esma-app-store/issues
- EAS dokümanlar: https://docs.expo.dev/build/setup/
- App Store Connect rehber: https://developer.apple.com/help/app-store-connect/

Başarılar! 🎯
