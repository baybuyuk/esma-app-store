import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { colors } from '../constants/colors';

/**
 * NurHalesi
 * Zikir hedef tamamlandiginda merkez -> dis yayilan altin radyal hale.
 * Tek seferlik patlama: scale 0.6 -> 1.4, opacity 0 -> 0.5 -> 0 (600ms).
 *
 * Props:
 *   aktif: boolean    -> true olunca animasyon basliyor
 *   boyut: number     -> hale capi (px)
 *   renk:  string     -> opsiyonel, default altin
 */
export default function NurHalesi({ aktif, boyut = 300, renk = colors.altin }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!aktif) {
      scale.setValue(0.6);
      opacity.setValue(0);
      return;
    }
    scale.setValue(0.6);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.4,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [aktif, scale, opacity]);

  return (
    <View pointerEvents="none" style={[styles.kapsayici, { width: boyut, height: boyut, marginLeft: -boyut / 2, marginTop: -boyut / 2 }]}>
      <Animated.View
        style={{
          width: boyut,
          height: boyut,
          opacity,
          transform: [{ scale }],
        }}
      >
        <Svg width={boyut} height={boyut}>
          <Defs>
            <RadialGradient id="nurHale" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={renk} stopOpacity="0.85" />
              <Stop offset="45%" stopColor={renk} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={renk} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={boyut / 2} cy={boyut / 2} r={boyut / 2} fill="url(#nurHale)" />
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
