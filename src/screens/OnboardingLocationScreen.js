import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import { sehirler } from '../constants/sehirler';
import GradientArkaPlan from '../components/GradientArkaPlan';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function OnboardingLocationScreen({ navigation }) {
  const tip = useTipScale();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [modalAcik, setModalAcik] = useState(false);
  const [arama, setArama] = useState('');

  const g1Opacity = useRef(new Animated.Value(0)).current;
  const g1TranslateY = useRef(new Animated.Value(18)).current;
  const g2Opacity = useRef(new Animated.Value(0)).current;
  const g2TranslateY = useRef(new Animated.Value(18)).current;
  const g3Opacity = useRef(new Animated.Value(0)).current;
  const g3TranslateY = useRef(new Animated.Value(18)).current;
  const konumButonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const grupAnim = (op, ty, delay) =>
      Animated.parallel([
        Animated.timing(op, {
          toValue: 1,
          duration: 460,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ty, {
          toValue: 0,
          duration: 460,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    Animated.parallel([
      grupAnim(g1Opacity, g1TranslateY, 0),
      grupAnim(g2Opacity, g2TranslateY, 100),
      grupAnim(g3Opacity, g3TranslateY, 220),
    ]).start();
  }, [
    g1Opacity,
    g1TranslateY,
    g2Opacity,
    g2TranslateY,
    g3Opacity,
    g3TranslateY,
  ]);

  const konumPressIn = () =>
    Animated.timing(konumButonScale, {
      toValue: 0.96,
      duration: 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  const konumPressOut = () =>
    Animated.timing(konumButonScale, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

  const kaydet = async ({ sehir, enlem, boylam }) => {
    await AsyncStorage.setItem('sehir', sehir);
    await AsyncStorage.setItem('enlem', String(enlem));
    await AsyncStorage.setItem('boylam', String(boylam));
    navigation.navigate('OnboardingNotification');
  };

  const konumKullan = async () => {
    try {
      setYukleniyor(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setYukleniyor(false);
        Alert.alert(
          'Konum izni reddedildi',
          'Manuel olarak şehir seçebilirsin.',
          [{ text: 'Tamam' }]
        );
        return;
      }
      const konum = await Location.getCurrentPositionAsync({});
      let sehirAd = 'Bilinmeyen';
      try {
        const yer = await Location.reverseGeocodeAsync({
          latitude: konum.coords.latitude,
          longitude: konum.coords.longitude,
        });
        if (yer?.[0]?.region) sehirAd = yer[0].region;
        else if (yer?.[0]?.city) sehirAd = yer[0].city;
      } catch (e) {}
      await kaydet({
        sehir: sehirAd,
        enlem: konum.coords.latitude,
        boylam: konum.coords.longitude,
      });
    } catch (e) {
      setYukleniyor(false);
      Alert.alert('Konum alınamadı', 'Manuel olarak şehir seçebilirsin.');
    }
  };

  const sehirSec = async (s) => {
    setModalAcik(false);
    await kaydet({ sehir: s.ad, enlem: s.enlem, boylam: s.boylam });
  };

  const filtreli = arama
    ? sehirler.filter((s) =>
        s.ad.toLocaleLowerCase('tr-TR').includes(arama.toLocaleLowerCase('tr-TR'))
      )
    : sehirler;

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Animated.Text
          style={[
            styles.baslik,
            { fontSize: tip['2xl'].fontSize, lineHeight: tip['2xl'].lineHeight },
            {
              opacity: g1Opacity,
              transform: [{ translateY: g1TranslateY }],
            },
          ]}
        >
          Konumun gerekli
        </Animated.Text>
        <Animated.Text
          style={[
            styles.aciklama,
            { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight },
            {
              opacity: g2Opacity,
              transform: [{ translateY: g2TranslateY }],
            },
          ]}
        >
          Namaz vakitleri için konumuna ihtiyacımız var.
        </Animated.Text>

        <Animated.View
          style={{
            opacity: g3Opacity,
            transform: [{ translateY: g3TranslateY }],
          }}
        >
          <AnimatedTouchable
            style={[styles.buton, { transform: [{ scale: konumButonScale }] }]}
            onPress={konumKullan}
            onPressIn={konumPressIn}
            onPressOut={konumPressOut}
            disabled={yukleniyor}
            activeOpacity={0.9}
          >
            {yukleniyor ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.butonYazi, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Konumumu Kullan</Text>
            )}
          </AnimatedTouchable>

          <TouchableOpacity
            style={styles.butonIkincil}
            onPress={() => setModalAcik(true)}
          >
            <Text style={[styles.butonIkincilYazi, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Manuel Şehir Seç</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Modal
        visible={modalAcik}
        animationType="slide"
        onRequestClose={() => setModalAcik(false)}
      >
        <GradientArkaPlan>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalBaslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Şehir seç</Text>
              <TouchableOpacity onPress={() => setModalAcik(false)}>
                <Text style={[styles.modalKapat, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.aramaInput, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}
              value={arama}
              onChangeText={setArama}
              placeholder="Şehir ara..."
              placeholderTextColor={colors.ikincilMetin}
            />
            <FlatList
              data={filtreli}
              keyExtractor={(s) => s.ad}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sehirSatir}
                  onPress={() => sehirSec(item)}
                >
                  <Text style={[styles.sehirAd, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>{item.ad}</Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </GradientArkaPlan>
      </Modal>
    </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  inner: { flex: 1, padding: 28, justifyContent: 'center' },
  baslik: {
    color: colors.anaYesil,
    marginBottom: 12,
    textAlign: 'center',
  },
  aciklama: {
    color: colors.ikincilMetin,
    marginBottom: 32,
    textAlign: 'center',
  },
  buton: {
    backgroundColor: colors.altin,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  butonYazi: { color: '#fff', fontWeight: '600' },
  butonIkincil: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  butonIkincilYazi: { color: colors.anaYesil },
  modalContainer: { flex: 1, backgroundColor: 'transparent' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.cizgi,
  },
  modalBaslik: { color: colors.anaYesil, fontWeight: '600' },
  modalKapat: { color: colors.altin },
  aramaInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cizgi,
    borderRadius: radii.sm,
    color: colors.anaMetin,
  },
  sehirSatir: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE9D8',
  },
  sehirAd: { color: colors.anaMetin },
});
