import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import { esmaById } from '../lib/esma';
import { esmaToplamSayim, esmaGunlukSayim, esmaStreak } from '../db/db';
import GradientArkaPlan from '../components/GradientArkaPlan';
import KaligrafiHalo from '../components/KaligrafiHalo';

function bugunIsoTarih() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function EsmaDetayScreen({ route, navigation }) {
  const { esmaNo } = route.params || {};
  const esma = esmaById(esmaNo);
  const tip = useTipScale();
  const [istatistik, setIstatistik] = useState({
    yuklendi: false,
    toplam: 0,
    bugun: 0,
    streak: 0,
  });
  const [faziletAcik, setFaziletAcik] = useState(false);

  useEffect(() => {
    if (!esma) return;
    let iptal = false;
    (async () => {
      try {
        const [toplam, bugun, streak] = await Promise.all([
          esmaToplamSayim(esma.no),
          esmaGunlukSayim(esma.no, bugunIsoTarih()),
          esmaStreak(esma.no),
        ]);
        if (iptal) return;
        setIstatistik({
          yuklendi: true,
          toplam: toplam || 0,
          bugun: bugun || 0,
          streak: streak || 0,
        });
      } catch (e) {
        if (!iptal) setIstatistik({ yuklendi: true, toplam: 0, bugun: 0, streak: 0 });
      }
    })();
    return () => {
      iptal = true;
    };
  }, [esma]);

  const arapcaOpacity = useRef(new Animated.Value(0)).current;
  const arapcaScale = useRef(new Animated.Value(0.82)).current;
  const arapcaTranslateY = useRef(new Animated.Value(12)).current;
  const yaEsmaOpacity = useRef(new Animated.Value(0)).current;
  const yaEsmaTranslateY = useRef(new Animated.Value(8)).current;
  const ebcedOpacity = useRef(new Animated.Value(0)).current;
  const ebcedTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!esma) return;
    Animated.parallel([
      Animated.timing(arapcaOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(arapcaScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(arapcaTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(yaEsmaOpacity, {
        toValue: 1,
        delay: 180,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(yaEsmaTranslateY, {
        toValue: 0,
        delay: 180,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ebcedOpacity, {
        toValue: 1,
        delay: 320,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ebcedTranslateY, {
        toValue: 0,
        delay: 320,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    esma,
    arapcaOpacity,
    arapcaScale,
    arapcaTranslateY,
    yaEsmaOpacity,
    yaEsmaTranslateY,
    ebcedOpacity,
    ebcedTranslateY,
  ]);

  if (!esma) {
    return (
      <GradientArkaPlan>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.bos, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Esma bulunamadı.</Text>
        </SafeAreaView>
      </GradientArkaPlan>
    );
  }

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Geri">
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.arapcaSarmal}>
          <KaligrafiHalo boyut={240} />
          <Animated.Text
            style={[
              styles.arapca,
              {
                opacity: arapcaOpacity,
                transform: [
                  { scale: arapcaScale },
                  { translateY: arapcaTranslateY },
                ],
              },
            ]}
          >
            {esma.arapca}
          </Animated.Text>
        </View>
        <Animated.Text
          style={[
            styles.yaEsma,
            { fontSize: tip['2xl'].fontSize, lineHeight: tip['2xl'].lineHeight },
            {
              opacity: yaEsmaOpacity,
              transform: [{ translateY: yaEsmaTranslateY }],
            },
          ]}
        >
          Yâ {esma.esma}
        </Animated.Text>

        <Animated.View
          style={[
            styles.ebcedKart,
            {
              opacity: ebcedOpacity,
              transform: [{ translateY: ebcedTranslateY }],
            },
          ]}
        >
          <Text style={styles.ebcedSayi}>{esma.ebced}</Text>
          <Text style={[styles.ebcedEtiket, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>EBCED DEĞERİ</Text>
          <Text style={[styles.ebcedNot, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>Önerilen zikir sayısı</Text>
        </Animated.View>

        <View style={styles.istatistikKart}>
          <Text style={[styles.istatistikBaslik, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>📊 İstatistik</Text>
          {istatistik.yuklendi &&
          istatistik.toplam === 0 &&
          istatistik.bugun === 0 &&
          istatistik.streak === 0 ? (
            <Text style={[styles.istatistikBos, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>Henüz okuma yok</Text>
          ) : (
            <View style={styles.istatistikSatir}>
              <View style={styles.istatistikKutu}>
                <Text style={styles.istatistikSayi} numberOfLines={1}>{istatistik.bugun}</Text>
                <Text style={[styles.istatistikEtiket, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>Bugün</Text>
              </View>
              <View style={styles.istatistikAyirici} />
              <View style={styles.istatistikKutu}>
                <Text style={styles.istatistikSayi} numberOfLines={1}>{istatistik.toplam}</Text>
                <Text style={[styles.istatistikEtiket, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>Toplam</Text>
              </View>
              <View style={styles.istatistikAyirici} />
              <View style={styles.istatistikKutu}>
                <Text style={styles.istatistikSayi} numberOfLines={1}>🔥 {istatistik.streak}</Text>
                <Text style={[styles.istatistikEtiket, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>Streak (gün)</Text>
              </View>
            </View>
          )}
        </View>

        {!!esma.fazilet && (
          <View style={styles.faziletKart}>
            <Text style={[styles.faziletBaslik, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>✨ Fazilet</Text>
            <Text style={[styles.faziletMetin, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>{esma.fazilet}</Text>

            {!!esma.faziletDetay && (() => {
              const detay = esma.faziletDetay;
              const KESIM = 250;
              const uzun = detay.length > KESIM;
              const gosterilen = !uzun || faziletAcik
                ? detay
                : detay.substring(0, KESIM).trimEnd() + '…';
              return (
                <>
                  <View style={styles.faziletAyirici} />
                  <Text style={[styles.faziletAltBaslik, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>🕯️ Havâs ve Tesirleri</Text>
                  <Text style={[styles.faziletDetayMetin, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>{gosterilen}</Text>
                  {uzun && (
                    <TouchableOpacity
                      onPress={() => setFaziletAcik((a) => !a)}
                      style={styles.devamButon}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.devamYazi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                        {faziletAcik ? 'Daha az göster' : 'Devamını oku'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}
          </View>
        )}

        <View style={styles.rehberKart}>
          <Text style={[styles.rehberBaslik, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>📿 Zikir Rehberi</Text>

          <View style={styles.rehberSatir}>
            <Text style={styles.rehberEmoji}>🔢</Text>
            <Text style={[styles.rehberMetin, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
              Önerilen sayı:{' '}
              <Text style={styles.rehberVurgu}>{esma.ebced} kez</Text>
            </Text>
          </View>

          <View style={styles.rehberSatir}>
            <Text style={styles.rehberEmoji}>🌅</Text>
            <Text style={[styles.rehberMetin, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
              Uygun vakit: <Text style={styles.rehberVurgu}>{esma.vakit}</Text>
            </Text>
          </View>

          <View style={styles.rehberSatir}>
            <Text style={styles.rehberEmoji}>📅</Text>
            <Text style={[styles.rehberMetin, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
              Uygun gün: <Text style={styles.rehberVurgu}>{esma.gun}</Text>
            </Text>
          </View>

          <View style={styles.rehberSatir}>
            <Text style={styles.rehberEmoji}>🪐</Text>
            <Text style={[styles.rehberMetin, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
              Gezegen saati: <Text style={styles.rehberVurgu}>{esma.saat}</Text>
            </Text>
          </View>
        </View>

        {Array.isArray(esma.tesir) && esma.tesir.length > 0 && (
          <View style={styles.tesirKart}>
            <Text style={[styles.tesirBaslik, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>🎯 Tesir Alanları</Text>
            <View style={styles.tesirler}>
              {esma.tesir.map((t) => (
                <View key={t} style={styles.tesirRozet}>
                  <Text style={[styles.tesirYazi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.zikretButon}
          onPress={() =>
            navigation.navigate('ZikirSayac', {
              esmaNo: esma.no,
              hedef: esma.ebced,
            })
          }
          activeOpacity={0.85}
        >
          <Text style={[styles.zikretYazi, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>🤲 Zikretmeye Başla</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { paddingHorizontal: 14, paddingVertical: 12 },
  geri: { color: colors.altin },
  bos: { padding: 28, color: colors.ikincilMetin, textAlign: 'center' },
  scroll: { padding: 24, alignItems: 'center', paddingBottom: 40 },

  arapcaSarmal: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 80,
  },
  arapca: {
    fontSize: 48,
    color: colors.altin,
    textAlign: 'center',
  },
  yaEsma: {
    color: colors.anaYesil,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },

  ebcedKart: {
    marginTop: 28,
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderWidth: 1.5,
    borderColor: colors.altin,
    borderRadius: radii.md,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  ebcedSayi: {
    fontSize: 48,
    color: colors.altin,
    fontWeight: '300',
  },
  ebcedEtiket: {
    marginTop: 6,
    color: colors.anaYesil,
    letterSpacing: 2,
    fontWeight: '600',
  },
  ebcedNot: {
    marginTop: 8,
    color: colors.ikincilMetin,
    fontStyle: 'italic',
  },

  istatistikKart: {
    marginTop: 24,
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: radii.md,
    alignSelf: 'stretch',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  istatistikBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 14,
  },
  istatistikBos: {
    color: colors.ikincilMetin,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  istatistikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  istatistikKutu: {
    flex: 1,
    alignItems: 'center',
  },
  istatistikAyirici: {
    width: 1,
    height: 32,
    backgroundColor: colors.cizgi,
    opacity: 0.5,
  },
  istatistikSayi: {
    fontSize: type.xl,
    color: colors.altin,
    fontWeight: '700',
  },
  istatistikEtiket: {
    color: colors.ikincilMetin,
    marginTop: 4,
    letterSpacing: 0.3,
  },

  faziletKart: {
    marginTop: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.altin,
    borderRadius: radii.md,
    alignSelf: 'stretch',
  },
  faziletBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 10,
  },
  faziletMetin: {
    color: colors.ikincilMetin,
    fontStyle: 'italic',
  },
  faziletAyirici: {
    height: 1,
    backgroundColor: colors.cizgi,
    opacity: 0.4,
    marginTop: 14,
    marginBottom: 14,
  },
  faziletAltBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  faziletDetayMetin: {
    color: colors.ikincilMetin,
  },
  devamButon: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  devamYazi: {
    color: colors.altin,
    fontWeight: '600',
  },

  rehberKart: {
    marginTop: 24,
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: radii.md,
    alignSelf: 'stretch',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  rehberBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 12,
  },
  rehberSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rehberEmoji: {
    fontSize: 18,
    width: 28,
  },
  rehberMetin: {
    flex: 1,
    color: colors.ikincilMetin,
  },
  rehberVurgu: {
    color: colors.altin,
    fontWeight: '600',
  },

  tesirKart: {
    marginTop: 24,
    alignSelf: 'stretch',
  },
  tesirBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 12,
  },
  tesirler: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tesirRozet: {
    backgroundColor: colors.anaYesil,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tesirYazi: {
    color: '#fff',
    fontWeight: '600',
  },

  zikretButon: {
    marginTop: 32,
    alignSelf: 'stretch',
    backgroundColor: colors.altin,
    paddingVertical: 18,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  zikretYazi: {
    color: '#fff',
    fontWeight: '700',
  },
});
