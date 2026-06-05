import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Alert,
  Platform,
  ToastAndroid,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import {
  tasbihCal,
  tasbihAyari,
  tasbihAyariOku,
  ortamCal,
  ortamDur,
  ortamAyariOku,
  ortamAyariKaydet,
} from '../lib/ses';
import GradientArkaPlan from '../components/GradientArkaPlan';
import IsinPatlamasi from '../components/IsinPatlamasi';
import OrtamSesiSecici from '../components/OrtamSesiSecici';

const MIN_ARALIK_MS = 200;

const ADIMLAR = [
  {
    id: 'subhanallah',
    arapca: 'سُبْحَانَ اللَّهِ',
    okunus: 'Subhânallâh',
    anlam: 'Allah noksan sıfatlardan münezzehtir',
    hedef: 33,
    tip: 'sayac',
  },
  {
    id: 'elhamdulillah',
    arapca: 'الْحَمْدُ لِلَّهِ',
    okunus: 'Elhamdülillâh',
    anlam: "Hamd Allah'a mahsustur",
    hedef: 33,
    tip: 'sayac',
  },
  {
    id: 'allahuekber',
    arapca: 'اللَّهُ أَكْبَرُ',
    okunus: 'Allâhu ekber',
    anlam: 'Allah en büyüktür',
    hedef: 33,
    tip: 'sayac',
  },
  {
    id: 'tehlil',
    arapca:
      'لَا إِلٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    okunus:
      "Lâ ilâhe illallâhu vahdehû lâ şerîke leh, lehü'l-mülkü ve lehü'l-hamdü ve hüve alâ külli şey'in kadîr",
    anlam:
      "Allah'tan başka ilah yoktur, O tektir, ortağı yoktur. Mülk O'nun, hamd O'na mahsustur. O her şeye kadirdir.",
    hedef: 1,
    tip: 'sayac',
  },
  {
    id: 'ayetelkursi',
    arapca:
      'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    okunus: "Allâhu lâ ilâhe illâ hüve'l-hayyu'l-kayyûm... (Bakara 255)",
    anlam:
      'Âyetel Kürsî — Bakara sûresinin 255. âyeti. Tam meal için sûre detayına gidin.',
    hedef: 1,
    tip: 'okuma',
  },
];

export default function TesbihatScreen({ navigation }) {
  const tip = useTipScale();
  const { width: ekranEn } = useWindowDimensions();
  const daireBoyut = Math.min(ekranEn * 0.5, 220);

  const [aktifAdimIdx, setAktifAdimIdx] = useState(0);
  const [sayim, setSayim] = useState(0);
  const [kutlama, setKutlama] = useState(false);
  const [sesAcik, setSesAcik] = useState(true);
  const [ortamAyar, setOrtamAyar] = useState({ id: null, seviye: 'orta' });
  const [ortamSecVisible, setOrtamSecVisible] = useState(false);

  const sonTikRef = useRef(0);
  const mountedRef = useRef(true);
  const gecisTimerRef = useRef(null);
  const kutlamaTimerRef = useRef(null);
  const bitisTimerRef = useRef(null);
  const aktifIdxRef = useRef(0);

  // Animasyonlar — sadece transform/opacity
  const butonScale = useRef(new Animated.Value(1)).current;
  const sayiFlash = useRef(new Animated.Value(1)).current;
  const icerikOpacity = useRef(new Animated.Value(1)).current;

  const aktifAdim = ADIMLAR[aktifAdimIdx];

  useEffect(() => {
    aktifIdxRef.current = aktifAdimIdx;
  }, [aktifAdimIdx]);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const a = await tasbihAyariOku();
        if (mountedRef.current) setSesAcik(!!a);
      } catch (e) {}
      try {
        const o = await ortamAyariOku();
        if (mountedRef.current && o) setOrtamAyar(o);
      } catch (e) {}
    })();
    return () => {
      mountedRef.current = false;
      if (gecisTimerRef.current) {
        clearTimeout(gecisTimerRef.current);
        gecisTimerRef.current = null;
      }
      if (kutlamaTimerRef.current) {
        clearTimeout(kutlamaTimerRef.current);
        kutlamaTimerRef.current = null;
      }
      if (bitisTimerRef.current) {
        clearTimeout(bitisTimerRef.current);
        bitisTimerRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      (async () => {
        try {
          const a = await tasbihAyariOku();
          if (!iptal) setSesAcik(!!a);
        } catch (e) {}
        try {
          const o = await ortamAyariOku();
          if (iptal) return;
          if (o) {
            setOrtamAyar(o);
            if (o.id) {
              try {
                ortamCal(o.id, o.seviye);
              } catch (e) {}
            }
          }
        } catch (e) {}
      })();
      return () => {
        iptal = true;
        try {
          ortamDur();
        } catch (e) {}
      };
    }, [])
  );

  const sonrakiAdimaGec = useCallback(() => {
    const simdikiIdx = aktifIdxRef.current;
    const sonAdimMi = simdikiIdx >= ADIMLAR.length - 1;

    if (sonAdimMi) {
      // Tesbihat tamamlandi
      setKutlama(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      if (Platform.OS === 'android') {
        ToastAndroid.show('Tesbihat tamamlandı — Allah kabul etsin', ToastAndroid.LONG);
      }
      bitisTimerRef.current = setTimeout(() => {
        bitisTimerRef.current = null;
        if (!mountedRef.current) return;
        navigation.goBack();
      }, 2000);
      return;
    }

    // Fade-out, adim degistir, fade-in
    Animated.timing(icerikOpacity, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || !mountedRef.current) return;
      setAktifAdimIdx((i) => Math.min(i + 1, ADIMLAR.length - 1));
      setSayim(0);
      Animated.timing(icerikOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [icerikOpacity, navigation]);

  const arttir = useCallback(() => {
    if (kutlama) return;
    const simdi = Date.now();
    if (simdi - sonTikRef.current < MIN_ARALIK_MS) return;
    sonTikRef.current = simdi;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    tasbihCal();

    Animated.sequence([
      Animated.timing(butonScale, {
        toValue: 0.94,
        duration: 70,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(butonScale, {
        toValue: 1,
        duration: 110,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    Animated.sequence([
      Animated.timing(sayiFlash, {
        toValue: 0.4,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(sayiFlash, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const adimAnlik = ADIMLAR[aktifIdxRef.current];
    const yeni = sayim + 1;
    setSayim(yeni);

    if (yeni >= adimAnlik.hedef) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      gecisTimerRef.current = setTimeout(() => {
        gecisTimerRef.current = null;
        if (!mountedRef.current) return;
        sonrakiAdimaGec();
      }, 350);
    }
  }, [kutlama, sayim, butonScale, sayiFlash, sonrakiAdimaGec]);

  const okumayiTamamla = useCallback(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    sonrakiAdimaGec();
  }, [sonrakiAdimaGec]);

  const handleOrtamKaydet = useCallback(async ({ id, seviye }) => {
    setOrtamAyar({ id, seviye });
    try {
      await ortamAyariKaydet({ id, seviye });
    } catch (e) {}
    try {
      if (id) {
        ortamCal(id, seviye);
      } else {
        ortamDur();
      }
    } catch (e) {}
  }, []);

  const sesToggle = useCallback(async () => {
    const yeni = !sesAcik;
    setSesAcik(yeni);
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    try {
      await tasbihAyari(yeni);
    } catch (e) {}
  }, [sesAcik]);

  const geriDokun = useCallback(() => {
    if (aktifAdimIdx === 0 && sayim === 0) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Tesbihatı bırak',
      'Tesbihat tamamlanmadı. Çıkmak istiyor musun?',
      [
        { text: 'Devam et', style: 'cancel' },
        {
          text: 'Çık',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [aktifAdimIdx, sayim, navigation]);

  const yuzde = aktifAdim.hedef > 0 ? Math.min(1, sayim / aktifAdim.hedef) : 0;
  const arapcaUzun = aktifAdim.id === 'tehlil' || aktifAdim.id === 'ayetelkursi';

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={geriDokun} hitSlop={12} accessibilityLabel="Geri">
            <Text
              style={[
                styles.geri,
                { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight },
              ]}
            >
              ‹ Geri
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.headerBaslik,
              { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight },
            ]}
            numberOfLines={1}
          >
            Tesbihat
          </Text>
          <View style={styles.sagAksiyonlar}>
            <TouchableOpacity
              onPress={sesToggle}
              hitSlop={8}
              style={styles.sesBtn}
              accessibilityRole="switch"
              accessibilityState={{ checked: sesAcik }}
              accessibilityLabel={
                sesAcik
                  ? 'Tasbih sesi acik, kapatmak icin dokun'
                  : 'Tasbih sesi kapali, acmak icin dokun'
              }
            >
              <Text style={styles.sesIkon}>{sesAcik ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setOrtamSecVisible(true)}
              hitSlop={8}
              style={styles.ortamBtn}
              accessibilityRole="button"
              accessibilityLabel="Arka plan sesi"
            >
              <Text style={styles.ortamIkon}>
                {ortamAyar.id
                  ? ortamAyar.id === 'yagmur'
                    ? '🌧️'
                    : ortamAyar.id === 'deniz'
                      ? '🌊'
                      : '🐦'
                  : '🔇'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.icerikKap}>
          <Text
            style={[
              styles.adimEtiket,
              { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight },
            ]}
          >
            {aktifAdimIdx + 1}/{ADIMLAR.length} ADIM
          </Text>

          <Animated.View style={[styles.adimGovde, { opacity: icerikOpacity }]}>
            <Text
              style={[
                styles.okunus,
                { fontSize: tip.xl.fontSize, lineHeight: tip.xl.lineHeight },
              ]}
              numberOfLines={2}
            >
              {aktifAdim.okunus}
            </Text>

            {arapcaUzun ? (
              <ScrollView
                style={styles.arapcaKaydirma}
                contentContainerStyle={styles.arapcaKaydirmaIcerik}
                showsVerticalScrollIndicator
              >
                <Text
                  style={[
                    styles.arapca,
                    {
                      fontSize: tip.arapca.fontSize,
                      lineHeight: tip.arapca.lineHeight,
                    },
                  ]}
                >
                  {aktifAdim.arapca}
                </Text>
              </ScrollView>
            ) : (
              <Text
                style={[
                  styles.arapca,
                  styles.arapcaKisa,
                  {
                    fontSize: tip.arapcaBuyuk.fontSize,
                    lineHeight: tip.arapcaBuyuk.lineHeight,
                  },
                ]}
              >
                {aktifAdim.arapca}
              </Text>
            )}

            <Text
              style={[
                styles.anlam,
                { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight },
              ]}
              numberOfLines={3}
            >
              {aktifAdim.anlam}
            </Text>
          </Animated.View>

          <View style={[styles.efektKap, { width: daireBoyut, height: daireBoyut }]}>
            <IsinPatlamasi
              aktif={kutlama}
              boyut={daireBoyut * 1.5}
              renk={colors.altin}
              adet={12}
            />
            {aktifAdim.tip === 'sayac' ? (
              <Animated.View
                style={[
                  styles.butonDis,
                  {
                    width: daireBoyut,
                    height: daireBoyut,
                    borderRadius: daireBoyut / 2,
                    transform: [{ scale: butonScale }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.buton}
                  onPress={arttir}
                  activeOpacity={0.88}
                  accessibilityLabel={`${aktifAdim.okunus} sayacı, dokun`}
                  accessibilityRole="button"
                >
                  <Animated.Text style={[styles.sayi, { opacity: sayiFlash }]}>
                    {sayim}
                  </Animated.Text>
                  <Text
                    style={[
                      styles.hedefYazi,
                      { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight },
                    ]}
                  >
                    / {aktifAdim.hedef}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View
                style={[
                  styles.okumaKap,
                  {
                    width: daireBoyut,
                    height: daireBoyut,
                    borderRadius: daireBoyut / 2,
                  },
                ]}
              >
                <Text style={styles.okumaIkon}>📖</Text>
                <Text
                  style={[
                    styles.okumaYazi,
                    { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight },
                  ]}
                >
                  Okundu mu?
                </Text>
              </View>
            )}
          </View>

          {aktifAdim.tip === 'sayac' && (
            <View style={styles.barDis}>
              <View
                style={[
                  styles.barIc,
                  {
                    width: `${Math.round(yuzde * 100)}%`,
                    backgroundColor:
                      yuzde >= 1 ? colors.altin : colors.ortaYesil,
                  },
                ]}
              />
            </View>
          )}

          <View style={styles.dotlar}>
            {ADIMLAR.map((_, i) => {
              const aktif = i === aktifAdimIdx;
              const bitmis = i < aktifAdimIdx;
              return (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    bitmis && styles.dotBitmis,
                    aktif && styles.dotAktif,
                  ]}
                />
              );
            })}
          </View>

          {aktifAdim.tip === 'okuma' && (
            <TouchableOpacity
              style={styles.okudumBtn}
              onPress={okumayiTamamla}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Okudum, bitir"
            >
              <Text
                style={[
                  styles.okudumYazi,
                  { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight },
                ]}
              >
                Okudum
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <OrtamSesiSecici
          visible={ortamSecVisible}
          onClose={() => setOrtamSecVisible(false)}
          mevcut={ortamAyar}
          onKaydet={handleOrtamKaydet}
        />
      </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE9D8',
  },
  geri: { color: colors.altin, fontWeight: '600', width: 80 },
  headerBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  sagAksiyonlar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 100,
    minHeight: 44,
  },
  sesBtn: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sesIkon: { fontSize: 22 },
  ortamBtn: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ortamIkon: { fontSize: 22 },

  icerikKap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  adimEtiket: {
    color: colors.altin,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  adimGovde: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  okunus: {
    color: colors.anaYesil,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  arapca: {
    color: colors.anaMetin,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: 12,
  },
  arapcaKisa: {
    marginTop: 10,
  },
  arapcaKaydirma: {
    marginTop: 10,
    maxHeight: 160,
    width: '100%',
  },
  arapcaKaydirmaIcerik: {
    paddingVertical: 4,
  },
  anlam: {
    color: colors.ikincilMetin,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },

  efektKap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  butonDis: {
    backgroundColor: 'rgba(176, 141, 46, 0.10)',
    borderWidth: 3,
    borderColor: colors.altin,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.altin,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  buton: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sayi: {
    fontSize: type.display,
    color: colors.anaYesil,
    fontWeight: '300',
    lineHeight: Math.round(type.display * 1.3),
  },
  hedefYazi: {
    color: colors.altin,
    marginTop: -2,
    fontWeight: '600',
  },

  okumaKap: {
    backgroundColor: '#FFF7E0',
    borderWidth: 3,
    borderColor: colors.altin,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  okumaIkon: {
    fontSize: 48,
    marginBottom: 6,
  },
  okumaYazi: {
    color: colors.anaYesil,
    fontWeight: '700',
  },

  barDis: {
    width: '80%',
    height: 8,
    backgroundColor: '#EFE9D8',
    borderRadius: radii.sm,
    marginTop: 8,
    overflow: 'hidden',
  },
  barIc: {
    height: 8,
    borderRadius: radii.sm,
  },

  dotlar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.cizgi,
    backgroundColor: 'transparent',
  },
  dotBitmis: {
    backgroundColor: colors.altin,
    borderColor: colors.altin,
  },
  dotAktif: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: colors.altin,
    backgroundColor: '#FFF7E0',
  },

  okudumBtn: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radii.md,
    backgroundColor: colors.anaYesil,
    minWidth: 200,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.anaYesil,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  okudumYazi: {
    color: '#fff',
    fontWeight: '700',
  },
});
