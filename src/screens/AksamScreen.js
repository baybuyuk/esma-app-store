import { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { gunlukKayitEkle } from '../db/db';
import GradientArkaPlan from '../components/GradientArkaPlan';

const NAMAZ_SECENEK = [
  { key: 5, label: '5 vakit' },
  { key: 4, label: '3-4 vakit' },
  { key: 2, label: '1-2 vakit' },
  { key: 0, label: 'Kılamadım' },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function AksamScreen({ navigation }) {
  const [namazSayisi, setNamazSayisi] = useState(null);
  const [sukur, setSukur] = useState('');
  const [iyilik, setIyilik] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const radioScaleRef = useRef({});
  NAMAZ_SECENEK.forEach((s) => {
    if (!radioScaleRef.current[s.key]) {
      radioScaleRef.current[s.key] = new Animated.Value(1);
    }
  });

  const radioPulse = (key) => {
    const anim = radioScaleRef.current[key];
    if (!anim) return;
    anim.stopAnimation(() => {
      anim.setValue(1);
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.92,
          duration: 90,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const tarihYazi = useMemo(() => {
    try {
      return format(new Date(), 'd MMMM, EEEE akşamı', { locale: tr });
    } catch {
      return new Date().toDateString();
    }
  }, []);

  const kapat = async () => {
    try {
      setYukleniyor(true);
      const bugun = new Date();
      const tarihIso = `${bugun.getFullYear()}-${String(bugun.getMonth() + 1).padStart(2, '0')}-${String(bugun.getDate()).padStart(2, '0')}`;
      await gunlukKayitEkle({
        tarih: tarihIso,
        namazSayisi,
        sukurNotu: sukur.trim() || null,
        iyilikNotu: iyilik.trim() || null,
      });
      if (Platform.OS === 'android') {
        ToastAndroid.show('Bismillah, hayırlı geceler', ToastAndroid.SHORT);
      } else {
        Alert.alert('Bismillah', 'Hayırlı geceler.');
      }
      navigation.goBack();
    } catch (e) {
      setYukleniyor(false);
      Alert.alert('Kaydedilemedi', 'Lütfen tekrar dene.');
    }
  };

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.geri}>‹ Geri</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.baslik}>Günü bağla</Text>
            <Text style={styles.tarih}>{tarihYazi}</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.soru}>Bugün kaç vakit namaz kıldın?</Text>
          {NAMAZ_SECENEK.map((s) => {
            const secili = namazSayisi === s.key;
            const scale = radioScaleRef.current[s.key];
            return (
              <AnimatedTouchable
                key={s.key}
                style={[
                  styles.radio,
                  secili && styles.radioSecili,
                  { transform: [{ scale }] },
                ]}
                onPress={() => {
                  setNamazSayisi(s.key);
                  radioPulse(s.key);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.radioBullet, secili && styles.radioBulletSecili]}>
                  {secili ? '●' : '○'}
                </Text>
                <Text style={[styles.radioLabel, secili && { color: colors.anaYesil }]}>{s.label}</Text>
              </AnimatedTouchable>
            );
          })}

          <Text style={styles.soru}>Bugün için şükredeceğin ne var?</Text>
          <TextInput
            style={[styles.input, { minHeight: 90 }]}
            value={sukur}
            onChangeText={setSukur}
            placeholder="Bir kelime bile yeter..."
            placeholderTextColor={colors.ikincilMetin}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.soru}>Bugün kimi sevindirdin?</Text>
          <TextInput
            style={[styles.input, { minHeight: 70 }]}
            value={iyilik}
            onChangeText={setIyilik}
            placeholder="Boş bırakabilirsin..."
            placeholderTextColor={colors.ikincilMetin}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.kapatButon, yukleniyor && { opacity: 0.6 }]}
            onPress={kapat}
            disabled={yukleniyor}
          >
            <Text style={styles.kapatYazi}>Günü Kapat</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  geri: { color: colors.altin, fontSize: 16, width: 60 },
  baslik: { color: colors.anaYesil, fontSize: 18, fontWeight: '600' },
  tarih: { color: colors.ikincilMetin, fontSize: type.xs, marginTop: 2 },
  scroll: { padding: 18, paddingBottom: 32 },
  soru: {
    fontSize: type.base,
    color: colors.anaYesil,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 8,
  },
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.cizgi,
    borderRadius: radii.sm,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  radioSecili: { borderColor: colors.altin, backgroundColor: '#FBF6E6' },
  radioBullet: { fontSize: 18, color: colors.ikincilMetin, marginRight: 10 },
  radioBulletSecili: { color: colors.altin },
  radioLabel: { fontSize: type.base, color: colors.anaMetin },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.cizgi,
    borderRadius: radii.sm,
    padding: 12,
    fontSize: type.base,
    color: colors.anaMetin,
  },
  kapatButon: {
    backgroundColor: colors.altin,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  kapatYazi: { color: '#fff', fontSize: type.lg, fontWeight: '600' },
});
