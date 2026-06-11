// Turkce isimleri algoritmik olarak Arapca'ya cevirip Ebced hesabi yapar.
// Sozlukte (assets/data/isimler.json) bulunmayan isimler icin fallback.
// Tasarim kararlari (kalibrasyon raporuna gore secildi):
//  - Tum ses ozellikleri korunur, kisa unluleri YAZIYORUZ (deterministic).
//  - 'i' -> ye (ي), 'o'/'ö'/'u'/'ü'/'v' -> vav (و), 'a'/'e' -> elif (ا).
//  - Tekrarli harfler tek harf olarak yazilir (mm -> m), klasik imla aliskanligi.
//  - 'ı' SKIP edilir (kisa kalin unlu, Osmanlica'da yazilmazdi).
//  - 'g' -> kef (ك, 20) — modern Turkce'deki sert/yumusak g icin, sozlukle uyumlu.
//    NOT: Gayn (غ, 1000) Arapca'da bogazsi bir ses, Turkce'de yok.
//  - 'ğ' -> gayn (غ, 1000) — klasik sozlukler (oğuz=أوغوز, uğur=أوغور) bu sekilde yaziyor.
//  - 'h' kelime sonunda hep hesaplanir (yazilsin).
//  - Diger ozel: 'c' -> jim (ج), 'ç' -> jim (ج), 'p' -> ba (ب), 'j' -> ze (ز).
//
// Klasik Ebced (Ebced-i Kebir) tablosu - 28 harf:
//   ا=1, ب=2, ج=3, د=4, ه=5, و=6, ز=7, ح=8, ط=9, ي=10,
//   ك=20, ل=30, م=40, ن=50, س=60, ع=70, ف=80, ص=90, ق=100,
//   ر=200, ش=300, ت=400, ث=500, خ=600, ذ=700, ض=800, ظ=900, غ=1000

const EBCED_TABLOSU = {
  'ا': 1,    // ا elif
  'ب': 2,    // ب be
  'ج': 3,    // ج jim
  'د': 4,    // د dal
  'ه': 5,    // ه he
  'ة': 5,    // ة te marbuta (he gibi sayilir)
  'و': 6,    // و vav
  'ز': 7,    // ز ze
  'ح': 8,    // ح ha
  'ط': 9,    // ط tı
  'ي': 10,   // ي ye
  'ى': 10,   // ى elif maksure (ye gibi)
  'ك': 20,   // ك kef
  'ل': 30,   // ل lam
  'م': 40,   // م mim
  'ن': 50,   // ن nun
  'س': 60,   // س sin
  'ع': 70,   // ع ayn
  'ف': 80,   // ف fe
  'ص': 90,   // ص sad
  'ق': 100,  // ق kaf
  'ر': 200,  // ر ra
  'ش': 300,  // ش şın
  'ت': 400,  // ت te
  'ث': 500,  // ث se
  'خ': 600,  // خ hı
  'ذ': 700,  // ذ zel
  'ض': 800,  // ض dad
  'ظ': 900,  // ظ zı
  'غ': 1000, // غ gayn
  'أ': 1,    // أ elif (hamzeli)
  'إ': 1,    // إ elif (hamzeli)
  'آ': 1,    // آ elif (med)
  'ء': 1,    // ء hamza (klasik 1)
  'ئ': 10,   // ئ ye (hamze altinda)
  'ؤ': 6,    // ؤ vav (hamzeli)
};

// Turkce -> Arapca harf esleme. Bos string => o harf atlandi (skip).
// Sira onemli: tek karakterli kurallar burada. Cogul karakterler ('ch','sh') alfabesinde yok.
const TURKCE_HARF_AR = {
  'a': 'ا',  // elif
  'b': 'ب',  // be
  'c': 'ج',  // jim
  'ç': 'ج', // ç -> jim
  'd': 'د',  // dal
  'e': 'ا',  // elif (a ile ayni)
  'f': 'ف',  // fe
  'g': 'ك',  // kef (Arapca'da Turkce sert g icin en yakin; gayn=bogazsi, Turkce'de yok)
  'ğ': 'غ',  // gayn (klasik sozlukler oğuz=أوغوز yaziyor)
  'h': 'ه',  // he
  'ı': '',   // ı -> SKIP (kisa kalin unlu)
  'i': 'ي',  // ye
  'j': 'ز',  // ze (Arapca'da j yok, en yakin)
  'k': 'ك',  // kef
  'l': 'ل',  // lam
  'm': 'م',  // mim
  'n': 'ن',  // nun
  'o': 'و',  // vav
  'ö': 'و', // ö -> vav
  'p': 'ب',  // be (Arapca'da p yok)
  'q': 'ق',  // kaf
  'r': 'ر',  // ra
  's': 'س',  // sin
  'ş': 'ش', // ş -> şın
  't': 'ت',  // te
  'u': 'و',  // vav
  'ü': 'و', // ü -> vav
  'v': 'و',  // vav
  'w': 'و',  // vav
  'x': 'خ',  // hı
  'y': 'ي',  // ye
  'z': 'ز',  // ze
};

// Turkce diakritik -> ASCII haritasi (sozluk lookup'i icin).
// Amac: kullanici "Omer" yazsa da "Ömer" yazsa da ayni key'e dussun.
// Yasli kullanici Turkce klavye karakterlerini koyamayabilir — bu yuzden kritik.
// Uzun unluleri (â/î/û) duz hale indir (Klasik Osmanlica yazimda farklilik olabilir,
// ama sozluk key'leri zaten ASCII'ye dusurulurken birlesir).
const DIAKRITIK_HARITASI = {
  'ç': 'c', 'Ç': 'c',
  'ğ': 'g', 'Ğ': 'g',
  'ı': 'i', 'I': 'i',  // dikkat: I -> i (Turkce kuralina gore), asagidaki tr-TR lowercase zaten yapar
  'İ': 'i',
  'ö': 'o', 'Ö': 'o',
  'ş': 's', 'Ş': 's',
  'ü': 'u', 'Ü': 'u',
  'â': 'a', 'Â': 'a',
  'î': 'i', 'Î': 'i',
  'û': 'u', 'Û': 'u',
  'ô': 'o', 'Ô': 'o',
  'ê': 'e', 'Ê': 'e',
};

// Turkce ismi ASCII-only lowercase hale getirir.
// Sozluk lookup'i (isimler.json key'leri) icin tek noktadan normalize.
// Adimlar: NFC -> tr-TR lowercase -> diakritik temizleme -> trim.
// "Omer" / "ÖMER" / " ömer " / "Ömer" hepsi -> "omer".
export function asciiNormalize(s) {
  if (typeof s !== 'string') return '';
  // NFC once (bilesik formlar tutarli olsun), sonra tr-TR lowercase (I->i, i->i kurali).
  const lower = s.normalize('NFC').toLocaleLowerCase('tr-TR');
  let out = '';
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    const mapped = DIAKRITIK_HARITASI[ch];
    out += mapped !== undefined ? mapped : ch;
  }
  return out.trim();
}

// Turkce ismi Arapca harf dizisine cevirir.
// - Once NFC normalize, sonra kucuk harfe (tr-TR).
// - Bosluk/noktalama atilir (sadece harfler).
// - Pespese ayni Arapca harf -> tek harf (idgam/birlestirme yaklasimi).
export function turkceToArapca(turkceIsim) {
  if (typeof turkceIsim !== 'string') return '';
  const norm = turkceIsim.normalize('NFC').toLocaleLowerCase('tr-TR').trim();
  let sonuc = '';
  let oncekiAr = '';
  for (let i = 0; i < norm.length; i++) {
    const ch = norm[i];
    const ar = TURKCE_HARF_AR[ch];
    if (ar === undefined) continue; // harf disi karakter (bosluk, tire vs)
    if (ar === '') continue;        // skip karari (g, ı)
    if (ar === oncekiAr) continue;  // pespese tekrar -> tek harf
    sonuc += ar;
    oncekiAr = ar;
  }
  return sonuc;
}

// Tek bir Arapca harfin Ebced degerini dondurur (0 = bilinmiyor).
export function arapcaHarfEbced(arHarf) {
  if (typeof arHarf !== 'string' || arHarf.length === 0) return 0;
  return EBCED_TABLOSU[arHarf[0]] || 0;
}

// Arapca kelimedeki tum harflerin Ebced toplamini dondurur.
// Hareke/diakritik karakterleri yok sayar (U+064B - U+065F arasi + tatweel).
export function kelimeEbced(arKelime) {
  if (typeof arKelime !== 'string') return 0;
  let toplam = 0;
  for (let i = 0; i < arKelime.length; i++) {
    const kod = arKelime.charCodeAt(i);
    // Hareke ve tatweel atla
    if (kod >= 0x064B && kod <= 0x065F) continue;
    if (kod === 0x0640) continue; // tatweel
    toplam += arapcaHarfEbced(arKelime[i]);
  }
  return toplam;
}

// Turkce isim -> {arapca, ebced} composition.
// Sozlukte bulunmayan isimler icin tek giris noktasi.
export function algoritmikEbced(turkceIsim) {
  const arapca = turkceToArapca(turkceIsim);
  const ebced = kelimeEbced(arapca);
  return { arapca, ebced };
}
