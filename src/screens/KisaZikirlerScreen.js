import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import { kisaZikirler } from '../lib/data';
import GradientArkaPlan from '../components/GradientArkaPlan';

const KAYNAK_RENGI = {
  kuran: { arka: '#E6F0E6', metin: colors.anaYesil, etiket: '📖 KURAN' },
  sahih_hadis: { arka: '#E6EEF5', metin: '#1F4E79', etiket: '📚 SAHİH HADİS' },
};

export default function KisaZikirlerScreen({ navigation }) {
  const tip = useTipScale();
  const girisOpacity = useRef(new Animated.Value(0)).current;
  const girisTranslateY = useRef(new Animated.Value(20)).current;
  const aciklamaOpacity = useRef(new Animated.Value(0)).current;
  const aciklamaTranslateY = useRef(new Animated.Value(20)).current;

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
      Animated.timing(aciklamaOpacity, {
        toValue: 1,
        delay: 100,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(aciklamaTranslateY, {
        toValue: 0,
        delay: 100,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [girisOpacity, girisTranslateY, aciklamaOpacity, aciklamaTranslateY]);

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Kısa Zikirler</Text>
        <View style={{ width: 60 }} />
      </View>
      <Animated.Text
        style={[
          styles.aciklama,
          { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight },
          {
            opacity: aciklamaOpacity,
            transform: [{ translateY: aciklamaTranslateY }],
          },
        ]}
      >
        Kuran ve sahih hadis kaynaklı
      </Animated.Text>

      <Animated.View
        style={{
          flex: 1,
          opacity: girisOpacity,
          transform: [{ translateY: girisTranslateY }],
        }}
      >
        <FlatList
          data={kisaZikirler}
          keyExtractor={(z) => z.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const rozet = KAYNAK_RENGI[item.kaynak_turu] || KAYNAK_RENGI.sahih_hadis;
            return (
              <TouchableOpacity
                style={styles.kart}
                onPress={() => navigation.navigate('ZikirDetay', { zikirId: item.id })}
                activeOpacity={0.85}
              >
                <Text style={[styles.ad, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>{item.ad}</Text>
                <Text style={[styles.arapca, { fontSize: tip.arapca.fontSize, lineHeight: tip.arapca.lineHeight }]} numberOfLines={1}>{item.arapca}</Text>
                <Text style={[styles.meal, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]} numberOfLines={1}>{item.meal}</Text>
                <View style={[styles.rozet, { backgroundColor: rozet.arka }]}>
                  <Text style={[styles.rozetYazi, { color: rozet.metin, fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>{rozet.etiket}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </Animated.View>
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
  baslik: { color: colors.anaYesil, fontWeight: '600', flex: 1, textAlign: 'center' },
  aciklama: {
    color: colors.ikincilMetin,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  kart: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  ad: { color: colors.anaYesil, fontWeight: '600' },
  arapca: { color: colors.anaMetin, marginTop: 6, fontStyle: 'italic' },
  meal: { color: colors.ikincilMetin, marginTop: 4 },
  rozet: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  rozetYazi: { fontWeight: '600' },
});
