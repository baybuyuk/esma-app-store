// Salavat Istatistik ekrani — son 7 gunun bar chart'i + salavat bazli toplam tablo.
// Backend: salavatHaftalikOzet() (7 gun + haftaToplam), salavatTumSayaclar() (id bazli bugun/toplam),
// salavatlariGetir() (id->ad esleme). EsmaIstatistikScreen ile ayni iptalRef cleanup pattern'i.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import {
  salavatHaftalikOzet,
  salavatTumSayaclar,
  salavatlariGetir,
} from '../lib/salavat';
import GradientArkaPlan from '../components/GradientArkaPlan';

const BAR_MAX_YUKSEKLIK = 120; // dp — sabit kalmasi UI dengesi icin gerekli
const BAR_MIN_YUKSEKLIK = 4;   // sifir gunlerde bile gorunur ince cizgi

// "YYYY-MM-DD" -> "5 Haz" (tr-TR locale)
function tarihKisaltma(s) {
  if (!s) return '';
  // ISO yerine yerel saat parsesi — UTC kaymasini engelle
  const [y, m, g] = s.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !g) return s;
  const d = new Date(y, m - 1, g);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// "YYYY-MM-DD" bugun mu?
function bugunMu(s) {
  if (!s) return false;
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return s === `${y}-${m}-${g}`;
}

export default function SalavatIstatistikScreen({ navigation }) {
  const tip = useTipScale();

  const [gunler, setGunler] = useState([]);       // [{tarih, toplam}]
  const [haftaToplam, setHaftaToplam] = useState(0);
  const [salavatSatirlari, setSalavatSatirlari] = useState([]); // [{id, ad, bugun, toplam}]
  const [yuklendi, setYuklendi] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const girisOpacity = useRef(new Animated.Value(0)).current;
  const girisTranslateY = useRef(new Animated.Value(20)).current;
  const iptalRef = useRef(false);

  // Salavat id -> ad eslemesi (statik veri, tek seferlik)
  const adHaritasi = useMemo(() => {
    try {
      const veri = salavatlariGetir();
      const liste = Array.isArray(veri) ? veri : (veri?.salavatlar || []);
      const m = new Map();
      liste.forEach((s) => { if (s?.id) m.set(s.id, s.ad || s.id); });
      return m;
    } catch (e) {
      return new Map();
    }
  }, []);

  const yukle = useCallback(async () => {
    try {
      const [haftalik, tumSayac] = await Promise.all([
        salavatHaftalikOzet(),
        salavatTumSayaclar(),
      ]);
      if (iptalRef.current) return;

      const dolu = Array.isArray(haftalik?.gunler) ? haftalik.gunler : [];
      const toplam = haftalik?.haftaToplam || 0;

      const sayaclar = tumSayac?.sayaclar || {};
      const satirlar = [];
      adHaritasi.forEach((ad, id) => {
        const s = sayaclar[id] || { bugun: 0, toplam: 0 };
        satirlar.push({
          id,
          ad,
          bugun: s.bugun || 0,
          toplam: s.toplam || 0,
        });
      });
      // Toplama gore buyukten kucuge — kullanici en cok cektigini ust gorur
      satirlar.sort((a, b) => b.toplam - a.toplam);

      if (iptalRef.current) return;
      setGunler(dolu);
      setHaftaToplam(toplam);
      setSalavatSatirlari(satirlar);
    } catch (e) {
      if (!iptalRef.current) {
        setGunler([]);
        setHaftaToplam(0);
        setSalavatSatirlari([]);
      }
    } finally {
      if (!iptalRef.current) setYuklendi(true);
    }
  }, [adHaritasi]);

  useEffect(() => {
    iptalRef.current = false;
    yukle();
    return () => {
      iptalRef.current = true;
    };
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

  // Bar chart icin maks deger — sifirsa 1'e dus, bolme hatasini onle
  const maksGun = useMemo(() => {
    if (!gunler.length) return 1;
    const m = Math.max(...gunler.map((g) => g.toplam || 0));
    return m > 0 ? m : 1;
  }, [gunler]);

  const renderBar = useCallback(
    ({ item }) => {
      const oran = (item.toplam || 0) / maksGun;
      const yukseklik = Math.max(
        BAR_MIN_YUKSEKLIK,
        Math.round(oran * BAR_MAX_YUKSEKLIK)
      );
      const bugun = bugunMu(item.tarih);
      return (
        <View style={styles.barSutun}>
          <Text
            style={[
              styles.barSayi,
              { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight },
              bugun && { color: colors.anaYesil, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {item.toplam || 0}
          </Text>
          <View style={styles.barAlan}>
            <View
              style={[
                styles.bar,
                {
                  height: yukseklik,
                  backgroundColor: bugun ? colors.anaYesil : colors.altin,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.barTarih,
              { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight },
              bugun && { color: colors.anaYesil, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {tarihKisaltma(item.tarih)}
          </Text>
        </View>
      );
    },
    [maksGun, tip]
  );

  const renderSatir = useCallback(
    ({ item }) => (
      <View style={styles.satir}>
        <View style={styles.satirOrta}>
          <Text
            style={[styles.satirAd, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}
            numberOfLines={2}
          >
            {item.ad}
          </Text>
          {item.bugun > 0 && (
            <Text
              style={[styles.satirBugun, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}
            >
              Bugün: {item.bugun}
            </Text>
          )}
        </View>
        <View style={styles.satirSag}>
          <Text
            style={[styles.satirToplam, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}
            numberOfLines={1}
          >
            {item.toplam}
          </Text>
          <Text
            style={[styles.satirEtiket, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}
          >
            kez
          </Text>
        </View>
      </View>
    ),
    [tip]
  );

  const bosHaftaMesaji = haftaToplam === 0 && yuklendi
    ? 'Bu hafta henüz salavat çekilmedi.'
    : null;

  // ListHeader — ust kart + bar chart + tablo basligi
  const listHeader = (
    <View>
      {/* Ust kart: hafta toplam */}
      <View style={styles.haftaKart}>
        <Text style={[styles.haftaToplamSayi]}>
          {haftaToplam}
        </Text>
        <Text style={[styles.haftaToplamEtiket, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
          Bu hafta toplam
        </Text>
        <Text style={[styles.haftaToplamAlt, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
          7 günlük çekim
        </Text>
      </View>

      {/* Bar chart */}
      <View style={styles.chartKap}>
        <Text style={[styles.chartBaslik, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
          Son 7 gün
        </Text>
        <View style={styles.chartSatir}>
          {gunler.map((g) => (
            <View key={g.tarih} style={styles.chartHucre}>
              {renderBar({ item: g })}
            </View>
          ))}
        </View>
        {bosHaftaMesaji && (
          <Text style={[styles.bosHaftaYazi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
            {bosHaftaMesaji}
          </Text>
        )}
      </View>

      {/* Tablo basligi */}
      <Text style={[styles.tabloBaslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>
        Salavat Bazında
      </Text>
    </View>
  );

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Geri" hitSlop={12}>
            <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
          </TouchableOpacity>
          <Text
            style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}
            numberOfLines={1}
          >
            Salavat İstatistiği
          </Text>
          <View style={styles.headerSag} />
        </View>

        <Animated.View
          style={{
            flex: 1,
            opacity: girisOpacity,
            transform: [{ translateY: girisTranslateY }],
          }}
        >
          <FlatList
            data={salavatSatirlari}
            keyExtractor={(item) => item.id}
            renderItem={renderSatir}
            ListHeaderComponent={listHeader}
            ItemSeparatorComponent={() => <View style={styles.ayirici} />}
            contentContainerStyle={styles.liste}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.altin}
              />
            }
            initialNumToRender={10}
            windowSize={8}
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
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  geri: { color: colors.altin, fontWeight: '600', minWidth: 80 },
  baslik: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    color: colors.anaYesil,
  },
  headerSag: { minWidth: 80 },

  liste: { paddingHorizontal: 16, paddingBottom: 28 },
  ayirici: { height: 10 },

  // Ust kart
  haftaKart: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.altin,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  haftaToplamSayi: {
    // Sabit display tipi — buyuk rakam okunabilirligi icin yaziKademesi'nden bagimsiz
    fontSize: type.display,
    lineHeight: Math.round(type.display * 1.2),
    color: colors.anaYesil,
    fontWeight: '300',
  },
  haftaToplamEtiket: {
    color: colors.anaMetin,
    fontWeight: '600',
    marginTop: 6,
  },
  haftaToplamAlt: {
    color: colors.ikincilMetin,
    marginTop: 2,
  },

  // Chart
  chartKap: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  chartBaslik: {
    color: colors.ikincilMetin,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  chartSatir: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  chartHucre: {
    flex: 1,
    alignItems: 'center',
  },
  barSutun: {
    alignItems: 'center',
    width: '100%',
  },
  barSayi: {
    color: colors.ikincilMetin,
    marginBottom: 4,
    minHeight: 16,
  },
  barAlan: {
    height: BAR_MAX_YUKSEKLIK,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: 18,
    borderTopLeftRadius: radii.sm,
    borderTopRightRadius: radii.sm,
  },
  barTarih: {
    color: colors.ikincilMetin,
    marginTop: 6,
  },
  bosHaftaYazi: {
    color: colors.ikincilMetin,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    fontStyle: 'italic',
  },

  // Tablo
  tabloBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 12,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 64,
    borderLeftWidth: 3,
    borderLeftColor: colors.altin,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  satirOrta: { flex: 1, paddingRight: 12 },
  satirAd: {
    color: colors.anaYesil,
    fontWeight: '600',
  },
  satirBugun: {
    color: colors.ortaYesil,
    marginTop: 4,
    fontWeight: '600',
  },
  satirSag: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  satirToplam: {
    color: colors.altin,
    fontWeight: '700',
  },
  satirEtiket: {
    color: colors.ikincilMetin,
    marginTop: -2,
  },
});
