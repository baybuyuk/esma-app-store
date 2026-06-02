import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tipScale } from '../constants/type';

const STORAGE_KEY = '@hu/yaziKademesi';
const DEFAULT_KADEME = 'normal';
const GECERLI_KADEMELER = ['kucuk', 'normal', 'buyuk'];

// Çarpan tablosu — direktör kararı
const CARPAN_TABLO = {
  kucuk:  { carpan: 1.00, basliklarCarpan: 1.00, arapcaCarpan: 1.40 },
  normal: { carpan: 1.15, basliklarCarpan: 1.08, arapcaCarpan: 1.40 },
  buyuk:  { carpan: 1.30, basliklarCarpan: 1.15, arapcaCarpan: 1.40 },
};

const YaziKademesiContext = createContext(null);

export function YaziKademesiProvider({ children }) {
  const [kademe, setKademeState] = useState(DEFAULT_KADEME);
  const [hidrasyonTamam, setHidrasyonTamam] = useState(false);

  // Mount: AsyncStorage'dan oku
  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const kayitli = await AsyncStorage.getItem(STORAGE_KEY);
        if (!iptal && kayitli && GECERLI_KADEMELER.includes(kayitli)) {
          setKademeState(kayitli);
        }
      } catch (e) {
        // sessiz — default kademe ile devam
      } finally {
        if (!iptal) setHidrasyonTamam(true);
      }
    })();
    return () => { iptal = true; };
  }, []);

  const setKademe = useCallback(async (yeni) => {
    if (!GECERLI_KADEMELER.includes(yeni)) return;
    setKademeState(yeni);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, yeni);
    } catch (e) {
      // sessiz
    }
  }, []);

  const deger = useMemo(() => {
    const tablo = CARPAN_TABLO[kademe] || CARPAN_TABLO[DEFAULT_KADEME];
    const arapcaFinal = tablo.carpan * tablo.arapcaCarpan;
    return {
      kademe,
      setKademe,
      carpan: tablo.carpan,
      arapcaCarpan: tablo.arapcaCarpan,
      basliklarCarpan: tablo.basliklarCarpan,
      arapcaFinal,
      hidrasyonTamam,
    };
  }, [kademe, setKademe, hidrasyonTamam]);

  return (
    <YaziKademesiContext.Provider value={deger}>
      {children}
    </YaziKademesiContext.Provider>
  );
}

export function useYaziKademesi() {
  const ctx = useContext(YaziKademesiContext);
  if (!ctx) {
    // Provider sarmadiysa — guvenli default
    const t = CARPAN_TABLO[DEFAULT_KADEME];
    return {
      kademe: DEFAULT_KADEME,
      setKademe: () => {},
      carpan: t.carpan,
      arapcaCarpan: t.arapcaCarpan,
      basliklarCarpan: t.basliklarCarpan,
      arapcaFinal: t.carpan * t.arapcaCarpan,
      hidrasyonTamam: true,
    };
  }
  return ctx;
}

/**
 * useTipScale — context carpanlarini alip tipScale() sonucunu memoize eder.
 * Frontend kullanim: const tip = useTipScale(); style={{ fontSize: tip.base.fontSize }}
 */
export function useTipScale() {
  const { carpan, basliklarCarpan, arapcaFinal } = useYaziKademesi();
  return useMemo(
    () => tipScale(carpan, basliklarCarpan, arapcaFinal),
    [carpan, basliklarCarpan, arapcaFinal]
  );
}
