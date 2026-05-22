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
import { izinIste, namazBildirimleriniKur, tumBildirimleriIptal } from '../lib/bildirim';
import { gunlukVakitler } from '../lib/namaz';

export default function AyarlarScreen({ navigation }) {
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const [sehir, setSehir] = useState('');
  const [konumModal, setKonumModal] = useState(false);
  const [arama, setArama] = useState('');

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.baslik}>Ayarlar</Text>
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
        <Animated.View style={[styles.satir, { transform: [{ scale: bildirimScale }] }]}>
          <Animated.Text style={[styles.label, { opacity: bildirimLabelOpacity }]}>
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
          <Text style={styles.label}>Konum / Şehir</Text>
          <Text style={styles.deger}>{sehir || 'Seç'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.satir} onPress={() => navigation.navigate('Hakkinda')}>
          <Text style={styles.label}>Hakkında</Text>
          <Text style={styles.deger}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.satir}
          onPress={() => Linking.openURL('mailto:?subject=Hu%20Geri%20Bildirim')}
        >
          <Text style={styles.label}>Bize Geri Bildirim</Text>
          <Text style={styles.deger}>›</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={konumModal} animationType="slide" onRequestClose={() => setKonumModal(false)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.baslik}>Şehir seç</Text>
            <TouchableOpacity onPress={() => setKonumModal(false)}>
              <Text style={styles.geri}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.aramaInput}
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
                <Text style={styles.sehirAd}>{item.ad}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.krem },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  geri: { color: colors.altin, fontSize: 16, width: 60 },
  baslik: { color: colors.anaYesil, fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
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
  label: { fontSize: type.base, color: colors.anaMetin },
  deger: { fontSize: 14, color: colors.altin },
  aramaInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cizgi,
    borderRadius: radii.sm,
    fontSize: 16,
    color: colors.anaMetin,
  },
  sehirSatir: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#EFE9D8' },
  sehirAd: { fontSize: 16, color: colors.anaMetin },
});
