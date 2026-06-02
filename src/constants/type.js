// Geriye donuk uyumluluk icin eski statik export korunuyor.
// Yeni ekranlar useTipScale() hook'undan tipScale(carpan, basliklarCarpan) sonucunu tuketmeli.

export const type = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 22,
  '2xl': 28,
  '3xl': 38,
  display: 56,
  count: 96,
  geri: 16,
};

// Ana taban degerler — tipScale icin kaynak
const TABAN = {
  xs: 12,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 22,
  '2xl': 28,
  '3xl': 38,
  display: 56,
  count: 96,
  geri: 16,
};

const GOVDE_LH_ORAN = 1.5;
const BASLIK_LH_ORAN = 1.3;
const ARAPCA_LH_ORAN = 1.8;

// fontSize'i tam sayiya yuvarla (Android subpixel sorunlarini onler)
const yuv = (n) => Math.round(n);

/**
 * tipScale — yazi kademesi carpanlarini alip olceklenmis token objesi dondurur.
 * @param {number} carpan — govde token'lari icin carpan (xs/sm/base/lg)
 * @param {number} basliklarCarpan — baslik token'lari icin carpan (xl/2xl/3xl)
 * @param {number} arapcaFinal — arapca metinler icin son carpan (base/lg uzerine)
 * @returns govde + baslik + arapca + sabit (display/count/geri) token'lari
 */
export function tipScale(carpan = 1.15, basliklarCarpan = 1.08, arapcaFinal = 1.61) {
  const xs = yuv(TABAN.xs * carpan);
  const sm = yuv(TABAN.sm * carpan);
  const base = yuv(TABAN.base * carpan);
  const lg = yuv(TABAN.lg * carpan);
  const xl = yuv(TABAN.xl * basliklarCarpan);
  const xl2 = yuv(TABAN['2xl'] * basliklarCarpan);
  const xl3 = yuv(TABAN['3xl'] * basliklarCarpan);

  const arapcaSize = yuv(TABAN.base * arapcaFinal);
  const arapcaBuyukSize = yuv(TABAN.lg * arapcaFinal);

  return {
    // gövde
    xs: { fontSize: xs, lineHeight: yuv(xs * GOVDE_LH_ORAN) },
    sm: { fontSize: sm, lineHeight: yuv(sm * GOVDE_LH_ORAN) },
    base: { fontSize: base, lineHeight: yuv(base * GOVDE_LH_ORAN) },
    lg: { fontSize: lg, lineHeight: yuv(lg * GOVDE_LH_ORAN) },
    // başlık
    xl: { fontSize: xl, lineHeight: yuv(xl * BASLIK_LH_ORAN) },
    '2xl': { fontSize: xl2, lineHeight: yuv(xl2 * BASLIK_LH_ORAN) },
    '3xl': { fontSize: xl3, lineHeight: yuv(xl3 * BASLIK_LH_ORAN) },
    // sabit — carpan uygulanmaz (büyük rakamlar zaten görünür)
    display: { fontSize: TABAN.display, lineHeight: yuv(TABAN.display * BASLIK_LH_ORAN) },
    count: { fontSize: TABAN.count, lineHeight: yuv(TABAN.count * BASLIK_LH_ORAN) },
    geri: { fontSize: TABAN.geri, lineHeight: yuv(TABAN.geri * GOVDE_LH_ORAN) },
    // Arapça
    arapca: { fontSize: arapcaSize, lineHeight: yuv(arapcaSize * ARAPCA_LH_ORAN) },
    arapcaBuyuk: { fontSize: arapcaBuyukSize, lineHeight: yuv(arapcaBuyukSize * ARAPCA_LH_ORAN) },
  };
}
