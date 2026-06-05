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
import { useTipScale } from '../context/YaziKademesiContext';
import GradientArkaPlan from '../components/GradientArkaPlan';

export default function OnboardingEsmaAciklamaScreen({ navigation }) {
  const tip = useTipScale();

  const g1Opacity = useRef(new Animated.Value(0)).current;
  const g1TranslateY = useRef(new Animated.Value(18)).current;
  const g2Opacity = useRef(new Animated.Value(0)).current;
  const g2TranslateY = useRef(new Animated.Value(18)).current;
  const g3Opacity = useRef(new Animated.Value(0)).current;
  const g3TranslateY = useRef(new Animated.Value(18)).current;
  const g4Opacity = useRef(new Animated.Value(0)).current;
  const g4TranslateY = useRef(new Animated.Value(18)).current;
  const butonOpacity = useRef(new Animated.Value(0)).current;
  const butonTranslateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const grup = (op, ty, delay) =>
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
      grup(g1Opacity, g1TranslateY, 0),
      grup(g2Opacity, g2TranslateY, 180),
      grup(g3Opacity, g3TranslateY, 360),
      grup(g4Opacity, g4TranslateY, 540),
      grup(butonOpacity, butonTranslateY, 760),
    ]).start();
  }, [
    g1Opacity, g1TranslateY,
    g2Opacity, g2TranslateY,
    g3Opacity, g3TranslateY,
    g4Opacity, g4TranslateY,
    butonOpacity, butonTranslateY,
  ]);

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Animated.View
            style={{
              opacity: g1Opacity,
              transform: [{ translateY: g1TranslateY }],
              alignItems: 'center',
            }}
          >
            <Text style={styles.ust}>HAZIRLANIYOR</Text>
            <Text style={[styles.baslik, { fontSize: tip['2xl'].fontSize, lineHeight: tip['2xl'].lineHeight }]}>
              Esman hesaplandı
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.kart,
              {
                opacity: g2Opacity,
                transform: [{ translateY: g2TranslateY }],
              },
            ]}
          >
            <Text style={[styles.paragraf, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.45 }]}>
              İsmindeki harflerin sayısal değeri <Text style={styles.vurgu}>Ebced</Text> hesabıyla toplandı ve seni Allah'ın 99 isminden birine yönlendirdi.
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.kart,
              {
                opacity: g3Opacity,
                transform: [{ translateY: g3TranslateY }],
              },
            ]}
          >
            <Text style={[styles.paragraf, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.45 }]}>
              Bu isim rastgele değil — sende <Text style={styles.vurgu}>doğuştan en çok ihtiyaç duyduğun</Text> ilahi nitelik üzerinedir. Zikrettikçe Allah'ın bu sıfatından nasibin artar.
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.kartAlt,
              {
                opacity: g4Opacity,
                transform: [{ translateY: g4TranslateY }],
              },
            ]}
          >
            <Text style={[styles.kaynakBaslik, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
              KLASİK GELENEK
            </Text>
            <Text style={[styles.kaynakMetin, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight * 1.35 }]}>
              Bûnî, Gümüşhânevî ve Nâzilî gibi klasik havas kaynaklarında anlatılan bu yöntem, kişiye özel bir ruhi reçete sunar.
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: butonOpacity,
              transform: [{ translateY: butonTranslateY }],
              width: '100%',
              marginTop: 28,
            }}
          >
            <TouchableOpacity
              style={styles.buton}
              activeOpacity={0.85}
              onPress={() => navigation.replace('OnboardingEsma')}
              accessibilityLabel="Esmama bak"
              accessibilityRole="button"
            >
              <Text style={[styles.butonYazi, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                Esmama Bak
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  ust: {
    color: colors.altin,
    fontSize: 12,
    letterSpacing: 2.4,
    fontWeight: '700',
    marginBottom: 10,
  },
  baslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 28,
  },
  kart: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    padding: 18,
    marginBottom: 14,
    width: '100%',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  paragraf: {
    color: colors.anaMetin,
    textAlign: 'left',
  },
  vurgu: {
    color: colors.anaYesil,
    fontWeight: '700',
  },
  kartAlt: {
    backgroundColor: '#FDFAF1',
    borderRadius: radii.md,
    padding: 16,
    marginTop: 6,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  kaynakBaslik: {
    color: colors.altin,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  kaynakMetin: {
    color: colors.anaMetin,
  },
  buton: {
    backgroundColor: colors.anaYesil,
    paddingVertical: 18,
    borderRadius: radii.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  butonYazi: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
