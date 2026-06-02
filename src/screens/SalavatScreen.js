// Salavat ekrani — tek ekran, ust 60% aktif sayac, alt 40% diger salavat listesi.
// Cuma gunu Munciye otomatik aktif gelir. Liste tap'i yeni ekran ACMAZ — ust metni degistirir.

import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
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
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import {
  salavatlariGetir,
  bugununSalavati,
  salavatSayacOku,
  salavatSayacArtir,
} from '../lib/salavat';
import GradientArkaPlan from '../components/GradientArkaPlan';
import IsinPatlamasi from '../components/IsinPatlamasi';

const MIN_ARALIK_MS = 200;
const SEKMELER = [
  { id: 'okunus', etiket: 'Okunuş' },
  { id: 'anlam', etiket: 'Anlam' },
  { id: 'fazilet', etiket: 'Fazilet' },
];

export default function SalavatScreen({ navigation }) {
  const tip = useTipScale();
  const { width: ekranEn } = useWindowDimensions();
  const daireBoyut = Math.min(ekranEn * 0.55, 240);

  // Tum salavatlar — backend { ad, aciklama, salavatlar: [...] } objesi donduruyor.
  const tumSalavatlar = useMemo(() => {
    try {
      const veri = salavatlariGetir();
      if (Array.isArray(veri)) return veri; // ileride sozlesme degisirse
      return Array.isArray(veri?.salavatlar) ? veri.salavatlar : [];
    } catch (e) {
      return [];
    }
  }, []);

  // Bugunun salavati (Cuma gunu Munciye + 300 hedef otomatik)
  const bugun = useMemo(() => {
    try {
      return bugununSalavati();
    } catch (e) {
      return null;
    }
  }, []);

  // Aktif salavat ID + hedef
  const [aktifId, setAktifId] = useState(bugun?.id || tumSalavatlar[0]?.id || null);
  const aktifSalavat = useMemo(
    () => tumSalavatlar.find((s) => s.id === aktifId) || null,
    [tumSalavatlar, aktifId]
  );
  const hedef = useMemo(() => {
    if (bugun && bugun.id === aktifId) return bugun.hedef || 100;
    return aktifSalavat?.onerilenSayi || aktifSalavat?.hedef || 100;
  }, [bugun, aktifId, aktifSalavat]);

  // Sayac durumu (backend'den okunur, +1 ile artar)
  const [bugunSayim, setBugunSayim] = useState(0);
  const [toplamSayim, setToplamSayim] = useState(0);
  const [sekme, setSekme] = useState('okunus');
  const [kutlama, setKutlama] = useState(false);
  const kutlandiRef = useRef(false);
  const sonTikRef = useRef(0);

  // Animasyonlar — sadece transform/opacity
  const butonScale = useRef(new Animated.Value(1)).current;
  const sayiFlash = useRef(new Animated.Value(1)).current;
  const ilerlemeAnim = useRef(new Animated.Value(0)).current;
  const icerikOpacity = useRef(new Animated.Value(1)).current;

  // Aktif salavat degistiginde: sayaci yeniden yukle + fade animasyonu
  useEffect(() => {
    if (!aktifId) return;
    let iptal = false;
    kutlandiRef.current = false;
    setKutlama(false);
    (async () => {
      try {
        const sonuc = await salavatSayacOku(aktifId);
        if (iptal) return;
        setBugunSayim(sonuc?.bugun || 0);
        setToplamSayim(sonuc?.toplam || 0);
      } catch (e) {
        if (!iptal) {
          setBugunSayim(0);
          setToplamSayim(0);
        }
      }
    })();
    // Icerik degisim fade-in
    icerikOpacity.setValue(0);
    Animated.timing(icerikOpacity, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    return () => {
      iptal = true;
    };
  }, [aktifId, icerikOpacity]);

  // Ilerleme bar animasyonu
  const yuzde = useMemo(() => {
    if (!hedef) return 0;
    return Math.min(1, bugunSayim / hedef);
  }, [bugunSayim, hedef]);

  useEffect(() => {
    // 0..1 araliginda scaleX kullanmak icin native driver ile calisiyoruz.
    Animated.timing(ilerlemeAnim, {
      toValue: yuzde,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [yuzde, ilerlemeAnim]);

  const sayacArtir = useCallback(async () => {
    const simdi = Date.now();
    if (simdi - sonTikRef.current < MIN_ARALIK_MS) return;
    sonTikRef.current = simdi;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    // Buton + sayi flash animasyonu (yalin, transform/opacity)
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

    // Iyimser guncelleme + backend cagrisi
    const yeniBugun = bugunSayim + 1;
    setBugunSayim(yeniBugun);
    setToplamSayim((t) => t + 1);

    try {
      const sonuc = await salavatSayacArtir(aktifId, 1);
      if (sonuc) {
        setBugunSayim(sonuc.bugun || yeniBugun);
        setToplamSayim(sonuc.toplam || toplamSayim + 1);
      }
    } catch (e) {
      // Sessiz fallback — iyimser update kalsin
    }

    // Hedefe ulasinca kutlama (sadece ilk kez)
    if (yeniBugun >= hedef && !kutlandiRef.current) {
      kutlandiRef.current = true;
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      setKutlama(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Elhamdulillah — hedefe ulaştın', ToastAndroid.LONG);
      } else {
        setTimeout(() => {
          Alert.alert('Elhamdulillah', 'Hedefe ulaştın. Allah kabul etsin.');
        }, 400);
      }
      // Isin patlamasi 1.5s sonra otomatik kapanir
      setTimeout(() => setKutlama(false), 1500);
    }
  }, [aktifId, bugunSayim, toplamSayim, hedef, butonScale, sayiFlash]);

  const aktifSalavatSec = useCallback((id) => {
    if (id === aktifId) return;
    setAktifId(id);
    setSekme('okunus'); // her degisimde okunusa don
    try {
      Haptics.selectionAsync();
    } catch (e) {}
  }, [aktifId]);

  // Diger salavatlar listesi (aktif olani cikar)
  const digerSalavatlar = useMemo(
    () => tumSalavatlar.filter((s) => s.id !== aktifId),
    [tumSalavatlar, aktifId]
  );

  if (!aktifSalavat) {
    return (
      <GradientArkaPlan>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
              <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bosKap}>
            <Text style={[styles.bos, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
              Salavat verisi yüklenemedi.
            </Text>
          </View>
        </SafeAreaView>
      </GradientArkaPlan>
    );
  }

  const aktifSekmeIcerik = (() => {
    if (sekme === 'okunus') return aktifSalavat.okunus || '';
    if (sekme === 'anlam') return aktifSalavat.anlam || '';
    if (sekme === 'fazilet') return aktifSalavat.fazilet || '';
    return '';
  })();

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Geri">
            <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={[styles.headerBaslik, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]} numberOfLines={1}>
            Salavat
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* UST: aktif salavat sayac + buton */}
          <Animated.View style={[styles.ustBlok, { opacity: icerikOpacity }]}>
            {bugun && bugun.id === aktifId && (
              <Text style={[styles.cumaEtiket, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                {bugun.cuma ? 'CUMA SALAVATI' : 'BUGÜNÜN SALAVATI'}
              </Text>
            )}
            <Text style={[styles.salavatAd, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>
              {aktifSalavat.ad}
            </Text>
            <Text style={[styles.suAnEtiket, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
              Şu an çekiyorsunuz
            </Text>

            {!!aktifSalavat.arapca && (
              <Text style={[styles.arapca, { fontSize: tip.arapcaBuyuk.fontSize, lineHeight: tip.arapcaBuyuk.lineHeight }]}>
                {aktifSalavat.arapca}
              </Text>
            )}

            {/* 3'lu sekme: Okunus / Anlam / Fazilet */}
            <View style={styles.sekmeBar}>
              {SEKMELER.map((s) => {
                const aktif = sekme === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setSekme(s.id)}
                    style={[styles.sekmeButon, aktif && styles.sekmeButonAktif]}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityState={{ selected: aktif }}
                  >
                    <Text
                      style={[
                        styles.sekmeYazi,
                        aktif && styles.sekmeYaziAktif,
                        { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight },
                      ]}
                    >
                      {s.etiket}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!!aktifSekmeIcerik && (
              <Text style={[styles.sekmeIcerik, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                {aktifSekmeIcerik}
              </Text>
            )}

            {/* Sayac + buton (kutlama efekti kapsayicisi) */}
            <View style={styles.sayacKap}>
              <View style={[styles.efektKap, { width: daireBoyut, height: daireBoyut }]}>
                <IsinPatlamasi aktif={kutlama} boyut={daireBoyut * 1.4} renk={colors.altin} adet={12} />
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
                    onPress={sayacArtir}
                    activeOpacity={0.88}
                    accessibilityLabel="Bir salavat ekle"
                    accessibilityRole="button"
                  >
                    <Animated.Text style={[styles.sayi, { opacity: sayiFlash }]}>
                      {bugunSayim}
                    </Animated.Text>
                    <Text style={[styles.hedefYazi, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                      / {hedef}
                    </Text>
                    <Text style={[styles.artiYazi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                      Dokun · +1
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            {/* Progress bar — scaleX ile native driver uyumlu */}
            <View style={styles.barDis}>
              <Animated.View
                style={[
                  styles.barIc,
                  {
                    backgroundColor: yuzde >= 1 ? colors.altin : colors.ortaYesil,
                    transform: [{ scaleX: ilerlemeAnim }],
                  },
                ]}
              />
            </View>
            <Text style={[styles.toplamYazi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
              Toplam: {toplamSayim}
            </Text>
          </Animated.View>

          {/* ALT: diger salavatlar listesi */}
          <View style={styles.altBlok}>
            <Text style={[styles.altBaslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>
              Diğer Meşhur Salavatlar
            </Text>
            {digerSalavatlar.map((s) => (
              <SalavatKart
                key={s.id}
                salavat={s}
                tip={tip}
                onPress={() => aktifSalavatSec(s.id)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientArkaPlan>
  );
}

const SalavatKart = memo(function SalavatKart({ salavat, tip, onPress }) {
  const ozet = salavat.faziletOzet || salavat.kisaFazilet || (salavat.fazilet ? `${salavat.fazilet.slice(0, 80)}…` : '');
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.kart}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${salavat.ad} salavatini sec`}
    >
      <Text style={[styles.kartAd, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]} numberOfLines={1}>
        {salavat.ad}
      </Text>
      {!!ozet && (
        <Text
          style={[styles.kartOzet, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}
          numberOfLines={2}
        >
          {ozet}
        </Text>
      )}
      <Text style={styles.kartOk}>›</Text>
    </TouchableOpacity>
  );
});

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
  geri: { color: colors.altin, fontWeight: '600', width: 60 },
  headerBaslik: { color: colors.anaYesil, fontWeight: '700' },

  scroll: { paddingHorizontal: 16, paddingBottom: 32 },

  bosKap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  bos: { color: colors.ikincilMetin, textAlign: 'center' },

  // UST blok
  ustBlok: {
    paddingTop: 18,
    paddingBottom: 18,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE9D8',
    marginBottom: 18,
  },
  cumaEtiket: {
    color: colors.altin,
    letterSpacing: 1.6,
    fontWeight: '700',
    marginBottom: 6,
  },
  salavatAd: {
    color: colors.anaYesil,
    fontWeight: '700',
    textAlign: 'center',
  },
  suAnEtiket: {
    color: colors.ikincilMetin,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  arapca: {
    color: colors.anaMetin,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 8,
  },

  // Sekme bar
  sekmeBar: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#FFF7E0',
    borderRadius: radii.sm,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  sekmeButon: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.sm,
    minHeight: 44,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sekmeButonAktif: {
    backgroundColor: colors.anaYesil,
  },
  sekmeYazi: { color: colors.anaYesil, fontWeight: '600' },
  sekmeYaziAktif: { color: '#fff' },

  sekmeIcerik: {
    color: colors.anaMetin,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    fontStyle: 'italic',
  },

  // Sayac + buton
  sayacKap: {
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  efektKap: {
    alignItems: 'center',
    justifyContent: 'center',
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
  artiYazi: {
    color: colors.ikincilMetin,
    marginTop: 6,
    letterSpacing: 0.5,
  },

  barDis: {
    width: '80%',
    height: 8,
    backgroundColor: '#EFE9D8',
    borderRadius: radii.sm,
    marginTop: 22,
    overflow: 'hidden',
  },
  // width %100 + scaleX(0..1) + transformOrigin sol = sol kenardan dolma efekti.
  // Expo SDK 54 (RN 0.76+) transformOrigin destekliyor.
  barIc: {
    width: '100%',
    height: 8,
    borderRadius: radii.sm,
    transformOrigin: 'left',
  },

  toplamYazi: {
    color: colors.ikincilMetin,
    marginTop: 10,
  },

  // ALT blok
  altBlok: { marginTop: 4 },
  altBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 12,
  },
  kart: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 36,
    marginBottom: 10,
    minHeight: 64,
    borderLeftWidth: 3,
    borderLeftColor: colors.altin,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  kartAd: {
    color: colors.anaYesil,
    fontWeight: '700',
  },
  kartOzet: {
    color: colors.ikincilMetin,
    marginTop: 4,
  },
  kartOk: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -12,
    fontSize: 24,
    color: colors.altin,
  },
});
