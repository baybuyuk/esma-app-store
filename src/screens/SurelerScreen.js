// Sureler ekrani — iki sekmeli yapi:
//  - "Namaz Sureleri" sekmesi: 15 kisa sure, SureDetay ekranina (eski tek-mp3 player)
//  - "Manevi Dinleme" sekmesi: 6 buyuk sure, ManeviSureDetay ekranina (ayet ayet tilavet + auto-scroll)

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { useTipScale } from '../context/YaziKademesiContext';
import { sureler, maneviSureler } from '../lib/data';
import GradientArkaPlan from '../components/GradientArkaPlan';

export default function SurelerScreen({ navigation }) {
  const tip = useTipScale();
  const [sekme, setSekme] = useState('namaz'); // 'namaz' | 'manevi'

  const liste = useMemo(
    () => (sekme === 'manevi' ? (maneviSureler || []) : (sureler || [])),
    [sekme]
  );

  const altMetin = sekme === 'manevi'
    ? 'Ayet ayet dinleyerek ezberle ve oku.'
    : 'Tilâvet eşliğinde okumak için seç.';

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [opacity, translateY]);

  const sekmeyeBas = (yeni) => {
    if (yeni === sekme) return;
    setSekme(yeni);
  };

  const ogeyeBas = (item) => {
    if (sekme === 'manevi') {
      navigation.navigate('ManeviSureDetay', { sureNo: item.no });
    } else {
      navigation.navigate('SureDetay', { sureNo: item.no });
    }
  };

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Sûreler</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Segmented control (2 buton) */}
        <View style={styles.sekmeKapsayici}>
          <Pressable
            onPress={() => sekmeyeBas('namaz')}
            style={[styles.sekmeBtn, sekme === 'namaz' && styles.sekmeBtnAktif]}
            accessibilityRole="tab"
            accessibilityState={{ selected: sekme === 'namaz' }}
            accessibilityLabel="Namaz Sûreleri sekmesi"
            hitSlop={6}
          >
            <Text
              style={[
                styles.sekmeYazi,
                { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight },
                sekme === 'namaz' && styles.sekmeYaziAktif,
              ]}
            >
              Namaz Sûreleri
            </Text>
          </Pressable>
          <Pressable
            onPress={() => sekmeyeBas('manevi')}
            style={[styles.sekmeBtn, sekme === 'manevi' && styles.sekmeBtnAktif]}
            accessibilityRole="tab"
            accessibilityState={{ selected: sekme === 'manevi' }}
            accessibilityLabel="Manevi Dinleme sekmesi"
            hitSlop={6}
          >
            <Text
              style={[
                styles.sekmeYazi,
                { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight },
                sekme === 'manevi' && styles.sekmeYaziAktif,
              ]}
            >
              Manevi Dinleme
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.altMetin, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
          {altMetin}
        </Text>

        <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
          <FlatList
            data={liste}
            // keyExtractor sekme prefix'i ile — sekme degisince FlatList icini tamamen yeniler
            keyExtractor={(s) => `${sekme}-${s.no}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.kart}
                onPress={() => ogeyeBas(item)}
                activeOpacity={0.85}
                accessibilityLabel={`${item.ad} sûresi`}
                accessibilityRole="button"
              >
                <View style={styles.kartIcerik}>
                  <View style={styles.arapcaCerceve}>
                    <Text style={styles.arapcaAd}>{item.arapca_ad}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.turkceAd, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                      {item.ad} Sûresi
                    </Text>
                    <Text style={[styles.altKart, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                      {item.ayet_sayisi} âyet · {item.inis_yeri}
                    </Text>
                    {item.kisa_aciklama ? (
                      <Text
                        style={[styles.kisaAciklama, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight * 1.2 }]}
                        numberOfLines={2}
                      >
                        {item.kisa_aciklama}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.ok}>›</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[styles.bos, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight }]}>
                {sekme === 'manevi' ? 'Manevi sûreler henüz hazırlanıyor.' : 'Henüz sûre eklenmedi.'}
              </Text>
            }
          />
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

  // Sekme (segmented control)
  sekmeKapsayici: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: '#FDFAF1',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cizgi,
    overflow: 'hidden',
  },
  sekmeBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sekmeBtnAktif: {
    backgroundColor: colors.altin,
  },
  sekmeYazi: {
    color: colors.altin,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sekmeYaziAktif: {
    color: colors.anaYesil,
  },

  altMetin: {
    color: colors.ikincilMetin,
    paddingHorizontal: 22,
    paddingBottom: 12,
    textAlign: 'center',
  },
  kart: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  kartIcerik: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  arapcaCerceve: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDFAF1',
    borderWidth: 1,
    borderColor: colors.cizgi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arapcaAd: {
    fontSize: 22,
    lineHeight: 30,
    color: colors.anaYesil,
    fontWeight: '600',
  },
  turkceAd: { color: colors.anaMetin, fontWeight: '600' },
  altKart: { color: colors.altin, marginTop: 2, fontWeight: '600' },
  kisaAciklama: {
    color: colors.ikincilMetin,
    marginTop: 6,
  },
  ok: { color: colors.altin, fontSize: 26, marginLeft: 6 },
  bos: {
    textAlign: 'center',
    color: colors.ikincilMetin,
    marginTop: 40,
    paddingHorizontal: 24,
  },
});
