import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { type } from '../constants/type';
import { gunlukVakitler, sonrakiVakit, vakitFormat } from '../lib/namaz';
import GradientArkaPlan from '../components/GradientArkaPlan';

const SIRA = [
  ['imsak', 'İmsak'],
  ['gunes', 'Güneş'],
  ['ogle', 'Öğle'],
  ['ikindi', 'İkindi'],
  ['aksam', 'Akşam'],
  ['yatsi', 'Yatsı'],
];

export default function TumVakitlerScreen({ navigation }) {
  const [konum, setKonum] = useState(null);
  const [sehir, setSehir] = useState('');
  const simdi = new Date();

  const satirAnimRef = useRef(
    SIRA.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(-16),
    }))
  ).current;
  const aktifNefesAnim = useRef(new Animated.Value(1)).current;
  const aktifLoopRef = useRef(null);

  useEffect(() => {
    (async () => {
      const en = await AsyncStorage.getItem('enlem');
      const bo = await AsyncStorage.getItem('boylam');
      const s = await AsyncStorage.getItem('sehir');
      if (en && bo) setKonum({ enlem: parseFloat(en), boylam: parseFloat(bo) });
      if (s) setSehir(s);
    })();
  }, []);

  const vakitler = useMemo(() => {
    if (!konum) return null;
    return gunlukVakitler(konum.enlem, konum.boylam);
  }, [konum]);

  const sonraki = useMemo(() => (vakitler ? sonrakiVakit(vakitler, simdi) : null), [vakitler]);

  useEffect(() => {
    if (!vakitler) return;
    const animler = satirAnimRef.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 380,
          delay: i * 60,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(a.translateX, {
          toValue: 0,
          duration: 380,
          delay: i * 60,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(animler).start();
  }, [vakitler, satirAnimRef]);

  useEffect(() => {
    if (aktifLoopRef.current) {
      aktifLoopRef.current.stop();
      aktifLoopRef.current = null;
    }
    if (sonraki?.anahtar) {
      aktifNefesAnim.setValue(1);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(aktifNefesAnim, {
            toValue: 1.015,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(aktifNefesAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      aktifLoopRef.current = loop;
      loop.start();
    } else {
      aktifNefesAnim.setValue(1);
    }
    return () => {
      if (aktifLoopRef.current) {
        aktifLoopRef.current.stop();
        aktifLoopRef.current = null;
      }
      aktifNefesAnim.setValue(1);
    };
  }, [sonraki?.anahtar, aktifNefesAnim]);

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.baslik}>Tüm Vakitler</Text>
        <View style={{ width: 60 }} />
      </View>

      {!!sehir && <Text style={styles.sehir}>{sehir}</Text>}

      {!vakitler ? (
        <Text style={styles.bos}>Konum gerekli.</Text>
      ) : (
        <View style={styles.tablo}>
          {SIRA.map(([anahtar, ad], i) => {
            const t = vakitler[anahtar];
            const aktif = sonraki?.anahtar === anahtar;
            const gecmis = t && t.getTime() < simdi.getTime() && !aktif;
            const a = satirAnimRef[i];
            const transformlar = aktif
              ? [{ translateX: a.translateX }, { scale: aktifNefesAnim }]
              : [{ translateX: a.translateX }];
            return (
              <Animated.View
                key={anahtar}
                style={[
                  styles.satir,
                  aktif && styles.satirAktif,
                  {
                    opacity: a.opacity,
                    transform: transformlar,
                  },
                ]}
              >
                <Text style={[styles.vakit, gecmis && styles.solgun, aktif && styles.aktifYazi]}>
                  {ad}
                </Text>
                <Text style={[styles.saat, gecmis && styles.solgun, aktif && styles.aktifYazi]}>
                  {vakitFormat(t)}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      )}
    </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  geri: { color: colors.altin, fontSize: 16, width: 60 },
  baslik: { color: colors.anaYesil, fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  sehir: { color: colors.ikincilMetin, fontSize: type.sm, paddingHorizontal: 18, marginBottom: 8 },
  bos: { padding: 24, color: colors.ikincilMetin, textAlign: 'center' },
  tablo: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  satir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE9D8',
  },
  satirAktif: { backgroundColor: '#FBF6E6' },
  vakit: { fontSize: 16, color: colors.anaMetin },
  saat: { fontSize: 16, color: colors.anaMetin, fontVariant: ['tabular-nums'] },
  solgun: { color: '#AFA98F' },
  aktifYazi: { color: colors.altin, fontWeight: '700' },
});
