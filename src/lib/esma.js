import { esmalar, isimler } from './data';
import { algoritmikEbced, asciiNormalize } from './translit';

// Sozluk key'lerinin diakritik-temiz indexi.
// Modul yuklendiginde bir kez kurulur. "Omer" / "Ömer" / "ömer" hepsi ayni key'e duser.
// Cakisma durumunda son giris kazanir — kalibrasyon scripti cakismalari ayrica raporluyor.
const NORMALIZED_INDEX = {};
for (const key of Object.keys(isimler)) {
  const norm = asciiNormalize(key);
  if (norm.length > 0) {
    NORMALIZED_INDEX[norm] = isimler[key];
  }
}

// Isimden esma bulma — HIBRIT:
//  1) Sozlukte (assets/data/isimler.json) varsa: klasik dogruluk (Omer=310, Ali=110...)
//     Lookup ASCII-normalize index uzerinden — diakritiksiz yazilan isim (Omer, Huseyin)
//     da sozlukten bulunur. Yasli kullanici Turkce karakter koyamayabilir, kritik.
//  2) Sozlukte yoksa: turkceToArapca + harf-bazli Ebced algoritmasi.
//     ASLA "bulunamadi" donmez — her isim icin bir esma bulunur.
export function isimdenEsma(turkceIsim) {
  if (!turkceIsim || typeof turkceIsim !== 'string' || turkceIsim.trim().length === 0) {
    // Bos/gecersiz input: yine de bir sonuc don, ama bos isim icin sembolik.
    return {
      bulundu: false,
      kaynak: 'bos',
      isim_turkce: '',
      isim_arapca: null,
      isim_ebced: null,
      cinsiyet: 'u',
      esma: null,
      fark: null,
    };
  }

  const normIsim = asciiNormalize(turkceIsim);
  const isimVerisi = NORMALIZED_INDEX[normIsim];

  if (isimVerisi) {
    // Sozluk yolu
    const enYakin = enYakinEsma(isimVerisi.ebced);
    return {
      bulundu: true,
      kaynak: 'sozluk',
      isim_turkce: turkceIsim,
      isim_arapca: isimVerisi.arapca,
      isim_ebced: isimVerisi.ebced,
      cinsiyet: isimVerisi.cinsiyet,
      esma: enYakin,
      fark: Math.abs(isimVerisi.ebced - enYakin.ebced),
    };
  }

  // Algoritmik yol
  const { arapca, ebced } = algoritmikEbced(turkceIsim);
  const enYakin = enYakinEsma(ebced);
  return {
    bulundu: true,
    kaynak: 'algoritma',
    isim_turkce: turkceIsim,
    isim_arapca: arapca,
    isim_ebced: ebced,
    cinsiyet: 'u',
    esma: enYakin,
    fark: enYakin ? Math.abs(ebced - enYakin.ebced) : null,
    not: 'Adın Ebced harf hesabıyla çıkarıldı.',
  };
}

export function enYakinEsma(ebced) {
  if (typeof ebced !== 'number') return null;
  let enYakin = esmalar[0];
  let enKucukFark = Math.abs(ebced - enYakin.ebced);
  for (const esma of esmalar) {
    const fark = Math.abs(ebced - esma.ebced);
    if (fark < enKucukFark) {
      enKucukFark = fark;
      enYakin = esma;
    }
  }
  return enYakin;
}

export function esmaById(no) {
  // React Navigation route.params bazen string dondurur, Number() ile dayanikli karsilastirma
  return esmalar.find((e) => e.no === Number(no)) || null;
}

export function tesireGoreEsma(kategori) {
  return esmalar.filter((e) => Array.isArray(e.tesir) && e.tesir.includes(kategori));
}

export function guneGoreEsma(gun) {
  return esmalar.filter((e) => e.gun === gun);
}

// Tum esmalari no'ya gore artan sirada guvenli kopya olarak dondurur.
// Orijinal `esmalar` referansi disariya sizmaz; cagiran taraf serbestce siralayip filtreleyebilir.
export function tumEsmalar() {
  return esmalar.slice().sort((a, b) => a.no - b.no);
}

// Turkce veya arapca metne gore esma filtreler.
// Bos string => tum liste. Turkce icin toLocaleLowerCase('tr-TR') ile i/I duyarliligi saglanir.
// Arapca icin ham karakter eslemesi yapilir (kucuk/buyuk harf kavrami yok).
export function esmaAra(metin) {
  const tumu = tumEsmalar();
  if (typeof metin !== 'string') return tumu;
  const sorgu = metin.trim();
  if (sorgu.length === 0) return tumu;

  const sorguTr = sorgu.toLocaleLowerCase('tr-TR');
  return tumu.filter((e) => {
    const esmaTr = typeof e.esma === 'string' ? e.esma.toLocaleLowerCase('tr-TR') : '';
    const anlamTr = typeof e.anlam === 'string' ? e.anlam.toLocaleLowerCase('tr-TR') : '';
    const arapcaHam = typeof e.arapca === 'string' ? e.arapca : '';
    return (
      esmaTr.includes(sorguTr) ||
      anlamTr.includes(sorguTr) ||
      arapcaHam.includes(sorgu)
    );
  });
}
