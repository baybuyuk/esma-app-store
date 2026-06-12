import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { useTipScale } from '../context/YaziKademesiContext';
import GradientArkaPlan from '../components/GradientArkaPlan';

export default function HakkindaScreen({ navigation }) {
  const tip = useTipScale();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const arapcaOpacity = useRef(new Animated.Value(0)).current;
  const arapcaTranslateY = useRef(new Animated.Value(12)).current;
  const surumOpacity = useRef(new Animated.Value(0)).current;
  const lisansOpacity = useRef(new Animated.Value(0)).current;
  const lisansTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(arapcaOpacity, {
        toValue: 1,
        delay: 200,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(arapcaTranslateY, {
        toValue: 0,
        delay: 200,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(surumOpacity, {
        toValue: 1,
        delay: 400,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lisansOpacity, {
        toValue: 1,
        delay: 600,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lisansTranslateY, {
        toValue: 0,
        delay: 600,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    logoOpacity,
    logoScale,
    arapcaOpacity,
    arapcaTranslateY,
    surumOpacity,
    lisansOpacity,
    lisansTranslateY,
  ]);

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Hakkında</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.Text
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          Hu
        </Animated.Text>
        <Animated.Text
          style={[
            styles.arapca,
            {
              opacity: arapcaOpacity,
              transform: [{ translateY: arapcaTranslateY }],
            },
          ]}
        >
          هُو
        </Animated.Text>
        <Animated.Text style={[styles.surum, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }, { opacity: surumOpacity }]}>v1.0.0</Animated.Text>

        <Text style={[styles.paragraf, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
          Hu, Müslüman bireyler için sade ve reklamsız bir manevi rutin asistanıdır.
          Sadaka-i câriye niyetiyle yapılmıştır.
        </Text>

        <View style={styles.bilgiKutu}>
          <Text style={[styles.bilgiBaslik, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
            Hicri Takvim Hakkında
          </Text>
          <Text style={[styles.bilgiMetin, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
            Hicri tarih hesaplaması Kuwaiti algoritmasına dayanır. Bu yöntem astronomik olarak yeni ayın doğuş anını hesaplar. Diyanet İşleri Başkanlığı ay görme (rüyet) esaslı resmi takvim yayınlar, bu iki sistem arasında 1-2 gün farklılık olabilir. Ramazan, Kurban Bayramı, Mevlid, Berat, Kadir ve diğer mübarek günler için Diyanet İşleri Başkanlığı'nın resmi takvimini esas alınız.
          </Text>
        </View>

        <View style={styles.bilgiKutu}>
          <Text style={[styles.bilgiBaslik, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
            Esma Hesabı Hakkında
          </Text>
          <Text style={[styles.bilgiMetin, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
            İsmindeki harflerin sayısal değerleri klasik Ebced hesabıyla toplanır ve seni Allah'ın 99 isminden birine yönlendirir. Bu eşleme rastgele değildir — sende doğuştan en çok ihtiyaç duyulan ilahi nitelik üzerinedir. Zikrettikçe Allah'ın bu sıfatından nasibin artar. Bu yöntem Bûnî (Şemsü'l-Maârif), Gümüşhânevî (Mecmûâtü'l-Ahzâb) ve Nâzilî (Hizbü'l-Bahr) gibi klasik havas kaynaklarında anlatılan bir gelenektir. Bilgi amaçlıdır, dini bir vecibe içermez.
          </Text>
        </View>

        <View style={styles.bilgiKutu}>
          <Text style={[styles.bilgiBaslik, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
            Manevi Sûre Tilâveti Hakkında
          </Text>
          <Text style={[styles.bilgiMetin, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
            Manevi sûreler bölümünde (Yâsîn, Rahmân, Vâkıa, Mülk, Müzzemmil, Nebe ve İnşirâh) tilâvet, kelime kelime senkronludur. Şeyh Mishary Râşid el-Afâsî hocanın okuyuşu çalarken o anda okunan kelime sarı renkle işaretlenir; böylece mushaftan parmakla takip eder gibi gözle izleyebilirsiniz. Hemen altındaki kartta âyetin meâli de aynı anda görünür — Arapça bilmeseniz dahi nereden geçildiğini rahatça takip edebilirsiniz.
          </Text>
        </View>

        <Animated.View
          style={[
            styles.lisansKutu,
            {
              opacity: lisansOpacity,
              transform: [{ translateY: lisansTranslateY }],
            },
          ]}
        >
          <Text style={[styles.lisansSatir, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>📖 Meal (kısa sûreler): Diyanet İşleri Başkanlığı</Text>
          <Text style={[styles.lisansSatir, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>📖 Meal (manevi sûreler): Süleyman Ateş (alquran.cloud)</Text>
          <Text style={[styles.lisansSatir, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>📚 Hadisler: fawazahmed0/hadith-api (MIT)</Text>
          <Text style={[styles.lisansSatir, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>🕌 Namaz vakitleri: adhan-js</Text>
          <Text style={[styles.lisansSatir, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>🌟 Esma faziletleri: Klasik İslami kaynaklar (Bûnî, Gümüşhânevî, Nâzilî)</Text>
          <Text style={[styles.lisansSatir, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>🔔 Ezan sesi: Wikimedia Commons / Aaqib Azeez (CC BY-SA 4.0)</Text>
          <Text style={[styles.lisansSatir, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>📿 Tespih sesi: OpenGameArt / rubberduck "80 CC0 RPG SFX" (CC0)</Text>
          <Text style={[styles.lisansSatir, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>🌧️ Ortam sesleri: Internet Archive Nature Sounds (CC0)</Text>
          <Text style={[styles.lisansSatir, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>📜 Sûre tilâvetleri (kısa): Şeyh Saad al-Ghamdi</Text>
          <Text style={[styles.lisansSatir, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>📜 Tilâvet (manevi sûreler + kelime senkron): Şeyh Mishary Rashid al-Afasy (Quran.com)</Text>
        </Animated.View>

        <Text style={[styles.niyet, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>🤲 Niyetimiz halis olsun</Text>
      </ScrollView>
    </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  geri: { color: colors.altin, width: 60 },
  baslik: { color: colors.anaYesil, fontWeight: '600', flex: 1, textAlign: 'center' },
  scroll: { padding: 24, alignItems: 'center' },
  logo: { fontSize: type.display, color: colors.altin, marginTop: 12 },
  arapca: { fontSize: 40, color: colors.anaMetin, marginTop: 4 },
  surum: { color: colors.ikincilMetin, marginTop: 8 },
  paragraf: {
    color: colors.anaMetin,
    textAlign: 'center',
    marginTop: 22,
    paddingHorizontal: 8,
  },
  bilgiKutu: {
    marginTop: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cizgi,
    borderRadius: radii.sm,
    width: '100%',
    backgroundColor: '#FFF7E0',
  },
  bilgiBaslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    marginBottom: 8,
  },
  bilgiMetin: {
    color: colors.anaMetin,
    textAlign: 'left',
  },
  lisansKutu: {
    marginTop: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cizgi,
    borderRadius: radii.sm,
    width: '100%',
  },
  lisansSatir: { color: colors.anaMetin, marginVertical: 3 },
  niyet: {
    marginTop: 28,
    color: colors.anaYesil,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
