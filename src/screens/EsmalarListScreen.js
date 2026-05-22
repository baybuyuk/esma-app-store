import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { type } from '../constants/type';
import { tumEsmalar } from '../lib/esma';
import GradientArkaPlan from '../components/GradientArkaPlan';

const FAVORI_KEY = 'esmaFavoriler';

export default function EsmalarListScreen({ navigation }) {
  const [arama, setArama] = useState('');
  const [sekme, setSekme] = useState('tumu');
  const [favoriler, setFavoriler] = useState(() => new Set());
  const listeOpacity = useRef(new Animated.Value(1)).current;
  const listeTranslateY = useRef(new Animated.Value(0)).current;
  const oncekiSekmeRef = useRef(null);
  const kalpScaleMap = useRef(new Map()).current;
  const girisOpacity = useRef(new Animated.Value(0)).current;
  const girisTranslateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(girisOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(girisTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [girisOpacity, girisTranslateY]);

  const kalpScale = useCallback(
    (no) => {
      let v = kalpScaleMap.get(no);
      if (!v) {
        v = new Animated.Value(1);
        kalpScaleMap.set(no, v);
      }
      return v;
    },
    [kalpScaleMap]
  );

  const kalpBounce = useCallback(
    (no) => {
      const v = kalpScale(no);
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1.4,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [kalpScale]
  );

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORI_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) setFavoriler(new Set(arr.map(Number)));
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (oncekiSekmeRef.current === null || oncekiSekmeRef.current === sekme) {
      oncekiSekmeRef.current = sekme;
      return;
    }
    oncekiSekmeRef.current = sekme;
    Animated.sequence([
      Animated.timing(listeOpacity, {
        toValue: 0.15,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(listeOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(listeTranslateY, {
            toValue: 12,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(listeTranslateY, {
            toValue: 0,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [sekme, listeOpacity, listeTranslateY]);

  const toggleFavori = useCallback(
    (no) => {
      kalpBounce(no);
      setFavoriler((mevcut) => {
        const yeni = new Set(mevcut);
        if (yeni.has(no)) yeni.delete(no);
        else yeni.add(no);
        AsyncStorage.setItem(FAVORI_KEY, JSON.stringify(Array.from(yeni))).catch(() => {});
        return yeni;
      });
    },
    [kalpBounce]
  );

  const veri = useMemo(() => {
    let liste = tumEsmalar() || [];
    if (sekme === 'favoriler') {
      liste = liste.filter((e) => favoriler.has(e.no));
    }
    const q = arama.trim().toLocaleLowerCase('tr-TR');
    if (!q) return liste;
    return liste.filter((e) => {
      const ad = (e.esma || '').toLocaleLowerCase('tr-TR');
      const ar = e.arapca || '';
      const ebcedStr = String(e.ebced ?? '');
      const anlam = (e.anlam || '').toLocaleLowerCase('tr-TR');
      return (
        ad.includes(q) ||
        ar.includes(arama.trim()) ||
        ebcedStr === q ||
        anlam.includes(q)
      );
    });
  }, [arama, sekme, favoriler]);

  const renderItem = ({ item }) => {
    const fav = favoriler.has(item.no);
    return (
      <TouchableOpacity
        style={styles.satir}
        onPress={() => navigation.navigate('EsmaDetay', { esmaNo: item.no })}
        activeOpacity={0.85}
      >
        <View style={styles.noRozet}>
          <Text style={styles.noYazi}>{item.no}</Text>
        </View>

        <View style={styles.ortaBlok}>
          <Text style={styles.yaEsma}>Yâ {item.esma}</Text>
          {!!item.anlam && (
            <Text style={styles.anlam} numberOfLines={2}>
              {item.anlam}
            </Text>
          )}
        </View>

        <View style={styles.sagBlok}>
          <Text style={styles.arapca}>{item.arapca}</Text>
          <View style={styles.ebcedBadge}>
            <Text style={styles.ebcedYazi}>{item.ebced}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.favoriButon}
          onPress={() => toggleFavori(item.no)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Animated.Text
            style={[
              styles.favoriIkon,
              fav && styles.favoriIkonAktif,
              { transform: [{ scale: kalpScale(item.no) }] },
            ]}
          >
            {fav ? '♥' : '♡'}
          </Animated.Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <GradientArkaPlan>
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View
        style={{
          flex: 1,
          opacity: girisOpacity,
          transform: [{ translateY: girisTranslateY }],
        }}
      >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Geri">
          <Text style={styles.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.baslik}>99 Esmaü'l-Hüsnâ</Text>
        <View style={styles.headerSag} />
      </View>

      <View style={styles.sekmeler}>
        <TouchableOpacity
          style={[styles.sekme, sekme === 'tumu' && styles.sekmeAktif]}
          onPress={() => setSekme('tumu')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sekmeYazi, sekme === 'tumu' && styles.sekmeYaziAktif]}>
            Tümü
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sekme, sekme === 'favoriler' && styles.sekmeAktif]}
          onPress={() => setSekme('favoriler')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sekmeYazi, sekme === 'favoriler' && styles.sekmeYaziAktif]}>
            ♥ Favoriler{favoriler.size > 0 ? ` (${favoriler.size})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.aramaSar}>
        <TextInput
          style={styles.arama}
          placeholder="Esma, anlam veya ebced ara..."
          placeholderTextColor={colors.ikincilMetin}
          value={arama}
          onChangeText={setArama}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      <Animated.View
        style={{
          flex: 1,
          opacity: listeOpacity,
          transform: [{ translateY: listeTranslateY }],
        }}
      >
        <FlatList
          data={veri}
          keyExtractor={(item) => String(item.no)}
          renderItem={renderItem}
          contentContainerStyle={styles.liste}
          ItemSeparatorComponent={() => <View style={styles.ayirici} />}
          ListEmptyComponent={
            <View style={styles.bosKutu}>
              <Text style={styles.bosYazi}>
                {sekme === 'favoriler'
                  ? favoriler.size === 0
                    ? 'Henüz favori esma yok'
                    : 'Aranan favori bulunamadı'
                  : 'Sonuç yok'}
              </Text>
            </View>
          }
          initialNumToRender={12}
          windowSize={10}
        />
      </Animated.View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  geri: { color: colors.altin, fontSize: 16, minWidth: 60 },
  baslik: {
    flex: 1,
    textAlign: 'center',
    fontSize: type.lg,
    fontWeight: '700',
    color: colors.anaYesil,
  },
  headerSag: { minWidth: 60 },

  sekmeler: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  sekme: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.cizgi,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  sekmeAktif: {
    backgroundColor: colors.anaYesil,
    borderColor: colors.anaYesil,
  },
  sekmeYazi: {
    fontSize: type.sm,
    fontWeight: '600',
    color: colors.ikincilMetin,
  },
  sekmeYaziAktif: {
    color: '#fff',
  },

  aramaSar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  arama: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.cizgi,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.anaMetin,
  },

  liste: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  ayirici: { height: 10 },

  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  noRozet: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.anaYesil,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noYazi: {
    color: '#fff',
    fontSize: type.sm,
    fontWeight: '700',
  },
  ortaBlok: {
    flex: 1,
    paddingRight: 10,
  },
  yaEsma: {
    fontSize: 16,
    color: colors.anaYesil,
    fontWeight: '600',
  },
  anlam: {
    fontSize: type.xs,
    color: colors.ikincilMetin,
    marginTop: 2,
  },
  sagBlok: {
    alignItems: 'flex-end',
  },
  arapca: {
    fontSize: type.xl,
    color: colors.altin,
  },
  ebcedBadge: {
    marginTop: 4,
    backgroundColor: colors.krem,
    borderWidth: 1,
    borderColor: colors.altin,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ebcedYazi: {
    color: colors.altin,
    fontSize: 11,
    fontWeight: '700',
  },
  favoriButon: {
    marginLeft: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriIkon: {
    fontSize: type.xl,
    color: colors.ikincilMetin,
  },
  favoriIkonAktif: {
    color: colors.altin,
  },

  bosKutu: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  bosYazi: {
    color: colors.ikincilMetin,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
