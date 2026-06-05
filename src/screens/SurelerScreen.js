// Kisa Sureler listesi. Detay icin SureDetay'a yonlendirir.
// Su an icin tek sure (Insirah) var; ileride genisleyebilir.

import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { useTipScale } from '../context/YaziKademesiContext';
import { sureler } from '../lib/data';
import GradientArkaPlan from '../components/GradientArkaPlan';

export default function SurelerScreen({ navigation }) {
  const tip = useTipScale();
  const liste = sureler || [];

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Kısa Sûreler</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={[styles.altMetin, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
          Tilâvet eşliğinde okumak için seç.
        </Text>

        <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
          <FlatList
            data={liste}
            keyExtractor={(s) => String(s.no)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.kart}
                onPress={() => navigation.navigate('SureDetay', { sureNo: item.no })}
                activeOpacity={0.85}
                accessibilityLabel={`${item.ad} sûresi`}
                accessibilityRole="button"
              >
                <View style={styles.kartIcerik}>
                  <View style={styles.arapcaCerceve}>
                    <Text style={styles.arapcaAd}>{item.arapca_ad}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.turkceAd, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                      {item.ad} Sûresi
                    </Text>
                    <Text style={[styles.altKart, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                      {item.ayet_sayisi} âyet · {item.inis_yeri}
                    </Text>
                    {item.kisa_aciklama ? (
                      <Text
                        style={[styles.kisaAciklama, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight * 1.2 }]}
                        numberOfLines={2}
                      >
                        {item.kisa_aciklama}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.ok}>›</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[styles.bos, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                Henüz sûre eklenmedi.
              </Text>
            }
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
  altMetin: {
    color: colors.ikincilMetin,
    paddingHorizontal: 22,
    paddingBottom: 12,
    textAlign: 'center',
  },
  kart: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  kartIcerik: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  arapcaCerceve: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDFAF1',
    borderWidth: 1,
    borderColor: colors.cizgi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arapcaAd: {
    fontSize: 22,
    lineHeight: 30,
    color: colors.anaYesil,
    fontWeight: '600',
  },
  turkceAd: { color: colors.anaMetin, fontWeight: '600' },
  altKart: { color: colors.altin, marginTop: 2, fontWeight: '600' },
  kisaAciklama: {
    color: colors.ikincilMetin,
    marginTop: 6,
  },
  ok: { color: colors.altin, fontSize: 26, marginLeft: 6 },
  bos: {
    textAlign: 'center',
    color: colors.ikincilMetin,
    marginTop: 40,
  },
});
