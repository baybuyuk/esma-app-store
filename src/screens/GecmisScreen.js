import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { gunlukKayitlar } from '../db/db';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function tarihFormat(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function namazEtiket(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 5) return '5 vakit';
  if (n >= 3) return '3-4 vakit';
  if (n >= 1) return '1-2 vakit';
  return 'Kılamadım';
}

export default function GecmisScreen({ navigation }) {
  const [kayitlar, setKayitlar] = useState([]);
  const [aktif, setAktif] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [yuklendi, setYuklendi] = useState(false);

  const girisOpacity = useRef(new Animated.Value(0)).current;
  const girisTranslateY = useRef(new Animated.Value(20)).current;
  const kartScaleMap = useRef(new Map()).current;

  const kartScale = useCallback(
    (id) => {
      let v = kartScaleMap.get(id);
      if (!v) {
        v = new Animated.Value(1);
        kartScaleMap.set(id, v);
      }
      return v;
    },
    [kartScaleMap]
  );

  const kartPressIn = useCallback(
    (id) => {
      Animated.timing(kartScale(id), {
        toValue: 0.97,
        duration: 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [kartScale]
  );
  const kartPressOut = useCallback(
    (id) => {
      Animated.timing(kartScale(id), {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [kartScale]
  );

  const yukle = useCallback(async () => {
    try {
      const k = await gunlukKayitlar(30);
      setKayitlar(k || []);
    } catch (e) {
      setKayitlar([]);
    } finally {
      setYuklendi(true);
    }
  }, []);

  useEffect(() => {
    yukle();
  }, [yukle]);

  useEffect(() => {
    if (!yuklendi) return;
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
  }, [yuklendi, girisOpacity, girisTranslateY]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await yukle();
    setRefreshing(false);
  }, [yukle]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.baslik}>Akşam Muhasebesi</Text>
        <View style={{ width: 60 }} />
      </View>

      {yuklendi && kayitlar.length === 0 ? (
        <Text style={styles.bos}>Henüz kayıt yok.</Text>
      ) : (
        <Animated.View
          style={{
            flex: 1,
            opacity: girisOpacity,
            transform: [{ translateY: girisTranslateY }],
          }}
        >
          <FlatList
            data={kayitlar}
            keyExtractor={(k) => String(k.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.altin} />}
            renderItem={({ item }) => (
              <AnimatedTouchable
                style={[styles.kart, { transform: [{ scale: kartScale(item.id) }] }]}
                onPress={() => setAktif(item)}
                onPressIn={() => kartPressIn(item.id)}
                onPressOut={() => kartPressOut(item.id)}
                activeOpacity={0.9}
              >
                <View style={styles.kartUst}>
                  <Text style={styles.tarih}>{tarihFormat(item.tarih)}</Text>
                  <Text style={styles.namaz}>{namazEtiket(item.namaz_sayisi)}</Text>
                </View>
                {!!item.sukur_notu && (
                  <Text style={styles.sukur} numberOfLines={2}>{item.sukur_notu}</Text>
                )}
              </AnimatedTouchable>
            )}
          />
        </Animated.View>
      )}

      <Modal visible={!!aktif} animationType="slide" onRequestClose={() => setAktif(null)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setAktif(null)}>
              <Text style={styles.geri}>Kapat</Text>
            </TouchableOpacity>
            <Text style={styles.baslik}>{aktif ? tarihFormat(aktif.tarih) : ''}</Text>
            <View style={{ width: 60 }} />
          </View>
          {!!aktif && (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.detayLabel}>Namaz</Text>
              <Text style={styles.detayDeger}>{namazEtiket(aktif.namaz_sayisi)}</Text>
              <Text style={styles.detayLabel}>Şükür</Text>
              <Text style={styles.detayDeger}>{aktif.sukur_notu || '—'}</Text>
              <Text style={styles.detayLabel}>İyilik</Text>
              <Text style={styles.detayDeger}>{aktif.iyilik_notu || '—'}</Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.krem },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  geri: { color: colors.altin, fontSize: 16, width: 60 },
  baslik: { color: colors.anaYesil, fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  bos: { padding: 28, color: colors.ikincilMetin, textAlign: 'center' },
  kart: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
  },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  tarih: { color: colors.anaYesil, fontSize: 14, fontWeight: '600' },
  namaz: { color: colors.altin, fontSize: 13 },
  sukur: { color: colors.ikincilMetin, fontSize: 13, fontStyle: 'italic' },
  detayLabel: { color: colors.altin, fontSize: 13, marginTop: 14, marginBottom: 4 },
  detayDeger: { color: colors.anaMetin, fontSize: 15, lineHeight: 22 },
});
