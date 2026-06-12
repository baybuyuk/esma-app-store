import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../constants/colors';
import { type } from '../constants/type';

/**
 * ErrorBoundary — uygulamayi sarmalayan global hata yakalayici.
 * React class component zorunlu (componentDidCatch sadece class'larda calisir).
 * iOS TestFlight / Apple Review crash bypass'i icin kor noktayi kapatir.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Production'da uzak loglama buraya entegre edilebilir (Sentry vb.)
    console.error('[ErrorBoundary] yakalandi:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
    const errMsg = this.state.error?.message || '';

    return (
      <SafeAreaView style={styles.kapsayici}>
        <View style={styles.icerik}>
          <Text style={styles.ikon} accessibilityLabel="uyari">!</Text>
          <Text style={styles.baslik}>Bir aksilik oldu</Text>
          <Text style={styles.altMetin}>
            Uygulamayi yeniden baslatmayi deneyin.
          </Text>

          <TouchableOpacity
            style={styles.buton}
            onPress={this.handleReset}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Tekrar dene"
          >
            <Text style={styles.butonMetin}>Tekrar Dene</Text>
          </TouchableOpacity>

          <Text style={styles.huMark}>Hu</Text>
          {isDev && errMsg ? (
            <Text style={styles.debug} numberOfLines={4}>
              {errMsg}
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: colors.krem,
  },
  icerik: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  ikon: {
    fontSize: 48,
    color: colors.altin,
    fontWeight: '300',
    marginBottom: 16,
    width: 72,
    height: 72,
    lineHeight: 70,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.altin,
    borderRadius: 36,
  },
  baslik: {
    fontSize: type.lg,
    color: colors.anaMetin,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  altMetin: {
    fontSize: type.base,
    color: colors.ikincilMetin,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: type.base * 1.5,
  },
  buton: {
    marginTop: 28,
    minHeight: 48,
    minWidth: 160,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.anaYesil,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  butonMetin: {
    fontSize: type.base,
    color: colors.krem,
    fontWeight: '600',
  },
  huMark: {
    marginTop: 40,
    fontSize: type.xl,
    color: colors.altin,
    fontWeight: '300',
  },
  debug: {
    marginTop: 16,
    fontSize: type.xs,
    color: colors.ikincilMetin,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.7,
  },
});
