import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../constants/colors';

/**
 * GradientArkaPlan
 * Tum ekranlar icin atmosferik krem -> kremAlt dikey gradient + sag ust altin halesi.
 * Statik (animasyon yok). useNativeDriver:true gerektirmez (animasyon yok).
 *
 * Kullanim:
 *   <GradientArkaPlan>
 *     <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>...</SafeAreaView>
 *   </GradientArkaPlan>
 */
export default function GradientArkaPlan({ children, style }) {
  return (
    <View style={[styles.kok, style]}>
      <LinearGradient
        colors={[colors.krem, colors.kremAlt]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient
            id="altinHale"
            cx="92%"
            cy="6%"
            rx="70%"
            ry="55%"
            fx="92%"
            fy="6%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={colors.altin} stopOpacity="0.11" />
            <Stop offset="55%" stopColor={colors.altin} stopOpacity="0.04" />
            <Stop offset="100%" stopColor={colors.altin} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#altinHale)" />
      </Svg>
      <View style={styles.icerik}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: colors.krem },
  icerik: { flex: 1 },
});
