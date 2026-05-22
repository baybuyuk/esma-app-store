import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Rect } from 'react-native-svg';
import { colors } from '../constants/colors';

/**
 * IsinPatlamasi
 * Onboarding "bu senin" reveal ani. Tek seferlik dramatic:
 *   - 10 isin dilimi merkezden disa fade-in (0->0.65 opacity) + 45 derece rotation, 800ms
 *   - Ardindan kisa halo (180ms hold + 320ms fade-out)
 * Sadece transform + opacity, useNativeDriver:true.
 *
 * Props:
 *   aktif: boolean
 *   boyut: number   (default 360)
 *   renk:  string   (default altin)
 *   adet:  number   (default 10, 8-12 onerilir)
 */
export default function IsinPatlamasi({ aktif, boyut = 360, renk = colors.altin, adet = 10 }) {
  const isinOpacity = useRef(new Animated.Value(0)).current;
  const isinRot = useRef(new Animated.Value(0)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.6)).current;

  const isinlar = useMemo(() => {
    return Array.from({ length: adet }, (_, i) => ({
      id: i,
      aci: (360 / adet) * i,
    }));
  }, [adet]);

  useEffect(() => {
    if (!aktif) {
      isinOpacity.setValue(0);
      isinRot.setValue(0);
      haloOpacity.setValue(0);
      haloScale.setValue(0.6);
      return;
    }
    isinOpacity.setValue(0);
    isinRot.setValue(0);
    haloOpacity.setValue(0);
    haloScale.setValue(0.6);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(isinOpacity, {
          toValue: 0.65,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(isinRot, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(isinOpacity, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(haloOpacity, {
              toValue: 0.45,
              duration: 180,
              useNativeDriver: true,
            }),
            Animated.timing(haloScale, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(haloOpacity, {
            toValue: 0,
            duration: 320,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [aktif, isinOpacity, isinRot, haloOpacity, haloScale]);

  const rotation = isinRot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const isinUzunluk = boyut / 2;
  const isinGenislik = Math.max(3, boyut / 90);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.kapsayici,
        { width: boyut, height: boyut, marginLeft: -boyut / 2, marginTop: -boyut / 2 },
      ]}
    >
      {/* Halo (ikinci faz) */}
      <Animated.View
        style={{
          position: 'absolute',
          width: boyut,
          height: boyut,
          opacity: haloOpacity,
          transform: [{ scale: haloScale }],
        }}
      >
        <Svg width={boyut} height={boyut}>
          <Defs>
            <RadialGradient id="isinHalo" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={renk} stopOpacity="0.8" />
              <Stop offset="55%" stopColor={renk} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={renk} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={boyut / 2} cy={boyut / 2} r={boyut / 2} fill="url(#isinHalo)" />
        </Svg>
      </Animated.View>

      {/* Isin dilimleri (ilk faz) */}
      <Animated.View
        style={{
          position: 'absolute',
          width: boyut,
          height: boyut,
          opacity: isinOpacity,
          transform: [{ rotate: rotation }],
        }}
      >
        <Svg width={boyut} height={boyut}>
          <Defs>
            <RadialGradient id="isinFade" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={renk} stopOpacity="1" />
              <Stop offset="60%" stopColor={renk} stopOpacity="0.5" />
              <Stop offset="100%" stopColor={renk} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {isinlar.map((isin) => (
            <Rect
              key={isin.id}
              x={boyut / 2 - isinGenislik / 2}
              y={0}
              width={isinGenislik}
              height={isinUzunluk}
              fill="url(#isinFade)"
              transform={`rotate(${isin.aci}, ${boyut / 2}, ${boyut / 2})`}
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  kapsayici: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
});
