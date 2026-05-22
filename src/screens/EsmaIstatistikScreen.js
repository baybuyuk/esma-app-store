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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { tumEsmalar } from '../lib/esma';
import { tumEsmaIstatistik } from '../db/db';
import GradientArkaPlan from '../components/GradientArkaPlan';

function tarihFormat(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

export default function EsmaIstatistikScreen({ navigation }) {
  const [satirlar, setSatirlar] = useState([]);
  const [yuklendi, setYuklendi] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const girisOpacity = useRef(new Animated.Value(0)).current;
  const girisTranslateY = useRef(new Animated.Value(20)).current;
  const iptalRef = useRef(false);

  const yukle = useCallback(async () => {
    try {
      const istatistik = (await tumEsmaIstatistik()) || [];
      if (iptalRef.current) return;
      const tumu = tumEsmalar() || [];
      const harita = new Map(tumu.map((e) => [e.no, e]));
      const liste = istatistik
        .map((s) => {
          const esma = harita.get(s.esmaNo);
          if (!esma) return null;
          return {
            esmaNo: s.esmaNo,
            esma,
            toplamSayim: s.toplamSayim || 0,
            sonOkuma: s.sonOkuma || null,
          };
        })
        .filter(Boolean);
      if (!iptalRef.current) setSatirlar(liste);
    } catch (e) {
      if (!iptalRef.current) setSatirlar([]);
    } finally {
      if (!iptalRef.current) setYuklendi(true);
    }
  }, []);

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

  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.satir}
        onPress={() => navigation.navigate('EsmaDetay', { esmaNo: item.esmaNo })}
        activeOpacity={0.85}
      >
        <View style={styles.noRozet}>
          <Text style={styles.noYazi}>{item.esmaNo}</Text>
        </View>
        <View style={styles.ortaBlok}>
          <Text style={styles.yaEsma}>Yâ {item.esma.esma}</Text>
          {!!item.sonOkuma && (
            <Text style={styles.sonOkuma}>Son: {tarihFormat(item.sonOkuma)}</Text>
          )}
        </View>
        <View style={styles.sagBlok}>
          <Text style={styles.toplamSayi}>{item.toplamSayim}</Text>
          <Text style={styles.toplamEtiket}>kez</Text>
        </View>
      </TouchableOpacity>
    ),
    [navigation]
  );

  const bosMesaj = useMemo(() => {
    if (!yuklendi) return null;
    if (satirlar.length === 0) {
      return (
        <View style={styles.bosKutu}>
          <Text style={styles.bosBaslik}>Henüz hiçbir esma okumadın</Text>
          <Text style={styles.bosAlt}>
            Bir esmayı zikretmeye başla, istatistiklerin burada birikir.
          </Text>
        </View>
      );
    }
    return null;
  }, [yuklendi, satirlar.length]);

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Geri">
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.baslik}>📊 Esma İstatistikleri</Text>
        <View style={styles.headerSag} />
      </View>

      <Animated.View
        style={{
          flex: 1,
          opacity: girisOpacity,
          transform: [{ translateY: girisTranslateY }],
        }}
      >
        {bosMesaj ? (
          bosMesaj
        ) : (
          <FlatList
            data={satirlar}
            keyExtractor={(item) => String(item.esmaNo)}
            renderItem={renderItem}
            contentContainerStyle={styles.liste}
            ItemSeparatorComponent={() => <View style={styles.ayirici} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.altin}
              />
            }
            initialNumToRender={12}
            windowSize={10}
          />
        )}
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
  geri: { color: colors.altin, fontSize: type.geri, minWidth: 60 },
  baslik: {
    flex: 1,
    textAlign: 'center',
    fontSize: type.lg,
    fontWeight: '700',
    color: colors.anaYesil,
  },
  headerSag: { minWidth: 60 },

  liste: { paddingHorizontal: 16, paddingBottom: 28 },
  ayirici: { height: 10 },

  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radii.md,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  noRozet: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: colors.anaYesil,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noYazi: { color: '#fff', fontSize: type.sm, fontWeight: '700' },

  ortaBlok: { flex: 1, paddingRight: 10 },
  yaEsma: { fontSize: type.lg, color: colors.anaYesil, fontWeight: '600' },
  sonOkuma: { fontSize: type.xs, color: colors.ikincilMetin, marginTop: 2 },

  sagBlok: { alignItems: 'flex-end' },
  toplamSayi: { fontSize: type.xl, color: colors.altin, fontWeight: '700' },
  toplamEtiket: { fontSize: type.xs, color: colors.ikincilMetin, marginTop: -2 },

  bosKutu: { padding: 36, alignItems: 'center' },
  bosBaslik: {
    fontSize: type.base,
    color: colors.anaYesil,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  bosAlt: {
    fontSize: type.sm,
    color: colors.ikincilMetin,
    textAlign: 'center',
    lineHeight: 20,
  },
});
