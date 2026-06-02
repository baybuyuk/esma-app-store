import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Linking,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { sehirler } from '../constants/sehirler';
import { useYaziKademesi, useTipScale } from '../context/YaziKademesiContext';
import { izinIste, namazBildirimleriniKur, tumBildirimleriIptal } from '../lib/bildirim';
import { gunlukVakitler } from '../lib/namaz';
import GradientArkaPlan from '../components/GradientArkaPlan';

const KADEME_ETIKET = {
  kucuk: 'Küçük',
  normal: 'Normal',
  buyuk: 'Büyük',
};

export default function AyarlarScreen({ navigation }) {
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const [sehir, setSehir] = useState('');
  const [konumModal, setKonumModal] = useState(false);
  const [arama, setArama] = useState('');
  const { kademe } = useYaziKademesi();
  const tip = useTipScale();

  const satirLiOpacity = useRef(new Animated.Value(0)).current;
  const satirLiTranslateY = useRef(new Animated.Value(16)).current;
  const bildirimScale = useRef(new Animated.Value(1)).current;
  const bildirimLabelOpacity = useRef(new Animated.Value(1)).current;
  const oncekiBildirimRef = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(satirLiOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(satirLiTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [satirLiOpacity, satirLiTranslateY]);

  useEffect(() => {
    if (bildirimAcik && !oncekiBildirimRef.current) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(bildirimScale, {
            toValue: 1.03,
            duration: 160,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(bildirimScale, {
            toValue: 1,
            duration: 160,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bildirimLabelOpacity, {
            toValue: 0.6,
            duration: 160,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(bildirimLabelOpacity, {
            toValue: 1,
            duration: 160,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
    oncekiBildirimRef.current = bildirimAcik;
  }, [bildirimAcik, bildirimScale, bildirimLabelOpacity]);

  const yukle = useCallback(async () => {
    const b = await AsyncStorage.getItem('bildirimAcik');
    setBildirimAcik(b === '1');
    const s = await AsyncStorage.getItem('sehir');
    if (s) setSehir(s);
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const bildirimToggle = async (deger) => {
    setBildirimAcik(deger);
    await AsyncStorage.setItem('bildirimAcik', deger ? '1' : '0');
    if (deger) {
      const izin = await izinIste();
      if (!izin) {
        setBildirimAcik(false);
        await AsyncStorage.setItem('bildirimAcik', '0');
        Alert.alert('İzin verilmedi', 'Bildirimleri açmak için sistem ayarlarından izin ver.');
        return;
      }
      const en = parseFloat((await AsyncStorage.getItem('enlem')) || '41');
      const bo = parseFloat((await AsyncStorage.getItem('boylam')) || '29');
      const vakitler = gunlukVakitler(en, bo);
      await namazBildirimleriniKur(vakitler);
    } else {
      await tumBildirimleriIptal();
    }
  };

  const sehirSec = async (s) => {
    setSehir(s.ad);
    setKonumModal(false);
    await AsyncStorage.setItem('sehir', s.ad);
    await AsyncStorage.setItem('enlem', String(s.enlem));
    await AsyncStorage.setItem('boylam', String(s.boylam));
    if (bildirimAcik) {
      const vakitler = gunlukVakitler(s.enlem, s.boylam);
      await namazBildirimleriniKur(vakitler);
    }
  };

  const filtreli = arama
    ? sehirler.filter((s) => s.ad.toLocaleLowerCase('tr-TR').includes(arama.toLocaleLowerCase('tr-TR')))
    : sehirler;

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Ayarlar</Text>
        <View style={{ width: 60 }} />
      </View>

      <Animated.View
        style={[
          styles.satirLi,
          {
            opacity: satirLiOpacity,
            transform: [{ translateY: satirLiTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.satir}
          onPress={() => navigation.navigate('Erisilebilirlik')}
          accessibilityLabel="Yazi Boyutu"
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Yazı Boyutu</Text>
            <Text style={[styles.altMetin, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>{KADEME_ETIKET[kademe] || 'Normal'}</Text>
          </View>
          <Text style={styles.deger}>›</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.satir, { transform: [{ scale: bildirimScale }] }]}>
          <Animated.Text style={[styles.label, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }, { opacity: bildirimLabelOpacity }]}>
            Bildirimler
          </Animated.Text>
          <Switch
            value={bildirimAcik}
            onValueChange={bildirimToggle}
            trackColor={{ false: '#ccc', true: colors.ortaYesil }}
            thumbColor={bildirimAcik ? colors.altin : '#fff'}
          />
        </Animated.View>

        <TouchableOpacity style={styles.satir} onPress={() => setKonumModal(true)}>
          <Text style={[styles.label, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Konum / Şehir</Text>
          <Text style={[styles.deger, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>{sehir || 'Seç'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.satir} onPress={() => navigation.navigate('Hakkinda')}>
          <Text style={[styles.label, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Hakkında</Text>
          <Text style={styles.deger}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.satir}
          onPress={() => Linking.openURL('mailto:?subject=Hu%20Geri%20Bildirim')}
        >
          <Text style={[styles.label, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>Bize Geri Bildirim</Text>
          <Text style={styles.deger}>›</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={konumModal} animationType="slide" onRequestClose={() => setKonumModal(false)}>
        <GradientArkaPlan>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Şehir seç</Text>
              <TouchableOpacity onPress={() => setKonumModal(false)}>
                <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>Kapat</Text>
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
                <TouchableOpacity style={styles.sehirSatir} onPress={() => sehirSec(item)}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  geri: { color: colors.altin, width: 60 },
  baslik: { color: colors.anaYesil, fontWeight: '600', flex: 1, textAlign: 'center' },
  satirLi: { marginTop: 8, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE9D8',
  },
  label: { color: colors.anaMetin },
  altMetin: { color: colors.ikincilMetin, marginTop: 2 },
  deger: { color: colors.altin },
  aramaInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cizgi,
    borderRadius: radii.sm,
    color: colors.anaMetin,
  },
  sehirSatir: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#EFE9D8' },
  sehirAd: { color: colors.anaMetin },
});
