// Kible pusulasi.
// Magnetometer + konum -> Kabe yonune sapma hesabi.
// Yasli dostu: buyuk daire, net renk geri bildirim, kisa metin.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { kibleBearing, kibleSapma, kabeMesafeKm } from '../lib/kible';
import GradientArkaPlan from '../components/GradientArkaPlan';

const PUSULA_BOYUT = 300;

export default function KibleScreen({ navigation }) {
  const [konum, setKonum] = useState(null); // { enlem, boylam } | null
  const [heading, setHeading] = useState(0); // 0-360 derece (cihaz kuzeyden sapma)
  const [sensorVar, setSensorVar] = useState(true);
  const [konumDurum, setKonumDurum] = useState('yukleniyor'); // yukleniyor | tamam | yok
  const subRef = useRef(null);

  // Pusula donmesi icin animasyon degeri (derece -> transform rotate).
  const pusulaRotasyon = useRef(new Animated.Value(0)).current;
  const onceki = useRef(0);

  // Konum yukle: 1) son bilinen 2) guncel 3) AsyncStorage fallback.
  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let pos = await Location.getLastKnownPositionAsync({});
          if (!pos) {
            try {
              pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
            } catch (e) {}
          }
          if (!iptal && pos?.coords) {
            setKonum({ enlem: pos.coords.latitude, boylam: pos.coords.longitude });
            setKonumDurum('tamam');
            return;
          }
        }
        // Fallback: AsyncStorage.
        const [en, bo] = await Promise.all([
          AsyncStorage.getItem('enlem'),
          AsyncStorage.getItem('boylam'),
        ]);
        if (!iptal) {
          if (en && bo) {
            setKonum({ enlem: parseFloat(en), boylam: parseFloat(bo) });
            setKonumDurum('tamam');
          } else {
            setKonumDurum('yok');
          }
        }
      } catch (e) {
        if (!iptal) setKonumDurum('yok');
      }
    })();
    return () => {
      iptal = true;
    };
  }, []);

  // Magnetometer dinleyici.
  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const mevcut = await Magnetometer.isAvailableAsync();
        if (!mevcut) {
          if (!iptal) setSensorVar(false);
          return;
        }
        // Android 12+ varsayilan 200ms alt sinir; daha hizliya HIGH_SAMPLING_RATE_SENSORS izni gerek.
        Magnetometer.setUpdateInterval(200);
        const sub = Magnetometer.addListener((data) => {
          // x,y duzleminde aci. Kuzeyden saat yonune sapma (0=Kuzey, 90=Dogu).
          const { x, y } = data;
          let angle = Math.atan2(y, x) * (180 / Math.PI);
          // Atan2(y,x) Kuzey'i 90'a yerlestirir; "Kuzey=0" eksenine donduruyoruz.
          angle = 90 - angle;
          if (angle < 0) angle += 360;
          if (angle >= 360) angle -= 360;
          if (!iptal) setHeading(angle);
        });
        subRef.current = sub;
      } catch (e) {
        if (!iptal) setSensorVar(false);
      }
    })();
    return () => {
      iptal = true;
      if (subRef.current) {
        subRef.current.remove();
        subRef.current = null;
      }
      try {
        Magnetometer.removeAllListeners();
      } catch (e) {}
    };
  }, []);

  // Hedef bearing (Kabe yonu) ve sapma.
  const hedefBearing = useMemo(() => {
    if (!konum) return 0;
    return kibleBearing(konum.enlem, konum.boylam);
  }, [konum]);

  const sapma = useMemo(() => {
    if (!konum) return 0;
    return kibleSapma(konum.enlem, konum.boylam, heading);
  }, [konum, heading]);

  const mesafe = useMemo(() => {
    if (!konum) return null;
    return Math.round(kabeMesafeKm(konum.enlem, konum.boylam));
  }, [konum]);

  // Pusula daire donmesi: cihaz donduginde daire ters yonde donsun ki
  // Kabe isareti dunyada sabit kalsin (yukari = kible olunca dogru yon).
  // Daire rotasyonu = -heading + hedefBearing. Bu durumda Kabe isareti
  // tam yukaridayken (0 derece) kullanici dogru yondedir.
  // Ancak biz daireyi her zaman -heading ile dondurelim, Kabe isareti
  // dairenin uzerinde hedefBearing'de yer alsin -> kullanici ona dogru
  // ok'u (sabit yukari) cevirmeli.
  // Pratik: derece farkini animate et, kisa yoldan don.
  useEffect(() => {
    if (!konum) return;
    const hedef = -heading;
    // En kisa yoldan animasyon: 360 sinir kontrolu.
    let onc = onceki.current;
    let yeni = hedef;
    const fark = yeni - onc;
    if (fark > 180) yeni -= 360;
    if (fark < -180) yeni += 360;
    onceki.current = yeni;
    Animated.timing(pusulaRotasyon, {
      toValue: yeni,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [heading, konum, pusulaRotasyon]);

  const sapmaMutlak = Math.abs(sapma);
  const dogruYon = sapmaMutlak < 5;
  const yakinYon = sapmaMutlak < 20;

  const renkDurum = dogruYon
    ? '#2D6A4F' // canli yesil
    : yakinYon
      ? colors.altin
      : colors.ikincilMetin;

  // Kabe isaretinin dairedeki konumu (hedefBearing).
  // Daire kendisi -heading kadar donduruluyor. Dolayisiyla Kabe isaretinin
  // dairedeki sabit acisi hedefBearing kadar olmali; merkez 0=yukari.
  const kabeAci = hedefBearing; // derece

  // Polar -> cartesian (yukari = 0 derece, saat yonu pozitif).
  const r = PUSULA_BOYUT / 2 - 24;
  const kabeX = r * Math.sin((kabeAci * Math.PI) / 180);
  const kabeY = -r * Math.cos((kabeAci * Math.PI) / 180);

  const rotasyon = pusulaRotasyon.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={styles.geri}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={styles.baslik}>Kıble Yönü</Text>
          <View style={{ width: 60 }} />
        </View>

        {konumDurum === 'yok' ? (
          <View style={styles.bos}>
            <Text style={styles.bosEmoji}>📍</Text>
            <Text style={styles.bosBaslik}>Konum gerekli</Text>
            <Text style={styles.bosMetin}>
              Kıble yönünü göstermek için bulunduğun şehri bilmem lazım.
            </Text>
            <TouchableOpacity
              style={styles.cta}
              onPress={() => navigation.navigate('Ayarlar')}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaYazi}>Ayarlara Git</Text>
            </TouchableOpacity>
          </View>
        ) : !sensorVar ? (
          <View style={styles.bos}>
            <Text style={styles.bosEmoji}>🧭</Text>
            <Text style={styles.bosBaslik}>Pusula bulunamadı</Text>
            <Text style={styles.bosMetin}>
              Cihazın pusula sensörünü desteklemiyor ya da kapalı.
            </Text>
            {konum && (
              <Text style={styles.bosBilgi}>
                Yine de Kâbe yönü kuzeyden{' '}
                <Text style={{ color: colors.altin, fontWeight: '700' }}>
                  {Math.round(hedefBearing)}°
                </Text>
                .
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.govde}>
            <Text style={styles.ustBilgi}>
              {dogruYon
                ? '✓ Tam Kıbledesin'
                : yakinYon
                  ? 'Biraz daha çevir'
                  : 'Telefonu çevir'}
            </Text>

            <View style={styles.pusulaCerceve}>
              {/* Sabit kuzey ok'u (ust). Yasli icin "ben buyum, hareketsiz" */}
              <View style={styles.merkezOk}>
                <Text style={[styles.okYazi, { color: renkDurum }]}>▲</Text>
                <Text style={styles.okAlt}>Telefonun</Text>
              </View>

              {/* Donen daire */}
              <Animated.View
                style={[
                  styles.daire,
                  {
                    transform: [{ rotate: rotasyon }],
                  },
                ]}
              >
                {/* Daire icindeki yon yazilari */}
                <Text style={[styles.yonYazi, styles.yonK]}>K</Text>
                <Text style={[styles.yonYazi, styles.yonD]}>D</Text>
                <Text style={[styles.yonYazi, styles.yonG]}>G</Text>
                <Text style={[styles.yonYazi, styles.yonB]}>B</Text>

                {/* Kabe isareti (daire uzerinde, hedefBearing acisinda) */}
                <View
                  style={[
                    styles.kabeIsaret,
                    {
                      left: PUSULA_BOYUT / 2 + kabeX - 26,
                      top: PUSULA_BOYUT / 2 + kabeY - 26,
                      backgroundColor: dogruYon ? '#2D6A4F' : colors.altin,
                    },
                  ]}
                >
                  <Text style={styles.kabeEmoji}>🕋</Text>
                </View>
              </Animated.View>
            </View>

            <View style={[styles.sapmaKart, { borderColor: renkDurum }]}>
              <Text style={styles.sapmaLabel}>Sapma</Text>
              <Text style={[styles.sapmaDerece, { color: renkDurum }]}>
                {Math.round(sapmaMutlak)}°
              </Text>
              <Text style={styles.sapmaYon}>
                {dogruYon
                  ? 'Kâbe karşında'
                  : sapma > 0
                    ? 'Sağa dön →'
                    : '← Sola dön'}
              </Text>
            </View>

            {mesafe != null && (
              <Text style={styles.mesafe}>Mekke'ye yaklaşık {mesafe.toLocaleString('tr-TR')} km</Text>
            )}

            <Text style={styles.ipucu}>
              Telefonu düz tut. Kırmızı/altın 🕋 işaretini yukarıdaki ▲ ile çakıştır.
            </Text>
          </View>
        )}
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
  geri: { color: colors.altin, fontSize: type.geri, width: 60 },
  baslik: {
    color: colors.anaYesil,
    fontSize: type.lg,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  govde: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  ustBilgi: {
    fontSize: type.xl,
    color: colors.anaYesil,
    fontWeight: '600',
    marginBottom: 18,
  },

  pusulaCerceve: {
    width: PUSULA_BOYUT,
    height: PUSULA_BOYUT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merkezOk: {
    position: 'absolute',
    top: -2,
    zIndex: 5,
    alignItems: 'center',
  },
  okYazi: {
    fontSize: 36,
    lineHeight: 36,
  },
  okAlt: {
    fontSize: type.xs,
    color: colors.ikincilMetin,
    marginTop: 2,
  },
  daire: {
    width: PUSULA_BOYUT,
    height: PUSULA_BOYUT,
    borderRadius: PUSULA_BOYUT / 2,
    borderWidth: 3,
    borderColor: colors.cizgi,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  yonYazi: {
    position: 'absolute',
    color: colors.anaMetin,
    fontWeight: '700',
    fontSize: type.lg,
  },
  yonK: { top: 8, left: PUSULA_BOYUT / 2 - 8 },
  yonG: { bottom: 8, left: PUSULA_BOYUT / 2 - 8 },
  yonD: { right: 10, top: PUSULA_BOYUT / 2 - 12 },
  yonB: { left: 12, top: PUSULA_BOYUT / 2 - 12 },

  kabeIsaret: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  kabeEmoji: { fontSize: 28 },

  sapmaKart: {
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radii.md,
    backgroundColor: '#fff',
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 200,
  },
  sapmaLabel: {
    fontSize: type.sm,
    color: colors.ikincilMetin,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  sapmaDerece: {
    fontSize: type['2xl'],
    fontWeight: '300',
    marginVertical: 2,
  },
  sapmaYon: {
    fontSize: type.base,
    color: colors.anaMetin,
    marginTop: 2,
  },
  mesafe: {
    marginTop: 14,
    fontSize: type.sm,
    color: colors.ikincilMetin,
  },
  ipucu: {
    marginTop: 16,
    fontSize: type.sm,
    color: colors.ikincilMetin,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },

  bos: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  bosEmoji: { fontSize: 56, marginBottom: 18 },
  bosBaslik: {
    fontSize: type.xl,
    color: colors.anaYesil,
    fontWeight: '600',
    marginBottom: 10,
  },
  bosMetin: {
    fontSize: type.base,
    color: colors.anaMetin,
    textAlign: 'center',
    lineHeight: 22,
  },
  bosBilgi: {
    marginTop: 14,
    fontSize: type.sm,
    color: colors.ikincilMetin,
    textAlign: 'center',
  },
  cta: {
    marginTop: 22,
    backgroundColor: colors.anaYesil,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radii.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  ctaYazi: { color: '#fff', fontSize: type.base, fontWeight: '600' },
});
