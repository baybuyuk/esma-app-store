import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

/**
 * Partikullar
 * Aktif=true olunca yukaridan asagi yagan kucuk altin noktalar.
 * Sure: 600ms. Sadece transform + opacity (useNativeDriver:true).
 *
 * Props:
 *   aktif: boolean
 *   alan:  { en, boy } -> partikullerin dagilacagi pencere
 *   adet:  default 10
 */
export default function Partikullar({ aktif, alan = { en: 300, boy: 300 }, adet = 10 }) {
  const parts = useMemo(() => {
    return Array.from({ length: adet }, (_, i) => {
      const baslangicX = Math.random() * alan.en;
      const dusus = alan.boy * (0.55 + Math.random() * 0.45); // 55-100% asagi
      const gecikme = Math.random() * 160; // 0-160ms stagger
      const boyut = 3 + Math.random() * 2; // 3-5 px
      return { id: i, baslangicX, dusus, gecikme, boyut };
    });
  }, [adet, alan.en, alan.boy]);

  // her partikul icin Animated.Value cifti
  const animler = useRef(
    parts.map(() => ({
      ty: new Animated.Value(0),
      op: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!aktif) {
      animler.forEach((a) => {
        a.ty.setValue(0);
        a.op.setValue(0);
      });
      return;
    }
    const animasyonlar = parts.map((p, i) => {
      animler[i].ty.setValue(-20);
      animler[i].op.setValue(0);
      return Animated.parallel([
        Animated.timing(animler[i].ty, {
          toValue: p.dusus,
          duration: 600,
          delay: p.gecikme,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(animler[i].op, {
            toValue: 0.9,
            duration: 140,
            delay: p.gecikme,
            useNativeDriver: true,
          }),
          Animated.timing(animler[i].op, {
            toValue: 0,
            duration: 460,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });
    Animated.parallel(animasyonlar).start();
  }, [aktif, parts, animler]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.kapsayici,
        { width: alan.en, height: alan.boy, marginLeft: -alan.en / 2, marginTop: -alan.boy / 2 },
      ]}
    >
      {parts.map((p, i) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.baslangicX,
            top: 0,
            width: p.boyut,
            height: p.boyut,
            borderRadius: p.boyut / 2,
            backgroundColor: colors.altin,
            opacity: animler[i].op,
            transform: [{ translateY: animler[i].ty }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  kapsayici: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    overflow: 'hidden',
  },
});
