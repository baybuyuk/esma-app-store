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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import GradientArkaPlan from '../components/GradientArkaPlan';
import IsinPatlamasi from '../components/IsinPatlamasi';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function OnboardingEsmaScreen({ navigation }) {
  const [veri, setVeri] = useState(null);
  const [patlamaAktif, setPatlamaAktif] = useState(false);

  const ustOpacity = useRef(new Animated.Value(0)).current;
  const ustTranslateY = useRef(new Animated.Value(12)).current;
  const isimOpacity = useRef(new Animated.Value(0)).current;
  const isimScale = useRef(new Animated.Value(0.85)).current;
  const cizgiOpacity = useRef(new Animated.Value(0)).current;
  const esmaOpacity = useRef(new Animated.Value(0)).current;
  const esmaScale = useRef(new Animated.Value(0.82)).current;
  const esmaTranslateY = useRef(new Animated.Value(16)).current;
  const butonOpacity = useRef(new Animated.Value(0)).current;
  const butonTranslateY = useRef(new Animated.Value(16)).current;
  const butonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('userEsma');
        if (raw) setVeri(JSON.parse(raw));
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (!veri) return;
    const patlamaTimer = setTimeout(() => setPatlamaAktif(true), 500);
    Animated.parallel([
      Animated.timing(ustOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ustTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(isimOpacity, {
        toValue: 1,
        delay: 150,
        duration: 540,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(isimScale, {
        toValue: 1,
        delay: 150,
        duration: 540,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cizgiOpacity, {
        toValue: 1,
        delay: 350,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(esmaOpacity, {
        toValue: 1,
        delay: 500,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(esmaScale, {
        toValue: 1,
        delay: 500,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(esmaTranslateY, {
        toValue: 0,
        delay: 500,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(butonOpacity, {
        toValue: 1,
        delay: 800,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(butonTranslateY, {
        toValue: 0,
        delay: 800,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    return () => {
      clearTimeout(patlamaTimer);
    };
  }, [
    veri,
    ustOpacity,
    ustTranslateY,
    isimOpacity,
    isimScale,
    cizgiOpacity,
    esmaOpacity,
    esmaScale,
    esmaTranslateY,
    butonOpacity,
    butonTranslateY,
  ]);

  const baslayalim = () => {
    navigation.reset({ index: 0, routes: [{ name: 'AnaEkran' }] });
  };

  const butonPressIn = () =>
    Animated.timing(butonScale, {
      toValue: 0.96,
      duration: 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  const butonPressOut = () =>
    Animated.timing(butonScale, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

  if (!veri) {
    return (
      <GradientArkaPlan>
        <SafeAreaView style={styles.container}>
          <View style={styles.inner}><Text style={styles.altYazi}>Yükleniyor...</Text></View>
        </SafeAreaView>
      </GradientArkaPlan>
    );
  }

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Animated.Text
          style={[
            styles.ust,
            {
              opacity: ustOpacity,
              transform: [{ translateY: ustTranslateY }],
            },
          ]}
        >
          🌟 {veri.isim_turkce}
        </Animated.Text>

        {veri.bulundu ? (
          <Animated.View
            style={[
              styles.kutu,
              {
                opacity: isimOpacity,
                transform: [{ scale: isimScale }],
              },
            ]}
          >
            <Text style={styles.arapca}>{veri.isim_arapca}</Text>
            <Text style={styles.ebced}>Ebced değerin: {veri.isim_ebced}</Text>
          </Animated.View>
        ) : (
          <Animated.Text
            style={[
              styles.not,
              {
                opacity: isimOpacity,
                transform: [{ scale: isimScale }],
              },
            ]}
          >
            {veri.not}
          </Animated.Text>
        )}

        <Animated.View style={[styles.cizgi, { opacity: cizgiOpacity }]} />

        <Animated.View
          style={{
            alignSelf: 'stretch',
            alignItems: 'center',
            opacity: esmaOpacity,
            transform: [
              { scale: esmaScale },
              { translateY: esmaTranslateY },
            ],
          }}
        >
          <Text style={styles.label}>Senin esman:</Text>
          <Text style={styles.esmaArapca}>{veri.esma.arapca}</Text>
          <Text style={styles.yaEsma}>Yâ {veri.esma.esma}</Text>
          <Text style={styles.anlam}>{veri.esma.anlam}</Text>
        </Animated.View>

        <View style={styles.cizgiInce} />

        <Text style={styles.fazilet}>{veri.esma.fazilet}</Text>

        <View style={styles.bilgiKutusu}>
          <Text style={styles.bilgiSatir}>Gün: {veri.esma.gun}</Text>
          <Text style={styles.bilgiSatir}>Saat: {veri.esma.saat}</Text>
          <Text style={styles.bilgiSatir}>Vakit: {veri.esma.vakit}</Text>
        </View>

        <Animated.View
          style={{
            alignSelf: 'stretch',
            opacity: butonOpacity,
            transform: [{ translateY: butonTranslateY }],
          }}
        >
          <AnimatedTouchable
            style={[styles.buton, { transform: [{ scale: butonScale }] }]}
            onPress={baslayalim}
            onPressIn={butonPressIn}
            onPressOut={butonPressOut}
            activeOpacity={0.9}
          >
            <Text style={styles.butonYazi}>Bismillah, Başlayalım</Text>
          </AnimatedTouchable>
        </Animated.View>
      </ScrollView>
      <IsinPatlamasi aktif={patlamaAktif} boyut={360} />
    </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  inner: { padding: 24, alignItems: 'center' },
  altYazi: { color: colors.ikincilMetin, fontSize: 14 },
  ust: {
    fontSize: 26,
    color: colors.anaYesil,
    marginTop: 12,
    marginBottom: 20,
  },
  kutu: { alignItems: 'center', marginBottom: 16 },
  arapca: { fontSize: type['3xl'], color: colors.anaMetin, marginBottom: 8 },
  ebced: { fontSize: 14, color: colors.ikincilMetin },
  not: {
    fontSize: 14,
    color: colors.ikincilMetin,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  cizgi: {
    height: 1,
    width: '60%',
    backgroundColor: colors.cizgi,
    marginVertical: 20,
  },
  cizgiInce: {
    height: 1,
    width: '40%',
    backgroundColor: colors.cizgi,
    marginVertical: 14,
  },
  label: { fontSize: 14, color: colors.ikincilMetin, marginBottom: 8 },
  esmaArapca: { fontSize: type.display, color: colors.altin, marginBottom: 6 },
  yaEsma: { fontSize: type.xl, color: colors.anaYesil, marginBottom: 6, fontWeight: '600' },
  anlam: { fontSize: 16, color: colors.anaMetin, textAlign: 'center' },
  fazilet: {
    fontSize: 14,
    color: colors.anaMetin,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 12,
  },
  bilgiKutusu: {
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cizgi,
    borderRadius: radii.sm,
    width: '100%',
  },
  bilgiSatir: { fontSize: type.sm, color: colors.anaMetin, marginVertical: 2 },
  buton: {
    backgroundColor: colors.altin,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 28,
    alignSelf: 'stretch',
  },
  butonYazi: { color: '#fff', fontSize: type.lg, fontWeight: '600' },
});
