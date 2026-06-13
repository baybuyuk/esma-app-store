# Hu App — Google Play Store Teslim Dökümanı

Bu doküman, **Google Play Store'a yüklemek** için gereken tüm bilgileri içerir.
iOS App Store tarafını başka bir arkadaş yapacak; sen sadece Android ile ilgilen.

**Repo:** https://github.com/baybuyuk/esma-app-store
**Branch:** `master`
**Son commit (ship-ready):** `42c16a7` veya üstü

---

## 0. Önkoşullar

Senin bilgisayarında olması gerekenler:
- Windows / macOS / Linux (Android için OS bağımsız, EAS bulut build kullanıyoruz, Android Studio gerekmiyor)
- Node.js 20+ ve npm
- Git
- **Google Play Console hesabı** ($25 tek seferlik, ömür boyu)
- EAS hesabı (https://expo.dev — Yusuf'un mevcut hesabı `baybuyukk`, kullanmak istersen Yusuf paylaşır)

**Apple'dan farklı iyi haberler:**
- $25 tek seferlik (Apple $99/yıl)
- Mac gerekmez
- İnceleme genelde otomatik, 1-3 gün (Apple 1-2 hafta insan inceleme)

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

## 3. Play Console hesabı aç

https://play.google.com/console

1. Google hesabınla giriş yap
2. **"Create developer account"** → **"Personal"** seç (organizasyon değilse)
3. Geliştirici adı, iletişim bilgileri doldur
4. **$25 öde** (kart bilgisi)
5. **Kimlik doğrulama**: T.C. kimlik kartı fotoğrafı + selfie yükle → Google onaylayana kadar bekle (genelde 1-2 gün)
6. Onay geldikten sonra **"Create app"**:

| Alan | Değer |
|---|---|
| App name | **Hu** |
| Default language | Turkish (Türkiye) |
| App or game | App |
| Free or paid | Free |
| Declarations | (her ikisini de işaretle) |

---

## 4. AAB build çıkar

Hesap onayını beklerken bunu paralel başlatabilirsin:

```bash
eas build -p android --profile production
```

~15-20 dakika bulutta build. Bittiğinde `.aab` dosyası (Android App Bundle) link verilir,
indir. Play Console'a manuel yükleyeceksin.

**Test build için (opsiyonel)**, APK isterseniz:

```bash
eas build -p android --profile preview
```

Bu APK'yı kendi telefonuna yükleyip test edebilirsin (yan yükleme).

---

## 5. Play Console setup adımları

Play Console → App seç → sol menüden tek tek:

### A. App content (sol menü → Policy → App content)

Tüm bölümler yeşil ✓ olmalı submit'ten önce:

#### Privacy Policy
- URL: **`https://baybuyuk.github.io/esma-app-store/privacy.html`**

#### App access
- "All functionality is available without special access"

#### Ads
- "No, my app does not contain ads"

#### Content rating (IARC anketi)
- Tüm sorulara **No / Yok** cevapla
- Sonuç: **Everyone / 3+** çıkacak

#### Target audience and content
- Age range: **18 and over** seç (yaşlı odaklı uygulama)
- "Does your app appeal to children?" → **No**

#### News app
- "No, my app is not a news app"

#### COVID-19 contact tracing
- "No"

#### Data safety form (kritik)
- Tüm veri toplama: **No** / **None**
- Detaylar `docs/store-listing.md` Bölüm 6'da

#### Government apps
- "No"

#### Financial features
- "My app does not have any of these features"

#### Health
- "None of these"

---

### B. Main store listing (sol menü → Grow → Store presence → Main store listing)

Tüm metinler hazır → `docs/store-listing.md` Bölüm 3'te (Türkçe).

| Alan | Değer |
|---|---|
| **App name** | `Hu — Esma, Namaz, Tesbih` |
| **Short description (78/80)** | dosyadan kopyala |
| **Full description (2356/4000)** | dosyadan kopyala |

#### Graphics

- **App icon** (512×512 PNG, 32-bit, alpha kanal yok)
  → `assets/icon.png` dosyasını online araçla 512×512'ye scale et (squoosh.app)
  → veya doğrudan dosyayı yükle (Play Console otomatik scale eder)
- **Feature graphic** (1024×500 PNG/JPG, zorunlu)
  → Yusuf hazırlayacak, ondan iste. Spec `docs/store-assets.md` Bölüm 1'de
- **Phone screenshots** (min 2, max 8, telefon 16:9 veya 9:16, min boyut 320px)
  → Yusuf hazırlayacak, ondan iste. 7 frame önerisi `docs/store-assets.md` Bölüm 3'te
- **7-inch tablet screenshots** (opsiyonel, atla)
- **10-inch tablet screenshots** (opsiyonel, atla)

#### Categorization

- **App category** → **Lifestyle**
- **Tags** (Play Console önerirse) → Religion & Spirituality, Daily Routines

#### Contact details

- **Email**: `myusufcl7@gmail.com`
- **Website**: `https://baybuyuk.github.io/esma-app-store/`
- **Phone**: opsiyonel
- **Privacy Policy**: `https://baybuyuk.github.io/esma-app-store/privacy.html`

---

### C. Releases (sol menü → Release → Production)

İlk yüklemede önce **Internal Testing** veya **Closed Testing** önerilir:

1. Sol menü → **Testing → Internal testing**
2. **Create new release** → **Upload** → `.aab` dosyasını sürükle
3. **Release name**: `1.0.0 (4)` (versiyon adı + version code)
4. **Release notes** (Turkish, yeni kullanıcılar için):
   ```
   İlk sürüm 🌙
   • 99 Esma-i Hüsna + size özel esma reçetesi
   • Namaz vakitleri ve ezan bildirimi
   • Kıble yönü, tesbihat, salavat sayaçları
   • 22 sure metni + 7 sure sesli tilavet
   • Sabah/akşam evradı, hicri takvim
   ```
5. **Review release** → **Start rollout to Internal testing**

Internal testing'de cihazda test ettikten sonra:
6. **Promote release → Production** → yeniden inceleme
7. Production rollout: **kademeli %5 → %20 → %50 → %100** önerilir, ilk gün %5 ile başla

---

### D. Inceleme süresi ve sonuç

Google çoğu zaman 1-3 gün içinde inceler. Reject gelirse email gelir, gerekçesi yazar.
Yaygın reject sebepleri:
- Eksik content rating
- Privacy Policy URL erişilemiyor (kontrol et: tarayıcıda aç, 200 dönsün)
- Data safety form ile uygulama davranışı uyumsuz

---

## 6. Yusuf'tan alman gerekenler

- Phone screenshots (min 2, ideal 4-7 adet, telefondan ekran görüntüsü)
- Feature graphic (1024×500 PNG/JPG)
- 512×512 icon (gerekirse asset dosyadan büyütülür)

---

## 7. Yararli komutlar (reference)

```bash
# Mevcut build'ları listele
eas build:list -p android

# Belirli build'ı Play Console'a gönder (opsiyonel, manuel upload da olur)
eas submit -p android --id <BUILD_ID>

# Son production build'ı submit et
eas submit -p android --latest
# NOT: `eas submit` Play Console service account JSON gerekir
# Manuel upload daha basit ilk seferlik

# Package name kontrol
cat app.json | grep package

# Versiyon güncelleme (gelecek sprint)
# app.json -> "android.versionCode": 5 (her build'da +1)
# version: "1.0.1" (kullanıcıya görünür)
```

---

## 8. Cihaz testi (build geldikten sonra)

APK preview build'ını telefona yükle:
1. EAS dashboard'dan APK link al
2. Telefon → tarayıcıdan link aç → indir
3. Ayarlar → bilinmeyen kaynaklardan yükleme izni ver
4. Test et: namaz vakti, kıble, tesbihat, sureler, esma hesap, bildirimler

---

## Soru/Sorun olursa

- Yusuf: `myusufcl7@gmail.com`
- Repo Issues: https://github.com/baybuyuk/esma-app-store/issues
- EAS dokümanlar: https://docs.expo.dev/build/setup/
- Play Console rehber: https://support.google.com/googleplay/android-developer/

Başarılar! 🎯
