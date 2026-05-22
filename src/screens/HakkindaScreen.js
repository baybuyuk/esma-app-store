import { useEffect, useRef } from 'react';
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
import GradientArkaPlan from '../components/GradientArkaPlan';

export default function HakkindaScreen({ navigation }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const arapcaOpacity = useRef(new Animated.Value(0)).current;
  const arapcaTranslateY = useRef(new Animated.Value(12)).current;
  const surumOpacity = useRef(new Animated.Value(0)).current;
  const lisansOpacity = useRef(new Animated.Value(0)).current;
  const lisansTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(arapcaOpacity, {
        toValue: 1,
        delay: 200,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(arapcaTranslateY, {
        toValue: 0,
        delay: 200,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(surumOpacity, {
        toValue: 1,
        delay: 400,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lisansOpacity, {
        toValue: 1,
        delay: 600,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lisansTranslateY, {
        toValue: 0,
        delay: 600,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    logoOpacity,
    logoScale,
    arapcaOpacity,
    arapcaTranslateY,
    surumOpacity,
    lisansOpacity,
    lisansTranslateY,
  ]);

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.baslik}>Hakkında</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.Text
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          Hu
        </Animated.Text>
        <Animated.Text
          style={[
            styles.arapca,
            {
              opacity: arapcaOpacity,
              transform: [{ translateY: arapcaTranslateY }],
            },
          ]}
        >
          هُو
        </Animated.Text>
        <Animated.Text style={[styles.surum, { opacity: surumOpacity }]}>v1.0.0</Animated.Text>

        <Text style={styles.paragraf}>
          Hu, Müslüman bireyler için sade ve reklamsız bir manevi rutin asistanıdır.
          Sadaka-i câriye niyetiyle yapılmıştır.
        </Text>

        <Animated.View
          style={[
            styles.lisansKutu,
            {
              opacity: lisansOpacity,
              transform: [{ translateY: lisansTranslateY }],
            },
          ]}
        >
          <Text style={styles.lisansSatir}>📖 Meal: Diyanet İşleri Başkanlığı</Text>
          <Text style={styles.lisansSatir}>📚 Hadisler: fawazahmed0/hadith-api (MIT)</Text>
          <Text style={styles.lisansSatir}>🕌 Namaz vakitleri: adhan-js</Text>
          <Text style={styles.lisansSatir}>🌟 Esma faziletleri: Klasik İslami kaynaklar (Bûnî, Gümüşhânevî, Nâzilî)</Text>
          <Text style={styles.lisansSatir}>🔔 Ezan sesi: Wikimedia Commons / Mahfoudou (CC BY-SA 4.0)</Text>
        </Animated.View>

        <Text style={styles.niyet}>🤲 Niyetimiz halis olsun</Text>
      </ScrollView>
    </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  geri: { color: colors.altin, fontSize: 16, width: 60 },
  baslik: { color: colors.anaYesil, fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  scroll: { padding: 24, alignItems: 'center' },
  logo: { fontSize: type.display, color: colors.altin, marginTop: 12 },
  arapca: { fontSize: 40, color: colors.anaMetin, marginTop: 4 },
  surum: { fontSize: type.sm, color: colors.ikincilMetin, marginTop: 8 },
  paragraf: {
    fontSize: 14,
    color: colors.anaMetin,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 22,
    paddingHorizontal: 8,
  },
  lisansKutu: {
    marginTop: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cizgi,
    borderRadius: radii.sm,
    width: '100%',
  },
  lisansSatir: { fontSize: type.xs, color: colors.anaMetin, marginVertical: 3 },
  niyet: {
    marginTop: 28,
    fontSize: 14,
    color: colors.anaYesil,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
