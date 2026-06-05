// Hu — tasbih + ortam ses katmani
// Sayac (zikir/salavat) tiklarinda kisa bir tahta tik sesi calar.
// Ayrica zikir/salavat ekranlarinda arkaplanda dogadan loop ses calabilir.
//
// AsyncStorage anahtari : @hu/ayar/tasbihSesi
// Deger formati         : string. '0' = kapali. Diger her sey (undefined dahil) = acik.
// Default               : acik (true)
// Ses dosyasi           : assets/sounds/tasbih.mp3 (CC0, ~180ms)
//
// Dis API (tasbih):
//   tasbihCal()             -> void, fire-and-forget. Ayar kapali ise sessizce doner.
//   tasbihAyari(acik:bool)  -> Promise<void>. Storage'a yazar + cache'i gunceller.
//   tasbihAyariOku()        -> Promise<boolean>. Storage'tan okur, cache'i besler.
//
// Dis API (ortam — loop nature sesi):
//   ortamCal(id, seviye)         -> void. id: 'yagmur'|'deniz'|'orman'|null,
//                                   seviye: 'kisik'|'orta'|'yuksek'. null id durdurur.
//   ortamDur()                   -> void. Aktif loop'u durdurur.
//   ortamAyariOku()              -> Promise<{id, seviye}>. Default {id: null, seviye: 'orta'}.
//   ortamAyariKaydet({id, seviye}) -> Promise<void>. Storage'a yazar.
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

// ============================================================
// ORTAM SES (loop nature)
// ============================================================
// Zikir/salavat ekraninda arka planda dogal ortam sesi (yagmur/deniz/orman kusu)
// loop'ta calar. Yasli kullanici dusunulerek max volume %60'ta kapali — kulagi yormasin.
//
// AsyncStorage:
//   @hu/ortam/sec     : 'yagmur'|'deniz'|'orman' veya yazilmamis (null)
//   @hu/ortam/seviye  : 'kisik'|'orta'|'yuksek', default 'orta'
//
// Static require map — Metro dinamik require almiyor, hepsi build zamaninda
// resolve edilmeli. Dosyalar henuz yoksa Metro warning verir ama crash etmez
// (try/catch sariyoruz).

const ORTAM_KEY_SEC = '@hu/ortam/sec';
const ORTAM_KEY_SEVIYE = '@hu/ortam/seviye';

const ORTAM_DOSYALARI = {
  yagmur: require('../../assets/sounds/ortam/yagmur.mp3'),
  deniz:  require('../../assets/sounds/ortam/deniz.mp3'),
  orman:  require('../../assets/sounds/ortam/orman.mp3'),
};

const SEVIYE_NUMERIK = {
  kisik:  0.15,
  orta:   0.35,
  yuksek: 0.6,
};

const ORTAM_VARSAYILAN = { id: null, seviye: 'orta' };

// Tek global ortam player'i. Aktif id'yi de takip et — degisirse release.
let ortamPlayer = null;
let ortamAktifId = null;
let ortamHataliIdler = {}; // id -> true. Bir kez basarisiz olursa tekrar deneme.

function seviyeyiYorumla(s) {
  return SEVIYE_NUMERIK.hasOwnProperty(s) ? s : 'orta';
}

function idYorumla(i) {
  if (i === 'yagmur' || i === 'deniz' || i === 'orman') return i;
  return null;
}

function ortamPlayerKur(id) {
  if (ortamHataliIdler[id]) return null;
  const kaynak = ORTAM_DOSYALARI[id];
  if (!kaynak) {
    ortamHataliIdler[id] = true;
    return null;
  }
  try {
    const p = createAudioPlayer(
      kaynak,
      { updateInterval: 1000, downloadFirst: true, keepAudioSessionActive: false }
    );
    // expo-audio 1.1.1: loop property olarak set ediliyor.
    try { p.loop = true; } catch (_) {}
    return p;
  } catch (e) {
    ortamHataliIdler[id] = true;
    return null;
  }
}

function ortamPlayerSerbestBirak() {
  if (!ortamPlayer) return;
  try { ortamPlayer.pause(); } catch (_) {}
  try { ortamPlayer.remove(); } catch (_) {}
  ortamPlayer = null;
  ortamAktifId = null;
}

// Disa acik: ortam sesi baslat / degistir. id null ise durdurur.
// seviye opsiyonel; verilmezse 'orta' kullanilir.
export function ortamCal(id, seviye) {
  try {
    const yeniId = idYorumla(id);
    if (yeniId === null) {
      ortamDur();
      return;
    }

    const yeniSeviye = seviyeyiYorumla(seviye);
    const numerikSeviye = SEVIYE_NUMERIK[yeniSeviye];

    // Tasbih ile ayni iOS ses modunu paylas (mixWithOthers) — tekrar set etme.
    if (!sesModuKuruldu) {
      sesModunuKur(); // fire-and-forget
    }

    // Id degisti mi? Degistiyse eski player'i temizle, yenisini kur.
    if (ortamAktifId !== yeniId) {
      ortamPlayerSerbestBirak();
      const p = ortamPlayerKur(yeniId);
      if (!p) return; // dosya yok / init basarisiz — sessiz fail
      ortamPlayer = p;
      ortamAktifId = yeniId;
    }

    if (!ortamPlayer) return;

    // Volume her cagrida guncellenebilir (release/recreate gerekmez).
    try { ortamPlayer.volume = numerikSeviye; } catch (_) {}
    try { ortamPlayer.play(); } catch (_) {}
  } catch (e) {
    // Sessiz fail — ortam sesi olmazsa app etkilenmesin.
  }
}

// Disa acik: aktif ortam sesini durdurur ve basa sarar.
export function ortamDur() {
  try {
    if (!ortamPlayer) return;
    try { ortamPlayer.pause(); } catch (_) {}
    try { ortamPlayer.seekTo(0); } catch (_) {}
  } catch (e) {
    // Yutucu
  }
}

// Disa acik: ortam ayarlarini okur. Yazilmamissa default doner — exception atmaz.
export async function ortamAyariOku() {
  try {
    const [hamId, hamSeviye] = await Promise.all([
      AsyncStorage.getItem(ORTAM_KEY_SEC),
      AsyncStorage.getItem(ORTAM_KEY_SEVIYE),
    ]);
    return {
      id: idYorumla(hamId),
      seviye: hamSeviye ? seviyeyiYorumla(hamSeviye) : ORTAM_VARSAYILAN.seviye,
    };
  } catch (e) {
    return { ...ORTAM_VARSAYILAN };
  }
}

// Disa acik: ortam ayarlarini AsyncStorage'a yazar.
// id null ise key silinir (default'a doner).
export async function ortamAyariKaydet({ id, seviye } = {}) {
  const yeniId = idYorumla(id);
  const yeniSeviye = seviyeyiYorumla(seviye);
  try {
    if (yeniId === null) {
      await AsyncStorage.removeItem(ORTAM_KEY_SEC);
    } else {
      await AsyncStorage.setItem(ORTAM_KEY_SEC, yeniId);
    }
    await AsyncStorage.setItem(ORTAM_KEY_SEVIYE, yeniSeviye);
  } catch (e) {
    // Yazma hatasinda sessizce gec — bir sonraki cagride tekrar denenir.
  }
}
