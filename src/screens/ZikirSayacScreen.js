import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  ToastAndroid,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import { esmaById } from '../lib/esma';
import { kisaZikirler } from '../lib/data';
import { zikirKaydet, bugunkuToplamSayim, toplamSayimArtir } from '../db/db';
import { tasbihCal, tasbihAyari, tasbihAyariOku, ortamCal, ortamDur, ortamAyariOku, ortamAyariKaydet } from '../lib/ses';
import GradientArkaPlan from '../components/GradientArkaPlan';
import NurHalesi from '../components/NurHalesi';
import Partikullar from '../components/Partikullar';
import OrtamSesiSecici from '../components/OrtamSesiSecici';

const MIN_ARALIK_MS = 200;
const GUNLUK_MAX = 10000;
const RATE_LIMIT_PENCERE_MS = 60000;
const RATE_LIMIT_ESIK = 300;

function bugunIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ZikirSayacScreen({ route, navigation }) {
  const { esmaNo = null, zikirId = null, hedef: hedefParam = null } = route.params || {};
  const { width: ekranEn } = useWindowDimensions();
  const daireBoyut = Math.min(ekranEn * 0.85, 380);
  const tip = useTipScale();

  const esma = useMemo(() => (esmaNo ? esmaById(esmaNo) : null), [esmaNo]);
  const zikir = useMemo(
    () => (zikirId ? kisaZikirler.find((z) => z.id === zikirId) : null),
    [zikirId]
  );

  const baslik = esma ? `Yâ ${esma.esma}` : zikir ? zikir.ad : 'Zikir';
  const arapca = esma?.arapca || zikir?.arapca || '';
  const altYazi = esma?.anlam || zikir?.meal || '';
  // Sayacin ustunde gosterilen okunus — esma icin "Ya X", zikir icin tam okunus.
  const okunus = esma ? `Yâ ${esma.esma}` : zikir?.okunus || '';
  const tesirler = Array.isArray(esma?.tesir) ? esma.tesir : [];

  const hedef = useMemo(() => {
    if (hedefParam) return hedefParam;
    if (esma) return esma.ebced || 100;
    if (zikir) return zikir.onerilen_sayi || 33;
    return 33;
  }, [hedefParam, esma, zikir]);

  const [sayim, setSayim] = useState(0);
  const [tamamlandi, setTamamlandi] = useState(false);
  const [gunlukToplam, setGunlukToplam] = useState(0);
  const [efektAktif, setEfektAktif] = useState(false);
  // Tasbih ses ayari — Ayarlar ekraniyla senkron, header'dan anlik toggle.
  const [sesAcik, setSesAcik] = useState(true);
  // Ortam sesi (yagmur/deniz/orman) — bagiamsal olarak bu ekranda secilebilir.
  const [ortamAyar, setOrtamAyar] = useState({ id: null, seviye: 'orta' });
  const [ortamSecVisible, setOrtamSecVisible] = useState(false);
  const sonTikRef = useRef(0);
  const dakikalikTiklarRef = useRef([]);
  const baslangicRef = useRef(new Date().toISOString());
  const uyariGosterildiRef = useRef(false);
  const alertTimeoutRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tamamAnim = useRef(new Animated.Value(1)).current;
  const daireAnim = useRef(new Animated.Value(0)).current;
  const dairePulseAnim = useRef(new Animated.Value(1)).current;
  const sayiFlashAnim = useRef(new Animated.Value(1)).current;
  const birlesikScale = useRef(Animated.multiply(scaleAnim, tamamAnim)).current;
  const birlesikDaireScale = useRef(Animated.multiply(daireAnim, dairePulseAnim)).current;

  useEffect(() => {
    (async () => {
      try {
        const t = await bugunkuToplamSayim(bugunIso());
        setGunlukToplam(t);
      } catch (e) {}
      // Tasbih ses cache'ini ilk tikta sessiz kalmasin diye onceden doldur.
      try {
        const a = await tasbihAyariOku();
        setSesAcik(!!a);
      } catch (e) {}
      // Ortam sesi ayarini yukle
      try {
        const o = await ortamAyariOku();
        if (o) setOrtamAyar(o);
      } catch (e) {}
    })();
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = null;
      }
    };
  }, []);

  // Ayarlar ekranindan donulunce ses ayarini tazele (focus senkronu).
  // Ortam sesi: ekrana girince calistir, ekrandan cikinca durdur.
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
              try { ortamCal(o.id, o.seviye); } catch (e) {}
            }
          }
        } catch (e) {}
      })();
      return () => {
        iptal = true;
        try { ortamDur(); } catch (e) {}
      };
    }, [])
  );

  const ilerleme = Math.min(sayim / hedef, 1);
  const yuzde = Math.round(ilerleme * 100);
  const son10da = hedef - sayim <= 10 && sayim < hedef;

  useEffect(() => {
    Animated.timing(daireAnim, {
      toValue: ilerleme,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [ilerleme, daireAnim]);

  const arttir = async () => {
    if (tamamlandi) return;
    const simdi = Date.now();
    if (simdi - sonTikRef.current < MIN_ARALIK_MS) return;
    sonTikRef.current = simdi;

    if (gunlukToplam >= GUNLUK_MAX) {
      if (!uyariGosterildiRef.current) {
        uyariGosterildiRef.current = true;
        Alert.alert('Günlük limit', 'Bugün için yeterince zikrettin, Allah kabul etsin.');
      }
      return;
    }

    dakikalikTiklarRef.current = dakikalikTiklarRef.current.filter(
      (t) => simdi - t < RATE_LIMIT_PENCERE_MS
    );
    dakikalikTiklarRef.current.push(simdi);
    if (dakikalikTiklarRef.current.length > RATE_LIMIT_ESIK && !uyariGosterildiRef.current) {
      uyariGosterildiRef.current = true;
      Alert.alert('Acele etme', 'Niyet et, kalpten geçir.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    // Tahta tikir sesi — fire-and-forget. Ses ayari kapaliysa ses.js icinden sessiz doner.
    tasbihCal();

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(sayiFlashAnim, {
        toValue: 0.4,
        duration: 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sayiFlashAnim, {
        toValue: 1,
        duration: 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const yeni = sayim + 1;
    setSayim(yeni);
    setGunlukToplam((t) => t + 1);
    try {
      toplamSayimArtir(bugunIso(), 1);
    } catch (e) {}

    if (yeni >= hedef && !tamamlandi) {
      setTamamlandi(true);
      setEfektAktif(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      Animated.parallel([
        Animated.sequence([
          Animated.timing(tamamAnim, {
            toValue: 1.18,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(tamamAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dairePulseAnim, {
            toValue: 1.05,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(dairePulseAnim, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      alertTimeoutRef.current = setTimeout(() => {
        alertTimeoutRef.current = null;
        setEfektAktif(false);
        Alert.alert('Elhamdulillah', 'Hedefe ulaştın. Allah kabul etsin.', [
          { text: 'Devam et', onPress: () => setTamamlandi(false) },
          { text: 'Bitir', onPress: tamamla, style: 'default' },
        ]);
      }, 350);
    }
  };

  const tamamla = async () => {
    const bitis = new Date().toISOString();
    try {
      await zikirKaydet({
        zikirId: zikirId,
        esmaNo: esmaNo,
        sayim,
        hedef,
        baslangic: baslangicRef.current,
        bitis,
      });
      if (Platform.OS === 'android') ToastAndroid.show('Kaydedildi', ToastAndroid.SHORT);
    } catch (e) {}
    navigation.goBack();
  };

  // Ortam sesi secimini uygula + storage'a yaz + anlik calistir/durdur.
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

  // Header ses toggle — anlik susturma. AsyncStorage'a yazar, cache senkronlanir.
  const sesToggle = async () => {
    const yeni = !sesAcik;
    setSesAcik(yeni);
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    try {
      await tasbihAyari(yeni);
    } catch (e) {}
  };

  const sifirla = () => {
    Alert.alert('Sıfırla', 'Sayımı sıfırlamak ister misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sıfırla',
        style: 'destructive',
        onPress: () => {
          setSayim(0);
          setTamamlandi(false);
          setEfektAktif(false);
          uyariGosterildiRef.current = false;
          baslangicRef.current = new Date().toISOString();
        },
      },
    ]);
  };

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Geri">
          <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]} numberOfLines={1}>{baslik}</Text>
          {!!arapca && <Text style={[styles.arapca, { fontSize: tip.arapca.fontSize, lineHeight: tip.arapca.lineHeight }]} numberOfLines={1}>{arapca}</Text>}
        </View>
        <TouchableOpacity
          onPress={sesToggle}
          style={styles.sesBtn}
          hitSlop={8}
          accessibilityRole="switch"
          accessibilityState={{ checked: sesAcik }}
          accessibilityLabel={sesAcik ? 'Tasbih sesi acik, kapatmak icin dokun' : 'Tasbih sesi kapali, acmak icin dokun'}
        >
          <Text style={styles.sesIkon}>{sesAcik ? '🔊' : '🔇'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setOrtamSecVisible(true)}
          style={styles.ortamBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Arka plan sesi"
        >
          <Text style={styles.ortamIkon}>
            {ortamAyar.id ? (ortamAyar.id === 'yagmur' ? '🌧️' : ortamAyar.id === 'deniz' ? '🌊' : '🐦') : '🔇'}
          </Text>
        </TouchableOpacity>
      </View>

      {(!!altYazi || tesirler.length > 0) && (
        <View style={styles.ustBilgi}>
          {!!altYazi && (
            <Text style={[styles.ustAnlam, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]} numberOfLines={2}>
              {altYazi}
            </Text>
          )}
          {tesirler.length > 0 && (
            <View style={styles.tesirler}>
              {tesirler.map((t) => (
                <View key={t} style={styles.tesir}>
                  <Text style={[styles.tesirYazi, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.tikAlani}
        onPress={arttir}
        activeOpacity={0.9}
        accessibilityLabel="Zikret"
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.arkaDaire,
            {
              width: daireBoyut,
              height: daireBoyut,
              borderRadius: daireBoyut / 2,
              marginLeft: -daireBoyut / 2,
              marginTop: -daireBoyut / 2,
              transform: [{ scale: birlesikDaireScale }],
            },
          ]}
        />
        <Animated.View style={[styles.sayiKutusu, { transform: [{ scale: birlesikScale }] }]}>
          {!!okunus && (
            <Text
              style={[
                styles.okunusYazi,
                { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight },
              ]}
            >
              {okunus}
            </Text>
          )}
          <Animated.Text style={[styles.sayi, { opacity: sayiFlashAnim }]}>
            {sayim}
          </Animated.Text>
          <Text style={[styles.hedef, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Hedef: {hedef}</Text>
          <View style={styles.barOut}>
            <View
              style={[
                styles.barIn,
                { width: `${yuzde}%`, backgroundColor: son10da ? colors.altin : colors.ortaYesil },
              ]}
            />
          </View>
          <Text style={[styles.yuzde, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>%{yuzde}</Text>
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.altBar}>
        <TouchableOpacity style={[styles.altButon, styles.sifirlaButon]} onPress={sifirla}>
          <Text style={[styles.altButonYazi, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Sıfırla</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.altButon, styles.tamamlaButon, sayim < hedef && styles.tamamlaPasif]}
          onPress={tamamla}
          disabled={sayim === 0}
        >
          <Text style={[styles.altButonYazi, { color: '#fff', fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Tamamla</Text>
        </TouchableOpacity>
      </View>

      <NurHalesi aktif={efektAktif} boyut={Math.min(ekranEn * 0.95, 420)} />
      <Partikullar aktif={efektAktif} alan={{ en: Math.min(ekranEn * 0.85, 360), boy: 320 }} adet={12} />

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
  arkaDaire: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: 'rgba(176, 141, 46, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(176, 141, 46, 0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE9D8',
  },
  geri: { color: colors.altin, width: 60 },
  sesBtn: {
    width: 50,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sesIkon: { fontSize: 22 },
  ortamBtn: {
    width: 50,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ortamIkon: { fontSize: 22 },
  baslik: { color: colors.anaYesil, fontWeight: '600' },
  arapca: { color: colors.anaMetin, marginTop: 2 },
  ustBilgi: {
    paddingHorizontal: 24,
    paddingTop: 14,
    alignItems: 'center',
  },
  ustAnlam: {
    color: colors.ikincilMetin,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tesirler: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  tesir: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.altin,
    backgroundColor: '#FBF6E6',
  },
  tesirYazi: {
    color: colors.altin,
    fontWeight: '600',
  },
  tikAlani: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sayiKutusu: { alignItems: 'center', paddingHorizontal: 24 },
  okunusYazi: {
    color: colors.anaMetin,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  sayi: { fontSize: type.count, color: colors.anaYesil, fontWeight: '300' },
  altYazi: {
    color: colors.ikincilMetin,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  hedef: { color: colors.altin, marginTop: 18 },
  barOut: {
    width: 220,
    height: 6,
    backgroundColor: '#EFE9D8',
    borderRadius: 6,
    marginTop: 10,
    overflow: 'hidden',
  },
  barIn: { height: 6, borderRadius: 6 },
  yuzde: { color: colors.ikincilMetin, marginTop: 8 },
  altBar: { flexDirection: 'row', padding: 16, gap: 12 },
  altButon: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sifirlaButon: { borderWidth: 1, borderColor: colors.cizgi },
  tamamlaButon: { backgroundColor: colors.altin },
  tamamlaPasif: { opacity: 0.6 },
  altButonYazi: { color: colors.anaMetin, fontWeight: '600' },
});
