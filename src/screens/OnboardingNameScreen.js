import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import { isimdenEsma, temizIsimGirdisi, gecerliIsimMi } from '../lib/esma';
import GradientArkaPlan from '../components/GradientArkaPlan';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function OnboardingNameScreen({ navigation }) {
  const tip = useTipScale();
  const [isim, setIsim] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const butonOpacity = useRef(new Animated.Value(0.5)).current;
  const butonScale = useRef(new Animated.Value(0.96)).current;
  const oncekiDoluRef = useRef(false);

  useEffect(() => {
    const dolu = gecerliIsimMi(isim) && !yukleniyor;
    if (dolu === oncekiDoluRef.current) return;
    oncekiDoluRef.current = dolu;
    Animated.parallel([
      Animated.timing(butonOpacity, {
        toValue: dolu ? 1 : 0.5,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(butonScale, {
        toValue: dolu ? 1 : 0.96,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isim, yukleniyor, butonOpacity, butonScale]);

  const devamEt = async () => {
    const temiz = isim.trim();
    if (!gecerliIsimMi(temiz)) {
      setHata('Lütfen harflerden oluşan bir ad gir.');
      return;
    }
    setHata('');
    try {
      setYukleniyor(true);
      const sonuc = isimdenEsma(temiz);
      if (!sonuc.esma) {
        // Savunma hatti: giris filtresi + buton kapisi normalde buraya birakmaz.
        setHata('Bu adı okuyamadık. Lütfen tekrar dener misin?');
        setYukleniyor(false);
        return;
      }
      await AsyncStorage.setItem('userName', temiz);
      await AsyncStorage.setItem('userEsma', JSON.stringify(sonuc));
      navigation.navigate('OnboardingYaziBoyutu');
    } catch (e) {
      setYukleniyor(false);
    }
  };

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>
            <Text style={[styles.selam, { fontSize: tip['3xl'].fontSize, lineHeight: tip['3xl'].lineHeight }]}>Selamün Aleyküm</Text>
            <Text style={[styles.soru, { fontSize: tip.xl.fontSize, lineHeight: tip.xl.lineHeight }]}>Adın nedir?</Text>
            <TextInput
              style={[styles.input, { fontSize: tip.xl.fontSize, lineHeight: tip.xl.lineHeight }]}
              value={isim}
              onChangeText={(t) => { setIsim(temizIsimGirdisi(t)); setHata(''); }}
              placeholder="İsmin"
              placeholderTextColor={colors.ikincilMetin}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={devamEt}
              maxLength={40}
            />
            {hata ? (
              <Text style={[styles.hata, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>{hata}</Text>
            ) : null}
            <AnimatedTouchable
              style={[
                styles.buton,
                {
                  opacity: butonOpacity,
                  transform: [{ scale: butonScale }],
                },
              ]}
              onPress={devamEt}
              disabled={!gecerliIsimMi(isim) || yukleniyor}
              accessibilityLabel="Devam Et"
            >
              <Text style={[styles.butonYazi, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Devam Et</Text>
            </AnimatedTouchable>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  inner: { flex: 1, padding: 28, justifyContent: 'center' },
  selam: {
    color: colors.anaYesil,
    marginBottom: 40,
    textAlign: 'center',
  },
  soru: {
    color: colors.anaMetin,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.cizgi,
    paddingVertical: 14,
    color: colors.anaMetin,
    marginBottom: 36,
  },
  buton: {
    backgroundColor: colors.altin,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  butonYazi: { color: '#fff', fontWeight: '600' },
  hata: {
    color: '#B3261E',
    textAlign: 'center',
    marginTop: -24,
    marginBottom: 20,
  },
});
