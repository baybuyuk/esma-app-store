import { esmalar, isimler } from './data';

const VARSAYILAN_ESMA_NO = 19;

export function isimdenEsma(turkceIsim) {
  if (!turkceIsim || typeof turkceIsim !== 'string') {
    return getVarsayilan('');
  }

  const isim = turkceIsim.toLocaleLowerCase('tr-TR').trim();
  const isimVerisi = isimler[isim];

  if (!isimVerisi) {
    return getVarsayilan(turkceIsim);
  }

  const enYakin = enYakinEsma(isimVerisi.ebced);
  return {
    bulundu: true,
    isim_turkce: turkceIsim,
    isim_arapca: isimVerisi.arapca,
    isim_ebced: isimVerisi.ebced,
    cinsiyet: isimVerisi.cinsiyet,
    esma: enYakin,
    fark: Math.abs(isimVerisi.ebced - enYakin.ebced),
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

function getVarsayilan(turkceIsim) {
  const varsayilan = esmaById(VARSAYILAN_ESMA_NO);
  return {
    bulundu: false,
    isim_turkce: turkceIsim,
    isim_arapca: null,
    isim_ebced: null,
    cinsiyet: 'u',
    esma: varsayilan,
    fark: null,
    not: 'Isim sozlugumuzde bulunamadi, sana en faydali esmalardan biri olan Fettah atandi.',
  };
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
