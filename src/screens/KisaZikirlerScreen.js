// KisaZikirlerScreen — 82 zikirin kompakt listesi.
//
// UX kararlari (Yusuf geri bildirimi):
//  - Eski: ad / arapca / meal / alt-sol rozet — dagınık, her kart 4 satir
//  - Yeni: ust satirda ad SOLDA + rozet ve favori SAGDA (aynali/simetrik)
//          arapca, meal, en altta tesir chip'leri (tikla -> filter)
//  - Tesir chip'i tiklandiginda ayni tesirdeki zikirler filtreleniyor
//    ("daha toplu durur"). Aktif filter ust barda iptal butonuyla.
//  - "Tesir alani" etiketi YAZILMAZ — chip degeri direkt gosterilir
//    (Estagfirullah icin "Tövbe" gibi, etiket dolgun degil).
//  - Favoriler: her kartin sag ustunde yildiz (bos/dolu), tikla toggle.
//    AsyncStorage anahtari @hu/favori/zikir. Ust barda "⭐ Favoriler"
//    toggle ile sadece favoriler gosterilebilir.

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { useTipScale } from '../context/YaziKademesiContext';
import { kisaZikirler } from '../lib/data';
import GradientArkaPlan from '../components/GradientArkaPlan';

const KAYNAK_RENGI = {
  kuran: { arka: '#E6F0E6', metin: colors.anaYesil, etiket: '📖 Kuran' },
  sahih_hadis: { arka: '#E6EEF5', metin: '#1F4E79', etiket: '📚 Sahih Hadis' },
};

// Tesir alani ASCII -> Turkce diakritik + Title Case.
// JSON'da 80+ farkli etiket var, sik kullanilanlar elle eslestirildi.
// Eslenmeyenler ilk-harf-buyuk fallback (capitalize) ile gosterilir.
const TESIR_ETIKET = {
  tovbe: 'Tövbe', tevbe: 'Tövbe',
  sukur: 'Şükür', magfiret: 'Mağfiret',
  saglik: 'Sağlık', sifa: 'Şifa', hastalik: 'Hastalık', agri: 'Ağrı',
  sikinti: 'Sıkıntı', uzuntu: 'Üzüntü', kaygi: 'Kaygı',
  borc: 'Borç', is: 'İş', rizik: 'Rızık', bereket: 'Bereket',
  korunma: 'Korunma', korku: 'Korku', sihir: 'Sihir', nazar: 'Nazar',
  vesvese: 'Vesvese', dusman: 'Düşman',
  aile: 'Aile', ailes: 'Aile', evlat: 'Evlat', anne_baba: 'Anne-Baba',
  esiyle: 'Eşle', vefat: 'Vefat',
  sabah: 'Sabah', aksam: 'Akşam', gece: 'Gece', uyku: 'Uyku',
  namaz: 'Namaz', vitir: 'Vitir', abdest: 'Abdest', cuma: 'Cuma',
  ramazan: 'Ramazan', ezan: 'Ezan', cami: 'Câmi',
  tevhid: 'Tevhid', tesbih: 'Tesbih', hamd: 'Hamd', salavat: 'Salavat',
  iman: 'İman', kulluk: 'Kulluk', ibadet: 'İbadet', dua: 'Duâ',
  tevekkul: 'Tevekkül', rahmet: 'Rahmet', sefaat: 'Şefaat', safaat: 'Şefaat',
  ahirret: 'Âhiret', ahiret: 'Âhiret', cennet: 'Cennet', kabir: 'Kabir',
  gunah: 'Günah', vicdan: 'Vicdan', kayip: 'Kayıp', musibet: 'Musîbet',
  ferahlik: 'Ferahlık', hayir: 'Hayır', manevi: 'Mânevî',
  yemek: 'Yemek', yolculuk: 'Yolculuk', alısveris: 'Alışveriş',
  yagmur: 'Yağmur', ruzgar: 'Rüzgâr', afet: 'Âfet',
  zorluk: 'Zorluk', umut: 'Ümit', kalp: 'Kalp', kulluk: 'Kulluk',
  selam: 'Selâm', adap: 'Âdâb', tekbir: 'Tekbir', sevap: 'Sevap',
  ev: 'Ev', sunnet: 'Sünnet', cin: 'Cin', acizlik: 'Âcizlik',
  af: 'Af', razi: 'Razı', karar: 'Karar', umum: 'Umum', nimet: 'Nimet',
};

function tesirEtiket(t) {
  if (TESIR_ETIKET[t]) return TESIR_ETIKET[t];
  if (!t) return '';
  return t.charAt(0).toLocaleUpperCase('tr-TR') + t.slice(1);
}

const FAVORI_KEY = '@hu/favori/zikir';

export default function KisaZikirlerScreen({ navigation }) {
  const tip = useTipScale();
  const [aktifTesir, setAktifTesir] = useState(null);
  const [sadeceFavori, setSadeceFavori] = useState(false);
  const [favoriler, setFavoriler] = useState(() => new Set());

  const girisOpacity = useRef(new Animated.Value(0)).current;
  const girisTranslateY = useRef(new Animated.Value(20)).current;

  // Favori yukle
  useEffect(() => {
    (async () => {
      try {
        const ham = await AsyncStorage.getItem(FAVORI_KEY);
        if (ham) setFavoriler(new Set(JSON.parse(ham)));
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(girisOpacity, {
        toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(girisTranslateY, {
        toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, [girisOpacity, girisTranslateY]);

  const favoriToggle = useCallback(async (id) => {
    setFavoriler((onceki) => {
      const yeni = new Set(onceki);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      AsyncStorage.setItem(FAVORI_KEY, JSON.stringify(Array.from(yeni))).catch(() => {});
      return yeni;
    });
  }, []);

  const gosterilen = useMemo(() => {
    let liste = kisaZikirler;
    if (aktifTesir) liste = liste.filter((z) => z.tesir?.includes(aktifTesir));
    if (sadeceFavori) liste = liste.filter((z) => favoriler.has(z.id));
    return liste;
  }, [aktifTesir, sadeceFavori, favoriler]);

  const filtreAktif = aktifTesir != null || sadeceFavori;

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Kısa Zikirler</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Filter bar — favori toggle + aktif tesir chip iptal */}
        <View style={styles.filtreBar}>
          <TouchableOpacity
            style={[styles.favoriToggleBtn, sadeceFavori && styles.favoriToggleAktif]}
            onPress={() => setSadeceFavori((v) => !v)}
            hitSlop={6}
          >
            <Text style={[styles.favoriToggleYazi, { fontSize: tip.xs.fontSize }, sadeceFavori && styles.favoriToggleYaziAktif]}>
              {sadeceFavori ? '★ Favoriler' : '☆ Favoriler'}
            </Text>
          </TouchableOpacity>

          {aktifTesir && (
            <TouchableOpacity
              style={styles.aktifTesirChip}
              onPress={() => setAktifTesir(null)}
              hitSlop={6}
            >
              <Text style={[styles.aktifTesirYazi, { fontSize: tip.xs.fontSize }]}>
                {tesirEtiket(aktifTesir)} ✕
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ flex: 1 }} />

          <Text style={[styles.sayim, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
            {gosterilen.length}/{kisaZikirler.length}
          </Text>
        </View>

        <Animated.View
          style={{
            flex: 1,
            opacity: girisOpacity,
            transform: [{ translateY: girisTranslateY }],
          }}
        >
          {gosterilen.length === 0 ? (
            <View style={styles.bosKonteyner}>
              <Text style={[styles.bosMetin, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                {sadeceFavori ? 'Henüz favorilediğin zikir yok.' : 'Bu tesir alanında zikir bulunamadı.'}
              </Text>
              {filtreAktif && (
                <TouchableOpacity onPress={() => { setAktifTesir(null); setSadeceFavori(false); }}>
                  <Text style={[styles.bosLink, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                    Filtreleri temizle
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={gosterilen}
              keyExtractor={(z) => z.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
              renderItem={({ item }) => {
                const rozet = KAYNAK_RENGI[item.kaynak_turu] || KAYNAK_RENGI.sahih_hadis;
                const favori = favoriler.has(item.id);
                return (
                  <View style={styles.kart}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ZikirDetay', { zikirId: item.id })}
                      activeOpacity={0.85}
                    >
                      {/* Ust satir: Ad SOL — Rozet + Favori SAG (aynali) */}
                      <View style={styles.ustSatir}>
                        <Text
                          style={[styles.ad, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}
                          numberOfLines={1}
                        >
                          {item.ad}
                        </Text>
                        <View style={styles.ustSag}>
                          <View style={[styles.rozet, { backgroundColor: rozet.arka }]}>
                            <Text style={[styles.rozetYazi, { color: rozet.metin, fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                              {rozet.etiket}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={(e) => { e.stopPropagation?.(); favoriToggle(item.id); }}
                            hitSlop={10}
                            style={styles.favoriBtn}
                          >
                            <Text style={[styles.favoriIkon, favori && styles.favoriIkonAktif]}>
                              {favori ? '★' : '☆'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text
                        style={[styles.arapca, { fontSize: tip.arapca.fontSize, lineHeight: tip.arapca.lineHeight }]}
                        numberOfLines={1}
                      >
                        {item.arapca}
                      </Text>
                      <Text
                        style={[styles.meal, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}
                        numberOfLines={1}
                      >
                        {item.meal}
                      </Text>
                    </TouchableOpacity>

                    {/* Tesir chip'leri — tikla -> o tesir alaninda filter */}
                    {item.tesir && item.tesir.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tesirSatir}
                      >
                        {item.tesir.slice(0, 5).map((t) => (
                          <TouchableOpacity
                            key={t}
                            style={[styles.tesirChip, aktifTesir === t && styles.tesirChipAktif]}
                            onPress={() => setAktifTesir(t)}
                            hitSlop={4}
                          >
                            <Text style={[styles.tesirChipYazi, { fontSize: tip.xs.fontSize }, aktifTesir === t && styles.tesirChipYaziAktif]}>
                              {tesirEtiket(t)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                );
              }}
            />
          )}
        </Animated.View>
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

  filtreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  favoriToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cizgi,
    backgroundColor: '#fff',
  },
  favoriToggleAktif: {
    backgroundColor: colors.altin,
    borderColor: colors.altin,
  },
  favoriToggleYazi: { color: colors.ikincilMetin, fontWeight: '600' },
  favoriToggleYaziAktif: { color: '#fff' },

  aktifTesirChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.anaYesil,
  },
  aktifTesirYazi: { color: '#fff', fontWeight: '600' },

  sayim: { color: colors.ikincilMetin },

  kart: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  ustSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ad: {
    color: colors.anaYesil,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  ustSag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rozet: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rozetYazi: { fontWeight: '600' },
  favoriBtn: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriIkon: {
    fontSize: 22,
    color: colors.cizgi,
  },
  favoriIkonAktif: { color: colors.altin },

  arapca: { color: colors.anaMetin, marginTop: 6, fontStyle: 'italic' },
  meal: { color: colors.ikincilMetin, marginTop: 4 },

  tesirSatir: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  tesirChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 11,
    backgroundColor: '#F4EFE4', // krem-altin yumusak
    borderWidth: 1,
    borderColor: '#E5DBC2',
  },
  tesirChipAktif: {
    backgroundColor: colors.anaYesil,
    borderColor: colors.anaYesil,
  },
  tesirChipYazi: { color: colors.altin, fontWeight: '600' },
  tesirChipYaziAktif: { color: '#fff' },

  bosKonteyner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bosMetin: {
    color: colors.ikincilMetin,
    textAlign: 'center',
    marginBottom: 12,
  },
  bosLink: {
    color: colors.altin,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
