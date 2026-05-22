import { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { type } from '../constants/type';
import { anlikZikirler, kisaZikirler } from '../lib/data';
import { bugunCumaMi } from '../lib/gunlukSecim';
import GradientArkaPlan from '../components/GradientArkaPlan';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function DuyguButon({ style, onPress, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.timing(scale, {
      toValue: 0.95,
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
      style={[style, { transform: [{ scale }] }]}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      activeOpacity={0.9}
    >
      {children}
    </AnimatedTouchable>
  );
}

const EMOJI = {
  'Korku, kaygı': '😟',
  'Üzüntü, kayıp': '😢',
  'Suçluluk, pişmanlık': '😔',
  'Aciz, çaresiz': '😞',
  'Düşman, baskı': '😠',
  'Şükür, sevinç': '😊',
  'Cuma günü': '🌙',
};

function emojiBul(durum) {
  if (EMOJI[durum]) return EMOJI[durum];
  const d = (durum || '').toLocaleLowerCase('tr-TR');
  if (d.includes('korku') || d.includes('kayg')) return '😟';
  if (d.includes('üzüntü') || d.includes('uzun')) return '😢';
  if (d.includes('suç') || d.includes('piş')) return '😔';
  if (d.includes('aciz') || d.includes('çare')) return '😞';
  if (d.includes('düşman') || d.includes('baski') || d.includes('baskı')) return '😠';
  if (d.includes('şükür') || d.includes('sevin')) return '😊';
  if (d.includes('cuma')) return '🌙';
  return '🤲';
}

export default function AnlikZikirScreen({ navigation }) {
  const cuma = bugunCumaMi();
  const girisOpacity = useRef(new Animated.Value(0)).current;
  const girisTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(girisOpacity, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(girisTranslateY, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [girisOpacity, girisTranslateY]);

  const sirali = useMemo(() => {
    const cumaItem = anlikZikirler.find((a) => (a.durum || '').toLocaleLowerCase('tr-TR').includes('cuma'));
    const digerleri = anlikZikirler.filter((a) => a !== cumaItem);
    if (cuma && cumaItem) return [cumaItem, ...digerleri];
    return digerleri;
  }, [cuma]);

  const ac = (item) => {
    const zikir = kisaZikirler.find((z) => z.id === item.zikir_id);
    if (zikir) navigation.navigate('ZikirDetay', { zikirId: item.zikir_id });
  };

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.baslik}>Şu an ne hissediyorsun?</Text>
        <View style={{ width: 60 }} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        style={{
          opacity: girisOpacity,
          transform: [{ translateY: girisTranslateY }],
        }}
      >
        {sirali.map((item, i) => {
          const zikir = kisaZikirler.find((z) => z.id === item.zikir_id);
          return (
            <DuyguButon
              key={item.durum + i}
              style={[styles.buton, { backgroundColor: item.renk || colors.ortaYesil }]}
              onPress={() => ac(item)}
            >
              <Text style={styles.emoji}>{emojiBul(item.durum)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.durum}>{item.durum}</Text>
                {!!zikir && <Text style={styles.zikirAd}>{zikir.ad}</Text>}
              </View>
            </DuyguButon>
          );
        })}
      </Animated.ScrollView>
    </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  geri: { color: colors.altin, fontSize: 16, width: 60 },
  baslik: { color: colors.anaYesil, fontSize: type.lg, fontWeight: '600', flex: 1, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
  buton: {
    minHeight: 80,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: { fontSize: type['2xl'], marginRight: 14 },
  durum: { color: '#fff', fontSize: type.lg, fontWeight: '600' },
  zikirAd: { color: 'rgba(255,255,255,0.85)', fontSize: type.xs, marginTop: 4 },
});
