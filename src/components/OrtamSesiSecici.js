// Ortam sesi (yagmur/deniz/orman) secici modal — bottom-sheet tarzi.
// Sheet kutuphanesi YOK; basit Modal + slide-up animasyon ile yasli kullanici icin
// minimal karmasiklik. Sadece transform/opacity animasyonu (useNativeDriver:true).

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { useTipScale } from '../context/YaziKademesiContext';

const SECENEKLER = [
  { id: null, ikon: '🔇', etiket: 'Yok' },
  { id: 'yagmur', ikon: '🌧️', etiket: 'Yağmur' },
  { id: 'deniz', ikon: '🌊', etiket: 'Deniz dalgası' },
  { id: 'orman', ikon: '🐦', etiket: 'Orman kuşları' },
];

const SEVIYELER = [
  { id: 'kisik', ikon: '🔈', etiket: 'Kısık' },
  { id: 'orta', ikon: '🔉', etiket: 'Orta' },
  { id: 'yuksek', ikon: '🔊', etiket: 'Yüksek' },
];

const SHEET_YUKSEKLIK = 460;
const EKRAN_YUKSEKLIK = Dimensions.get('window').height;

export default function OrtamSesiSecici({ visible, onClose, mevcut, onKaydet }) {
  const tip = useTipScale();
  // Yerel taslak — Tamam'a basana kadar dis state degismesin (cancel davranisi).
  const [secimId, setSecimId] = useState(mevcut?.id ?? null);
  const [secimSeviye, setSecimSeviye] = useState(mevcut?.seviye ?? 'orta');

  const slideAnim = useRef(new Animated.Value(SHEET_YUKSEKLIK)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // visible degisiminde taslagi mevcut ayardan yeniden senkronla
  useEffect(() => {
    if (visible) {
      setSecimId(mevcut?.id ?? null);
      setSecimSeviye(mevcut?.seviye ?? 'orta');
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Modal kapatildiginda bir sonraki acilis icin reset
      slideAnim.setValue(SHEET_YUKSEKLIK);
      backdropAnim.setValue(0);
    }
  }, [visible, mevcut, slideAnim, backdropAnim]);

  const kapat = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SHEET_YUKSEKLIK,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  }, [slideAnim, backdropAnim, onClose]);

  const tamamla = useCallback(() => {
    onKaydet?.({ id: secimId, seviye: secimSeviye });
    kapat();
  }, [secimId, secimSeviye, onKaydet, kapat]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={kapat}
      statusBarTranslucent
    >
      <View style={styles.kap}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={kapat} accessibilityLabel="Kapat" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.tutac} />

          <Text
            style={[
              styles.baslik,
              { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight },
            ]}
          >
            Arka Plan Sesi
          </Text>
          <Text
            style={[
              styles.altMetin,
              { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight },
            ]}
          >
            Zikir çekerken hafifçe çalar
          </Text>

          {/* Ses secenekleri */}
          <View style={styles.secenekListe}>
            {SECENEKLER.map((s) => {
              const aktif = secimId === s.id;
              return (
                <Pressable
                  key={String(s.id)}
                  onPress={() => setSecimId(s.id)}
                  style={({ pressed }) => [
                    styles.secenek,
                    aktif && styles.secenekAktif,
                    pressed && styles.secenekBasili,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: aktif }}
                  accessibilityLabel={s.etiket}
                >
                  <View style={[styles.daire, aktif && styles.daireAktif]} />
                  <Text style={styles.secenekIkon}>{s.ikon}</Text>
                  <Text
                    style={[
                      styles.secenekYazi,
                      { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight },
                    ]}
                  >
                    {s.etiket}
                  </Text>
                  {aktif && <Text style={styles.tik}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          {/* Ses seviyesi */}
          <Text
            style={[
              styles.seviyeBaslik,
              { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight },
            ]}
          >
            Ses seviyesi
          </Text>
          <View style={styles.seviyeBar}>
            {SEVIYELER.map((sv) => {
              const aktif = secimSeviye === sv.id;
              return (
                <Pressable
                  key={sv.id}
                  onPress={() => setSecimSeviye(sv.id)}
                  style={({ pressed }) => [
                    styles.seviyeKart,
                    aktif && styles.seviyeKartAktif,
                    pressed && styles.secenekBasili,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: aktif }}
                  accessibilityLabel={`Ses seviyesi ${sv.etiket}`}
                >
                  <Text style={styles.seviyeIkon}>{sv.ikon}</Text>
                  <Text
                    style={[
                      styles.seviyeYazi,
                      aktif && styles.seviyeYaziAktif,
                      { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight },
                    ]}
                  >
                    {sv.etiket}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={tamamla}
            style={styles.tamamButon}
            accessibilityRole="button"
            accessibilityLabel="Tamam"
          >
            <Text
              style={[
                styles.tamamYazi,
                { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight },
              ]}
            >
              Tamam
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.krem,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    minHeight: SHEET_YUKSEKLIK,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  tutac: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cizgi,
    alignSelf: 'center',
    marginBottom: 14,
  },
  baslik: {
    color: colors.anaYesil,
    fontWeight: '700',
    textAlign: 'center',
  },
  altMetin: {
    color: colors.ikincilMetin,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  secenekListe: {
    marginBottom: 18,
  },
  secenek: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  secenekAktif: {
    borderColor: colors.altin,
    backgroundColor: '#FFF7E0',
  },
  secenekBasili: {
    opacity: 0.7,
  },
  daire: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.cizgi,
    backgroundColor: 'transparent',
    marginRight: 12,
  },
  daireAktif: {
    borderColor: colors.altin,
    backgroundColor: colors.altin,
  },
  secenekIkon: {
    fontSize: 22,
    marginRight: 10,
  },
  secenekYazi: {
    flex: 1,
    color: colors.anaMetin,
    fontWeight: '600',
  },
  tik: {
    fontSize: 20,
    color: colors.altin,
    fontWeight: '700',
  },
  seviyeBaslik: {
    color: colors.anaMetin,
    fontWeight: '700',
    marginBottom: 10,
  },
  seviyeBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  seviyeKart: {
    flex: 1,
    minHeight: 64,
    borderRadius: radii.md,
    backgroundColor: '#FFF7E0',
    borderWidth: 1,
    borderColor: colors.cizgi,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  seviyeKartAktif: {
    backgroundColor: colors.anaYesil,
    borderColor: colors.anaYesil,
  },
  seviyeIkon: {
    fontSize: 22,
    marginBottom: 2,
  },
  seviyeYazi: {
    color: colors.altin,
    fontWeight: '700',
  },
  seviyeYaziAktif: {
    color: '#fff',
  },
  tamamButon: {
    minHeight: 56,
    borderRadius: radii.md,
    backgroundColor: colors.anaYesil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tamamYazi: {
    color: '#fff',
    fontWeight: '700',
  },
});
