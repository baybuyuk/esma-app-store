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
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { gunlukVakitler, sonrakiVakit, vakitFormat, gericiSayim } from '../lib/namaz';
import { gununIcerigi, bugunCumaMi } from '../lib/gunlukSecim';
import { ayetler, hadisler } from '../lib/data';
import { hicriTarih, mubarekGun, sonrakiMubarekGun } from '../lib/hicri';
import { useTipScale } from '../context/YaziKademesiContext';
import GradientArkaPlan from '../components/GradientArkaPlan';

export default function AnaEkran({ navigation }) {
  const tip = useTipScale();
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

  const hicri = useMemo(() => hicriTarih(simdi), [simdi]);
  const hicriYazi = useMemo(
    () => `${hicri.gun} ${hicri.ayAdi} ${hicri.yil}`,
    [hicri]
  );
  const mubarek = useMemo(() => mubarekGun(simdi), [simdi]);
  const yaklasan = useMemo(() => {
    if (mubarek) return null;
    const s = sonrakiMubarekGun(simdi);
    // Sadece 14 gun ve daha yakindaki mubarek gunleri goster.
    if (s && s.kalanGun <= 14) return s;
    return null;
  }, [mubarek, simdi]);

  // Saate gore akilli evrad onerisi.
  const evradOnerisi = useMemo(() => {
    const saat = simdi.getHours();
    if (saat >= 5 && saat < 10) {
      return { tip: 'sabah', emoji: '🌅', metin: 'Sabah evrâdını oku' };
    }
    if (saat >= 17 && saat < 22) {
      return { tip: 'aksam', emoji: '🌆', metin: 'Akşam evrâdını oku' };
    }
    return null;
  }, [simdi]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await yukle();
    setSimdi(new Date());
    setRefreshing(false);
  }, [yukle]);

  return (
    <GradientArkaPlan>
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
            <Text style={[styles.selam, { fontSize: tip.xl.fontSize, lineHeight: tip.xl.lineHeight }]}>
              Selamün Aleyküm, {isim || 'Kardeşim'}
            </Text>
            <Text style={[styles.tarih, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
              {tarihYazi}
            </Text>
            <Text style={[styles.hicri, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
              {hicriYazi}
            </Text>
            {yaklasan && (
              <Text style={[styles.yaklasan, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                {yaklasan.kalanGun === 1
                  ? `Yarın: ${yaklasan.ad}`
                  : `${yaklasan.kalanGun} gün sonra ${yaklasan.ad}`}
              </Text>
            )}
            {evradOnerisi && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Evrad', { tip: evradOnerisi.tip })}
                style={styles.evradOneri}
                activeOpacity={0.8}
                hitSlop={6}
              >
                <Text style={[styles.evradOneriYazi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                  {evradOnerisi.emoji} {evradOnerisi.metin} ›
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {mubarek && (
            <View style={styles.mubarekKart}>
              <Text style={styles.mubarekEmoji}>🌙</Text>
              <Text style={styles.mubarekAd}>{mubarek.ad}</Text>
              <Text style={styles.mubarekVurgu}>{mubarek.vurgu}</Text>
            </View>
          )}
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
                <Text style={[styles.vakitLabel, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                  Sonraki: {sonraki.ad}
                </Text>
                <Text style={styles.vakitSaat}>{vakitFormat(sonraki.zaman)}</Text>
                <Text style={[styles.vakitKaldi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                  {gericiSayim(sonraki.zaman, simdi)} kaldı
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.vakitIkon}>🕌</Text>
                <Text style={[styles.vakitLabel, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                  Namaz vakitleri
                </Text>
                <Text style={[styles.vakitKaldi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
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
              <Text style={[styles.tumEsmalarBaslik, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                Tüm Esmalar
              </Text>
              <Text style={[styles.tumEsmalarAlt, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                99 ismin tamamı · Ara, oku, zikret
              </Text>
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
                <Text style={[styles.zikirAd, { fontSize: tip.xl.fontSize, lineHeight: tip.xl.lineHeight }]}>
                  Yâ {esma.esma.esma}
                </Text>
                {esma.isim_ebced != null && esma.isim_turkce ? (
                  <Text style={styles.zikirEbced} numberOfLines={1} ellipsizeMode="tail">
                    {esma.isim_turkce} ({esma.isim_ebced}) → {esma.esma.esma} ({esma.esma.ebced})
                  </Text>
                ) : (
                  <Text
                    style={[styles.zikirAnlam, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}
                    numberOfLines={2}
                  >
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
              <Text style={[styles.kartBaslik, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                📖 Günün Ayeti
              </Text>
              <Text style={[styles.ayetMeal, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                {gununAyeti.tr}
              </Text>
              <Text style={[styles.kaynak, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                — {gununAyeti.sure_adi}, {gununAyeti.ayet_no}
              </Text>
              <TouchableOpacity onPress={() => setAyetGoster((v) => !v)} hitSlop={8}>
                <Text style={[styles.toggle, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                  {ayetGoster ? 'Gizle' : 'Aslını Göster'}
                </Text>
              </TouchableOpacity>
              {ayetGoster && (
                <Text style={[styles.arapca, { fontSize: tip.arapca.fontSize, lineHeight: tip.arapca.lineHeight }]}>
                  {gununAyeti.ar}
                </Text>
              )}
            </View>
          )}

          {gununHadisi && (
            <View style={styles.kart}>
              <Text style={[styles.kartBaslik, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                📚 Günün Hadisi
              </Text>
              <Text style={[styles.ayetMeal, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                {gununHadisi.tr}
              </Text>
              <Text style={[styles.kaynak, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                — {gununHadisi.kaynak}
              </Text>
              <TouchableOpacity onPress={() => setHadisGoster((v) => !v)} hitSlop={8}>
                <Text style={[styles.toggle, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                  {hadisGoster ? 'Gizle' : 'Aslını Göster'}
                </Text>
              </TouchableOpacity>
              {hadisGoster && (
                <Text style={[styles.arapca, { fontSize: tip.arapca.fontSize, lineHeight: tip.arapca.lineHeight }]}>
                  {gununHadisi.ar}
                </Text>
              )}
            </View>
          )}

          <View style={styles.grid}>
            <KisaYol tip={tip} emoji="💎" label="Kısa Zikirler" onPress={() => navigation.navigate('KisaZikirler')} />
            <KisaYol tip={tip} emoji="🌟" label="Anlık Zikir" onPress={() => navigation.navigate('AnlikZikir')} />
            <KisaYol tip={tip} emoji="🧭" label="Kıble" onPress={() => navigation.navigate('Kible')} />
            <KisaYol tip={tip} emoji="🌅" label="Sabah Evrâdı" onPress={() => navigation.navigate('Evrad', { tip: 'sabah' })} />
            <KisaYol tip={tip} emoji="🌆" label="Akşam Evrâdı" onPress={() => navigation.navigate('Evrad', { tip: 'aksam' })} />
            <KisaYol tip={tip} emoji="🤲" label="Dualar" onPress={() => navigation.navigate('Dualar')} />
            <KisaYol tip={tip} emoji="🌙" label="Akşam Muhasebesi" onPress={() => navigation.navigate('Aksam')} />
            <KisaYol tip={tip} emoji="📿" label="Tüm Vakitler" onPress={() => navigation.navigate('TumVakitler')} />
            <KisaYol tip={tip} emoji="📊" label="Geçmiş" onPress={() => navigation.navigate('Gecmis')} />
            <KisaYol tip={tip} emoji="🔍" label="Esma Bul" onPress={() => navigation.navigate('EsmaBul')} />
          </View>

          <View style={styles.altMenu}>
            <TouchableOpacity onPress={() => navigation.navigate('EsmaIstatistik')} hitSlop={8}>
              <Text style={[styles.altLink, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                📈 İstatistik
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Ayarlar')} hitSlop={8}>
              <Text style={[styles.altLink, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                ⚙️ Ayarlar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Hakkinda')} hitSlop={8}>
              <Text style={[styles.altLink, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                ℹ️ Hakkında
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
    </GradientArkaPlan>
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

function KisaYol({ emoji, label, onPress, tip }) {
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
      <Text
        style={[
          styles.gridLabel,
          tip ? { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight } : null,
        ]}
      >
        {label}
      </Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: 16, paddingBottom: 32 },
  basliklik: { marginBottom: 16, marginTop: 4 },
  selam: { fontSize: 20, color: colors.anaYesil, fontWeight: '600' },
  tarih: { fontSize: type.sm, color: colors.ikincilMetin, marginTop: 4 },
  hicri: { fontSize: type.sm, color: colors.altin, marginTop: 2, fontWeight: '600' },
  yaklasan: {
    marginTop: 6,
    fontSize: type.sm,
    color: colors.anaYesil,
    fontStyle: 'italic',
  },
  evradOneri: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    backgroundColor: '#FFF7E0',
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  evradOneriYazi: {
    fontSize: type.sm,
    color: colors.anaYesil,
    fontWeight: '600',
  },

  mubarekKart: {
    backgroundColor: '#FFF7E0',
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.altin,
    alignItems: 'center',
  },
  mubarekEmoji: { fontSize: 36, marginBottom: 4 },
  mubarekAd: {
    fontSize: type.xl,
    color: colors.anaYesil,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  mubarekVurgu: {
    fontSize: type.base,
    color: colors.anaMetin,
    textAlign: 'center',
    lineHeight: 22,
  },

  vakitKart: {
    backgroundColor: colors.anaYesil,
    padding: 20,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  vakitIkon: { fontSize: type['2xl'], marginBottom: 6 },
  vakitLabel: { color: colors.krem, fontSize: 14, opacity: 0.9 },
  vakitSaat: { color: '#fff', fontSize: 44, fontWeight: '300', marginVertical: 4 },
  vakitKaldi: { color: colors.kremAlt, fontSize: type.sm },

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
    fontSize: type.xl,
    marginRight: 12,
  },
  tumEsmalarOrta: { flex: 1 },
  tumEsmalarBaslik: {
    color: '#fff',
    fontSize: type.base,
    fontWeight: '700',
  },
  tumEsmalarAlt: {
    color: colors.kremAlt,
    fontSize: type.xs,
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
    borderRadius: radii.md,
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
    borderRadius: radii.lg,
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
  zikirAd: { color: colors.anaYesil, fontSize: type.xl, fontWeight: '600', marginTop: 4 },
  zikirEbced: { color: colors.altin, fontSize: 11, marginTop: 4, letterSpacing: 0.3 },
  zikirAnlam: { color: colors.ikincilMetin, fontSize: type.sm, marginTop: 4 },

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
  kartBaslik: { color: colors.anaYesil, fontSize: type.sm, marginBottom: 8, fontWeight: '600' },
  ayetMeal: { color: colors.anaMetin, fontSize: type.base, fontStyle: 'italic', lineHeight: 22 },
  kaynak: { color: colors.altin, fontSize: type.xs, marginTop: 8 },
  toggle: { color: colors.altin, fontSize: type.xs, marginTop: 8, textAlign: 'right' },
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
  gridLabel: { fontSize: type.sm, color: colors.anaMetin, textAlign: 'center' },
  altMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  altLink: { color: colors.anaYesil, fontSize: type.sm },
});
