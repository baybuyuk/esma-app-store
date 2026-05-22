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
import { esmaById } from '../lib/esma';
import { esmaToplamSayim, esmaGunlukSayim, esmaStreak } from '../db/db';

function bugunIsoTarih() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function EsmaDetayScreen({ route, navigation }) {
  const { esmaNo } = route.params || {};
  const esma = esmaById(esmaNo);
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.geri}>‹ Geri</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bos}>Esma bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Geri">
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
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
        <Animated.Text
          style={[
            styles.yaEsma,
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
          <Text style={styles.ebcedEtiket}>EBCED DEĞERİ</Text>
          <Text style={styles.ebcedNot}>Önerilen zikir sayısı</Text>
        </Animated.View>

        <View style={styles.istatistikKart}>
          <Text style={styles.istatistikBaslik}>📊 İstatistik</Text>
          {istatistik.yuklendi &&
          istatistik.toplam === 0 &&
          istatistik.bugun === 0 &&
          istatistik.streak === 0 ? (
            <Text style={styles.istatistikBos}>Henüz okuma yok</Text>
          ) : (
            <View style={styles.istatistikSatir}>
              <View style={styles.istatistikKutu}>
                <Text style={styles.istatistikSayi}>{istatistik.bugun}</Text>
                <Text style={styles.istatistikEtiket}>Bugün</Text>
              </View>
              <View style={styles.istatistikAyirici} />
              <View style={styles.istatistikKutu}>
                <Text style={styles.istatistikSayi}>{istatistik.toplam}</Text>
                <Text style={styles.istatistikEtiket}>Toplam</Text>
              </View>
              <View style={styles.istatistikAyirici} />
              <View style={styles.istatistikKutu}>
                <Text style={styles.istatistikSayi}>🔥 {istatistik.streak}</Text>
                <Text style={styles.istatistikEtiket}>Streak (gün)</Text>
              </View>
            </View>
          )}
        </View>

        {!!esma.fazilet && (
          <View style={styles.faziletKart}>
            <Text style={styles.faziletBaslik}>✨ Fazilet</Text>
            <Text style={styles.faziletMetin}>{esma.fazilet}</Text>

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
                  <Text style={styles.faziletAltBaslik}>🕯️ Havâs ve Tesirleri</Text>
                  <Text style={styles.faziletDetayMetin}>{gosterilen}</Text>
                  {uzun && (
                    <TouchableOpacity
                      onPress={() => setFaziletAcik((a) => !a)}
                      style={styles.devamButon}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.devamYazi}>
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
          <Text style={styles.rehberBaslik}>📿 Zikir Rehberi</Text>

          <View style={styles.rehberSatir}>
            <Text style={styles.rehberEmoji}>🔢</Text>
            <Text style={styles.rehberMetin}>
              Önerilen sayı:{' '}
              <Text style={styles.rehberVurgu}>{esma.ebced} kez</Text>
            </Text>
          </View>

          <View style={styles.rehberSatir}>
            <Text style={styles.rehberEmoji}>🌅</Text>
            <Text style={styles.rehberMetin}>
              Uygun vakit: <Text style={styles.rehberVurgu}>{esma.vakit}</Text>
            </Text>
          </View>

          <View style={styles.rehberSatir}>
            <Text style={styles.rehberEmoji}>📅</Text>
            <Text style={styles.rehberMetin}>
              Uygun gün: <Text style={styles.rehberVurgu}>{esma.gun}</Text>
            </Text>
          </View>

          <View style={styles.rehberSatir}>
            <Text style={styles.rehberEmoji}>🪐</Text>
            <Text style={styles.rehberMetin}>
              Gezegen saati: <Text style={styles.rehberVurgu}>{esma.saat}</Text>
            </Text>
          </View>
        </View>

        {Array.isArray(esma.tesir) && esma.tesir.length > 0 && (
          <View style={styles.tesirKart}>
            <Text style={styles.tesirBaslik}>🎯 Tesir Alanları</Text>
            <View style={styles.tesirler}>
              {esma.tesir.map((t) => (
                <View key={t} style={styles.tesirRozet}>
                  <Text style={styles.tesirYazi}>{t}</Text>
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
          <Text style={styles.zikretYazi}>🤲 Zikretmeye Başla</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.krem },
  header: { paddingHorizontal: 14, paddingVertical: 12 },
  geri: { color: colors.altin, fontSize: 16 },
  bos: { padding: 28, color: colors.ikincilMetin, textAlign: 'center' },
  scroll: { padding: 24, alignItems: 'center', paddingBottom: 40 },

  arapca: {
    fontSize: 48,
    color: colors.altin,
    textAlign: 'center',
    marginTop: 16,
  },
  yaEsma: {
    fontSize: type['2xl'],
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
    fontSize: type.xs,
    color: colors.anaYesil,
    letterSpacing: 2,
    fontWeight: '600',
  },
  ebcedNot: {
    marginTop: 8,
    fontSize: type.xs,
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
    fontSize: 16,
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 14,
  },
  istatistikBos: {
    fontSize: type.sm,
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
    fontSize: 11,
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
    fontSize: 16,
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 10,
  },
  faziletMetin: {
    fontSize: type.base,
    color: colors.ikincilMetin,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  faziletAyirici: {
    height: 1,
    backgroundColor: colors.cizgi,
    opacity: 0.4,
    marginTop: 14,
    marginBottom: 14,
  },
  faziletAltBaslik: {
    fontSize: 14,
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  faziletDetayMetin: {
    fontSize: 14.5,
    color: colors.ikincilMetin,
    lineHeight: 22,
  },
  devamButon: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  devamYazi: {
    fontSize: type.sm,
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
    fontSize: 16,
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
    fontSize: 14,
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
    fontSize: 16,
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
    fontSize: type.sm,
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
    fontSize: type.lg,
    fontWeight: '700',
  },
});
