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
import { kisaZikirler } from '../lib/data';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ZikirDetayScreen({ route, navigation }) {
  const { zikirId } = route.params || {};
  const zikir = kisaZikirler.find((z) => z.id === zikirId);

  const g1Opacity = useRef(new Animated.Value(0)).current;
  const g1TranslateY = useRef(new Animated.Value(20)).current;
  const g2Opacity = useRef(new Animated.Value(0)).current;
  const g2TranslateY = useRef(new Animated.Value(20)).current;
  const g3Opacity = useRef(new Animated.Value(0)).current;
  const g3TranslateY = useRef(new Animated.Value(20)).current;
  const butonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!zikir) return;
    const grupAnim = (op, ty, delay) =>
      Animated.parallel([
        Animated.timing(op, {
          toValue: 1,
          duration: 480,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ty, {
          toValue: 0,
          duration: 480,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    Animated.parallel([
      grupAnim(g1Opacity, g1TranslateY, 0),
      grupAnim(g2Opacity, g2TranslateY, 120),
      grupAnim(g3Opacity, g3TranslateY, 240),
    ]).start();
  }, [
    zikir,
    g1Opacity,
    g1TranslateY,
    g2Opacity,
    g2TranslateY,
    g3Opacity,
    g3TranslateY,
  ]);

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

  if (!zikir) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.bos}>Zikir bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View
          style={{
            alignSelf: 'stretch',
            alignItems: 'center',
            opacity: g1Opacity,
            transform: [{ translateY: g1TranslateY }],
          }}
        >
          <Text style={styles.ad}>{zikir.ad}</Text>
        </Animated.View>

        <Animated.View
          style={{
            alignSelf: 'stretch',
            alignItems: 'center',
            opacity: g2Opacity,
            transform: [{ translateY: g2TranslateY }],
          }}
        >
          <Text style={styles.arapca}>{zikir.arapca}</Text>
        </Animated.View>

        <Animated.View
          style={{
            alignSelf: 'stretch',
            alignItems: 'center',
            opacity: g3Opacity,
            transform: [{ translateY: g3TranslateY }],
          }}
        >
          <Text style={styles.okunus}>{zikir.okunus}</Text>
          <Text style={styles.meal}>{zikir.meal}</Text>
        </Animated.View>

        <View style={styles.cizgi} />

        <View style={styles.kaynakKutu}>
          <Text style={styles.kaynak}>📖 {zikir.kaynak}</Text>
        </View>

        {!!zikir.fazilet && <Text style={styles.fazilet}>{zikir.fazilet}</Text>}

        <View style={styles.bilgi}>
          <Text style={styles.bilgiSatir}>Önerilen sayı: {zikir.onerilen_sayi}</Text>
          {!!zikir.vakit && <Text style={styles.bilgiSatir}>Vakit: {zikir.vakit}</Text>}
        </View>

        <AnimatedTouchable
          style={[styles.buton, { transform: [{ scale: butonScale }] }]}
          onPress={() => navigation.navigate('ZikirSayac', { zikirId: zikir.id })}
          onPressIn={butonPressIn}
          onPressOut={butonPressOut}
          activeOpacity={0.9}
        >
          <Text style={styles.butonYazi}>Zikretmeye Başla</Text>
        </AnimatedTouchable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.krem },
  header: { paddingHorizontal: 14, paddingVertical: 12 },
  geri: { color: colors.altin, fontSize: 16 },
  scroll: { padding: 24, alignItems: 'center' },
  bos: { padding: 24, color: colors.ikincilMetin },
  ad: { fontSize: 24, color: colors.anaYesil, fontWeight: '600', marginBottom: 18, textAlign: 'center' },
  arapca: { fontSize: 30, color: colors.anaMetin, textAlign: 'center', lineHeight: 48, marginBottom: 10 },
  okunus: { fontSize: 14, color: colors.ikincilMetin, fontStyle: 'italic', textAlign: 'center', marginBottom: 10 },
  meal: { fontSize: 16, color: colors.anaMetin, textAlign: 'center', lineHeight: 24 },
  cizgi: { height: 1, width: '60%', backgroundColor: colors.cizgi, marginVertical: 20 },
  kaynakKutu: {
    borderWidth: 1,
    borderColor: colors.altin,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    marginBottom: 18,
  },
  kaynak: { color: colors.altin, fontSize: type.sm },
  fazilet: {
    fontSize: 14,
    color: colors.anaMetin,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  bilgi: { alignSelf: 'stretch', alignItems: 'center', marginBottom: 18 },
  bilgiSatir: { color: colors.altin, fontSize: type.sm, marginVertical: 2 },
  buton: {
    backgroundColor: colors.altin,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 8,
  },
  butonYazi: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
