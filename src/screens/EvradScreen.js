// Sabah / Aksam Evradi ekrani.
// route.params.tip = 'sabah' | 'aksam'
// Her madde icin sayac (+1) ile hedef tekrar sayisina ulasinca tamamlanir.
// Yasli dostu: buyuk dokunma alani, net tipografi, dokunsal geri bildirim.

import { useMemo, useRef, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import { sabahEvradi, aksamEvradi } from '../lib/data';
import GradientArkaPlan from '../components/GradientArkaPlan';

export default function EvradScreen({ navigation, route }) {
  const yazi = useTipScale();
  const tip = route?.params?.tip === 'aksam' ? 'aksam' : 'sabah';
  const veri = tip === 'aksam' ? aksamEvradi : sabahEvradi;
  const maddeler = veri?.maddeler || [];

  // Her madde icin sayac: { [no]: gecerli }
  const [sayaclar, setSayaclar] = useState(() => {
    const obj = {};
    for (const m of maddeler) obj[m.no] = 0;
    return obj;
  });

  const arttir = (madde) => {
    const su = sayaclar[madde.no] || 0;
    if (su >= madde.tekrar) return; // hedef dolu, kilitli
    const yeni = su + 1;
    const yeniDurum = { ...sayaclar, [madde.no]: yeni };
    setSayaclar(yeniDurum);
    if (yeni >= madde.tekrar) {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    } else {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    }
  };

  const tamamlanan = useMemo(
    () => maddeler.filter((m) => (sayaclar[m.no] || 0) >= m.tekrar).length,
    [sayaclar, maddeler]
  );
  const toplam = maddeler.length;
  const hepsiBitti = toplam > 0 && tamamlanan === toplam;

  const baslik = tip === 'aksam' ? 'Akşam Evrâdı' : 'Sabah Evrâdı';

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.geri, { fontSize: yazi.geri.fontSize, lineHeight: yazi.geri.lineHeight }]}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={[styles.baslik, { fontSize: yazi.lg.fontSize, lineHeight: yazi.lg.lineHeight }]}>{baslik}</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={[styles.vakit, { fontSize: yazi.sm.fontSize, lineHeight: yazi.sm.lineHeight }]}>{veri?.vakit || ''}</Text>

        <View style={styles.ilerleme}>
          <Text style={[styles.ilerlemeYazi, { fontSize: yazi.sm.fontSize, lineHeight: yazi.sm.lineHeight }]}>
            {tamamlanan} / {toplam} tamamlandı
          </Text>
          <View style={styles.barArka}>
            <View
              style={[
                styles.barDolu,
                {
                  width: `${toplam > 0 ? (tamamlanan / toplam) * 100 : 0}%`,
                  backgroundColor: hepsiBitti ? colors.ortaYesil : colors.altin,
                },
              ]}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {veri?.aciklama && (
            <Text style={[styles.aciklama, { fontSize: yazi.sm.fontSize, lineHeight: yazi.sm.lineHeight }]}>{veri.aciklama}</Text>
          )}

          {hepsiBitti && (
            <View style={styles.bitisKart}>
              <Text style={styles.bitisEmoji}>🤲</Text>
              <Text style={[styles.bitisBaslik, { fontSize: yazi.lg.fontSize, lineHeight: yazi.lg.lineHeight }]}>
                {tip === 'aksam'
                  ? 'Akşam evrâdın tamamlandı'
                  : 'Sabah evrâdın tamamlandı'}
              </Text>
              <Text style={[styles.bitisAlt, { fontSize: yazi.base.fontSize, lineHeight: yazi.base.lineHeight }]}>Allah kabul etsin.</Text>
            </View>
          )}

          {maddeler.map((madde) => (
            <MaddeKart
              key={madde.no}
              madde={madde}
              gecerli={sayaclar[madde.no] || 0}
              onArtir={() => arttir(madde)}
              yazi={yazi}
            />
          ))}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </GradientArkaPlan>
  );
}

function MaddeKart({ madde, gecerli, onArtir, yazi }) {
  const tamam = gecerli >= madde.tekrar;
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 80,
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
    <View style={[styles.kart, tamam && styles.kartTamam]}>
      <View style={styles.kartUst}>
        <View style={styles.noRozet}>
          <Text style={[styles.noYazi, { fontSize: yazi.sm.fontSize, lineHeight: yazi.sm.lineHeight }]}>{madde.no}</Text>
        </View>
        <Text style={[styles.ad, { fontSize: yazi.lg.fontSize, lineHeight: yazi.lg.lineHeight }]} numberOfLines={2}>{madde.ad}</Text>
        {tamam && <Text style={styles.tik}>✓</Text>}
      </View>

      <Text style={[styles.arapca, { fontSize: yazi.arapcaBuyuk.fontSize, lineHeight: yazi.arapcaBuyuk.lineHeight }]}>{madde.arapca}</Text>
      <Text style={[styles.okunus, { fontSize: yazi.base.fontSize, lineHeight: yazi.base.lineHeight }]}>{madde.okunus}</Text>
      <Text style={[styles.meal, { fontSize: yazi.base.fontSize, lineHeight: yazi.base.lineHeight }]}>{madde.meal}</Text>

      <View style={styles.sayacSatir}>
        <View style={styles.sayacBilgi}>
          <Text style={styles.sayacRakam}>
            {gecerli}
            <Text style={styles.sayacHedef}> / {madde.tekrar}</Text>
          </Text>
          <Text style={[styles.sayacEtiket, { fontSize: yazi.xs.fontSize, lineHeight: yazi.xs.lineHeight }]}>
            {tamam ? 'tamamlandı' : 'tekrar'}
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            onPress={onArtir}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={tamam}
            activeOpacity={0.85}
            style={[styles.artiButon, tamam && styles.artiButonKapali]}
          >
            <Text style={styles.artiYazi}>{tamam ? '✓' : '+1'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {(madde.kaynak || madde.fazilet) && (
        <View style={styles.altBilgi}>
          {madde.fazilet && (
            <Text style={[styles.fazilet, { fontSize: yazi.sm.fontSize, lineHeight: yazi.sm.lineHeight }]}>{madde.fazilet}</Text>
          )}
          {madde.kaynak && (
            <Text style={[styles.kaynak, { fontSize: yazi.xs.fontSize, lineHeight: yazi.xs.lineHeight }]}>— {madde.kaynak}</Text>
          )}
        </View>
      )}
    </View>
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
  vakit: {
    paddingHorizontal: 16,
    color: colors.ikincilMetin,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  ilerleme: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  ilerlemeYazi: {
    color: colors.anaMetin,
    marginBottom: 6,
    fontWeight: '600',
  },
  barArka: {
    height: 8,
    borderRadius: radii.sm,
    backgroundColor: '#E8E1CC',
    overflow: 'hidden',
  },
  barDolu: {
    height: '100%',
    borderRadius: radii.sm,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  aciklama: {
    color: colors.ikincilMetin,
    marginVertical: 10,
  },

  bitisKart: {
    backgroundColor: colors.anaYesil,
    borderRadius: radii.md,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  bitisEmoji: { fontSize: 40, marginBottom: 6 },
  bitisBaslik: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  bitisAlt: {
    color: colors.kremAlt,
    marginTop: 6,
  },

  kart: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    borderLeftWidth: 3,
    borderLeftColor: colors.altin,
  },
  kartTamam: {
    borderLeftColor: colors.ortaYesil,
    backgroundColor: '#F4F8F2',
  },
  kartUst: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  noRozet: {
    width: 32,
    height: 32,
    borderRadius: radii.lg,
    backgroundColor: colors.altin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noYazi: { color: '#fff', fontWeight: '700' },
  ad: {
    flex: 1,
    color: colors.anaYesil,
    fontWeight: '600',
  },
  tik: {
    fontSize: 22,
    color: colors.ortaYesil,
    fontWeight: '700',
    marginLeft: 6,
  },

  arapca: {
    color: colors.anaMetin,
    textAlign: 'right',
    marginVertical: 8,
  },
  okunus: {
    color: colors.anaMetin,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  meal: {
    color: colors.ikincilMetin,
  },

  sayacSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.kremAlt,
  },
  sayacBilgi: {
    flex: 1,
  },
  sayacRakam: {
    fontSize: type.xl,
    color: colors.anaYesil,
    fontWeight: '700',
  }, // rakam — sabit
  sayacHedef: {
    fontSize: type.base,
    color: colors.ikincilMetin,
    fontWeight: '400',
  },
  sayacEtiket: {
    color: colors.ikincilMetin,
    marginTop: 2,
    letterSpacing: 0.8,
  },
  artiButon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.anaYesil,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  artiButonKapali: {
    backgroundColor: colors.ortaYesil,
  },
  artiYazi: {
    color: '#fff',
    fontSize: type.xl,
    fontWeight: '700',
  },

  altBilgi: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0E8CF',
  },
  fazilet: {
    color: colors.anaMetin,
    fontStyle: 'italic',
  },
  kaynak: {
    color: colors.altin,
    marginTop: 4,
  },
});
