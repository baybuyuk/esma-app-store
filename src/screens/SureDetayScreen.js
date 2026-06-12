// Tek sure detay ekrani.
// Ust kart: surenin Arapca + Turkce adi, ayet sayisi, inis yeri
// Tilavet kontrolu: oynat/durdur + ilerleme barri + kari adi
// Her ayet icin 3 katman: Arapca, okunus, meal
// En altta fazilet / hakkinda metni
//
// Ses calmasi: expo-audio'nun hook API'si (useAudioPlayer + useAudioPlayerStatus)
// Ekran kapanirken player otomatik temizlenir.

import { useMemo, useCallback, useEffect } from 'react';
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
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { useTipScale } from '../context/YaziKademesiContext';
import { sureler } from '../lib/data';
import GradientArkaPlan from '../components/GradientArkaPlan';

// Metro bundler require'lari dinamik kabul etmez — sure_no -> require eslemesi.
const TILAVET_DOSYALARI = {
  fatiha:  require('../../assets/sounds/sureler/fatiha.mp3'),
  duha:    require('../../assets/sounds/sureler/duha.mp3'),
  insirah: require('../../assets/sounds/sureler/insirah.mp3'),
  kadir:   require('../../assets/sounds/sureler/kadir.mp3'),
  asr:     require('../../assets/sounds/sureler/asr.mp3'),
  fil:     require('../../assets/sounds/sureler/fil.mp3'),
  kureys:  require('../../assets/sounds/sureler/kureys.mp3'),
  maun:    require('../../assets/sounds/sureler/maun.mp3'),
  kevser:  require('../../assets/sounds/sureler/kevser.mp3'),
  kafirun: require('../../assets/sounds/sureler/kafirun.mp3'),
  nasr:    require('../../assets/sounds/sureler/nasr.mp3'),
  tebbet:  require('../../assets/sounds/sureler/tebbet.mp3'),
  ihlas:   require('../../assets/sounds/sureler/ihlas.mp3'),
  felak:   require('../../assets/sounds/sureler/felak.mp3'),
  nas:     require('../../assets/sounds/sureler/nas.mp3'),
};

function dakSn(sn) {
  if (sn == null || isNaN(sn)) return '0:00';
  const m = Math.floor(sn / 60);
  const s = Math.floor(sn % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SureDetayScreen({ navigation, route }) {
  const tip = useTipScale();
  const sureNo = route?.params?.sureNo;
  const sure = useMemo(
    () => (sureler || []).find((s) => s.no === sureNo),
    [sureNo]
  );

  const ses = sure?.tilavet_dosya ? TILAVET_DOSYALARI[sure.tilavet_dosya] : null;
  const player = useAudioPlayer(ses);
  const status = useAudioPlayerStatus(player);

  const oynaniyor = !!status?.playing;
  const sureSn = status?.duration ?? 0;
  const suSn = status?.currentTime ?? 0;
  const ilerleme = sureSn > 0 ? Math.min(1, suSn / sureSn) : 0;
  const bitti = !!status?.didJustFinish || (sureSn > 0 && suSn >= sureSn - 0.1);

  const oynatDurdur = useCallback(() => {
    if (!player) return;
    try {
      if (oynaniyor) {
        player.pause();
      } else {
        if (bitti) {
          try { player.seekTo(0); } catch (_) {}
        }
        player.play();
      }
    } catch (_) {}
  }, [player, oynaniyor, bitti]);

  // iOS sessiz mod override + arka plan oynatma — kisa sure ekraninda:
  //  1) Sessiz switch ON olsa bile sure okunsun.
  //  2) Ekran kapansa/app arka plana alinsa ses DEVAM etsin (iOS UIBackgroundModes
  //     ['audio'] app.json'da tanimli).
  //  3) Aktif oynatma sirasinda ekran otomatik kilitlenmesin (karaoke takibi).
  // Blur'da ses.js global ayarina geri don.
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

  useEffect(() => {
    if (oynaniyor) {
      activateKeepAwakeAsync('sure-detay').catch(() => {});
    } else {
      deactivateKeepAwake('sure-detay');
    }
    return () => {
      deactivateKeepAwake('sure-detay');
    };
  }, [oynaniyor]);

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

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View style={styles.basKart}>
            <Text style={styles.basArapcaAd}>{sure.arapca_ad}</Text>
            <Text style={[styles.basTurkceAd, { fontSize: tip.xl.fontSize, lineHeight: tip.xl.lineHeight }]}>
              {sure.ad} Sûresi
            </Text>
            <Text style={[styles.basAlt, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
              {sure.ayet_sayisi} âyet · {sure.inis_yeri}
            </Text>
          </View>

          {ses ? (
            <View style={styles.tilavetKart}>
              <TouchableOpacity
                style={[styles.oynatBtn, oynaniyor && styles.oynatBtnAktif]}
                onPress={oynatDurdur}
                activeOpacity={0.85}
                accessibilityLabel={oynaniyor ? 'Tilâveti duraklat' : 'Tilâveti başlat'}
                accessibilityRole="button"
                accessibilityState={{ selected: oynaniyor }}
              >
                <Text style={styles.oynatIcon}>{oynaniyor ? '❚❚' : '▶'}</Text>
              </TouchableOpacity>
              <View style={styles.tilavetBilgi}>
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
              </View>
            </View>
          ) : null}

          {(sure.ayetler || []).map((ayet) => (
            <View key={ayet.no} style={styles.ayetKart}>
              <Text style={styles.ayetNo}>{ayet.no}</Text>
              <Text style={[styles.arapca, { fontSize: tip.arapca?.fontSize || 28, lineHeight: (tip.arapca?.lineHeight || 44) + 4 }]}>
                {ayet.arapca}
              </Text>
              {ayet.okunus ? (
                <Text style={[styles.okunus, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.25 }]}>
                  {ayet.okunus}
                </Text>
              ) : null}
              <Text style={[styles.meal, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.4 }]}>
                {ayet.meal}
              </Text>
            </View>
          ))}

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
  oynatBtnAktif: {
    backgroundColor: colors.ortaYesil,
  },
  oynatIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
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
  zamanYazi: {
    color: colors.ikincilMetin,
  },
  kariYazi: {
    color: colors.altin,
    marginTop: 4,
    fontStyle: 'italic',
  },

  ayetKart: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: radii.md,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  ayetNo: {
    alignSelf: 'flex-start',
    color: '#fff',
    backgroundColor: colors.altin,
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  arapca: {
    color: colors.anaMetin,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  okunus: {
    color: colors.ortaYesil,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  meal: {
    color: colors.anaMetin,
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
  faziletMetin: {
    color: colors.anaMetin,
  },
});
