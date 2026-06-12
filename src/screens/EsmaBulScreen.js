import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import { isimdenEsma } from '../lib/esma';
import GradientArkaPlan from '../components/GradientArkaPlan';

export default function EsmaBulScreen({ navigation }) {
  const tip = useTipScale();
  const [isim, setIsim] = useState('');
  const [sonuc, setSonuc] = useState(null);
  const sonucOpacity = useRef(new Animated.Value(0)).current;
  const sonucTranslateY = useRef(new Animated.Value(12)).current;

  const hesapla = () => {
    const temiz = isim.trim();
    if (!temiz) return;
    Keyboard.dismiss();
    const s = isimdenEsma(temiz);
    setSonuc(s);
    sonucOpacity.setValue(0);
    sonucTranslateY.setValue(12);
    Animated.parallel([
      Animated.timing(sonucOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sonucTranslateY, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const temizle = () => {
    setIsim('');
    setSonuc(null);
  };

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Geri">
          <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Esma Bul</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.aciklama, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
          Bir kişinin ismini girin, ebced hesabına göre en yakın esmayı bulalım.
        </Text>

        <View style={styles.girisAlani}>
          <TextInput
            style={[styles.input, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}
            value={isim}
            onChangeText={setIsim}
            placeholder="Örn: Ayşe, Mehmet, Fatma..."
            placeholderTextColor={colors.ikincilMetin}
            autoCapitalize="words"
            autoCorrect={false}
            onSubmitEditing={hesapla}
            returnKeyType="search"
          />

          <View style={styles.butonSatir}>
            <TouchableOpacity
              style={[styles.buton, !isim.trim() && styles.butonDisabled]}
              onPress={hesapla}
              disabled={!isim.trim()}
              activeOpacity={0.85}
            >
              <Text style={[styles.butonYazi, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>🔍 Esmayı Bul</Text>
            </TouchableOpacity>
            {(isim || sonuc) && (
              <TouchableOpacity style={styles.temizleButon} onPress={temizle} activeOpacity={0.7}>
                <Text style={[styles.temizleYazi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!sonuc && (
          <View style={styles.bilgiBlok}>
            <Text style={[styles.bilgiBaslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>
              Adın Sırrı
            </Text>
            <Text style={[styles.bilgiParaf, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight + 6 }]}>
              Hz. Peygamber (s.a.v.) buyurdu:{' '}
              <Text style={styles.bilgiItalik}>
                "Sizler kıyamet günü isimlerinizle çağrılırsınız. O halde çocuklarınıza güzel isim koyun."
              </Text>{' '}
              (Ebû Dâvûd)
            </Text>
            <Text style={[styles.bilgiParaf, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight + 6 }]}>
              İsim sadece bir çağrı değildir. Klasik İslam ilmi geleneğinde — Bûnî, Gümüşhânevî, Nâzilî gibi büyük zatların kayıtlarında — ismin harflerinin sayısal değeri (Ebced), sahibinin fıtrî eğilimlerine işaret eder.
            </Text>
            <Text style={[styles.bilgiParaf, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight + 6 }]}>
              Buradan çıkan esmâ rastgele değildir; ismindeki harflerin toplamı, Allah'ın 99 isminden seninle en çok uyumlu olanına yönlendirir. O esmâyı zikrettikçe nasibin artar, fıtratınla barışırsın.
            </Text>
          </View>
        )}

        {sonuc && (
          <Animated.View
            style={[
              styles.sonucKart,
              {
                opacity: sonucOpacity,
                transform: [{ translateY: sonucTranslateY }],
              },
            ]}
          >
            <Text style={[styles.sonucEtiket, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
              {sonuc.bulundu ? `${sonuc.isim_turkce} için` : 'Sonuç'}
            </Text>

            {sonuc.bulundu && (
              <View style={styles.isimBilgi}>
                <Text style={styles.isimArapca}>{sonuc.isim_arapca}</Text>
                <Text style={[styles.isimDetay, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                  {sonuc.isim_turkce} · Ebced: <Text style={styles.vurgu}>{sonuc.isim_ebced}</Text>
                </Text>
              </View>
            )}

            <View style={styles.okSatir}>
              <Text style={styles.okYazi}>↓</Text>
            </View>

            <View style={styles.esmaBilgi}>
              <Text style={styles.esmaArapca}>{sonuc.esma.arapca}</Text>
              <Text style={[styles.yaEsma, { fontSize: tip.xl.fontSize, lineHeight: tip.xl.lineHeight }]}>Yâ {sonuc.esma.esma}</Text>
              <Text style={[styles.esmaAnlam, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>{sonuc.esma.anlam}</Text>
              <Text style={[styles.esmaEbced, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                Ebced: <Text style={styles.vurgu}>{sonuc.esma.ebced}</Text>
                {sonuc.fark != null && sonuc.fark > 0 && (
                  <Text style={styles.fark}> · fark {sonuc.fark}</Text>
                )}
              </Text>
            </View>

            {sonuc.not && (
              <View style={styles.notKutu}>
                <Text style={[styles.notYazi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>{sonuc.not}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.detayButon}
              onPress={() =>
                navigation.navigate('EsmaDetay', { esmaNo: sonuc.esma.no })
              }
              activeOpacity={0.85}
            >
              <Text style={[styles.detayYazi, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Esmanın Detayını Gör ›</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
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
  geri: { color: colors.altin, width: 60 },
  baslik: { color: colors.anaYesil, fontWeight: '600' },

  scroll: { padding: 20, paddingBottom: 40 },
  aciklama: {
    color: colors.ikincilMetin,
    textAlign: 'center',
    marginBottom: 24,
  },

  girisAlani: { marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.anaMetin,
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  butonSatir: { flexDirection: 'row', marginTop: 12, gap: 8 },
  buton: {
    flex: 1,
    backgroundColor: colors.altin,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  butonDisabled: { opacity: 0.5 },
  butonYazi: { color: '#fff', fontWeight: '700' },
  temizleButon: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  temizleYazi: { color: colors.ikincilMetin },

  // "Adin Sirri" bilgi blogu — sonuc yokken altta gosterilir, eski
  // bos alani doldurur ve ogretici icerik sunar.
  bilgiBlok: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  bilgiBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },
  bilgiParaf: {
    color: colors.anaMetin,
    marginBottom: 16,
    textAlign: 'left',
  },
  bilgiItalik: {
    fontStyle: 'italic',
    color: colors.altin,
  },

  sonucKart: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: radii.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sonucEtiket: {
    color: colors.altin,
    letterSpacing: 1.6,
    fontWeight: '700',
    marginBottom: 14,
  },

  isimBilgi: { alignItems: 'center', marginBottom: 4 },
  isimArapca: { fontSize: 32, color: colors.anaMetin, marginBottom: 4 },
  isimDetay: { color: colors.ikincilMetin },

  okSatir: { paddingVertical: 12 },
  okYazi: { fontSize: 24, color: colors.altin, opacity: 0.6 },

  esmaBilgi: { alignItems: 'center', marginBottom: 8 },
  esmaArapca: { fontSize: type.display, color: colors.altin },
  yaEsma: {
    color: colors.anaYesil,
    fontWeight: '600',
    marginTop: 6,
  },
  esmaAnlam: {
    color: colors.anaMetin,
    marginTop: 6,
    textAlign: 'center',
  },
  esmaEbced: { color: colors.ikincilMetin, marginTop: 8 },
  vurgu: { color: colors.altin, fontWeight: '700' },
  fark: { color: colors.ikincilMetin, fontWeight: '400' },

  notKutu: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.kremAlt,
    borderRadius: radii.sm,
  },
  notYazi: {
    color: colors.anaMetin,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  detayButon: {
    marginTop: 18,
    alignSelf: 'stretch',
    backgroundColor: colors.anaYesil,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  detayYazi: { color: '#fff', fontWeight: '600' },
});
