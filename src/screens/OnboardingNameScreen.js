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
import { isimdenEsma } from '../lib/esma';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function OnboardingNameScreen({ navigation }) {
  const [isim, setIsim] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const butonOpacity = useRef(new Animated.Value(0.5)).current;
  const butonScale = useRef(new Animated.Value(0.96)).current;
  const oncekiDoluRef = useRef(false);

  useEffect(() => {
    const dolu = isim.trim().length > 0 && !yukleniyor;
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
    if (!temiz) return;
    try {
      setYukleniyor(true);
      const sonuc = isimdenEsma(temiz);
      await AsyncStorage.setItem('userName', temiz);
      await AsyncStorage.setItem('userEsma', JSON.stringify(sonuc));
      navigation.navigate('OnboardingLocation');
    } catch (e) {
      setYukleniyor(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>
            <Text style={styles.selam}>Selamün Aleyküm</Text>
            <Text style={styles.soru}>Adın nedir?</Text>
            <TextInput
              style={styles.input}
              value={isim}
              onChangeText={setIsim}
              placeholder="İsmin"
              placeholderTextColor={colors.ikincilMetin}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={devamEt}
              maxLength={40}
            />
            <AnimatedTouchable
              style={[
                styles.buton,
                {
                  opacity: butonOpacity,
                  transform: [{ scale: butonScale }],
                },
              ]}
              onPress={devamEt}
              disabled={!isim.trim() || yukleniyor}
              accessibilityLabel="Devam Et"
            >
              <Text style={styles.butonYazi}>Devam Et</Text>
            </AnimatedTouchable>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.krem },
  inner: { flex: 1, padding: 28, justifyContent: 'center' },
  selam: {
    fontSize: 32,
    color: colors.anaYesil,
    marginBottom: 40,
    textAlign: 'center',
  },
  soru: {
    fontSize: 20,
    color: colors.anaMetin,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    fontSize: type.xl,
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
  butonYazi: { color: '#fff', fontSize: type.lg, fontWeight: '600' },
});
