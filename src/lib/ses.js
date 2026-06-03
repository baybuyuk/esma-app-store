// Hu — tasbih ses katmani
// Sayac (zikir/salavat) tiklarinda kisa bir tahta tik sesi calar.
//
// AsyncStorage anahtari : @hu/ayar/tasbihSesi
// Deger formati         : string. '0' = kapali. Diger her sey (undefined dahil) = acik.
// Default               : acik (true)
// Ses dosyasi           : assets/sounds/tasbih.mp3 (CC0, ~180ms)
//
// Dis API:
//   tasbihCal()             -> void, fire-and-forget. Ayar kapali ise sessizce doner.
//   tasbihAyari(acik:bool)  -> Promise<void>. Storage'a yazar + cache'i gunceller.
//   tasbihAyariOku()        -> Promise<boolean>. Storage'tan okur, cache'i besler.
//
// Tasarim notlari:
// - expo-audio v54: createAudioPlayer (imperatif). Hook degil cunku UI disindan da
//   cagrilabilmeli (sayac hooklari, ileride bildirim callback'leri vs).
// - Tek global player instance — lazy init (ilk tasbihCal cagrisinda yuklenir).
// - Overlap-safe: hizli ardarda tik basimlarinda seekTo(0) + play() ile re-trigger.
//   expo-audio bitince auto-reset YAPMAZ (expo-av'dan kirici degisiklik), o yuzden
//   seekTo(0) manuel cagriliyor.
// - AsyncStorage cache'i bellekte; tasbihCal her cagrida storage okumaz.
// - Tum hatalar sessizce yutulur; ses calmazsa app cokmesin.
// - iOS ses modu 'mixWithOthers' — arkaplandaki muzigi durdurmaz, sessiz modunda susar.

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANAHTAR = '@hu/ayar/tasbihSesi';

// Bellek cache'i — undefined = henuz okunmadi, true/false = okunmus durum.
let acikCache = undefined;

// Tek global player instance.
let player = null;
let playerHataliMi = false;
let sesModuKuruldu = false;

async function sesModunuKur() {
  if (sesModuKuruldu) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,        // iOS sessiz modunda susmali (kullanici tercihi)
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers' // Arkaplandaki muzigi durdurma
    });
    sesModuKuruldu = true;
  } catch (e) {
    // Mod kurulamazsa default ile devam et — yine de play denenir.
    sesModuKuruldu = true;
  }
}

function playerKur() {
  if (player || playerHataliMi) return;
  try {
    player = createAudioPlayer(
      require('../../assets/sounds/tasbih.mp3'),
      { updateInterval: 1000, downloadFirst: true, keepAudioSessionActive: false }
    );
    // Tahta tik — ortam sesi seviyesinde, comlek gibi gurultulu olmasin.
    try { player.volume = 0.8; } catch (_) {}
  } catch (e) {
    playerHataliMi = true;
    player = null;
  }
}

function ayarOkunduMu() {
  return acikCache !== undefined;
}

function storageDegeriniYorumla(deger) {
  // null/undefined -> default acik (true)
  if (deger === null || deger === undefined) return true;
  // '0' -> kapali. Geri kalan her sey acik.
  return deger !== '0';
}

async function ayariYukleSenkronGoster() {
  try {
    const ham = await AsyncStorage.getItem(ANAHTAR);
    acikCache = storageDegeriniYorumla(ham);
  } catch (e) {
    acikCache = true; // okuma hatasinda default acik
  }
}

// Disa acik: ayari okur (cache'i de besler). Async.
export async function tasbihAyariOku() {
  if (ayarOkunduMu()) return acikCache;
  await ayariYukleSenkronGoster();
  return acikCache;
}

// Disa acik: ayari yazar + cache'i gunceller. Async.
export async function tasbihAyari(acik) {
  const yeni = !!acik;
  acikCache = yeni;
  try {
    await AsyncStorage.setItem(ANAHTAR, yeni ? '1' : '0');
  } catch (e) {
    // Yazma hatasinda cache zaten guncellendi; sessizce gec.
  }
}

// Disa acik: sayac tikinda cagrilir. Fire-and-forget — donus degeri yok.
// Ayar henuz okunmamissa ilk tikta storage okur, sonraki tiklarda cache'tan.
export function tasbihCal() {
  try {
    // Cache henuz dolmamissa arkaplanda yukle, bu tikta calma (ilk tik sessiz olur
    // ama sonraki tiklar dogru calisir). Cogu durumda ayari ekran acilirken
    // tasbihAyariOku ile onceden yuklenmis olacak.
    if (!ayarOkunduMu()) {
      ayariYukleSenkronGoster();
      return;
    }
    if (acikCache === false) return;

    // Lazy ses modu + player init
    if (!sesModuKuruldu) {
      sesModunuKur(); // fire-and-forget
    }
    if (!player && !playerHataliMi) {
      playerKur();
    }
    if (!player) return;

    // Overlap-safe re-trigger: ses ortasinda yeniden tetiklenebilir.
    try {
      player.seekTo(0);
    } catch (_) {}
    try {
      player.play();
    } catch (_) {}
  } catch (e) {
    // Tum yutucu — sayac UI'i hicbir sekilde etkilenmesin.
  }
}
