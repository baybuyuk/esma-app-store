import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { useYaziKademesi, useTipScale } from '../context/YaziKademesiContext';
import GradientArkaPlan from '../components/GradientArkaPlan';

const KADEME_KARTLARI = [
  { id: 'kucuk', etiket: 'Küçük', orneklemPt: 18 },
  { id: 'normal', etiket: 'Normal', orneklemPt: 22 },
  { id: 'buyuk', etiket: 'Büyük', orneklemPt: 28 },
];

export default function OnboardingYaziBoyutuScreen({ navigation }) {
  const { kademe, setKademe } = useYaziKademesi();
  const tip = useTipScale();

  const onizlemeOpacity = useRef(new Animated.Value(1)).current;
  const oncekiKademeRef = useRef(kademe);

  const g1Opacity = useRef(new Animated.Value(0)).current;
  const g1TranslateY = useRef(new Animated.Value(18)).current;
  const g2Opacity = useRef(new Animated.Value(0)).current;
  const g2TranslateY = useRef(new Animated.Value(18)).current;
  const g3Opacity = useRef(new Animated.Value(0)).current;
  const g3TranslateY = useRef(new Animated.Value(18)).current;

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
  }, [g1Opacity, g1TranslateY, g2Opacity, g2TranslateY, g3Opacity, g3TranslateY]);

  useEffect(() => {
    if (oncekiKademeRef.current === kademe) return;
    oncekiKademeRef.current = kademe;
    Animated.sequence([
      Animated.timing(onizlemeOpacity, {
        toValue: 0.45,
        duration: 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(onizlemeOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [kademe, onizlemeOpacity]);

  const kademeyiSec = (yeni) => {
    if (yeni === kademe) return;
    try { Haptics.selectionAsync(); } catch (e) {}
    setKademe(yeni);
  };

  const devam = () => navigation.navigate('OnboardingLocation');

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Animated.Text
            style={[
              styles.baslik,
              { opacity: g1Opacity, transform: [{ translateY: g1TranslateY }] },
            ]}
          >
            Yazıları rahat okuyor musun?
          </Animated.Text>

          <Animated.Text
            style={[
              styles.aciklama,
              { opacity: g1Opacity, transform: [{ translateY: g1TranslateY }] },
            ]}
          >
            Sana en uygun yazı boyutunu seç. Daha sonra Ayarlar'dan da değiştirebilirsin.
          </Animated.Text>

          <Animated.View
            style={[
              styles.onizlemeKart,
              {
                opacity: Animated.multiply(g2Opacity, onizlemeOpacity),
                transform: [{ translateY: g2TranslateY }],
              },
            ]}
          >
            <Text
              style={[
                styles.onizlemeGovde,
                { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight },
              ]}
            >
              Allah celle celâlühû'nun güzel isimleri ile zikret.
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.kademeSatir,
              { opacity: g3Opacity, transform: [{ translateY: g3TranslateY }] },
            ]}
          >
            {KADEME_KARTLARI.map((k) => {
              const secili = k.id === kademe;
              return (
                <TouchableOpacity
                  key={k.id}
                  style={[styles.kademeKart, secili && styles.kademeKartSecili]}
                  onPress={() => kademeyiSec(k.id)}
                  activeOpacity={0.85}
                  accessibilityLabel={`Yazi boyutu ${k.etiket}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: secili }}
                >
                  {secili && (
                    <View style={styles.tikRozet}>
                      <Text style={styles.tikYazi}>✓</Text>
                    </View>
                  )}
                  <Text style={[styles.kademeAa, { fontSize: k.orneklemPt }]}>Aa</Text>
                  <Text style={[styles.kademeEtiket, secili && styles.kademeEtiketSecili]}>
                    {k.etiket}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          <Animated.View
            style={{
              opacity: g3Opacity,
              transform: [{ translateY: g3TranslateY }],
            }}
          >
            <TouchableOpacity
              style={styles.buton}
              onPress={devam}
              activeOpacity={0.9}
              accessibilityLabel="Devam Et"
            >
              <Text style={styles.butonYazi}>Devam</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  baslik: {
    fontSize: 26,
    color: colors.anaYesil,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  aciklama: {
    fontSize: type.base,
    color: colors.ikincilMetin,
    marginBottom: 26,
    textAlign: 'center',
    lineHeight: 22,
  },
  onizlemeKart: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cizgi,
    marginBottom: 22,
  },
  onizlemeGovde: {
    color: colors.anaMetin,
    textAlign: 'center',
  },
  kademeSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 28,
  },
  kademeKart: {
    flex: 1,
    minHeight: 110,
    minWidth: 88,
    backgroundColor: '#fff',
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cizgi,
  },
  kademeKartSecili: {
    borderColor: colors.altin,
    backgroundColor: '#FFF9E8',
  },
  tikRozet: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tikYazi: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 14,
  },
  kademeAa: {
    color: colors.anaMetin,
    fontWeight: '600',
    marginBottom: 8,
  },
  kademeEtiket: {
    fontSize: type.base,
    color: colors.ikincilMetin,
    fontWeight: '600',
  },
  kademeEtiketSecili: {
    color: colors.anaYesil,
  },
  buton: {
    backgroundColor: colors.altin,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  butonYazi: {
    color: '#fff',
    fontSize: type.lg,
    fontWeight: '600',
  },
});
