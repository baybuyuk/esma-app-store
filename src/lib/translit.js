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

// ============================================================================
// ETYMOLOJIK MORFEM HAVUZU (kok + ek tabanli)
// ============================================================================
// Sozlukten BAGIMSIZ — sozlukte olmayan bilesik isimleri (Sukrettin, Abdulvelid
// gibi) kok+ek parcalarindan dogru ebced ile hesaplar. Yapi:
//
//   [ascii_normalize_pattern, arapca_yazim]
//
// Ebced kelimeEbced(arapca) ile otomatik turetilir (hareke sayilmaz).
// Algoritma asagidaki etymolojikTahmin() icinde "greedy longest match"
// kullanir — en uzun morfem ilk denenir, yenmesi gerekenler erken biter.
//
// Havuzdaki morfem turleri:
//   - Bilesik isimler (abdurrahman, semseddin, bahaeddin) — tam isim
//   - Compound prefix (abd-, abdul-) + esma — ayri morfem olarak
//   - Compound suffix (-eddin, -ullah) — kelime sonu eki
//   - Sik kullanilan kok isimler (kerim, rahim, nur, sems...) — tek morfem
//   - Kadin varyantlari (-e, -iye suffixli formlar) — tam form olarak yazilir
//
// Sozlukle CAKISMA: Sozlukte zaten bulunan isimler icin etymon devreye girmez
// (esma.js fallback chain'i: sozluk > etymon > algoritmik). Bu yuzden ayni
// pattern hem sozlukte hem havuzda olabilir — sorun cikmaz.
const MORFEM_ARAY = [
  // === Compound Abdul-X (longest-first, prefix overlap'i onlemek icin) ===
  ['abdurrahman',   'عبد الرحمن'],
  ['abdurrahim',    'عبد الرحيم'],
  ['abdurrezzak',   'عبد الرزاق'],
  ['abdurresid',    'عبد الرشيد'],
  ['abdurrauf',     'عبد الرؤوف'],
  ['abdulkadir',    'عبد القادر'],
  ['abdulkerim',    'عبد الكريم'],
  ['abdulhakim',    'عبد الحكيم'],
  ['abdulhamid',    'عبد الحميد'],
  ['abdulhamit',    'عبد الحميد'],
  ['abdulhalim',    'عبد الحليم'],
  ['abdulhalik',    'عبد الخالق'],
  ['abdullatif',    'عبد اللطيف'],
  ['abdulmuhsin',   'عبد المحسن'],
  ['abdulmecit',    'عبد المجيد'],
  ['abdulmecid',    'عبد المجيد'],
  ['abdulmelik',    'عبد الملك'],
  ['abdulmumin',    'عبد المؤمن'],
  ['abdulvahit',    'عبد الواحد'],
  ['abdulvahid',    'عبد الواحد'],
  ['abdulvedud',    'عبد الودود'],
  ['abdulvedut',    'عبد الودود'],
  ['abdulaziz',     'عبد العزيز'],
  ['abdulazim',     'عبد العظيم'],
  ['abdulgani',     'عبد الغني'],
  ['abdulbasit',    'عبد الباسط'],
  ['abdulcebbar',   'عبد الجبار'],
  ['abdulgaffar',   'عبد الغفار'],
  ['abdullah',      'عبد الله'],
  ['abdusselam',    'عبد السلام'],
  ['abdussamed',    'عبد الصمد'],
  ['abdussamet',    'عبد الصمد'],

  // === Compound *-eddin (din ile bitenler — tam isim) ===
  ['siraceddin',    'سراج الدين'],
  ['saadettin',     'سعد الدين'],
  ['kemaleddin',    'كمال الدين'],
  ['kemalettin',    'كمال الدين'],
  ['necmeddin',     'نجم الدين'],
  ['necmettin',     'نجم الدين'],
  ['nureddin',      'نور الدين'],
  ['nurettin',      'نور الدين'],
  ['semseddin',     'شمس الدين'],
  ['semsettin',     'شمس الدين'],
  ['alaeddin',      'علاء الدين'],
  ['alaettin',      'علاء الدين'],
  ['bedreddin',     'بدر الدين'],
  ['bedrettin',     'بدر الدين'],
  ['bahaeddin',     'بهاء الدين'],
  ['bahattin',      'بهاء الدين'],
  ['hayreddin',     'خير الدين'],
  ['hayrettin',     'خير الدين'],
  ['fahreddin',     'فخر الدين'],
  ['fahrettin',     'فخر الدين'],
  ['seyfeddin',     'سيف الدين'],
  ['seyfettin',     'سيف الدين'],
  ['gibyaseddin',   'غياث الدين'],
  ['giyaseddin',    'غياث الدين'],
  ['takiyyeddin',   'تقي الدين'],
  ['safiyyeddin',   'صفي الدين'],
  ['siheabeddin',   'شهاب الدين'],
  ['sihabeddin',    'شهاب الدين'],
  ['sihabettin',    'شهاب الدين'],

  // === Suffix patterns (kelime sonu eki) ===
  // Algoritma onceki morfemi yer, sonra suffix'i eklerse cogalir
  ['eddin',         'الدين'],
  ['ettin',         'الدين'],
  ['uddin',         'الدين'],
  ['ullah',         'الله'],
  ['ullahi',        'اللهي'],
  ['iye',           'ية'],
  ['iyye',          'ية'],

  // === Sahabe / Peygamber / Klasik Islami isimler (tam form) ===
  ['muhammed',      'محمد'],
  ['mehmed',        'محمد'],
  ['ahmed',         'أحمد'],
  ['mahmud',        'محمود'],
  ['mahmut',        'محمود'],
  ['mustafa',       'مصطفى'],
  ['yusuf',         'يوسف'],
  ['ibrahim',       'إبراهيم'],
  ['ismail',        'إسماعيل'],
  ['ishak',         'إسحاق'],
  ['yakup',         'يعقوب'],
  ['yakub',         'يعقوب'],
  ['davud',         'داود'],
  ['davut',         'داود'],
  ['suleyman',      'سليمان'],
  ['eyyub',         'أيوب'],
  ['eyup',          'أيوب'],
  ['yahya',         'يحيى'],
  ['zekeriya',      'زكريا'],
  ['idris',         'إدريس'],
  ['hud',           'هود'],
  ['nuh',           'نوح'],
  ['salih',         'صالح'],
  ['saliha',        'صالحة'],
  ['lokman',        'لقمان'],
  ['adem',          'آدم'],

  // === Sahabe ===
  ['hasan',         'حسن'],
  ['huseyin',       'حسين'],
  ['huseyn',        'حسين'],
  ['enes',          'أنس'],
  ['bilal',         'بلال'],
  ['talha',         'طلحة'],
  ['ammar',         'عمار'],
  ['hamza',         'حمزة'],
  ['halid',         'خالد'],
  ['halit',         'خالد'],
  ['cafer',         'جعفر'],
  ['casim',         'جاسم'],
  ['osman',         'عثمان'],
  ['omar',          'عمر'],
  ['hatice',        'خديجة'],
  ['fatma',         'فاطمة'],
  ['ayse',          'عائشة'],
  ['meryem',        'مريم'],
  ['zeynep',        'زينب'],
  ['zeyneb',        'زينب'],
  ['safiye',        'صفية'],
  ['hafsa',         'حفصة'],
  ['rukiye',        'رقية'],
  ['ummhani',       'أم هاني'],

  // === Esma turevi (popüler İslami kök isimler — sik karsilasilan) ===
  ['rahman',        'رحمن'],
  ['rahim',         'رحيم'],
  ['rahime',        'رحيمة'],
  ['rahmi',         'رحمي'],
  ['rahmiye',       'رحمية'],
  ['kerim',         'كريم'],
  ['kerime',        'كريمة'],
  ['ekrem',         'أكرم'],
  ['mukerrem',      'مكرم'],
  ['halim',         'حليم'],
  ['halime',        'حليمة'],
  ['selim',         'سليم'],
  ['selime',        'سليمة'],
  ['salim',         'سالم'],
  ['salime',        'سالمة'],
  ['selman',        'سلمان'],
  ['selma',         'سلمى'],
  ['islam',         'إسلام'],
  ['hakim',         'حكيم'],
  ['hakime',        'حكيمة'],
  ['latif',         'لطيف'],
  ['latife',        'لطيفة'],
  ['azim',          'عظيم'],
  ['azime',         'عظيمة'],
  ['aziz',          'عزيز'],
  ['azize',         'عزيزة'],
  ['gani',          'غني'],
  ['hadi',          'هادي'],
  ['hidayet',       'هداية'],
  ['vahid',         'واحد'],
  ['vahit',         'واحد'],
  ['mecit',         'مجيد'],
  ['mecid',         'مجيد'],
  ['melik',         'ملك'],
  ['melike',        'ملكة'],
  ['vekil',         'وكيل'],
  ['vedud',         'ودود'],
  ['vedut',         'ودود'],
  ['mansur',        'منصور'],
  ['mensur',        'منصور'],
  ['nasir',         'ناصر'],
  ['naser',         'ناصر'],
  ['nasr',          'نصر'],
  ['nusret',        'نصرة'],
  ['nusrettin',     'نصرة الدين'],
  ['sukur',         'شكور'],
  ['sakir',         'شاكر'],
  ['sukru',         'شكري'],
  ['sukran',        'شكران'],
  ['sukriye',       'شكرية'],
  ['ali',           'علي'],
  ['aliye',         'علية'],
  ['ala',           'علاء'],
  ['mualla',        'معلى'],
  ['nur',           'نور'],
  ['nuri',          'نوري'],
  ['nuriye',        'نورية'],
  ['nurullah',      'نور الله'],
  ['nurcihan',      'نور جهان'],
  ['munir',         'منير'],
  ['munire',        'منيرة'],
  ['enver',         'أنور'],
  ['sems',          'شمس'],
  ['semsi',         'شمسي'],
  ['semsiye',       'شمسية'],
  ['kemal',         'كمال'],
  ['kamil',         'كامل'],
  ['kamile',        'كاملة'],
  ['cemal',         'جمال'],
  ['cemil',         'جميل'],
  ['cemile',        'جميلة'],
  ['celal',         'جلال'],
  ['celalettin',    'جلال الدين'],
  ['celaleddin',    'جلال الدين'],
  ['necm',          'نجم'],
  ['necmi',         'نجمي'],
  ['necmiye',       'نجمية'],
  ['bedr',          'بدر'],
  ['bedri',         'بدري'],
  ['bedriye',       'بدرية'],
  ['baha',          'بهاء'],
  ['fethi',         'فتحي'],
  ['fethiye',       'فتحية'],
  ['fatih',         'فاتح'],
  ['feth',          'فتح'],
  ['muhsin',        'محسن'],
  ['muhsine',       'محسنة'],
  ['sadik',         'صادق'],
  ['sadika',        'صادقة'],
  ['siddik',        'صديق'],
  ['siddika',       'صديقة'],
  ['hamid',         'حامد'],
  ['hamide',        'حامدة'],
  ['hamdi',         'حمدي'],
  ['hamdiye',       'حمدية'],
  ['ihsan',         'إحسان'],
  ['mubarek',       'مبارك'],
  ['mubareke',      'مباركة'],
  ['safa',          'صفاء'],
  ['saadet',        'سعادة'],
  ['saad',          'سعد'],
  ['halil',         'خليل'],
  ['halile',        'خليلة'],
  ['halife',        'خليفة'],
  ['hafiz',         'حافظ'],
  ['hafize',        'حافظة'],
  ['hakki',         'حقي'],
  ['lutfi',         'لطفي'],
  ['lutfiye',       'لطفية'],
  ['ferit',         'فريد'],
  ['ferid',         'فريد'],
  ['feride',        'فريدة'],
  ['saban',         'شعبان'],
  ['ramazan',       'رمضان'],
  ['recep',         'رجب'],
  ['receb',         'رجب'],
  ['muharrem',      'محرم'],
  ['safer',         'صفر'],
  ['rabia',         'رابعة'],
  ['rabbiye',       'رابعة'],
  ['hayriye',       'خيرية'],
  ['hayri',         'خيري'],
  ['huriye',        'حورية'],
  ['hayrunnisa',    'خير النساء'],
  ['nisa',          'نساء'],

  // === Compound kok parcalari (suffix ile birleserek isim olusturur) ===
  // Bu kokler tek basina kullanilmaz; "-eddin/-ettin/-ullah" ile birleserek
  // Sukrettin, Lutfullah, Ayetullah gibi isimleri olusturur.
  ['sukr',          'شكر'],
  ['lutf',          'لطف'],
  ['hasb',          'حسب'],
  ['ayet',          'آية'],
  ['seref',         'شرف'],
  ['seraf',         'شرف'],
  ['serif',         'شريف'],
  ['serife',        'شريفة'],
  ['nizam',         'نظام'],
  ['imad',          'عماد'],
  ['tac',           'تاج'],
  ['sefer',         'سفر'],
  ['rukn',          'ركن'],
  ['zeyn',          'زين'],
  ['sirac',         'سراج'],
  ['izz',           'عز'],
  ['izzet',         'عزت'],
  ['izzettin',      'عز الدين'],
  ['izzeddin',      'عز الدين'],
  ['vahdettin',     'وحدة الدين'],
  ['vahdeddin',     'وحدة الدين'],
  ['safi',          'صفي'],
  ['fahr',          'فخر'],
  ['hayr',          'خير'],
  ['seyf',          'سيف'],
  ['takiyy',        'تقي'],
  ['takiy',         'تقي'],
  ['cemaleddin',    'جمال الدين'],
  ['cemalettin',    'جمال الدين'],
  ['mubareke',      'مباركة'],

  // Compound *-ullah (her bir spesifik form)
  ['fethullah',     'فتح الله'],
  ['ayetullah',     'آية الله'],
  ['hasbullah',     'حسب الله'],
  ['lutfullah',     'لطف الله'],
  ['nasrullah',     'نصر الله'],
  ['rahmetullah',   'رحمة الله'],
  ['necmullah',     'نجم الله'],
  ['hayrullah',     'خير الله'],
  ['ubeydullah',    'عبيد الله'],
  ['emrullah',      'أمر الله'],
];

// Once tum patterleri ebced ile decorate et, sonra UZUNLUGA gore azalan siraya
// koy. Longest-first eslestirme dogru ayristirma icin sart (aksi halde "sems"
// 'semseddin' icin once eslesir, 'eddin' kalir; ama bu zaten dogru sonuc verir
// — yine de uzun morfem one cikarsa az hesaplama yapilir).
const MORFEM_LIST = MORFEM_ARAY
  .map(([p, ar]) => ({ pattern: p, ar, eb: kelimeEbced(ar) }))
  .sort((a, b) => b.pattern.length - a.pattern.length);

// Etymolojik tahmin: ASCII-normalize girdi uzerinde DP en-iyi-decompose.
// Donus: { arapca, ebced, kaynak, morfemSayisi, etymonKapsam } | null
//
// Algoritma: her pozisyon icin (i) "kalan substring'in optimal parcalanmasi"
// memoize edilir. Her adimda secenekler:
//   - Pozisyondan baslayan tum morfemleri dene (longest-first ZORUNLU DEGIL —
//     DP en iyi kapsam veren secenegi bulur)
//   - Veya tek harfi fonetik fallback olarak tuket (etymon kapsami artmaz)
// En iyi seceneği etymon karakter kapsami maksimum, esitlikte morfem sayisi
// minimum (daha az bolunmus daha temiz okumadır).
//
// Filtre kararlari:
//  - En az 1 morfem eslesmesi sart — yoksa salt fonetik, null
//  - Etymon karakter kapsami >= 60% olmali — fonetik agirlikli sonuc etymon
//    yanli olur (lutfullah'da sadece 'ullah' eslesip lutf yanlissa kabul edilmez)
//  - Sozluk yolu zaten esma.js'de oncelikli — bu fonksiyona ulasilirsa sozlukte
//    yok demektir
export function etymolojikTahmin(turkceIsim) {
  if (typeof turkceIsim !== 'string') return null;
  const norm = asciiNormalize(turkceIsim);
  if (norm.length < 3) return null;

  // DP: memo[i] = { parts, etymonChars, morfemSayisi } — norm[i..]'nin en iyi parcalanmasi
  const memo = new Array(norm.length + 1);

  function cozum(start) {
    if (start >= norm.length) return { parts: [], etymonChars: 0, morfemSayisi: 0 };
    if (memo[start]) return memo[start];

    let best = null;

    // Secenek 1: pozisyondan baslayan tum morfemleri dene
    for (const m of MORFEM_LIST) {
      const plen = m.pattern.length;
      if (plen > norm.length - start) continue;
      if (norm.substr(start, plen) !== m.pattern) continue;
      const sub = cozum(start + plen);
      const etymonChars = plen + sub.etymonChars;
      const morfemSayisi = 1 + sub.morfemSayisi;
      if (
        !best ||
        etymonChars > best.etymonChars ||
        (etymonChars === best.etymonChars && morfemSayisi < best.morfemSayisi)
      ) {
        best = {
          parts: [{ ar: m.ar, eb: m.eb, etymon: true }, ...sub.parts],
          etymonChars,
          morfemSayisi,
        };
      }
    }

    // Secenek 2: tek harfi fonetik fallback olarak tuket
    const ch = norm[start];
    const ar = TURKCE_HARF_AR[ch];
    const sub = cozum(start + 1);
    const fonetikPart = (ar === undefined || ar === '')
      ? sub.parts
      : [{ ar, eb: arapcaHarfEbced(ar), etymon: false }, ...sub.parts];
    if (
      !best ||
      sub.etymonChars > best.etymonChars ||
      (sub.etymonChars === best.etymonChars && sub.morfemSayisi < best.morfemSayisi)
    ) {
      best = {
        parts: fonetikPart,
        etymonChars: sub.etymonChars,
        morfemSayisi: sub.morfemSayisi,
      };
    }

    memo[start] = best;
    return best;
  }

  const sonuc = cozum(0);
  if (!sonuc || sonuc.morfemSayisi === 0) return null;
  const kapsam = sonuc.etymonChars / norm.length;
  if (kapsam < 0.6) return null;

  // Onceki Arapca harfi tekrar ediyorsa pespese (idgam) birlestir
  const arapcaParts = [];
  let oncekiSon = '';
  for (const p of sonuc.parts) {
    if (p.ar === oncekiSon) continue;
    arapcaParts.push(p.ar);
    oncekiSon = p.ar.length === 1 ? p.ar : '';
  }
  const arapca = arapcaParts.join(' ').trim();
  const ebced = sonuc.parts.reduce((s, p) => s + p.eb, 0);

  return {
    arapca,
    ebced,
    kaynak: 'etymon',
    morfemSayisi: sonuc.morfemSayisi,
    etymonKapsam: kapsam,
  };
}
