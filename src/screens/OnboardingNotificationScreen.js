import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { type } from '../constants/type';
import { izinIste, namazBildirimleriniKur } from '../lib/bildirim';
import { gunlukVakitler } from '../lib/namaz';
import GradientArkaPlan from '../components/GradientArkaPlan';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function OnboardingNotificationScreen({ navigation }) {
  const [yukleniyor, setYukleniyor] = useState(false);

  const g1Opacity = useRef(new Animated.Value(0)).current;
  const g1TranslateY = useRef(new Animated.Value(18)).current;
  const g2Opacity = useRef(new Animated.Value(0)).current;
  const g2TranslateY = useRef(new Animated.Value(18)).current;
  const g3Opacity = useRef(new Animated.Value(0)).current;
  const g3TranslateY = useRef(new Animated.Value(18)).current;
  const evetScale = useRef(new Animated.Value(1)).current;
  const evetPulse = useRef(new Animated.Value(1)).current;
  const evetBirlesik = useRef(Animated.multiply(evetScale, evetPulse)).current;
  const oncekiYukleniyorRef = useRef(false);

  useEffect(() => {
    const grupAnim = (op, ty, delay) =>
      Animated.parallel([
        Animated.timing(op, {
          toValue: 1,
          duration: 460,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ty, {
          toValue: 0,
          duration: 460,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    Animated.parallel([
      grupAnim(g1Opacity, g1TranslateY, 0),
      grupAnim(g2Opacity, g2TranslateY, 100),
      grupAnim(g3Opacity, g3TranslateY, 220),
    ]).start();
  }, [
    g1Opacity,
    g1TranslateY,
    g2Opacity,
    g2TranslateY,
    g3Opacity,
    g3TranslateY,
  ]);

  useEffect(() => {
    if (yukleniyor && !oncekiYukleniyorRef.current) {
      Animated.sequence([
        Animated.timing(evetPulse, {
          toValue: 1.04,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(evetPulse, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
    oncekiYukleniyorRef.current = yukleniyor;
  }, [yukleniyor, evetPulse]);

  const evetPressIn = () =>
    Animated.timing(evetScale, {
      toValue: 0.96,
      duration: 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  const evetPressOut = () =>
    Animated.timing(evetScale, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

  const evet = async () => {
    try {
      setYukleniyor(true);
      const izin = await izinIste();
      await AsyncStorage.setItem('bildirimAcik', izin ? '1' : '0');
      if (izin) {
        const enlem = parseFloat((await AsyncStorage.getItem('enlem')) || '41');
        const boylam = parseFloat((await AsyncStorage.getItem('boylam')) || '29');
        const vakitler = gunlukVakitler(enlem, boylam);
        await namazBildirimleriniKur(vakitler);
      }
    } finally {
      navigation.navigate('OnboardingEsma');
    }
  };

  const hayir = async () => {
    await AsyncStorage.setItem('bildirimAcik', '0');
    navigation.navigate('OnboardingEsma');
  };

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Animated.Text
          style={[
            styles.baslik,
            {
              opacity: g1Opacity,
              transform: [{ translateY: g1TranslateY }],
            },
          ]}
        >
          Bildirim izni
        </Animated.Text>
        <Animated.Text
          style={[
            styles.aciklama,
            {
              opacity: g2Opacity,
              transform: [{ translateY: g2TranslateY }],
            },
          ]}
        >
          Namaz vakitlerini yumuşak bir tonla hatırlatalım mı?
        </Animated.Text>

        <Animated.View
          style={{
            opacity: g3Opacity,
            transform: [{ translateY: g3TranslateY }],
          }}
        >
          <AnimatedTouchable
            style={[
              styles.buton,
              yukleniyor && styles.butonPasif,
              { transform: [{ scale: evetBirlesik }] },
            ]}
            onPress={evet}
            onPressIn={evetPressIn}
            onPressOut={evetPressOut}
            disabled={yukleniyor}
            activeOpacity={0.9}
          >
            {yukleniyor ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.butonYazi}>Evet, Bildir</Text>
            )}
          </AnimatedTouchable>

          <TouchableOpacity style={styles.butonIkincil} onPress={hayir} disabled={yukleniyor}>
            <Text style={styles.butonIkincilYazi}>Şimdilik Hayır</Text>
          </TouchableOpacity>

          <Text style={styles.not}>
            Bildirim almak istemesen de uygulama yine çalışır.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  inner: { flex: 1, padding: 28, justifyContent: 'center' },
  baslik: {
    fontSize: 26,
    color: colors.anaYesil,
    marginBottom: 12,
    textAlign: 'center',
  },
  aciklama: {
    fontSize: type.base,
    color: colors.ikincilMetin,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  buton: {
    backgroundColor: colors.altin,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  butonPasif: { opacity: 0.5 },
  butonYazi: { color: '#fff', fontSize: type.lg, fontWeight: '600' },
  butonIkincil: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  butonIkincilYazi: { color: colors.anaYesil, fontSize: 16 },
  not: {
    marginTop: 24,
    fontSize: type.xs,
    color: colors.ikincilMetin,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
