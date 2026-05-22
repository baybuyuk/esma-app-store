// Gunluk Dualar ekrani: iki seviye.
// Seviye 1: kategori listesi (kart grid). Seviye 2: secilen kategorinin dualari.
// secilenKategori state ile gecis (yeni route degil — daha hizli).

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { dualar } from '../lib/data';
import GradientArkaPlan from '../components/GradientArkaPlan';

// Kategori id -> emoji eslemesi.
const IKON = {
  yemek: '🍽️',
  uyku: '😴',
  yolculuk: '🧳',
  sikinti: '💧',
  hastalik: '💊',
  abdest: '🚿',
  tuvalet: '🚪',
  ev: '🏠',
  hava: '🌧️',
  aile: '👨‍👩‍👧',
  cuma: '🕌',
};

function kategoriIkon(id) {
  return IKON[id] || '🤲';
}

export default function DualarScreen({ navigation }) {
  const [secilen, setSecilen] = useState(null); // kategori objesi | null
  const kategoriler = dualar?.kategoriler || [];

  // Gecis animasyonu (sade fade)
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [secilen, fade]);

  const geriBas = () => {
    if (secilen) {
      setSecilen(null);
    } else {
      navigation.goBack();
    }
  };

  // Android donanim geri tusu: kategori detayindaysa once kategoriye don.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (secilen) {
        setSecilen(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [secilen]);

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={geriBas} hitSlop={10}>
            <Text style={styles.geri}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={styles.baslik} numberOfLines={1}>
            {secilen ? secilen.ad : 'Günlük Dualar'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <Animated.View style={{ flex: 1, opacity: fade }}>
          {!secilen ? (
            <KategoriListesi
              kategoriler={kategoriler}
              aciklama={dualar?.aciklama}
              onSec={setSecilen}
            />
          ) : (
            <KategoriDetay kategori={secilen} />
          )}
        </Animated.View>
      </SafeAreaView>
    </GradientArkaPlan>
  );
}

function KategoriListesi({ kategoriler, aciklama, onSec }) {
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {aciklama && <Text style={styles.aciklama}>{aciklama}</Text>}

      <View style={styles.grid}>
        {kategoriler.map((k) => (
          <KategoriKart
            key={k.id}
            kategori={k}
            onPress={() => onSec(k)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function KategoriKart({ kategori, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.timing(scale, {
      toValue: 0.96,
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

  const sayi = kategori.dualar?.length || 0;
  return (
    <Animated.View style={[styles.kategoriKartWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.kategoriKart}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.88}
      >
        <Text style={styles.kategoriEmoji}>{kategoriIkon(kategori.id)}</Text>
        <Text style={styles.kategoriAd} numberOfLines={2}>{kategori.ad}</Text>
        <Text style={styles.kategoriSayi}>{sayi} duâ</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function KategoriDetay({ kategori }) {
  const dualarListe = kategori.dualar || [];
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.detayBaslik}>
        {kategoriIkon(kategori.id)} {kategori.ad}
      </Text>

      {dualarListe.map((d, i) => (
        <View key={`${kategori.id}-${i}`} style={styles.duaKart}>
          <Text style={styles.duaAd}>{d.ad}</Text>
          <Text style={styles.arapca}>{d.arapca}</Text>
          <Text style={styles.okunus}>{d.okunus}</Text>
          <Text style={styles.meal}>{d.meal}</Text>
          {d.not && <Text style={styles.not}>{d.not}</Text>}
          {d.fazilet && <Text style={styles.fazilet}>{d.fazilet}</Text>}
          {d.kaynak && <Text style={styles.kaynak}>— {d.kaynak}</Text>}
        </View>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
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
  geri: { color: colors.altin, fontSize: type.geri, width: 60 },
  baslik: {
    color: colors.anaYesil,
    fontSize: type.lg,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  aciklama: {
    fontSize: type.sm,
    color: colors.ikincilMetin,
    marginVertical: 12,
    lineHeight: 20,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kategoriKartWrap: {
    width: '48%',
    marginBottom: 12,
  },
  kategoriKart: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    borderLeftWidth: 3,
    borderLeftColor: colors.altin,
  },
  kategoriEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  kategoriAd: {
    fontSize: type.base,
    color: colors.anaYesil,
    fontWeight: '600',
    textAlign: 'center',
  },
  kategoriSayi: {
    fontSize: type.xs,
    color: colors.ikincilMetin,
    marginTop: 4,
  },

  detayBaslik: {
    fontSize: type.xl,
    color: colors.anaYesil,
    fontWeight: '700',
    marginVertical: 14,
  },
  duaKart: {
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
  duaAd: {
    fontSize: type.lg,
    color: colors.anaYesil,
    fontWeight: '600',
    marginBottom: 10,
  },
  arapca: {
    fontSize: 24,
    color: colors.anaMetin,
    textAlign: 'right',
    lineHeight: 40,
    marginBottom: 10,
  },
  okunus: {
    fontSize: type.base,
    color: colors.anaMetin,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 6,
  },
  meal: {
    fontSize: type.base,
    color: colors.ikincilMetin,
    lineHeight: 22,
  },
  not: {
    fontSize: type.sm,
    color: colors.altin,
    marginTop: 10,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  fazilet: {
    fontSize: type.sm,
    color: colors.anaMetin,
    marginTop: 10,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  kaynak: {
    fontSize: type.xs,
    color: colors.altin,
    marginTop: 8,
  },
});
