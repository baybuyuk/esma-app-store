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
// - Mushaf sabit-yukseklik (360px) inner-scroll. Aktif kelime degistikce
//   mushafScrollRef.scrollTo ile yaklasik konuma kaydirilir (kelime index /
//   toplam kelime lineer). Hassas degil ama kullanici karaoke takipte ekrandan
//   cikan kelimeyi kaybetmez.
// - useFocusEffect blur'da player.pause().

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
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
  // ÂYET N/M rozetine dokununca acilan meal popup'i icin secili ayet.
  const [secilenAyet, setSecilenAyet] = useState(null);
  useEffect(() => {
    if (!sesVar || !oynaniyor) return;
    if (!tumKelimeler.length) return;
    const yeni = aktifKelimeBul(tumKelimeler, suMs);
    if (yeni !== aktifIdx) setAktifIdx(yeni);
  }, [suMs, sesVar, oynaniyor, tumKelimeler, aktifIdx]);

  // Mushaf inner-scroll auto-tracking — aktif kelime degistikce mushaf
  // penceresini kelime'nin yaklasik konumuna kaydirir (lineer index oranlama).
  // Hassas degil ama karaoke sirasinda aktif kelime hep ekrandadir.
  const mushafScrollRef = useRef(null);
  const mushafContentH = useRef(0);
  const mushafViewH = useRef(0);
  useEffect(() => {
    if (aktifIdx < 0 || !mushafScrollRef.current) return;
    if (!tumKelimeler.length) return;
    const overflow = Math.max(0, mushafContentH.current - mushafViewH.current);
    if (overflow <= 0) return;
    const oran = aktifIdx / Math.max(1, tumKelimeler.length - 1);
    // Aktif kelime'yi pencerenin ~%30 ust noktasina yerlestir
    const hedef = Math.max(
      0,
      Math.min(overflow, mushafContentH.current * oran - mushafViewH.current * 0.3)
    );
    try {
      mushafScrollRef.current.scrollTo({ y: hedef, animated: true });
    } catch (_) {}
  }, [aktifIdx, tumKelimeler.length]);

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

  // iOS sessiz mod override + arka plan oynatma — tilavet ekraninda:
  //  1) Telefon sessiz switch ON olsa bile sure okunsun (yasli kullanici donanim
  //     switch'i unutabilir).
  //  2) Ekran kapansa veya app arka plana alinsa ses DEVAM etsin (Yasin gibi uzun
  //     sureler — kullanici cebine koyup dinleyebilsin). iOS icin app.json
  //     UIBackgroundModes:['audio'] gerekli.
  //  3) Aktif tilavet sirasinda ekran otomatik kilitlenmesin — karaoke takibi
  //     icin (expo-keep-awake).
  // Blur'da: ses.js global ayara (playsInSilentMode:false, mixWithOthers) geri don,
  // ekran kilit serbest birak.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: 'duckOthers',
          });
        } catch (_) {}
      })();
      return () => {
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

  // Aktif oynatma sirasinda ekran kilitlenmesin (karaoke takip edilebilsin).
  // Pause/duraklat/blur'da serbest birakilir.
  useEffect(() => {
    if (oynaniyor) {
      activateKeepAwakeAsync('manevi-sure').catch(() => {});
    } else {
      deactivateKeepAwake('manevi-sure');
    }
    return () => {
      deactivateKeepAwake('manevi-sure');
    };
  }, [oynaniyor]);

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

  // Ayet bazli atlama: tilavet tek mp3, her kelimede bas_ms var. Bir ayetin
  // baslangici = ilk kelimesinin bas_ms'i. Onceki/sonraki ayetin basina seek.
  const ayetBasiSn = (idx) => {
    const ay = ayetler[idx];
    const k = ay && Array.isArray(ay.kelimeler) ? ay.kelimeler[0] : null;
    return k && typeof k.bas_ms === 'number' ? k.bas_ms / 1000 : null;
  };
  const ayeteGit = (hedefIdx) => {
    if (!player || !sesVar) return;
    if (hedefIdx < 0 || hedefIdx >= ayetler.length) return;
    const sn = ayetBasiSn(hedefIdx);
    if (sn == null) return;
    try { player.seekTo(sn); } catch (_) {}
    // Durakta bile highlight + meal karti hemen guncellensin.
    const yeniIdx = aktifKelimeBul(tumKelimeler, Math.round(sn * 1000));
    if (yeniIdx >= 0) setAktifIdx(yeniIdx);
  };
  const oncekiAyet = () => ayeteGit((aktifAyetIdx >= 0 ? aktifAyetIdx : 0) - 1);
  const sonrakiAyet = () => ayeteGit((aktifAyetIdx >= 0 ? aktifAyetIdx : -1) + 1);

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
            <View style={styles.kontrolSatir}>
            <TouchableOpacity
              style={[styles.sarBtn, !sesVar && styles.sarBtnPasif]}
              onPress={oncekiAyet}
              disabled={!sesVar}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Önceki ayet"
            >
              <View style={styles.skipBar} />
              <Text style={styles.skipTri}>◀</Text>
            </TouchableOpacity>
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
            <TouchableOpacity
              style={[styles.sarBtn, !sesVar && styles.sarBtnPasif]}
              onPress={sonrakiAyet}
              disabled={!sesVar}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sonraki ayet"
            >
              <Text style={styles.skipTri}>▶</Text>
              <View style={styles.skipBar} />
            </TouchableOpacity>
            </View>
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

          {/* 3a. Besmele banner — manevi sureler ust sabit */}
          <View style={styles.besmeleBanner}>
            <Text style={styles.besmeleArapca}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
            <Text style={styles.besmeleTurkce}>Bismillâhirrahmânirrahîm</Text>
          </View>

          {/* 3b. Mushaf — sabit yukseklik, inner-scroll, aktif kelime auto-tracking */}
          <View
            style={styles.mushafKart}
            onLayout={({ nativeEvent }) => {
              mushafViewH.current = nativeEvent.layout.height;
            }}
          >
            <ScrollView
              ref={mushafScrollRef}
              onContentSizeChange={(_w, h) => {
                mushafContentH.current = h;
              }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <Text
                style={[
                  styles.mushafMetin,
                  { fontSize: arapcaFontSize, lineHeight: arapcaLineHeight },
                ]}
              >
                {ayetler.map((ayet, ai) => {
                  const kls = Array.isArray(ayet.kelimeler) ? ayet.kelimeler : [];
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
            </ScrollView>
          </View>

          {/* 4. Meal kartı — aktif ayetin meali */}
          {aktifAyet ? (
            <View style={styles.mealKart}>
              <TouchableOpacity
                onPress={() => setSecilenAyet(aktifAyet)}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={`Âyet ${aktifAyet.no} anlamını göster`}
              >
              <Text style={[styles.mealRozet, { fontSize: Math.max(9, tip.xs.fontSize - 1), lineHeight: tip.xs.lineHeight }]}>
                ÂYET {aktifAyet.no} / {ayetSayisi}
              </Text>
                <Text style={[styles.rozetIpucu, { fontSize: Math.max(8, tip.xs.fontSize - 2), lineHeight: tip.xs.lineHeight }]}>ⓘ anlamı için dokun</Text>
              </TouchableOpacity>
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

        <Modal
          visible={!!secilenAyet}
          transparent
          animationType="fade"
          onRequestClose={() => setSecilenAyet(null)}
        >
          <TouchableOpacity
            style={styles.modalArka}
            activeOpacity={1}
            onPress={() => setSecilenAyet(null)}
          >
            <View style={styles.modalKart}>
              <Text style={[styles.modalRozet, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                ÂYET {secilenAyet?.no} / {ayetSayisi}
              </Text>
              <Text style={[styles.modalMeal, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight * 1.4 }]}>
                {secilenAyet?.meal}
              </Text>
              {secilenAyet?.okunus ? (
                <Text style={[styles.modalOkunus, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.3 }]}>
                  {secilenAyet.okunus}
                </Text>
              ) : null}
              <TouchableOpacity
                style={styles.modalKapat}
                onPress={() => setSecilenAyet(null)}
                accessibilityRole="button"
                accessibilityLabel="Kapat"
              >
                <Text style={[styles.modalKapatYazi, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radii.md,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  kontrolSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  tilavetBilgi: { marginTop: 14 },
  barArka: {
    height: 4,
    backgroundColor: '#ECE6D6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barDolu: {
    height: '100%',
    backgroundColor: colors.altin,
    borderRadius: 2,
  },
  zamanSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  zamanYazi: { color: colors.ikincilMetin },
  kariYazi: {
    color: colors.altin,
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Besmele banner — manevi sureler ust sabit
  besmeleBanner: {
    backgroundColor: '#FFFDF6',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cizgi,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  besmeleArapca: {
    fontSize: 26,
    lineHeight: 44,
    color: colors.anaYesil,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  besmeleTurkce: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.altin,
    fontStyle: 'italic',
    marginTop: 4,
    letterSpacing: 0.3,
  },

  // Mushaf blok — sabit yukseklik, inner-scroll (klasik Diyanet mushaf hissi).
  // Height: 360px = ~7-8 satir Arapca, yasli kullaniciya rahat ayetler.
  mushafKart: {
    height: 360,
    backgroundColor: '#FFFDF6', // hafif kremsi sayfa rengi
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radii.md,
    paddingVertical: 16,
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
    letterSpacing: 0.6,
    marginBottom: 2,
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
  sarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: 16,
  },
  sarBtnPasif: { opacity: 0.35 },
  skipBar: {
    width: 3,
    height: 15,
    borderRadius: 1.5,
    backgroundColor: colors.altin,
  },
  skipTri: {
    color: colors.altin,
    fontSize: 17,
    marginHorizontal: 2,
  },
  rozetIpucu: {
    color: colors.altin,
    fontWeight: '600',
    marginBottom: 6,
    opacity: 0.8,
  },
  modalArka: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  modalKart: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    padding: 22,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: colors.ortaYesil,
  },
  modalRozet: {
    color: colors.altin,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  modalMeal: { color: colors.anaMetin },
  modalOkunus: {
    color: colors.ortaYesil,
    fontStyle: 'italic',
    marginTop: 10,
  },
  modalKapat: {
    marginTop: 18,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radii.sm,
    backgroundColor: colors.anaYesil,
  },
  modalKapatYazi: {
    color: '#fff',
    fontWeight: '600',
  },
});
