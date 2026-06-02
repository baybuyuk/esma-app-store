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
import { useYaziKademesi, useTipScale } from '../context/YaziKademesiContext';
import GradientArkaPlan from '../components/GradientArkaPlan';

const KADEME_KARTLARI = [
  { id: 'kucuk', etiket: 'Küçük', orneklemPt: 18 },
  { id: 'normal', etiket: 'Normal', orneklemPt: 22 },
  { id: 'buyuk', etiket: 'Büyük', orneklemPt: 28 },
];

export default function ErisilebilirlikScreen({ navigation }) {
  const { kademe, setKademe } = useYaziKademesi();
  const tip = useTipScale();

  // Onizleme metni icin tek-yonlu fade gecisi (kademe degisiminde tetiklenir)
  const onizlemeOpacity = useRef(new Animated.Value(1)).current;
  const oncekiKademeRef = useRef(kademe);

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

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Erişilebilirlik</Text>
          <View style={{ width: 60 }} />
        </View>

        <Animated.View style={[styles.onizlemeKart, { opacity: onizlemeOpacity }]}>
          <Text style={[styles.onizlemeEtiket, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>ÖNİZLEME</Text>
          <Text
            style={[
              styles.onizlemeBaslik,
              { fontSize: tip.xl.fontSize, lineHeight: tip.xl.lineHeight },
            ]}
          >
            Esmaü'l-Hüsna
          </Text>
          <Text
            style={[
              styles.onizlemeGovde,
              { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight },
            ]}
          >
            Allah celle celâlühû'nun güzel isimleri ile zikret, kalbini O'na bağla.
          </Text>
          <Text
            style={[
              styles.onizlemeMeta,
              { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight },
            ]}
          >
            1 / 99
          </Text>
        </Animated.View>

        <Text style={[styles.bolumBaslik, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>Yazı boyutu</Text>

        <View style={styles.kademeSatir}>
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
                <Text
                  style={[
                    styles.kademeEtiket,
                    { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight },
                    secili && styles.kademeEtiketSecili,
                  ]}
                >
                  {k.etiket}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.ipucu, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
          Değişiklik anında uygulanır, ayrıca kaydetmeniz gerekmez.
        </Text>
      </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  geri: { color: colors.altin, width: 60 },
  baslik: {
    color: colors.anaYesil,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  onizlemeKart: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: radii.md,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  onizlemeEtiket: {
    color: colors.altin,
    letterSpacing: 1.4,
    fontWeight: '700',
    marginBottom: 8,
  },
  onizlemeBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 8,
  },
  onizlemeGovde: {
    color: colors.anaMetin,
    marginBottom: 10,
  },
  onizlemeMeta: {
    color: colors.ikincilMetin,
  },

  bolumBaslik: {
    color: colors.ikincilMetin,
    letterSpacing: 1.4,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 10,
    marginHorizontal: 16,
  },

  kademeSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
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
    color: colors.ikincilMetin,
    fontWeight: '600',
  },
  kademeEtiketSecili: {
    color: colors.anaYesil,
  },

  ipucu: {
    marginTop: 22,
    marginHorizontal: 16,
    color: colors.ikincilMetin,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
