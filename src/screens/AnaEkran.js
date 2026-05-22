import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { colors } from '../constants/colors';
import { gunlukVakitler, sonrakiVakit, vakitFormat, gericiSayim } from '../lib/namaz';
import { gununIcerigi, bugunCumaMi } from '../lib/gunlukSecim';
import { ayetler, hadisler } from '../lib/data';

export default function AnaEkran({ navigation }) {
  const [isim, setIsim] = useState('');
  const [esma, setEsma] = useState(null);
  const [konum, setKonum] = useState(null);
  const [simdi, setSimdi] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [ayetGoster, setAyetGoster] = useState(false);
  const [hadisGoster, setHadisGoster] = useState(false);

  const g1Opacity = useRef(new Animated.Value(0)).current;
  const g1TranslateY = useRef(new Animated.Value(24)).current;
  const g2Opacity = useRef(new Animated.Value(0)).current;
  const g2TranslateY = useRef(new Animated.Value(24)).current;
  const g3Opacity = useRef(new Animated.Value(0)).current;
  const g3TranslateY = useRef(new Animated.Value(24)).current;
  const vakitNefesAnim = useRef(new Animated.Value(1)).current;
  const vakitLoopRef = useRef(null);

  const yukle = useCallback(async () => {
    try {
      const [n, e, en, bo] = await Promise.all([
        AsyncStorage.getItem('userName'),
        AsyncStorage.getItem('userEsma'),
        AsyncStorage.getItem('enlem'),
        AsyncStorage.getItem('boylam'),
      ]);
      if (n) setIsim(n);
      if (e) setEsma(JSON.parse(e));
      if (en && bo) setKonum({ enlem: parseFloat(en), boylam: parseFloat(bo) });
    } catch (err) {}
  }, []);

  useEffect(() => {
    let iptal = false;
    const grupAnim = (op, ty, delay) =>
      Animated.parallel([
        Animated.timing(op, {
          toValue: 1,
          duration: 520,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ty, {
          toValue: 0,
          duration: 520,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    (async () => {
      await yukle();
      if (iptal) return;
      Animated.parallel([
        grupAnim(g1Opacity, g1TranslateY, 0),
        grupAnim(g2Opacity, g2TranslateY, 80),
        grupAnim(g3Opacity, g3TranslateY, 160),
      ]).start();
    })();
    return () => {
      iptal = true;
    };
  }, [
    yukle,
    g1Opacity,
    g1TranslateY,
    g2Opacity,
    g2TranslateY,
    g3Opacity,
    g3TranslateY,
  ]);

  useEffect(() => {
    const t = setInterval(() => setSimdi(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const vakitler = useMemo(() => {
    if (!konum) return null;
    return gunlukVakitler(konum.enlem, konum.boylam);
  }, [konum]);

  const sonraki = useMemo(() => {
    if (!vakitler) return null;
    return sonrakiVakit(vakitler, simdi);
  }, [vakitler, simdi]);

  const vakitYakin = useMemo(() => {
    if (!sonraki?.zaman) return false;
    const fark = sonraki.zaman.getTime() - simdi.getTime();
    return fark > 0 && fark < 15 * 60 * 1000;
  }, [sonraki, simdi]);

  useEffect(() => {
    if (vakitLoopRef.current) {
      vakitLoopRef.current.stop();
      vakitLoopRef.current = null;
    }
    if (vakitYakin) {
      vakitNefesAnim.setValue(1);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(vakitNefesAnim, {
            toValue: 1.018,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(vakitNefesAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      vakitLoopRef.current = loop;
      loop.start();
    } else {
      vakitNefesAnim.setValue(1);
    }
    return () => {
      if (vakitLoopRef.current) {
        vakitLoopRef.current.stop();
        vakitLoopRef.current = null;
      }
      vakitNefesAnim.setValue(1);
    };
  }, [vakitYakin, vakitNefesAnim]);

  const gununAyeti = useMemo(() => {
    if (bugunCumaMi()) {
      const kehf = ayetler.filter((a) => a.sure_no === 18);
      if (kehf.length > 0) return gununIcerigi(kehf, 0) || ayetler[0];
    }
    return gununIcerigi(ayetler, 0);
  }, []);

  const gununHadisi = useMemo(() => gununIcerigi(hadisler, 7), []);

  const tarihYazi = useMemo(() => {
    try {
      return format(simdi, "EEEE, d MMMM yyyy", { locale: tr });
    } catch {
      return simdi.toDateString();
    }
  }, [simdi]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await yukle();
    setSimdi(new Date());
    setRefreshing(false);
  }, [yukle]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.altin} />}
      >
        <Animated.View
          style={{
            opacity: g1Opacity,
            transform: [{ translateY: g1TranslateY }],
          }}
        >
          <View style={styles.basliklik}>
            <Text style={styles.selam}>Selamün Aleyküm, {isim || 'Kardeşim'}</Text>
            <Text style={styles.tarih}>{tarihYazi}</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: g2Opacity,
            transform: [{ translateY: g2TranslateY }],
          }}
        >
          <PressKart
            style={styles.vakitKart}
            onPress={() => navigation.navigate('TumVakitler')}
            extraScale={vakitNefesAnim}
          >
            {sonraki ? (
              <>
                <Text style={styles.vakitIkon}>🕌</Text>
                <Text style={styles.vakitLabel}>Sonraki: {sonraki.ad}</Text>
                <Text style={styles.vakitSaat}>{vakitFormat(sonraki.zaman)}</Text>
                <Text style={styles.vakitKaldi}>{gericiSayim(sonraki.zaman, simdi)} kaldı</Text>
              </>
            ) : (
              <>
                <Text style={styles.vakitIkon}>🕌</Text>
                <Text style={styles.vakitLabel}>Namaz vakitleri</Text>
                <Text style={styles.vakitKaldi}>
                  {konum ? 'Yarın imsak için bekle' : 'Konumunu ayarla'}
                </Text>
              </>
            )}
          </PressKart>

          <PressKart
            style={styles.tumEsmalarKart}
            onPress={() => navigation.navigate('EsmaListesi')}
          >
            <Text style={styles.tumEsmalarIkon}>✨</Text>
            <View style={styles.tumEsmalarOrta}>
              <Text style={styles.tumEsmalarBaslik}>Tüm Esmalar</Text>
              <Text style={styles.tumEsmalarAlt}>99 ismin tamamı · Ara, oku, zikret</Text>
            </View>
            <Text style={styles.tumEsmalarOk}>›</Text>
          </PressKart>

          {esma?.esma && (
            <PressKart
              style={styles.zikirKart}
              onPress={() => navigation.navigate('EsmaDetay', { esmaNo: esma.esma.no })}
            >
              <View style={styles.zikirNoRozet}>
                <Text style={styles.zikirNoYazi}>{esma.esma.no}</Text>
              </View>
              <View style={styles.zikirIcerik}>
                <Text style={styles.zikirEtiket}>SENİN ESMAN</Text>
                <Text style={styles.zikirAd}>Yâ {esma.esma.esma}</Text>
                {esma.isim_ebced != null && esma.isim_turkce ? (
                  <Text style={styles.zikirEbced} numberOfLines={1} ellipsizeMode="tail">
                    {esma.isim_turkce} ({esma.isim_ebced}) → {esma.esma.esma} ({esma.esma.ebced})
                  </Text>
                ) : (
                  <Text style={styles.zikirAnlam} numberOfLines={2}>
                    {esma.esma.anlam}
                  </Text>
                )}
              </View>
            </PressKart>
          )}
        </Animated.View>

        <Animated.View
          style={{
            opacity: g3Opacity,
            transform: [{ translateY: g3TranslateY }],
          }}
        >
          {gununAyeti && (
            <View style={styles.kart}>
              <Text style={styles.kartBaslik}>📖 Günün Ayeti</Text>
              <Text style={styles.ayetMeal}>{gununAyeti.tr}</Text>
              <Text style={styles.kaynak}>— {gununAyeti.sure_adi}, {gununAyeti.ayet_no}</Text>
              <TouchableOpacity onPress={() => setAyetGoster((v) => !v)}>
                <Text style={styles.toggle}>{ayetGoster ? 'Gizle' : 'Aslını Göster'}</Text>
              </TouchableOpacity>
              {ayetGoster && <Text style={styles.arapca}>{gununAyeti.ar}</Text>}
            </View>
          )}

          {gununHadisi && (
            <View style={styles.kart}>
              <Text style={styles.kartBaslik}>📚 Günün Hadisi</Text>
              <Text style={styles.ayetMeal}>{gununHadisi.tr}</Text>
              <Text style={styles.kaynak}>— {gununHadisi.kaynak}</Text>
              <TouchableOpacity onPress={() => setHadisGoster((v) => !v)}>
                <Text style={styles.toggle}>{hadisGoster ? 'Gizle' : 'Aslını Göster'}</Text>
              </TouchableOpacity>
              {hadisGoster && <Text style={styles.arapca}>{gununHadisi.ar}</Text>}
            </View>
          )}

          <View style={styles.grid}>
            <KisaYol emoji="💎" label="Kısa Zikirler" onPress={() => navigation.navigate('KisaZikirler')} />
            <KisaYol emoji="🌟" label="Anlık Zikir" onPress={() => navigation.navigate('AnlikZikir')} />
            <KisaYol emoji="📿" label="Tüm Vakitler" onPress={() => navigation.navigate('TumVakitler')} />
            <KisaYol emoji="📊" label="Geçmiş" onPress={() => navigation.navigate('Gecmis')} />
            <KisaYol emoji="📈" label="İstatistik" onPress={() => navigation.navigate('EsmaIstatistik')} />
            <View style={styles.gridDolgu} />
          </View>

          <View style={styles.altMenu}>
            <TouchableOpacity onPress={() => navigation.navigate('Aksam')}>
              <Text style={styles.altLink}>🌙 Akşam Muhasebesi</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Ayarlar')}>
              <Text style={styles.altLink}>⚙️ Ayarlar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function PressKart({ style, onPress, children, extraScale }) {
  const scale = useRef(new Animated.Value(1)).current;
  const birlesik = useMemo(
    () => (extraScale ? Animated.multiply(scale, extraScale) : scale),
    [scale, extraScale]
  );
  const pressIn = () =>
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  const pressOut = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  return (
    <AnimatedTouchable
      style={[style, { transform: [{ scale: birlesik }] }]}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      activeOpacity={0.9}
    >
      {children}
    </AnimatedTouchable>
  );
}

function KisaYol({ emoji, label, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  const pressOut = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  return (
    <AnimatedTouchable
      style={[styles.gridKart, { transform: [{ scale }] }]}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      activeOpacity={0.85}
    >
      <Text style={styles.gridEmoji}>{emoji}</Text>
      <Text style={styles.gridLabel}>{label}</Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.krem },
  scroll: { padding: 16, paddingBottom: 32 },
  basliklik: { marginBottom: 16, marginTop: 4 },
  selam: { fontSize: 20, color: colors.anaYesil, fontWeight: '600' },
  tarih: { fontSize: 13, color: colors.ikincilMetin, marginTop: 4 },

  vakitKart: {
    backgroundColor: colors.anaYesil,
    padding: 20,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  vakitIkon: { fontSize: 28, marginBottom: 6 },
  vakitLabel: { color: colors.krem, fontSize: 14, opacity: 0.9 },
  vakitSaat: { color: '#fff', fontSize: 44, fontWeight: '300', marginVertical: 4 },
  vakitKaldi: { color: colors.kremAlt, fontSize: 13 },

  tumEsmalarKart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.anaYesil,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  tumEsmalarIkon: {
    fontSize: 22,
    marginRight: 12,
  },
  tumEsmalarOrta: { flex: 1 },
  tumEsmalarBaslik: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  tumEsmalarAlt: {
    color: colors.kremAlt,
    fontSize: 12,
    marginTop: 2,
  },
  tumEsmalarOk: {
    color: colors.kremAlt,
    fontSize: 24,
    marginLeft: 8,
  },

  zikirKart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.altin,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  zikirNoRozet: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.altin,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginRight: 14,
  },
  zikirNoYazi: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  zikirIcerik: { flex: 1 },
  zikirEtiket: {
    color: colors.altin,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  zikirAd: { color: colors.anaYesil, fontSize: 22, fontWeight: '600', marginTop: 4 },
  zikirEbced: { color: colors.altin, fontSize: 11, marginTop: 4, letterSpacing: 0.3 },
  zikirAnlam: { color: colors.ikincilMetin, fontSize: 13, marginTop: 4 },

  kart: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  kartBaslik: { color: colors.anaYesil, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  ayetMeal: { color: colors.anaMetin, fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  kaynak: { color: colors.altin, fontSize: 12, marginTop: 8 },
  toggle: { color: colors.altin, fontSize: 12, marginTop: 8, textAlign: 'right' },
  arapca: {
    color: colors.anaMetin,
    fontSize: 20,
    textAlign: 'right',
    marginTop: 10,
    lineHeight: 32,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gridKart: {
    width: '48%',
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
  },
  gridDolgu: { width: '48%' },
  gridEmoji: { fontSize: 24, marginBottom: 6 },
  gridLabel: { fontSize: 13, color: colors.anaMetin, textAlign: 'center' },
  altMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  altLink: { color: colors.anaYesil, fontSize: 13 },
});
