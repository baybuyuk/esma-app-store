# Hu — Store Asset Spec'leri

Bu doküman Hu uygulamasının Google Play Store ve Apple App Store görsellerini hazırlamak için kullanılacak spec'leri içerir. Mevcut marka kimliğini koruyarak (krem zemin + altın hat + koyu kahve tipografi), yaşlı kullanıcıya saygılı, sakin ve kutsiyet hissiyatlı bir vitrin amaçlanır.

---

## Marka Kimliği — Hatırlatma

| Token | Hex | Kullanım |
|---|---|---|
| `krem` | #F8F5EE | Tüm vitrin görsellerinin ana zemini |
| `kremAlt` | #E9DFC3 | İkincil zemin, hafif kontrast |
| `altin` | #B08D2E | Arapça hat, vurgu, çerçeve |
| `cizgi` | #C8B88A | İnce ayraç, dekoratif çizgi |
| `anaMetin` | #1C1C1A | Türkçe başlık |
| `ikincilMetin` | #5F5E5A | Alt yazı, meta |
| `anaYesil` | #1B4332 | KULLANMA — vitrinde dini yeşil klişesi olur |

**Tipografi (vitrin):**
- Arapça hat: serif (mevcut icon'daki sülüs ailesinden) — `altın` renkte
- Türkçe başlık: sans-serif, semi-bold (sistem fontu kabul; vitrinde Inter / SF Pro Display)
- Slogan: medium weight, geniş harf aralığı (letter-spacing 1.5–2 px)

**Kaçınılacaklar:**
- Material 3 emoji feast (yıldız parlama, gradient halo, sticker estetiği)
- Yarı şeffaf cam (frosted glass) — modern fakat manevi atmosferden uzak
- Neon yeşil/turkuaz — dini app klişesi
- Erkek/kadın insan figürü, cami silüeti, minare clipart

---

## 1. Play Store Feature Graphic — 1024×500 px

### Karar: TELEFON MOCKUP YOK, salt tipografi + hat dokusu

Telefon mockup koymak feature graphic'i "uygulama tanıtım reklamı" hissine sokar, Hu'nun manevi durağanlığını dağıtır. Mockup'lar zaten ayrı screenshot grid'inde gösterilecek. Feature graphic = **kapak**; bir uygulamanın değil, bir niyetin kapağı.

### Layout

```
+--------------------------------------------------------------+
|                                                              |
|  [hafif altın hat dokusu — opacity 0.06, sol/sağ kenarlarda] |
|                                                              |
|                                                              |
|         هـو                Hu                                |
|       (altın hat)         (koyu kahve)                       |
|       180 px              42 px tracking-wide                |
|                                                              |
|                  ── ince altın çizgi (180 px) ──             |
|                                                              |
|              99 ESMA · NAMAZ · ZIKIR · TILAVET               |
|              (orta kahve, 22 px, letter-spacing 2)           |
|                                                              |
+--------------------------------------------------------------+
```

### Spec Detay

| Öğe | Değer |
|---|---|
| Zemin | `#F8F5EE` solid (gradient YOK — yaşlı gözü için temizlik) |
| Köşelerde dekor | Mevcut `icon.png`'deki yıldız/dal motifinden alıntı, opacity 0.06–0.08, `#B08D2E` |
| Arapça "هو" | Mevcut icon'daki hat formundan ölçeklenip merkez-sol; yükseklik ~280 px (500'ün %56'sı) |
| Türkçe "Hu" | Arapça'nın sağında, baseline hizalı, `#2C2418`, 96 px, semi-bold |
| Ayraç çizgi | Tipografinin altında, 1 px, `#C8B88A`, genişlik 180 px, ortalanmış |
| Slogan | "99 ESMA · NAMAZ · ZIKIR · TILAVET" (`#5C4A2E`, 22 px, letter-spacing 2px, uppercase) |
| Güvenli alan | Play Store sağda 200 px'lik bölgeyi indirme butonu/yıldız ile kapatır — kritik öğe sağ 200 px'e GİRMEMELİ. Bu yüzden Arapça+Türkçe lockup'ı 35–55% x-eksenine yerleştir. |

### Slogan Adayları (sıralı tercih)

1. **"99 ESMA · NAMAZ · ZIKIR · TILAVET"** — kategori bildiren, tartışmasız (TERCİH)
2. "BIR HAYAT BOYU MANEVI REHBER" — duygusal ama belirsiz
3. "99 ESMA, TEK EKRANDAN" — kataloglayıcı, slogansal değil

Karar: 1 nolu — yaşlı kullanıcının ilk bakışta "bu uygulama bana ne sunar" sorusuna cevap verir.

### Format

- PNG, 24-bit, no alpha
- Maksimum 1 MB (Play sınırı)
- sRGB, 72 dpi
- Test: Play listing thumbnail boyutunda (256 px genişlik) okunaklılık zorunlu

---

## 2. App İkonu

### Mevcut Durum

Mevcut `assets/icon.png` (1024×1024) — krem zemin, altın "هو" hattı, dekoratif yıldız/dal motifleri, ince altın çerçeve.

### Karar: Mevcut ikon iOS ve Play için yeterli, fakat ADAPTIVE ICON'da safe zone ihlali VAR

**Play Store ana ikon (512×512):** Play Console upload sırasında 1024'ten otomatik scale eder, ek bir asset gerekmez.

**iOS App Store ikon (1024×1024):** Mevcut dosya direkt kullanılabilir. iOS köşeleri kendi maskeler — mevcut ikon zaten kendi yuvarlak köşesini ve çerçevesini içeriyor; iOS'un kendi maskesi bunu "kart içinde kart" gibi gösterir.

#### iOS Düzeltme (öneri, opsiyonel)

Eğer iOS'ta daha temiz görünüm istenirse, **iOS-only varyant** üret:
- Krem zemin tam taşar (kendi köşesi yok — iOS maskeler)
- Çerçeve kaldırılır
- Arapça "هو" merkez, daha büyük (650 px civarı, 1024 içinde %63)
- Yıldız/dal motifleri korunur ama daha geniş yerleşir

Bu varyant `assets/icon-ios.png` olarak eklenir; `app.json` ios.icon ile pin'lenir. Mevcut Android ikonu değişmez.

### Adaptive Icon (Android) — SAFE ZONE PROBLEMİ

Mevcut `adaptive-icon.png` (1024×1024) — aynı görsel, krem zeminli.

Android adaptive icon **safe zone = merkezdeki 66% (kenardan 17% kırpılabilir)**. Yani 1024'lük canvas'ta 174 px her kenardan kırpılma RİSKİ var. Launcher şekline göre (daire, squircle, kare) Hu hattının çerçevesi/dış halkası kırpılır.

**Mevcut adaptive-icon analizi:**
- Arapça "هو" hatti merkez-merkez yerleşmiş, ~%45 alan kaplıyor → safe zone içinde, GÜVENLİ
- Çerçeve dış kenara çok yakın (~%2 marj) → daire launcher'da TAMAMEN KIRPILACAK
- Yıldız/dal motifleri (~%75 alan) → daire launcher'da yarıları kırpılır

**Aksiyon:**
- Yeni `adaptive-icon.png` üretilmeli:
  - `foregroundImage`: SADECE Arapça "هو" hatti, ortada, 1024 canvas'ta ~620 px (yani %60). Krem zemin transparent, çerçeve YOK, dekor YOK.
  - `backgroundColor`: `#F8F5EE` (zaten doğru)
- Sonuç: launcher hangi şekli verirse versin (daire/kare/squircle), Arapça hat asla kırpılmaz, krem zemin maskeyi doldurur, dekor kaybı olsa bile marka kimliği korunur.

### Notification Icon (Android, dolaylı)

`app.json`'da expo-notifications color `#B08D2E` doğru. Notification icon'u ayrıca üretilmedi — Expo default'a düşüyor. **Aksiyon (opsiyonel):** Beyaz/transparent, sadece "هو" sülüs siluetli 96×96 mdpi notification icon. Şart değil ama bildirimde görsel marka tutarlılığı kazandırır.

---

## 3. Screenshot Composition

### Frame Sayısı: 7 (Play 2–8 arası kabul; iOS 6.7" için 3–10 arası)

7, hem yeterli zenginlik hem de yaşlı kullanıcının "swipe yorgunluğu"na düşmemesi için doğru. 6.5" Android ve 6.7" iPhone için ortak komposizyon.

### Sıralama Mantığı

Sıralama, kullanıcının uygulamaya temas yolculuğunu izler:
1. **Önce kim olduğunu söyle** (ana ekran)
2. **Sonra eşsiz değerini göster** (Esma'm hangisi — Hu'nun ayırt edici özelliği)
3. **Günlük rutini göster** (tesbihat, salavat, evrad)
4. **Manevi derinliği göster** (sure tilaveti)
5. **Pratik fayda kapatır** (kıble)

### Frame Listesi

| # | Ekran | Caption (uppercase, letter-spacing 1.5) | Gerekçe |
|---|---|---|---|
| 1 | **AnaEkran** | "NAMAZ VAKTI ELINIZIN ALTINDA" | İlk frame = uygulama özeti; namaz vakti yaşlı için en pratik fayda |
| 2 | **İsmin Sırrını Bul** (EsmaBulScreen) | "ISMINIZE DUSEN ESMA" | Ayırt edici özellik; rakip app'lerde yok, dikkat çekici |
| 3 | **EsmaDetayScreen** | "99 ISMIN ANLAMI VE SIRRI" | Esma derinliği; Hu'nun ana iddiası |
| 4 | **TesbihatScreen** | "NAMAZ SONRASI TESBIHAT" | Günlük rutin; "ben bunu kullanırım" hissi |
| 5 | **ManeviSureDetayScreen** | "AYET AYET MEAL VE TILAVET" | Tilavet + meal; manevi derinlik |
| 6 | **KisaZikirlerScreen** | "SABAH AKSAM EVRADI" | Rutin derinliği; reçete kart hissi |
| 7 | **KibleScreen** | "KIBLE HER AN YANINIZDA" | Pratik kapanış; konfor hissi |

### Önemsiz görülenler (atlananlar) ve gerekçe

- **SalavatScreen**: KisaZikirler ile çakışır (her ikisi de "günlük rutin"). KisaZikirler daha geniş kapsamlı, salavat kapsanmış sayılır.
- **SurelerScreen (liste)**: Liste ekranı vitrinde sönük; bunun yerine ManeviSureDetay (tilavet) daha güçlü.
- **Tesbihat → ZikirSayacScreen ayrımı**: Tesbihat yeterli, sayaç ayrı frame gerektirmez.
- **Ayarlar**: Vitrinde değer yok.

### Screenshot Frame Layout (her frame için ortak şablon)

```
+------------------------------+   ←  1242×2688 (iPhone 6.7")
|                              |       1080×1920 (Android 6.5")
|  [krem bant ~280 px]         |
|                              |
|   "NAMAZ VAKTI ELINIZIN     |  ← caption, üst bant
|    ALTINDA"                  |     - 2-3 satır, max 32 karakter
|                              |     - #2C2418, 64 px, semi-bold
|                              |     - center-aligned
|------------------------------|
|                              |
|                              |
|                              |
|  [TELEFON MOCKUP — gerçek    |  ← ekran görüntüsü
|   ekran görüntüsü, dış       |     - device frame: koyu kahve
|   çerçeve yok, status bar    |        (#2C2418), gölge YOK
|   temiz]                     |     - ekran içeriği gerçek render
|                              |     - status bar saat 09:41
|                              |        (iOS klişe, güvenli)
|                              |     - batarya/sinyal görünmez
|                              |
|                              |
|                              |
|------------------------------|
|                              |
|  [krem alt bant ~120 px]    |  ← alt bant — boş veya
|        هـو   Hu              |     küçük marka mührü
|        (32px altın)          |
+------------------------------+
```

### Caption Spec

- Renk: `#2C2418` (koyu kahve)
- Font: Türkçe sans-serif semi-bold; **uppercase, letter-spacing 1.5 px**
- Boyut: 64 px (iPhone 6.7" canvas için); orantılı scale diğer cihazlara
- Hizalama: Her zaman üst bantta, center
- Satır: Maks 2 satır, satır başına ortalama 18 karakter
- Vurgu kelime (opsiyonel): Caption içinde 1 kelime `altın` (#B08D2E) — örn. "ISMINIZE DUSEN **ESMA**"; vurguyu sadece 2., 3., 5. frame'lerde kullan (3 frame, fazlası dağıtır)

### Status Bar Temizleme

Screenshot'larda iOS/Android status bar saati **09:41 (iOS klişe) veya 09:41 (Android)** olarak sabitle. Batarya, sinyal, bildirim ikonları temizlenmeli — Figma/Photoshop'ta üst banta krem bant uygulanırsa zaten kaybolur. Saat değeri vitrinde "uygulama yeni açılmış" hissi verir.

### Hangi screenshot en güçlü?

**Frame 2: İsmin Sırrını Bul — "ISMINIZE DUSEN ESMA"**

Sebep:
- Rakip namaz vakti / Kuran app'lerinde yok
- Yaşlı için pratik+manevi karışımı doğru oranda
- "Benim ismim hangisi?" sorusu indirme niyetini tetikler (kişiselleştirme)
- Caption kısa, vurgu net

Frame 1 (AnaEkran) listelemede ilk göründüğü için zorunlu kalır, fakat ASIL CTA frame'i 2'dir. Play Console'da feature graphic + 2 nolu frame ekranda yan yana göründüğünde compositional uyum oluşur.

---

## 4. iOS App Preview Video — Öneri: ŞİMDİ YAPMA

### Öneri Gerekçesi

App Preview video iOS App Store'da opsiyonel (Apple zorunlu kılmıyor). Yusuf için **ilk lansman sürümünde atlanmasını öneririm**, sebepler:

1. **Production maliyeti yüksek**: 15-30 sn video için screen recording + montaj + müzik/ses kararı + Apple'ın 3 frame "poster" seçimi + dikey 1080×1920 render = en az 1 gün iş.
2. **Müzik kararı manevi risk**: Hu uygulamasında ezan dışı ses yok. App Preview'a Sufi müzik / nasheed eklemek **vibe ile çelişir** (uygulama içinde böyle bir şey yok). Sessiz video da Apple'ın "sessiz video uyarısı"nı tetikler.
3. **Screenshot'lar zaten anlatabilir**: 7 statik frame iyi caption'lanmışsa video'nun katma değeri %15-20'yi geçmez.
4. **İlerideki sürümler için saklayın**: Versiyon 1.1 veya 1.2'de organik geri bildirim toplandıktan sonra, hangi özelliğin en çok ilgi gördüğüne bakıp ona göre 1 video çekin.

### Eğer Yusuf yine de yapmak isterse — Brief

15 saniye, dikey, sessiz (siyah-beyaz başlık karelerinde "Sesi açın" CTA YOK):

| Sahne | Süre | İçerik |
|---|---|---|
| 1 | 0-2 sn | Krem zemin → Arapça "هو" hattı fade-in (300 ms), Türkçe "Hu" fade-in (600 ms) |
| 2 | 2-5 sn | AnaEkran ekran kaydı — namaz vakti kartı highlight, parmak hayali ile tap (gerçek el yok, soyut tap göstergesi) |
| 3 | 5-9 sn | İsmin Sırrını Bul — isim yazımı (timelapse 2 sn) → Esma sonucu fade-up |
| 4 | 9-12 sn | ManeviSureDetay — tilavet sayfası scroll, ayet vurgusu animasyonu (mevcut highlight) |
| 5 | 12-14 sn | Tesbihat — sayaç 33'e dolar, "Subhanallah" yazısı görünür |
| 6 | 14-15 sn | Krem zemin → "هو · Hu" lockup (1. sahnenin tekrarı) — kapanış mührü |

Spec:
- Çözünürlük: 1080×1920 (App Store iPhone)
- Format: H.264 MP4, max 500 MB
- FPS: 30
- Ses: SESSIZ track (zorunlu — Apple sessiz olsa bile track olmalı)
- 3 poster frame seçimi: 1. sahnenin son frame'i, 3. sahne sonu (Esma sonucu), 6. sahne (lockup)

---

## Üretim Sırası — Yusuf İçin Önerilen Akış

1. **Adaptive-icon düzeltmesi** (en kritik — Android cihazlarda zaten yanlış görünüyor olabilir) — yeni `adaptive-icon.png` (sadece sülüs hat, transparent zemin)
2. **Feature graphic** (Play Console lansman için zorunlu)
3. **7 screenshot** (Play + iOS, aynı içerik, farklı canvas boyutu)
4. **iOS-only ikon varyantı** (opsiyonel; mevcut ikon ile de yayınlanabilir)
5. **App Preview video** — sürüm 1.1+ için ertele
