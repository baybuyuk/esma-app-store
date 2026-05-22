# 🤖 Hu — Claude Code Prompt Rehberi

> Müslüman bireyler için sade, reklamsız manevi rutin asistanı.
> İsim: **Hu** (هُو) — Allah'a işaret eden zamir.

---

## ⚙️ ÖN HAZIRLIK

Claude Code'u kullanmaya başlamadan önce:

1. Bilgisayarında bir klasör oluştur (örnek: `~/Projects/hu-app/` veya `C:\Projects\hu-app\`)
2. Terminal'de o klasöre git: `cd ~/Projects/hu-app`
3. Claude Code'u başlat: `claude`
4. Bu dosyadaki promptları **sırayla** Claude Code'a yapıştır
5. Her adımdan sonra test et, çalışıyorsa sonrakine geç

---

## 🚀 ADIM 0 — PROJE KURULUMU

```
Hu adında bir React Native (Expo) projesi başlat.

Detaylar:
- Proje adı: hu-app
- Template: blank (TypeScript değil, JavaScript)

Şu kütüphaneleri yükle:
- expo-sqlite
- expo-notifications
- expo-location
- expo-haptics
- expo-font
- adhan
- @react-navigation/native
- @react-navigation/native-stack
- react-native-screens
- react-native-safe-area-context
- date-fns
- @react-native-async-storage/async-storage

Klasör yapısı oluştur:
/assets/data/        - JSON veri dosyaları
/assets/fonts/       - Özel fontlar
/src/screens/        - Ekranlar
/src/components/     - Tekrar kullanılan bileşenler
/src/lib/            - Yardımcı fonksiyonlar
/src/constants/      - Sabitler
/src/db/             - SQLite kurulumu

src/constants/colors.js oluştur:

export const colors = {
  anaYesil: '#1B4332',
  ortaYesil: '#2D6A4F',
  krem: '#F8F5EE',
  altin: '#B08D2E',
  cizgi: '#C8B88A',
  anaMetin: '#1C1C1A',
  ikincilMetin: '#5F5E5A',
  gecesArka: '#0F1A1A',
  geceMetin: '#E8E0CC',
};

App.js'i React Navigation ile stack navigator olarak yapılandır.
İlk açılışta AsyncStorage'dan 'userName' kontrol et:
- Varsa AnaEkran'a git
- Yoksa Onboarding'e git
```

---

## 📚 ADIM 1 — VERİ DOSYALARINI ENTEGRE ET

```
/assets/data/ klasöründe şu JSON dosyaları var (manuel olarak konuldu):

- esmalar.json (100 esma kaydı)
- isimler.json (246 Türkçe isim)
- kisa_zikirler.json (10 sahih kısa zikir)
- hedefler.json (6 hedef kategori)
- anlik_zikirler.json (7 duygu durumu)
- haftalik_rotasyon.json (haftalık zikir)
- hadisler.json (Buhârî + Müslim)
- ayetler.json (Hikmet ayetleri)

Dosya yapıları:

esmalar.json — Liste, her eleman:
{ "no": 1, "esma": "Allah", "arapca": "الله", "ebced": 66, 
  "anlam": "...", "fazilet": "...", "gun": "...", "saat": "...", 
  "vakit": "...", "tesir": [...] }

isimler.json — Dict, key Türkçe isim:
"hakan": { "arapca": "خاقان", "ebced": 752, "cinsiyet": "e" }

kisa_zikirler.json — Liste, her eleman:
{ "id": "...", "ad": "...", "arapca": "...", "okunus": "...", 
  "meal": "...", "kaynak": "...", "kaynak_turu": "kuran|sahih_hadis", 
  "onerilen_sayi": N, "vakit": "...", "fazilet": "...", "tesir": [...] }

hedefler.json — Liste, her eleman:
{ "id": "...", "ad": "...", "ikon": "...", "aciklama": "...",
  "esma_no": N, "ek_esma": [N, N, N] }

anlik_zikirler.json — Liste:
{ "durum": "...", "zikir_id": "...", "renk": "#..." }

src/lib/data.js dosyasını oluştur, tüm JSON'ları import edip export et:

import esmalar from '../../assets/data/esmalar.json';
import isimler from '../../assets/data/isimler.json';
import kisaZikirler from '../../assets/data/kisa_zikirler.json';
import hedefler from '../../assets/data/hedefler.json';
import anlikZikirler from '../../assets/data/anlik_zikirler.json';
import haftalikRotasyon from '../../assets/data/haftalik_rotasyon.json';
import hadisler from '../../assets/data/hadisler.json';
import ayetler from '../../assets/data/ayetler.json';

export { esmalar, isimler, kisaZikirler, hedefler, anlikZikirler, haftalikRotasyon, hadisler, ayetler };
```

---

## 🧠 ADIM 2 — İSME GÖRE ESMA ALGORİTMASI

```
src/lib/esma.js oluştur.

Fonksiyonlar:

1. isimdenEsma(turkceIsim) — Türkçe isim alır, en yakın esmayı döndürür
   - isim küçük harfe çevrilir, boşluklar atılır
   - isimler.json'da arar
   - Yoksa varsayılan olarak esma_no: 19 (Fettâh) döndür
   - Varsa ebced değerini alıp en yakın esmayı bul

   Dönen değer:
   {
     bulundu: true,
     isim_arapca: "خاقان",
     isim_ebced: 752,
     cinsiyet: "e",
     esma: { no, esma, arapca, ebced, anlam, fazilet, gun, saat, vakit, tesir },
     fark: 8
   }

2. enYakinEsma(ebced) — Verilen ebcede en yakın esmayı bulur
   esmalar.json'da gezer, Math.abs(ebced - esma.ebced) en küçük olanı döndürür

3. esmaById(no) — Numaraya göre esma getirir

4. tesireGoreEsma(kategori) — "rizik", "huzur" gibi kategoride esmaları döndürür

5. guneGoreEsma(gun) — "Pazartesi", "Salı" gibi günle eşleşen esmaları döndürür

Test için aşağıdaki isimleri konsola yazdır:
- "Hakan" → Muktedir bekleniyor (752 → 744, fark 8)
- "Ahmet" → Mücîb (53 → 55)
- "Fatih" → Fettâh (489 → 489, fark 0)
- "Ali" → Aliyy (110 → 110, fark 0)
- "BilinmeyenIsim" → varsayılan Fettâh
```

---

## 🕌 ADIM 3 — NAMAZ VAKİTLERİ

```
src/lib/namaz.js oluştur. adhan-js kütüphanesi kullan.

import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

Fonksiyonlar:

1. gunlukVakitler(enlem, boylam, tarih = new Date())
   - CalculationMethod.Turkey() metodunu kullan (Diyanet)
   - Madhab.Hanafi (ikindi vakti için)
   - Dönen değer:
     {
       imsak: Date,
       gunes: Date,
       ogle: Date,
       ikindi: Date,
       aksam: Date,
       yatsi: Date
     }

2. sonrakiVakit(vakitler)
   - Şu andan sonraki ilk vakti döndür
   - { ad: "İkindi", zaman: Date, dakikaKaldi: 72 }

3. vakitFormat(date) — "15:32" formatında string

4. gericiSayim(targetDate) — "1 saat 12 dakika" formatında

Vakit isimleri Türkçe: İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı.
```

---

## 🔔 ADIM 4 — BİLDİRİM SİSTEMİ

```
src/lib/bildirim.js oluştur. expo-notifications kullan.

import * as Notifications from 'expo-notifications';

Fonksiyonlar:

1. izinIste() — Bildirim iznini iste

2. namazBildirimleriniKur(vakitler, konum)
   Her vakit için 2 bildirim:
   - 15 dakika önce: "İkindi vaktine 15 dakika var, ne yapıyorsan toparla 🤲"
   - Vakit girdiğinde: "İkindi vakti girdi."
   
   Yarın sabaha kadar tüm bildirimleri kur.

3. aksamMuhasabesiBildirimi()
   Her gün 22:00:
   - Başlık: "Hu"
   - Mesaj: "Günü bağlayalım mı? 🌙"
   - Bildirime tıklayınca AksamMuhasabesi ekranı açılsın

4. tumBildirimleriIptal()

KRİTİK KURALLAR:
- Bildirim tonu ASLA suçlayıcı olmasın
- "Hâlâ kılmadın!" gibi ifadeler YASAK
- Sadece şefkatli hatırlatma
- Reklam VEYA tanıtım bildirimi YOK
- Sadece namaz vakitleri + 22:00 akşam muhasebesi
```

---

## 📱 ADIM 5 — ONBOARDING (4 EKRAN)

```
4 ekranlı onboarding akışı. Her ekran ayrı component, navigation stack ile bağlı.

EKRAN 1: OnboardingNameScreen.js
- Üst: "Selamün Aleyküm" (büyük, anaYesil)
- "Adın nedir?" başlık
- TextInput (büyük, ortada)
- "Devam Et" butonu (altın)
- İsim girilince:
  * AsyncStorage.setItem('userName', isim)
  * isimdenEsma() çağır, sonucu AsyncStorage'a kaydet (key: 'userEsma')
  * OnboardingLocationScreen'e geç

EKRAN 2: OnboardingLocationScreen.js
- Başlık: "Konumun gerekli"
- Açıklama: "Namaz vakitleri için konumuna ihtiyacımız var."
- "Konumumu Kullan" → expo-location ile koordinat al
- "Manuel Şehir Seç" → Türkiye şehirleri dropdown (81 il)
- Sonuçu AsyncStorage'a kaydet:
  - sehir (string)
  - enlem (number)
  - boylam (number)

EKRAN 3: OnboardingNotificationScreen.js
- Başlık: "Bildirim izni"
- Açıklama: "Namaz vakitlerini yumuşak bir tonla hatırlatalım mı?"
- "Evet, Bildir" → izinIste() + namazBildirimleriniKur() + aksamMuhasabesiBildirimi()
- "Şimdilik Hayır" — atla, uygulama yine çalışır

EKRAN 4: OnboardingEsmaScreen.js
Kullanıcının ismi ve esma bilgisini sade ve manevi bir atmosferle göster:

- Üst: "🌟 [İsim]"
- Eğer isim bulunduysa:
  * Arapça: [isim_arapca] (büyük)
  * "Ebced değerin: [isim_ebced]"
  * Ayırıcı çizgi
- "Senin esman:" yazısı
- Arapça esma (çok büyük, Amiri font)
- "Yâ [Esma]"
- Anlamı
- Detaylı fazilet metni (paragraf)
- Önerilen gün ve saat
- Alt: "Bismillah, Başlayalım" butonu → AnaEkran

Tüm onboarding ekranlarında:
- Krem arka plan
- Yeşil aksanlar
- Inter font (system)
- Sade, tevazu havası
- Fade animasyon geçişleri
```

---

## 🏠 ADIM 6 — ANA EKRAN

```
HomeScreen.js — ScrollView içinde dikey kartlar:

1. ÜST KARŞILAMA
   "Selamün Aleyküm, [İsim]"
   "Cuma, 22 Kasım 2025" (date-fns ile Türkçe format)

2. SONRAKİ VAKİT KARTI (büyük, anaYesil arka plan, beyaz yazı)
   - 🕌 İkonu
   - "Sonraki: İkindi"
   - "15:32" (büyük)
   - "1 saat 12 dakika kaldı" (geri sayım)
   - useEffect içinde setInterval ile her dakika güncelle
   - onPress → TumVakitlerModal aç

3. BUGÜNKÜ ZİKİR KARTI (altın aksan)
   - "📿 Bugün için: Yâ [Esma]"
   - Esma anlamı (kısa)
   - "Zikretmeye Başla" butonu → ZikirSayacScreen (esmayı parametre olarak gönder)

4. GÜNÜN AYETİ KARTI
   - "📖 Günün Ayeti"
   - Türkçe meal (büyük, italic)
   - "— [Sûre adı], [ayet no]"
   - "Aslını Göster" butonu (Arapça'yı toggle)

5. GÜNÜN HADİSİ KARTI
   - "📚 Günün Hadisi"
   - Türkçe metin
   - "— Buhârî" veya "— Müslim"
   - "Aslını Göster" butonu

6. KISA YOLLAR (2x2 grid)
   - 💎 Kısa Zikirler → KisaZikirlerScreen
   - 🌟 Anlık Zikir → AnlikZikirScreen
   - 📿 Tüm Vakitler → TumVakitlerModal
   - 📊 Geçmiş → GecmisScreen

src/lib/gunlukSecim.js oluştur:

export function gununIcerigi(liste, offset = 0) {
  const bugun = new Date();
  const tarihKodu = bugun.getFullYear() * 10000 
                  + (bugun.getMonth() + 1) * 100 
                  + bugun.getDate();
  return liste[(tarihKodu + offset) % liste.length];
}

Kullanım:
- Günün ayeti: gununIcerigi(ayetler, 0)
- Günün hadisi: gununIcerigi(hadisler, 7)

Cuma günü kontrolü: new Date().getDay() === 5
Cumaysa: ayetleri filtrele, sure_no === 18 (Kehf) olanlardan seç.

Tasarım:
- Krem arka plan (#F8F5EE)
- Kartlar beyaz, hafif gölge
- Border-radius: 12
- Padding: 16
- Aralarda 12px boşluk
- SafeAreaView kullan
```

---

## 📿 ADIM 7 — ZİKİR SAYAÇ EKRANI

```
ZikirSayacScreen.js

Route params: { esmaNo } veya { zikirId }
Hangi esma/zikir için sayım yapılacak.

ÜST (header):
- Geri butonu (sol)
- Esma adı: "Yâ Muktedir" (ortada, başlık)
- Arapça altta: "يا مقتدر"

ORTA (büyük tıklanabilir alan, ekranın %70'i):
- TouchableOpacity tüm orta alanı kaplar
- İçinde:
  * Çok büyük sayı (80pt+, anaYesil): mevcut sayı
  * "Hedef: 744" (altın)
  * Progress bar (yatay, %lik dolum)
  * Yüzde: "%29"

ALT (butonlar):
- "Sıfırla" butonu (sol)
- "Tamamla" butonu (sağ, hedefe ulaşınca aktif)

İŞLEVSELLİK:

Orta alana her dokunuş:
- sayim += 1
- Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
- Son 10'da: progress bar rengi altın olsun
- Hedef'e ulaşınca:
  * Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  * Alert: "Elhamdulillah, tamamladın"
  * "Devam et" veya "Bitir" seçeneği
  * SQLite zikir_gecmisi tablosuna kayıt:
    INSERT INTO zikir_gecmisi (zikir_id, esma_no, sayim, hedef, baslangic, bitis)

SAHTECİLİĞİ ÖNLEME (Önemli):
- İki tıklama arası min 200ms (useRef ile son tıklama zamanını tut)
- Günde max 10.000 sayım (kullanıcı başına)
- 1 dakikada 300+ tıklama → uyarı: "Acele etme, niyet et"

State:
- sayim, hedef, baslangic_zaman, tamamlandi

Tasarım:
- Krem arka plan
- Sayı: anaYesil, büyük
- Sayı altında esmanın anlamı (küçük, gri)
- Buton: altın
```

---

## 💎 ADIM 8 — KISA ZİKİRLER (2 EKRAN)

```
KisaZikirlerScreen.js — Liste:

- Header: "Kısa Zikirler"
- Açıklama: "Kuran ve sahih hadis kaynaklı"
- FlatList ile kisa_zikirler.json:
  Her item bir kart:
  * Türkçe ad (anaYesil, başlık)
  * Arapça (ilk 40 karakter, italic)
  * Türkçe meal (1 satır, gri)
  * Alt sağda kaynak etiketi:
    - kaynak_turu === "kuran" → yeşil rozet "📖 KURAN"
    - kaynak_turu === "sahih_hadis" → mavi rozet "📚 SAHİH HADİS"
- Karta tıklayınca ZikirDetayScreen aç (zikirId parametresiyle)

---

ZikirDetayScreen.js — Detay:

Route params: { zikirId }

İçerik (dikey ScrollView):

- Geri butonu
- Başlık: zikir adı (ortada, büyük)
- BÜYÜK Arapça (28pt+, ortada, Amiri font)
- Latin okunuş (italic, gri, küçük)
- Türkçe meal (15pt)
- Ayırıcı
- Kaynak kutusu (altın çerçeve):
  "📖 [kaynak]"
- Fazilet metni (paragraf, italic)
- "Önerilen Sayı: [N]" (altın)
- "Vakit: [vakit]" (gri)
- En altta: "Zikretmeye Başla" butonu → ZikirSayacScreen (zikirId ile)

Tasarım:
- Krem arka plan
- Arapça yazı için Amiri font
- Sade, ferah
- Margin'lar geniş
```

---

## 🌟 ADIM 9 — ANLIK ZİKİR

```
AnlikZikirScreen.js

Üst:
- Geri butonu
- Başlık: "Şu an ne hissediyorsun?"

7 büyük buton (anlik_zikirler.json'dan):

Her buton:
- Min yükseklik: 80px
- Border-radius: 12
- Arka plan rengi: anlik_zikirler.json'daki renk (her durum farklı)
- Sol: emoji (28pt)
  - "Korku, kaygı" → 😟
  - "Üzüntü, kayıp" → 😢
  - "Suçluluk, pişmanlık" → 😔
  - "Aciz, çaresiz" → 😞
  - "Düşman, baskı" → 😠
  - "Şükür, sevinç" → 😊
  - "Cuma günü" → 🌙

- Orta: durum metni (büyük, beyaz)
- Sağ: önerilen zikir adı (küçük, beyaz)

CUMA KONTROLÜ:
new Date().getDay() === 5 ise "Cuma günü" butonu en üstte gösterilir
Diğer günlerde gizli.

Tıklayınca:
- ZikirDetayScreen aç (zikir_id ile)
```

---

## 🌃 ADIM 10 — AKŞAM MUHASEBESİ

```
AksamScreen.js

22:00 bildiriminden veya manuel açılır.

Üst:
- Geri butonu
- Başlık: "Günü bağla"
- Tarih: "22 Kasım, Cuma akşamı"

İçerik:

SORU 1: "Bugün kaç vakit namaz kıldın?"
Radio button listesi:
- ⭕ 5 vakit
- ⭕ 3-4 vakit
- ⭕ 1-2 vakit
- ⭕ Kılamadım

SORU 2: "Bugün için şükredeceğin ne var?"
TextArea (4 satır)
Placeholder: "Bir kelime bile yeter..."

SORU 3 (opsiyonel): "Bugün kimi sevindirdin?"
TextArea (3 satır)
Placeholder: "Boş bırakabilirsin..."

Alt:
"Günü Kapat" butonu (altın, büyük)

KAYIT:
SQLite gunluk_kayit tablosuna ekle:

CREATE TABLE IF NOT EXISTS gunluk_kayit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tarih TEXT,
  namaz_sayisi INTEGER,
  sukur_notu TEXT,
  iyilik_notu TEXT,
  olusturma_zamani TEXT
);

Kaydedince:
- Toast: "Bismillah, hayırlı geceler"
- AnaEkran'a dön

KRİTİK KURAL:
- ASLA suçlama yok
- "Daha az namaz kıldın" feedback YOK
- Sadece veri al, kullanıcı kendi farkındalığını oluştursun
- "Allah kabul etsin" gibi dini ifadeler kullanılabilir ama abartmadan
```

---

## 🔍 ADIM 11 — DESTEK EKRANLAR

```
1. TumVakitlerModal.js
   - Modal olarak açılır (yarım ekran, alttan)
   - Bugünün 6 vakti (imsak dahil)
   - Tablo görünümü:
     | Vakit  | Saat  |
     | İmsak  | 05:42 |
     | Güneş  | 07:01 |
     | Öğle   | 12:55 |
     | İkindi | 15:32 |  ← sonraki vakit (altın)
     | Akşam  | 17:48 |
     | Yatsı  | 19:18 |
   - Geçmiş vakitler soluk gri
   - Sonraki vakit altın renkte vurgulu

2. GecmisScreen.js
   - "Akşam Muhasebesi Geçmişi" başlık
   - SQLite'dan son 30 günü çek:
     SELECT * FROM gunluk_kayit ORDER BY tarih DESC LIMIT 30
   - FlatList:
     Her item:
     * Tarih (üst sol)
     * Namaz sayısı (üst sağ)
     * Şükür notu (1-2 satır kısaltılmış)
   - Tıklayınca detay modalı

3. AyarlarScreen.js
   - Liste görünümü:
     * Bildirim açık/kapalı (Switch)
     * Konum değiştir (basın → şehir seçici)
     * "Hakkında" (basın → HakkindaScreen)
     * "Bize Geri Bildirim" (mailto:)

4. HakkindaScreen.js
   - Üst: Logo + "Hu" yazısı
   - Sürüm: "v1.0.0"
   - Açıklama paragrafı:
     "Hu, Müslüman bireyler için sade ve reklamsız bir
      manevi rutin asistanıdır. Sadaka-i câriye niyetiyle 
      yapılmıştır."
   - Lisanslar:
     "📖 Meal: Diyanet İşleri Başkanlığı"
     "📚 Hadisler: fawazahmed0/hadith-api (MIT)"
     "🕌 Namaz vakitleri: adhan-js"
     "🌟 Esma faziletleri: Klasik İslami kaynaklar (Bûnî, Gümüşhânevî, Nâzilî)"
   - Alt: "🤲 Niyetimiz halis olsun"
```

---

## 🎨 ADIM 12 — POLISH

```
Son rötuşlar:

1. FONTLAR
   Google Fonts'tan indir:
   - "Amiri" (Arapça için, klasik Kuran fontu)
   - "Cormorant Garamond" (Türkçe başlıklar için)
   
   /assets/fonts/ klasörüne koy.
   expo-font ile yükle:

   import { useFonts } from 'expo-font';
   const [fontsLoaded] = useFonts({
     'Amiri': require('./assets/fonts/Amiri-Regular.ttf'),
     'Amiri-Bold': require('./assets/fonts/Amiri-Bold.ttf'),
     'Cormorant': require('./assets/fonts/CormorantGaramond-Regular.ttf'),
   });

   if (!fontsLoaded) return <AppLoading />;

2. SPLASH SCREEN
   - Krem arka plan (#F8F5EE)
   - Ortada büyük "Hu" yazısı (altın, Cormorant)
   - Altında Arapça "هُو" (Amiri)
   - Çok altta küçük "Manevi rutinin"
   - 1.5 saniye gösterilir

3. ANİMASYONLAR
   - Sayaç tap'inde scale (0.95 → 1)
   - Hedef tamamlandığında parıltı efekti
   - Sayfa geçişlerinde fade

4. YÜKLEME DURUMLARI
   - ActivityIndicator (altın renkte)
   - Skeleton screen (içerik yüklenirken)

5. HATA YÖNETİMİ
   - Konum izni red → manuel şehir seçme akışı
   - Bildirim red → uygulama yine çalışsın
   - SQLite hatası → AsyncStorage fallback
   - Try-catch ile sarmala

6. PERFORMANS
   - FlatList kullan (listelerde)
   - useMemo (hesaplamalar)
   - React.memo (kart bileşenleri)
   - Image cache

7. ERİŞİLEBİLİRLİK
   - Tüm butonlarda accessibilityLabel
   - Font scale destek
   - Yüksek kontrast destek

8. KARANLIK MOD (basit versiyon)
   - useColorScheme() ile dinle
   - Karanlık temada:
     * Arka plan: gecesArka (#0F1A1A)
     * Metin: geceMetin (#E8E0CC)
     * Aksanlar altın kalır
```

---

## 🚀 ADIM 13 — TEST VE YAYIN

```
TEST AKIŞI:

1. Cihaz testi (en az 1 hafta)
   - Kendi telefonunda günde kullan
   - Tüm vakit bildirimleri gelmelidir
   - Tüm zikirleri çek
   - Akşam muhasebesi 22:00'da gelmelidir
   - Tüm ekran geçişleri sorunsuz
   - Veri kaybı olmamalı

2. Beta test
   - 3-5 müslüman arkadaşa kurdur
   - TestFlight (iOS) veya APK (Android) paylaş
   - Geri dönüş topla, not al
   - Hataları düzelt

3. Test cihazları
   - En az 1 eski Android
   - En az 1 yeni Android
   - 1 iPhone (varsa)

YAYIN HAZIRLIĞI:

1. Hesap aç:
   - Apple Developer: $99/yıl
   - Google Play Console: $25 tek seferlik

2. Ekran görselleri hazırla (her platform için):
   - Ana ekran
   - Zikir sayacı
   - Günün ayeti detay
   - Esma tanıtım
   - Akşam muhasebesi

3. Açıklama metni hazırla (App Store + Play Store):
   "Hu — Müslüman bireyler için sade, reklamsız manevi rutin asistanı.
   
   ✦ Namaz vakitleri ve şefkatli bildirim
   ✦ Günün ayeti ve hadisi (Diyanet meali, sahih kaynak)
   ✦ Zikir sayacı ve isme özel esma ataması
   ✦ Kısa zikirler (Hasbiyallah, Lâ havle, Estağfirullah...)
   ✦ Anlık zikir — duygu durumuna göre öneri
   ✦ Akşam muhasebesi — günü kapatma rutini
   
   Sade. Reklamsız. Manevi.
   
   Kalplere ferahlık verir."

4. Anahtar kelimeler (ASO):
   - zikir, dua, namaz, esma, ayet, hadis
   - islami uygulama, müslüman, manevi
   - Hu, allah, ibadet

5. Gizlilik politikası şart (App Store reddediyor):
   - Toplanan veri yok
   - Kullanıcı verisi sadece cihazda
   - Şehir bilgisi sadece namaz vakti için
   - Bildirim izni gönüllü
```

---

## 💡 GENEL İPUÇLARI

Her Claude Code seansında şunları belirt:

1. **"Test et ve çalıştığını doğrula"** — bittiğinden emin ol
2. **"Try-catch ile sarmala"** — hata yönetimi
3. **"Türkçe yorumlar ekle"** — sonradan anlayabilesin
4. **"Sade ve okunabilir kod yaz"** — over-engineering yok
5. **"iOS ve Android'de aynı görünsün"** — platform uyumu

## 🎯 BAŞARI KRİTERLERİ

MVP başarılı sayılır eğer:

- ✅ Uygulama açılıyor, ismi giriliyor, esma atanıyor
- ✅ Namaz vakitleri doğru hesaplanıyor (Diyanet ile karşılaştır)
- ✅ 5 vakit bildirimi geliyor
- ✅ Zikir sayacı doğru sayıyor
- ✅ Günün ayeti ve hadisi her gün değişiyor
- ✅ Akşam muhasebesi 22:00'da bildirim atıyor
- ✅ Uygulama çökmüyor, geri tuşu çalışıyor
- ✅ Tasarım sade, dini hassasiyete uygun
- ✅ Reklamsız, ücretsiz, premium tuzakları yok

**Hepsi olunca yayınla. Mükemmel değil, ÇALIŞAN olsun.**

---

🤲 **Hayırlı olsun.**
