import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { colors } from '../constants/colors';

/**
 * KaligrafiHalo
 * Mount aninda 800ms tek seferlik fade-in halo, ardindan ~18s periyotlu yavas
 * breathing (opacity 0.1 <-> 0.25). Sadece opacity animate edilir -> nativeDriver.
 *
 * Arapca kaligrafinin arkasina absolute olarak yerlestirilmek uzere tasarlandi.
 *
 * Props:
 *   boyut: number
 *   renk:  string  (default altin)
 */
export default function KaligrafiHalo({ boyut = 240, renk = colors.altin }) {
  const acilis = useRef(new Animated.Value(0)).current;
  const nefes = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);

  useEffect(() => {
    acilis.setValue(0);
    nefes.setValue(0);

    Animated.sequence([
      Animated.timing(acilis, {
        toValue: 0.4,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(acilis, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Yavas breathing loop
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(nefes, {
            toValue: 1,
            duration: 9000,
            useNativeDriver: true,
          }),
          Animated.timing(nefes, {
            toValue: 0,
            duration: 9000,
            useNativeDriver: true,
          }),
        ])
      );
      loopRef.current = loop;
      loop.start();
    });

    return () => {
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current = null;
      }
    };
  }, [acilis, nefes]);

  // Toplam opacity = acilis (kisa parlama) + nefes (0.1 -> 0.25)
  const nefesOpacity = nefes.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.25],
  });
  const toplam = Animated.add(acilis, nefesOpacity);

  return (
    <View pointerEvents="none" style={[styles.kok, { width: boyut, height: boyut, marginLeft: -boyut / 2, marginTop: -boyut / 2 }]}>
      <Animated.View style={{ width: boyut, height: boyut, opacity: toplam }}>
        <Svg width={boyut} height={boyut}>
          <Defs>
            <RadialGradient id="kaligrafiHalo" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor={renk} stopOpacity="0.85" />
              <Stop offset="50%" stopColor={renk} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={renk} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={boyut / 2} cy={boyut / 2} r={boyut / 2} fill="url(#kaligrafiHalo)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
});
