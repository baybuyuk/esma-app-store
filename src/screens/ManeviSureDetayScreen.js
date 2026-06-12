// ManeviSureDetay — sure-bazli tek mp3 tilavet + kelime-bazli karaoke senkronu.
// Mushaf gorseli: ayetler tek akiskan blok halinde Arapca yaziliyor, aralarda
// ﴿1﴾ ﴿2﴾ ayet numaralari daire icinde. O anda okunan kelime sari highlight.
//
// Veri kontrati (backend doluyor):
//   sure.tilavet_dosya       — 3 haneli string ('036', '055', '094' ...)
//   sure.ayetler[].kelimeler — [{ arapca, bas_ms, bit_ms }] zaman damgali kelimeler
//
// Notlar:
// - useAudioPlayer tek kaynak — tum sure tek mp3. Source degisimi YOK.
// - Aktif kelime = currentTime'dan binary search ile turetilir, ayri state degil.
// - Auto-scroll YOK — mushaf gorseli butun ekran, kullanici manuel kaydiriyor (klasik mushaf his).
// - useFocusEffect blur'da player.pause().

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { useTipScale } from '../context/YaziKademesiContext';
import { maneviSureler } from '../lib/data';
import GradientArkaPlan from '../components/GradientArkaPlan';

// Static require — Metro dinamik path almaz.
// 7 sure: Yasin(36), Rahman(55), Vakia(56), Mulk(67), Muzemmil(73), Nebe(78), Insirah(94)
const MANEVI_TILAVET_DOSYALARI = {
  '036': require('../../assets/sounds/manevi/036.mp3'),
  '055': require('../../assets/sounds/manevi/055.mp3'),
  '056': require('../../assets/sounds/manevi/056.mp3'),
  '067': require('../../assets/sounds/manevi/067.mp3'),
  '073': require('../../assets/sounds/manevi/073.mp3'),
  '078': require('../../assets/sounds/manevi/078.mp3'),
  '094': require('../../assets/sounds/manevi/094.mp3'),
};

// Mushaf sayfasindaki yumusak sari highlight tonu.
// colors.altin (#B08D2E) cok koyu — okunan kelime icin yumusak amber tonu uygun.
const HIGHLIGHT_SARI = '#FFE066';

function dakSn(sn) {
  if (sn == null || Number.isNaN(sn)) return '0:00';
  const m = Math.floor(sn / 60);
  const s = Math.floor(sn % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Binary search: bas_ms <= ms < bit_ms olan kelime indexini bul.
// Bulunamazsa -1. tumKelimeler bas_ms artan sirali olmali (sure ardisik calar).
function aktifKelimeBul(tumKelimeler, ms) {
  if (!tumKelimeler.length) return -1;
  let lo = 0;
  let hi = tumKelimeler.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const k = tumKelimeler[mid];
    if (ms < k.bas) hi = mid - 1;
    else if (ms >= k.bit) lo = mid + 1;
    else return mid;
  }
  return -1;
}

export default function ManeviSureDetayScreen({ navigation, route }) {
  const tip = useTipScale();
  const sureNo = route?.params?.sureNo;

  const sure = useMemo(
    () => (maneviSureler || []).find((s) => s.no === sureNo),
    [sureNo]
  );

  const ayetler = sure?.ayetler || [];
  const ayetSayisi = ayetler.length;

  // Tum kelimeleri flat array'e dok — binary search icin.
  // Her elemente { ai, ki, bas, bit } — ayet idx, kelime idx, zaman damgalari.
  const tumKelimeler = useMemo(() => {
    const out = [];
    ayetler.forEach((a, ai) => {
      const kls = Array.isArray(a.kelimeler) ? a.kelimeler : [];
      kls.forEach((k, ki) => {
        if (typeof k.bas_ms === 'number' && typeof k.bit_ms === 'number') {
          out.push({ ai, ki, bas: k.bas_ms, bit: k.bit_ms });
        }
      });
    });
    // Garanti — bas_ms artan sirali
    out.sort((a, b) => a.bas - b.bas);
    return out;
  }, [ayetler]);

  // Ses kaynagi — sure seviyesinde tek dosya.
  const sesKaynak = sure?.tilavet_dosya
    ? (MANEVI_TILAVET_DOSYALARI[sure.tilavet_dosya] || null)
    : null;
  const sesVar = !!sesKaynak;

  const player = useAudioPlayer(sesKaynak);
  const status = useAudioPlayerStatus(player);

  const oynaniyor = !!status?.playing;
  const sureSn = status?.duration ?? 0;
  const suSn = status?.currentTime ?? 0;
  const suMs = Math.floor(suSn * 1000);
  const ilerleme = sureSn > 0 ? Math.min(1, suSn / sureSn) : 0;
  const bitti = !!status?.didJustFinish || (sureSn > 0 && suSn >= sureSn - 0.1);

  // Aktif kelime — currentTime'dan turet. State sadece son bulunan idx (re-render azaltir).
  const [aktifIdx, setAktifIdx] = useState(-1);
  useEffect(() => {
    if (!sesVar || !oynaniyor) return;
    if (!tumKelimeler.length) return;
    const yeni = aktifKelimeBul(tumKelimeler, suMs);
    if (yeni !== aktifIdx) setAktifIdx(yeni);
  }, [suMs, sesVar, oynaniyor, tumKelimeler, aktifIdx]);

  // Pause/stop edildiginde highlight kaybolsun — kullanici neyi okudugunu unutmasin
  // diye SON aktif kelimeyi tutuyoruz (sifirlamiyoruz).

  const aktifKelime = aktifIdx >= 0 ? tumKelimeler[aktifIdx] : null;
  const aktifAyetIdx = aktifKelime ? aktifKelime.ai : -1;
  const aktifAyet = aktifAyetIdx >= 0 ? ayetler[aktifAyetIdx] : null;

  // Ekran blur'da pause + highlight reset
  useFocusEffect(
    useCallback(() => {
      return () => {
        try { player?.pause(); } catch (_) {}
      };
    }, [player])
  );

  // iOS sessiz mod override — tilavet ekraninda telefon sessiz switch ON olsa bile
  // sure okunsun (yasli kullanici donanim switch'i unutabilir). Tasbih/ortam ses.js
  // global ayari mixWithOthers + playsInSilentMode:false. Burada sadece bu ekran
  // suresince override edip, blur olunca eski hale geri donuyoruz. ses.js global
  // sesModuKuruldu state'i etkilenmiyor.
  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      (async () => {
        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: false,
            interruptionMode: 'duckOthers',
          });
        } catch (_) {}
      })();
      return () => {
        iptal = true;
        (async () => {
          try {
            await setAudioModeAsync({
              playsInSilentMode: false,
              shouldPlayInBackground: false,
              interruptionMode: 'mixWithOthers',
            });
          } catch (_) {}
        })();
      };
    }, [])
  );

  const oynatDurdur = useCallback(() => {
    if (!player || !sesVar) return;
    try {
      if (oynaniyor) {
        player.pause();
      } else {
        if (bitti) {
          try { player.seekTo(0); } catch (_) {}
          setAktifIdx(-1);
        }
        player.play();
      }
    } catch (_) {}
  }, [player, sesVar, oynaniyor, bitti]);

  // Empty / hata durumu
  if (!sure) {
    return (
      <GradientArkaPlan>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
              <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
            </TouchableOpacity>
            <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Sûre</Text>
            <View style={{ width: 60 }} />
          </View>
          <Text style={styles.bos}>Sûre bulunamadı.</Text>
        </SafeAreaView>
      </GradientArkaPlan>
    );
  }

  // Arapca font size — yasli kullanici icin tip.arapca uzerine +boost
  const arapcaFontSize = (tip.arapca?.fontSize || 28) + 6;
  const arapcaLineHeight = Math.round(arapcaFontSize * 1.95);

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>
            {sure.ad} Sûresi
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
          {/* 1. Bas kart — sure adi + bilgi */}
          <View style={styles.basKart}>
            <Text style={styles.basArapcaAd}>{sure.arapca_ad}</Text>
            <Text style={[styles.basTurkceAd, { fontSize: tip.xl.fontSize, lineHeight: tip.xl.lineHeight }]}>
              {sure.ad} Sûresi
            </Text>
            <Text style={[styles.basAlt, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
              {sure.ayet_sayisi} âyet · {sure.inis_yeri}
            </Text>
          </View>

          {/* 2. Tilavet kontrol kartı */}
          <View style={styles.tilavetKart}>
            <TouchableOpacity
              style={[
                styles.oynatBtn,
                oynaniyor && styles.oynatBtnAktif,
                !sesVar && styles.oynatBtnPasif,
              ]}
              onPress={oynatDurdur}
              activeOpacity={0.85}
              disabled={!sesVar}
              accessibilityLabel={oynaniyor ? 'Tilâveti duraklat' : 'Tilâveti başlat'}
              accessibilityRole="button"
              accessibilityState={{ selected: oynaniyor, disabled: !sesVar }}
            >
              <Text style={styles.oynatIcon}>{oynaniyor ? '❚❚' : '▶'}</Text>
            </TouchableOpacity>
            <View style={styles.tilavetBilgi}>
              {sesVar ? (
                <>
                  <View style={styles.barArka}>
                    <View style={[styles.barDolu, { width: `${ilerleme * 100}%` }]} />
                  </View>
                  <View style={styles.zamanSatir}>
                    <Text style={[styles.zamanYazi, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                      {dakSn(suSn)}
                    </Text>
                    <Text style={[styles.zamanYazi, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                      {dakSn(sureSn)}
                    </Text>
                  </View>
                  <Text style={[styles.kariYazi, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                    Tilâvet: {sure.tilavet_kari}
                  </Text>
                </>
              ) : (
                <Text style={[styles.kariYazi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                  Ses kaydı hazırlanıyor. Şimdilik metni okuyabilirsiniz.
                </Text>
              )}
            </View>
          </View>

          {/* 3. Mushaf blok — tek akiskan Arapca metin */}
          <View style={styles.mushafKart}>
            <Text
              style={[
                styles.mushafMetin,
                { fontSize: arapcaFontSize, lineHeight: arapcaLineHeight },
              ]}
            >
              {ayetler.map((ayet, ai) => {
                const kls = Array.isArray(ayet.kelimeler) ? ayet.kelimeler : [];
                // Kelimeler zaman damgali geldiyse — kelime kelime render et.
                // Damga yoksa (henuz timing yok) — ayet butun metni tek parca yaz.
                if (kls.length === 0) {
                  return (
                    <Text key={`a-${ai}`}>
                      <Text>{ayet.arapca} </Text>
                      <Text style={styles.ayetNoIc}> ﴿{ayet.no}﴾ </Text>
                    </Text>
                  );
                }
                return (
                  <Text key={`a-${ai}`}>
                    {kls.map((k, ki) => {
                      const aktif =
                        aktifKelime &&
                        aktifKelime.ai === ai &&
                        aktifKelime.ki === ki;
                      return (
                        <Text
                          key={`k-${ai}-${ki}`}
                          style={aktif ? styles.kelimeAktif : null}
                        >
                          {k.arapca}{' '}
                        </Text>
                      );
                    })}
                    <Text style={styles.ayetNoIc}> ﴿{ayet.no}﴾ </Text>
                  </Text>
                );
              })}
            </Text>
          </View>

          {/* 4. Meal kartı — aktif ayetin meali */}
          {aktifAyet ? (
            <View style={styles.mealKart}>
              <Text style={[styles.mealRozet, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                ÂYET {aktifAyet.no} / {ayetSayisi}
              </Text>
              <Text
                style={[
                  styles.mealMetin,
                  { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight * 1.4 },
                ]}
              >
                {aktifAyet.meal}
              </Text>
              {aktifAyet.okunus ? (
                <Text
                  style={[
                    styles.okunusMetin,
                    { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.3 },
                  ]}
                >
                  {aktifAyet.okunus}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.mealKart}>
              <Text style={[styles.mealRozet, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                MEÂL
              </Text>
              <Text
                style={[
                  styles.mealMetin,
                  { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.4, fontStyle: 'italic', color: colors.ikincilMetin },
                ]}
              >
                Tilâveti başlattığınızda okunan âyetin meâli burada görünecektir.
              </Text>
            </View>
          )}

          {/* 5. Fazilet kartı */}
          {sure.fazilet ? (
            <View style={styles.faziletKart}>
              <Text style={[styles.faziletBaslik, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                HAKKINDA
              </Text>
              <Text style={[styles.faziletMetin, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.35 }]}>
                {sure.fazilet}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  geri: { color: colors.altin, width: 60 },
  baslik: { color: colors.anaYesil, fontWeight: '600', flex: 1, textAlign: 'center' },
  bos: {
    textAlign: 'center',
    color: colors.ikincilMetin,
    marginTop: 60,
    paddingHorizontal: 20,
  },

  basKart: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: radii.md,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  basArapcaAd: {
    fontSize: 38,
    lineHeight: 54,
    color: colors.anaYesil,
    fontWeight: '600',
  },
  basTurkceAd: {
    color: colors.anaMetin,
    fontWeight: '700',
    marginTop: 6,
  },
  basAlt: {
    color: colors.altin,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  tilavetKart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radii.md,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  oynatBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.anaYesil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oynatBtnAktif: { backgroundColor: colors.ortaYesil },
  oynatBtnPasif: { backgroundColor: colors.cizgi, opacity: 0.6 },
  oynatIcon: { color: '#fff', fontSize: 22, fontWeight: '700' },
  tilavetBilgi: { flex: 1, marginLeft: 14 },
  barArka: {
    height: 6,
    backgroundColor: '#EFE9D8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barDolu: {
    height: '100%',
    backgroundColor: colors.altin,
  },
  zamanSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  zamanYazi: { color: colors.ikincilMetin },
  kariYazi: {
    color: colors.altin,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Mushaf blok — tek akiskan Arapca metin (klasik Diyanet mushaf hissi)
  mushafKart: {
    backgroundColor: '#FFFDF6', // hafif kremsi sayfa rengi
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radii.md,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.cizgi,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  mushafMetin: {
    color: colors.anaMetin,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  kelimeAktif: {
    backgroundColor: HIGHLIGHT_SARI,
    color: colors.anaMetin,
  },
  ayetNoIc: {
    color: colors.altin,
    fontWeight: '700',
  },

  // Meal kart — aktif ayet meali
  mealKart: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radii.md,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.ortaYesil,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  mealRozet: {
    color: colors.altin,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  mealMetin: {
    color: colors.anaMetin,
  },
  okunusMetin: {
    color: colors.ortaYesil,
    fontStyle: 'italic',
    marginTop: 8,
  },

  faziletKart: {
    backgroundColor: '#FDFAF1',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  faziletBaslik: {
    color: colors.altin,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  faziletMetin: { color: colors.anaMetin },
});
