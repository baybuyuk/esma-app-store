import { esmalar, isimler } from './data';
import { algoritmikEbced, asciiNormalize, etymolojikTahmin } from './translit';

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

// Isim girisi temizleme — TextInput'larda harf disi (rakam, sembol, emoji,
// noktalama) karakterleri suzer. Izin verilenler: Turkce dahil harfler,
// bosluk, tire ve kesme isareti. Boylece ebced=0 ureten cop girdi daha
// klavyede olusmadan engellenir; isimdenEsma'daki guard son savunma hattidir.
const IZINSIZ_KARAKTER = /[^A-Za-zçÇğĞıİöÖşŞüÜ\s'-]/g;
export function temizIsimGirdisi(ham) {
  if (typeof ham !== 'string') return '';
  return ham.replace(IZINSIZ_KARAKTER, '');
}

// En az bir harf iceriyor mu? Buton aktifligi icin: tek basina '-' veya bosluk
// "gecerli isim" sayilmaz (onlar da ebced=0 uretirdi).
const HARF_VAR = /[A-Za-zçÇğĞıİöÖşŞüÜ]/;
export function gecerliIsimMi(metin) {
  return typeof metin === 'string' && HARF_VAR.test(metin);
}

// Isimden esma bulma — UC ASAMALI HIBRIT FALLBACK:
//  1) Sozluk (assets/data/isimler.json) — en yuksek dogruluk
//     Klasik isimler (Omer=310, Ali=110, Hakan=752). ASCII-normalize index
//     uzerinden — diakritiksiz yazilan isim de bulunur. Yasli kullanici
//     Turkce karakter koyamayabilir, kritik.
//
//  2) Etymolojik tahmin (translit.etymolojikTahmin) — orta dogruluk
//     Morfem havuzundan greedy longest-match decompose. Sozlukte olmayan
//     bilesik isimler (Sukrettin, Abdulvelid, Necmettin) icin kok+ek
//     parcalarindan dogru ebced uretir. Klasik fonetik fallback'ten cok
//     daha tutarli — Bahaeddin algoritmik 152 yerine etymon 103 (dogru)
//     verir.
//
//  3) Algoritmik fonetik — son care
//     turkceToArapca + harf-bazli Ebced. Pure Turkce isimler (Cagla,
//     Defne, Kuzey) icin tek yol. ASLA "bulunamadi" donmez.
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

  // Etymolojik yol (morfem havuzu) — bilesik isimler icin kok+ek decompose
  const etymon = etymolojikTahmin(turkceIsim);
  if (etymon) {
    const enYakin = enYakinEsma(etymon.ebced);
    return {
      bulundu: true,
      kaynak: 'etymon',
      isim_turkce: turkceIsim,
      isim_arapca: etymon.arapca,
      isim_ebced: etymon.ebced,
      cinsiyet: 'u',
      esma: enYakin,
      fark: enYakin ? Math.abs(etymon.ebced - enYakin.ebced) : null,
      not: 'Adın kök ve eklerinden Ebced hesabıyla çıkarıldı.',
    };
  }

  // Algoritmik yol (saf fonetik) — son care
  const { arapca, ebced } = algoritmikEbced(turkceIsim);

  // Cop girdi koruması (#4): rakam/sembol/emoji gibi hicbir Arap harfine
  // eslenmeyen input ebced=0 / bos arapca uretir. Eskiden enYakinEsma(0) en
  // yakin esma olan Ahad'i "bulundu:true" + bos arapca ile donuyordu —
  // kendinden emin YANLIS eslesme, ustelik onboarding'de kalici kaydediliyordu.
  // Bunun yerine acik bir "okunamadi" durumu don (esma:null).
  if (!arapca || ebced === 0) {
    return {
      bulundu: false,
      kaynak: 'gecersiz',
      isim_turkce: turkceIsim,
      isim_arapca: null,
      isim_ebced: null,
      cinsiyet: 'u',
      esma: null,
      fark: null,
      not: 'Bu adı okuyamadık. Lütfen harflerden oluşan bir ad gir.',
    };
  }

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
