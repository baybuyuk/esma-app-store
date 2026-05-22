import { useFonts } from 'expo-font';

export function useUygulamaFontlari() {
  const [yukluMu] = useFonts({});
  return yukluMu;
}
