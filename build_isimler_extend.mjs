// Sozlugu (assets/data/isimler.json) ~246'dan ~450'ye cikarir.
// Hedef: yasli kitlenin torunlarinin modern Turk isimleri sozluge girsin,
// boylece algoritmik fallback yerine sozluk dogrulugu calissin.
//
// Strateji:
//  - Klasik Arapca/Islami kokenli isimler -> elle dogrulanmis Arapca yazim + ebced
//  - Turkce dogal/coğrafi/uniseks isimler -> algoritmik translit + kelimeEbced
//  - Mevcut girisleri ASLA dokunma; sadece append
//  - Cakisma kontrolu: asciiNormalize(yeni) sozlukte VARSA atla, rapor et
//
// ASCII-only stdout. Turkce/Arapca karakterler dosyaya yazilir.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  algoritmikEbced,
  asciiNormalize,
  kelimeEbced,
} from './src/lib/translit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ISIMLER_PATH = path.join(__dirname, 'assets', 'data', 'isimler.json');
const BACKUP_PATH = path.join(__dirname, 'assets', 'data', 'isimler.json.bak');
const REPORT_PATH = path.join(__dirname, 'isimler_extend_raporu.txt');

const raw = fs.readFileSync(ISIMLER_PATH, 'utf8');
const isimler = JSON.parse(raw);

// === 1) ASCII-normalize index (mevcut sozluk) ===
const mevcutNorm = new Set();
for (const k of Object.keys(isimler)) {
  mevcutNorm.add(asciiNormalize(k));
}

// === 2) Klasik Arapca/Islami etymon havuzu (manuel) ===
// Format: [turkceKey, arapca, ebcedManuel | null (null=algoritmik hesap), cinsiyet]
// ebced null verilirse kelimeEbced(arapca) ile hesaplanir — Arapca'dan dogru sayisal deger.
const klasikEtymon = [
  // --- Erkek (klasik Islami) ---
  ['abdülbasit',   'عبد الباسط', null, 'e'],
  ['abdülcebbar',  'عبد الجبار', null, 'e'],
  ['abdülgaffar',  'عبد الغفار', null, 'e'],
  ['abdülgani',    'عبد الغني',  null, 'e'],
  ['abdülhalim',   'عبد الحليم', null, 'e'],
  ['abdullatif',   'عبد اللطيف', null, 'e'],
  ['abdülmecit',   'عبد المجيد', null, 'e'],
  ['abdülmelik',   'عبد الملك',  null, 'e'],
  ['abdüsselam',   'عبد السلام', null, 'e'],
  ['abdülvahit',   'عبد الواحد', null, 'e'],
  ['adem',         'آدم',        null, 'e'],
  ['ahmed',        'أحمد',       null, 'e'],
  ['akif',         'عاكف',       null, 'e'],
  ['arif',         'عارف',       null, 'e'],
  ['asaf',         'آصف',        null, 'e'],
  ['asım',         'عاصم',       null, 'e'],
  ['atıf',         'عاطف',       null, 'e'],
  ['ayhan',        'آيخان',      null, 'e'], // Turkce ama klasik yazim
  ['bahaeddin',    'بهاء الدين', null, 'e'],
  ['bedrettin',    'بدر الدين',  null, 'e'],
  ['bedri',        'بدري',       null, 'e'],
  ['behçet',       'بهجت',       null, 'e'],
  ['bilgehan',     'بلگه خان',   null, 'e'],
  ['cafer',        'جعفر',       null, 'e'],
  ['casim',        'جاسم',       null, 'e'],
  ['davud',        'داود',       null, 'e'],
  ['eyüp',         'أيوب',       null, 'e'],
  ['enes',         'أنس',        null, 'e'],
  ['fadıl',        'فاضل',       null, 'e'],
  ['faik',         'فائق',       null, 'e'],
  ['fazıl',        'فاضل',       null, 'e'],
  ['feyzi',        'فيضي',       null, 'e'],
  ['gıyasettin',   'غياث الدين', null, 'e'],
  ['habib',        'حبيب',       null, 'e'],
  ['habil',        'هابيل',      null, 'e'],
  ['hafız',        'حافظ',       null, 'e'],
  ['hakkı',        'حقي',        null, 'e'],
  ['halid',        'خالد',       null, 'e'], // Halit varyantı için ayrı varyant
  ['hamza',        'حمزة',       null, 'e'], // mevcut: kontrol gerek
  ['hilmi',        'حلمي',       null, 'e'],
  ['hızır',        'خضر',        null, 'e'],
  ['hudai',        'هدائي',      null, 'e'],
  ['hulusi',       'خلوصي',      null, 'e'],
  ['ihsan',        'إحسان',      null, 'e'],
  ['ilyas',        'إلياس',      null, 'e'],
  ['imam',         'إمام',       null, 'e'],
  ['imran',        'عمران',      null, 'e'],
  ['ishak',        'إسحاق',      null, 'e'],
  ['ismet',        'عصمت',       null, 'e'],
  ['kamil',        'كامل',       null, 'e'],
  ['kasım',        'قاسم',       null, 'e'],
  ['kaya',         'قايا',       null, 'e'], // Turkce, kaya
  ['kazım',        'كاظم',       null, 'e'], // mevcut, atlanacak
  ['kenan',        'كنعان',      null, 'e'],
  ['korkut',       'قورقوت',     null, 'e'], // Turkce-Osmanlica
  ['lütfi',        'لطفي',       null, 'e'],
  ['mahir',        'ماهر',       null, 'e'],
  ['mansur',       'منصور',      null, 'e'],
  ['masum',        'معصوم',      null, 'e'],
  ['mecit',        'مجيد',       null, 'e'],
  ['mehdi',        'مهدي',       null, 'e'],
  ['mehmet ali',   'محمد علي',   null, 'e'],
  ['miraç',        'معراج',      null, 'e'],
  ['muammer',      'معمر',       null, 'e'],
  ['muhsin',       'محسن',       null, 'e'],
  ['muhittin',     'محيي الدين', null, 'e'],
  ['muhyiddin',    'محيي الدين', null, 'e'],
  ['mücahit',      'مجاهد',      null, 'e'],
  ['müjdat',       'مژدات',      null, 'e'],
  ['mümin',        'مؤمن',       null, 'e'],
  ['münir',        'منير',       null, 'e'],
  ['nail',         'نائل',       null, 'e'],
  ['naim',         'نعيم',       null, 'e'],
  ['nazif',        'نظيف',       null, 'e'],
  ['nazım',        'ناظم',       null, 'e'],
  ['nebi',         'نبي',        null, 'e'],
  ['nedim',        'نديم',       null, 'e'],
  ['nejat',        'نجاة',       null, 'e'],
  ['niyazi',       'نيازي',      null, 'e'],
  ['nizamettin',   'نظام الدين', null, 'e'], // mevcut
  ['nuh',          'نوح',        null, 'e'],
  ['numan',        'نعمان',      null, 'e'],
  ['nurettin',     'نور الدين',  null, 'e'],
  ['nurullah',     'نور الله',   null, 'e'],
  ['nusret',       'نصرت',       null, 'e'],
  ['raif',         'رائف',       null, 'e'],
  ['rahmi',        'رحمي',       null, 'e'],
  ['ramadan',      'رمضان',      null, 'e'], // Ramazan alternatifi
  ['raşit',        'راشد',       null, 'e'],
  ['rauf',         'رؤوف',       null, 'e'],
  ['refik',        'رفيق',       null, 'e'],
  ['remzi',        'رمزي',       null, 'e'],
  ['reşit',        'رشيد',       null, 'e'],
  ['rifat',        'رفعت',       null, 'e'], // mevcut
  ['ruhi',         'روحي',       null, 'e'],
  ['rüstem',       'رستم',       null, 'e'],
  ['saffet',       'صفوت',       null, 'e'],
  ['sait',         'سعيد',       null, 'e'],
  ['salim',        'سالم',       null, 'e'],
  ['sedat',        'سداد',       null, 'e'],
  ['seyfettin',    'سيف الدين',  null, 'e'],
  ['seyit',        'سيد',        null, 'e'],
  ['sıddık',       'صديق',       null, 'e'],
  ['sıtkı',        'صدقي',       null, 'e'],
  ['subhi',        'صبحي',       null, 'e'],
  ['suat',         'سؤاد',       null, 'e'],
  ['sungur',       'سونغور',     null, 'e'],
  ['şaban',        'شعبان',      null, 'e'], // mevcut
  ['şefik',        'شفيق',       null, 'e'],
  ['şeref',        'شرف',        null, 'e'],
  ['şinasi',       'شناسي',      null, 'e'],
  ['şuayp',        'شعيب',       null, 'e'],
  ['tahir',        'طاهر',       null, 'e'],
  ['talat',        'طلعت',       null, 'e'],
  ['talip',        'طالب',       null, 'e'],
  ['tevfik',       'توفيق',      null, 'e'],
  ['turan',        'طوران',      null, 'e'],
  ['turgut',       'طورغوت',     null, 'e'],
  ['ubeyd',        'عبيد',       null, 'e'],
  ['vahdet',       'وحدت',       null, 'e'],
  ['vasıf',        'وصاف',       null, 'e'],
  ['vasfi',        'وصفي',       null, 'e'],
  ['vehbi',        'وهبي',       null, 'e'],
  ['veysel',       'ويسل',       null, 'e'],
  ['veysi',        'ويسي',       null, 'e'],
  ['yahşi',        'ياخشي',      null, 'e'],
  ['yakup',        'يعقوب',      null, 'e'], // mevcut
  ['yaşar',        'ياشار',      null, 'e'],
  ['yıldırım',     'يلدرم',      null, 'e'],
  ['zeyd',         'زيد',        null, 'e'],
  ['zihni',        'ذهني',       null, 'e'],
  ['zübeyir',      'زبير',       null, 'e'],

  // --- Kadin (klasik Islami) ---
  ['afet',         'آفت',        null, 'k'],
  ['ayda',         'آيدا',       null, 'k'], // Turkce
  ['ayfer',        'آيفر',       null, 'k'],
  ['aylin',        'آيلين',      null, 'k'],
  ['aysel',        'آيسل',       null, 'k'],
  ['aysun',        'آيسون',      null, 'k'],
  ['aysima',       'آيسيما',     null, 'k'],
  ['ayşen',        'عائشن',      null, 'k'],
  ['azime',        'عظيمة',      null, 'k'],
  ['azize',        'عزيزة',      null, 'k'],
  ['behiye',       'بهية',       null, 'k'],
  ['belkıs',       'بلقيس',      null, 'k'],
  ['cemile',       'جميلة',      null, 'k'],
  ['cevriye',      'جوريه',      null, 'k'],
  ['dilek',        'ديلك',       null, 'k'], // Turkce
  ['dilşad',       'دلشاد',      null, 'k'],
  ['emel',         'أمل',        null, 'k'],
  ['emine',        'أمينة',      null, 'k'], // mevcut
  ['enise',        'أنيسة',      null, 'k'],
  ['esila',        'اسيلا',      null, 'k'], // modern
  ['esma nur',     'أسماء نور',  null, 'k'],
  ['esmanur',      'أسماء نور',  null, 'k'],
  ['fadime',       'فاطمة',      null, 'k'], // mevcut
  ['fatma nur',    'فاطمة نور',  null, 'k'],
  ['fatmanur',     'فاطمة نور',  null, 'k'],
  ['fevziye',      'فوزية',      null, 'k'],
  ['fitnat',       'فطنت',       null, 'k'],
  ['gülnaz',       'گلناز',      null, 'k'],
  ['gülnur',       'گل نور',     null, 'k'],
  ['gülsüm',       'كلثوم',      null, 'k'],
  ['habibe',       'حبيبة',      null, 'k'],
  ['hadice',       'خديجة',      null, 'k'], // Hatice varyant
  ['halide',       'خالدة',      null, 'k'],
  ['hamide',       'حميدة',      null, 'k'],
  ['hanım',        'خانم',       null, 'k'],
  ['hayrunisa',    'خير النساء', null, 'k'],
  ['hediye',       'هدية',       null, 'k'], // mevcut
  ['humeyra',      'حميراء',     null, 'k'],
  ['hümeyra',      'حميراء',     null, 'k'],
  ['hürrem',       'خرم',        null, 'k'],
  ['ilknur',       'إيلك نور',   null, 'k'],
  ['kerime',       'كريمة',      null, 'k'],
  ['lamia',        'لامعة',      null, 'k'],
  ['latife',       'لطيفة',      null, 'k'],
  ['mahinur',      'ماه نور',    null, 'k'],
  ['mehlika',      'مه ليقا',    null, 'k'],
  ['mihriban',     'مهربان',     null, 'k'],
  ['mualla',       'معلى',       null, 'k'],
  ['muazzez',      'معززة',      null, 'k'],
  ['mübeccel',     'مبجلة',      null, 'k'],
  ['münevver',     'منورة',      null, 'k'],
  ['müzeyyen',     'مزينة',      null, 'k'],
  ['nazife',       'نظيفة',      null, 'k'],
  ['nimet',        'نعمة',       null, 'k'],
  ['nuray',        'نور آي',     null, 'k'],
  ['nurgül',       'نور گل',     null, 'k'],
  ['nurhan',       'نور خان',    null, 'k'],
  ['nuriye',       'نورية',      null, 'k'],
  ['nurten',       'نور تن',     null, 'k'],
  ['rahime',       'رحيمة',      null, 'k'], // mevcut
  ['ravza',        'روضة',       null, 'k'],
  ['rana',         'رعنا',       null, 'k'],
  ['reyhan',       'ريحان',      null, 'k'],
  ['rüveyda',      'رويدا',      null, 'k'],
  ['safiye',       'صفية',       null, 'k'],
  ['saniye',       'ثانية',      null, 'k'],
  ['sevde',        'سودة',       null, 'k'],
  ['sıdıka',       'صديقة',      null, 'k'],
  ['suheyla',      'سهيلا',      null, 'k'],
  ['sümeyra',      'سميراء',     null, 'k'],
  ['şefika',       'شفيقة',      null, 'k'],
  ['şefkat',       'شفقت',       null, 'k'],
  ['şeyma',        'شيماء',      null, 'k'],
  ['şevval',       'شوال',       null, 'k'],
  ['ümmü',         'أم',         null, 'k'],
  ['ümmühan',      'أم خان',     null, 'k'],
  ['ümran',        'عمران',      null, 'k'],
  ['vesile',       'وسيلة',      null, 'k'],
  ['zerrin',       'زرين',       null, 'k'],
  ['zühal',        'زحل',        null, 'k'],
  ['zühre',        'زهرة',       null, 'k'],
  ['züleyha',      'زليخا',      null, 'k'],
  ['zümra',        'زمراء',      null, 'k'],
];

// === 3) Turkce dogal/cografi isim havuzu (algoritmik translit) ===
// Format: [turkceKey, cinsiyet ('e'/'k'/'u')]
// Arapca + ebced => translit + kelimeEbced ile uretilecek.
const turkceDogal = [
  // --- Kadin agirlikli (cicek/dogа/duygu) ---
  ['ada',          'k'],
  ['arzu',         'k'],
  ['asu',          'k'],
  ['aybike',       'k'],
  ['aydanur',      'k'],
  ['ayla',         'k'],
  ['aysima',       'k'],
  ['azra',         'k'],
  ['başak',        'k'],
  ['begüm',        'k'],
  ['belin',        'k'],
  ['belinay',      'k'],
  ['berfin',       'k'],
  ['berra',        'k'],
  ['berrak',       'k'],
  ['beril',        'k'],
  ['beste',        'k'],
  ['bilge',        'u'],
  ['birsen',       'k'],
  ['bulut',        'u'],
  ['cansu',        'k'],
  ['ceyda',        'k'], // mevcut: kontrol
  ['ceylan',       'k'],
  ['cemre',        'k'], // mevcut
  ['çağla',        'k'],
  ['çağrı',        'u'],
  ['çisem',        'k'],
  ['çiğdem',       'k'],
  ['çilem',        'k'],
  ['defne',        'k'],
  ['deren',        'k'],
  ['derin',        'u'],
  ['dilan',        'k'],
  ['dilay',        'k'],
  ['dilara',       'k'], // mevcut
  ['dilruba',      'k'],
  ['doğa',         'u'],
  ['ebrar',        'k'],
  ['ece',          'k'], // mevcut
  ['eda',          'k'],
  ['eflin',        'k'],
  ['ekin',         'u'],
  ['ela',          'k'], // mevcut
  ['eliz',         'k'],
  ['elvan',        'u'],
  ['elvin',        'k'],
  ['esen',         'u'],
  ['esin',         'k'],
  ['eylül',        'k'],
  ['ezgi',         'k'],
  ['fulya',        'k'],
  ['gizem',        'k'], // mevcut
  ['gökçe',        'k'],
  ['görkem',       'u'],
  ['gözde',        'k'],
  ['güçlü',        'e'],
  ['güler',        'k'],
  ['gülsen',       'k'],
  ['hilal',        'k'], // mevcut
  ['ilayda',       'k'],
  ['ilgin',        'k'],
  ['iclal',        'k'],
  ['idil',         'k'],
  ['ilkay',        'u'],
  ['ilke',         'u'],
  ['ilkim',        'k'],
  ['ilkin',        'k'],
  ['ilkim',        'k'],
  ['inci',         'k'],
  ['irmak',        'u'],
  ['işıl',         'k'],
  ['işın',         'k'],
  ['kıvılcım',     'k'],
  ['lara',         'k'],
  ['mavi',         'u'],
  ['mehtap',       'k'],
  ['melisa',       'k'],
  ['melis',        'k'],
  ['meltem',       'k'],
  ['mercan',       'k'],
  ['mira',         'k'],
  ['miray',        'k'],
  ['naz',          'k'],
  ['nazan',        'k'],
  ['nehir',        'k'],
  ['nida',         'k'],
  ['nil',          'k'],
  ['nilay',        'k'],
  ['nisa',         'k'],
  ['öykü',         'k'],
  ['özge',         'k'],
  ['pelinsu',      'k'],
  ['pervin',       'k'],
  ['petek',        'k'],
  ['pırıl',        'k'],
  ['pırlanta',     'k'],
  ['rüya',         'k'],
  ['seda',         'k'],
  ['sedef',        'k'],
  ['sevcan',       'k'],
  ['sevil',        'k'],
  ['sevtap',       'k'],
  ['sıla',         'u'],
  ['simge',        'k'],
  ['simay',        'k'],
  ['sinem',        'k'],
  ['su',           'k'],
  ['sude',         'k'],
  ['suzan',        'k'],
  ['şebnem',       'k'],
  ['tara',         'k'],
  ['tuana',        'k'],
  ['tuba',         'k'],
  ['tuğba',        'k'],
  ['tülay',        'k'],
  ['tülin',        'k'],
  ['türkan',       'k'],
  ['yağmur',       'u'],
  ['yaren',        'u'],
  ['yelda',        'k'],
  ['yıldız',       'k'],
  ['zeren',        'k'],
  ['zerrin',       'k'],

  // --- Erkek agirlikli (Turkce-tarihi / dogаl) ---
  ['ahmet kerim',  'e'],
  ['ahmet yusuf',  'e'],
  ['alp',          'e'],
  ['alpay',        'e'],
  ['altay',        'e'],
  ['altan',        'e'],
  ['atakan',       'e'],
  ['atalay',       'e'],
  ['atıl',         'e'],
  ['atlas',        'e'],
  ['arda',         'e'],
  ['aren',         'e'],
  ['aslan',        'e'],
  ['ataberk',      'e'],
  ['ata',          'e'],
  ['baran',        'e'],
  ['barkın',       'e'],
  ['barlas',       'e'],
  ['batu',         'e'],
  ['batuhan',      'e'],
  ['bedirhan',     'e'],
  ['berat',        'e'],
  ['berk',         'e'],
  ['berke',        'e'],
  ['berker',       'e'],
  ['boran',        'e'],
  ['bora',         'e'],
  ['bozkurt',      'e'],
  ['cengizhan',    'e'],
  ['çağan',        'e'],
  ['çağatay',      'e'],
  ['çelik',        'e'],
  ['çetin',        'e'],
  ['çınar',        'e'],
  ['demir',        'e'],
  ['deniz can',    'u'],
  ['doruk',        'e'],
  ['ediz',         'e'], // mevcut
  ['egemen',       'e'],
  ['ege',          'e'], // mevcut
  ['emirhan',      'e'],
  ['eralp',        'e'],
  ['ergun',        'e'],
  ['ersin',        'e'],
  ['ertekin',      'e'],
  ['göktuğ',       'e'],
  ['gökay',        'e'], // mevcut
  ['hakanalp',     'e'],
  ['kağan',        'e'], // mevcut
  ['kayhan',       'e'], // mevcut
  ['kemal',        'e'], // mevcut
  ['kuzey',        'u'],
  ['mete han',     'e'],
  ['mithat',       'e'],
  ['oğuzhan',      'e'],
  ['onur can',     'e'],
  ['orkun',        'e'],
  ['osman ali',    'e'],
  ['ozan',         'e'], // mevcut
  ['polat',        'e'],
  ['poyraz',       'e'],
  ['rüzgar',       'u'],
  ['sarp',         'e'],
  ['selçuk',       'e'],
  ['sezer',        'e'],
  ['taha',         'e'],
  ['tarkan',       'e'],
  ['tayyar',       'e'],
  ['tekin',        'e'],
  ['tolgahan',     'e'],
  ['toprak',       'u'],
  ['tuğra',        'e'],
  ['tuna',         'u'],
  ['ulaş',         'e'],
  ['uras',         'e'],
  ['utku',         'e'], // mevcut
  ['yaman',        'e'],
  ['yağız',        'e'],
  ['yiğit',        'e'],
];

// === 4) Aday listesini birlestir, cakismalari ayikla ===
const adaylar = [];
const atlananCakisma = [];

// Klasik etymon islemleri
for (const [key, arapca, ebcedManuel, cinsiyet] of klasikEtymon) {
  const norm = asciiNormalize(key);
  if (mevcutNorm.has(norm)) {
    atlananCakisma.push({ key, sebep: 'mevcut-norm', kaynak: 'klasik' });
    continue;
  }
  // Daha once eklemis miyiz? (klasik liste icinde mukerrer)
  if (adaylar.some((a) => asciiNormalize(a.key) === norm)) {
    atlananCakisma.push({ key, sebep: 'liste-ici-mukerrer', kaynak: 'klasik' });
    continue;
  }
  const ebced = ebcedManuel !== null ? ebcedManuel : kelimeEbced(arapca);
  adaylar.push({
    key,
    data: { arapca, ebced, cinsiyet },
    kaynak: 'klasik-etymon',
  });
}

// Algoritmik translit islemleri
for (const [key, cinsiyet] of turkceDogal) {
  const norm = asciiNormalize(key);
  if (mevcutNorm.has(norm)) {
    atlananCakisma.push({ key, sebep: 'mevcut-norm', kaynak: 'turkce' });
    continue;
  }
  if (adaylar.some((a) => asciiNormalize(a.key) === norm)) {
    atlananCakisma.push({ key, sebep: 'liste-ici-mukerrer', kaynak: 'turkce' });
    continue;
  }
  const { arapca, ebced } = algoritmikEbced(key);
  if (arapca.length === 0 || ebced === 0) {
    atlananCakisma.push({ key, sebep: 'algoritmik-sifir', kaynak: 'turkce' });
    continue;
  }
  adaylar.push({
    key,
    data: { arapca, ebced, cinsiyet },
    kaynak: 'algoritmik',
  });
}

// === 5) JSON'a append ===
const yeniIsimler = { ...isimler };
for (const a of adaylar) {
  yeniIsimler[a.key] = a.data;
}

// Yedek
if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, raw, 'utf8');
}

// Yaz (2-space indent, JSON-uyumlu)
fs.writeFileSync(
  ISIMLER_PATH,
  JSON.stringify(yeniIsimler, null, 2) + '\n',
  'utf8',
);

// === 6) Esma testi (en yakin esma matchini script ici hesapla) ===
const esmalar = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'assets', 'data', 'esmalar.json'),
    'utf8',
  ),
);

function enYakinEsma(ebced) {
  if (typeof ebced !== 'number') return null;
  let enYakin = esmalar[0];
  let enKucukFark = Math.abs(ebced - enYakin.ebced);
  for (const e of esmalar) {
    const f = Math.abs(ebced - e.ebced);
    if (f < enKucukFark) {
      enKucukFark = f;
      enYakin = e;
    }
  }
  return enYakin;
}

// isimdenEsma'nin sozluk yolunu simule et
function lookupYeni(key) {
  const norm = asciiNormalize(key);
  // yeniIsimler uzerinden index
  for (const k of Object.keys(yeniIsimler)) {
    if (asciiNormalize(k) === norm) {
      return { kaynak: 'sozluk', origKey: k, data: yeniIsimler[k] };
    }
  }
  return null;
}

// Stdout: ASCII summary
const stdoutLines = [];
const eklenenE = adaylar.filter((a) => a.data.cinsiyet === 'e').length;
const eklenenK = adaylar.filter((a) => a.data.cinsiyet === 'k').length;
const eklenenU = adaylar.filter((a) => a.data.cinsiyet === 'u').length;
const klasikSayi = adaylar.filter((a) => a.kaynak === 'klasik-etymon').length;
const algoSayi = adaylar.filter((a) => a.kaynak === 'algoritmik').length;

stdoutLines.push('=== ISIMLER.JSON GENISLETME RAPORU ===');
stdoutLines.push(`Onceki sozluk boyutu: ${Object.keys(isimler).length}`);
stdoutLines.push(`Sonraki sozluk boyutu: ${Object.keys(yeniIsimler).length}`);
stdoutLines.push(`Eklenen toplam: ${adaylar.length}`);
stdoutLines.push(`  Erkek (e): ${eklenenE}`);
stdoutLines.push(`  Kadin (k): ${eklenenK}`);
stdoutLines.push(`  Uniseks (u): ${eklenenU}`);
stdoutLines.push(`Klasik etymon (manuel Arapca): ${klasikSayi}`);
stdoutLines.push(`Algoritmik translit (Turkce dogаl): ${algoSayi}`);
stdoutLines.push('');
stdoutLines.push(`Atlanan cakisma sayisi: ${atlananCakisma.length}`);
stdoutLines.push('(Atlanan isim detaylari raporda — Turkce karakter icerebilir.)');
stdoutLines.push('');
stdoutLines.push('=== 10 ORNEK YENI ISIM TESTI ===');
stdoutLines.push('isim_ascii | kaynak | arapca | ebced | esma_ascii (no) | fark');

// Spec'teki ornek isimler
const ornekTest = [
  'Cagla', 'Berke', 'Defne', 'Eylul', 'Kuzey',
  'Asaf',  'Beste', 'Mert',  'Sila',  'Toprak',
];

// Yardimci: Arapca'yi ASCII-safe goster (ASCII kodlar)
function arapcaAscii(s) {
  // Sadece char count + ilk byte ascii kodu — debug icin yeterli.
  return `len=${s.length}`;
}

for (const t of ornekTest) {
  const hit = lookupYeni(t);
  if (!hit) {
    // Algoritmik fallback (sozlukte gercekten yok)
    const { arapca, ebced } = algoritmikEbced(t);
    const en = enYakinEsma(ebced);
    const esmaAscii = en ? `${asciiNormalize(en.esma)} (no:${en.no})` : 'yok';
    const fark = en ? Math.abs(ebced - en.ebced) : 0;
    stdoutLines.push(
      `${t.padEnd(8)} | algoritma | ${arapcaAscii(arapca)} | ${String(ebced).padStart(5)} | ${esmaAscii.padEnd(22)} | fark=${fark}`,
    );
  } else {
    const ebced = hit.data.ebced;
    const en = enYakinEsma(ebced);
    const esmaAscii = en ? `${asciiNormalize(en.esma)} (no:${en.no})` : 'yok';
    const fark = en ? Math.abs(ebced - en.ebced) : 0;
    stdoutLines.push(
      `${t.padEnd(8)} | sozluk    | ${arapcaAscii(hit.data.arapca)} | ${String(ebced).padStart(5)} | ${esmaAscii.padEnd(22)} | fark=${fark}`,
    );
  }
}

console.log(stdoutLines.join('\n'));

// === 7) Detayli rapor dosyasi (UTF-8, Turkce/Arapca icerir) ===
const reportLines = [];
reportLines.push('=== ISIMLER.JSON GENISLETME DETAYLI RAPOR ===');
reportLines.push(`Onceki: ${Object.keys(isimler).length}, Sonraki: ${Object.keys(yeniIsimler).length}`);
reportLines.push(`Eklenen: ${adaylar.length} (E:${eklenenE} K:${eklenenK} U:${eklenenU})`);
reportLines.push(`Klasik etymon: ${klasikSayi}, Algoritmik: ${algoSayi}`);
reportLines.push('');
reportLines.push('=== EKLENEN ISIMLER (alfabetik) ===');
reportLines.push('key | arapca | ebced | cinsiyet | kaynak');
const sirali = adaylar.slice().sort((a, b) => a.key.localeCompare(b.key, 'tr'));
for (const a of sirali) {
  reportLines.push(`${a.key} | ${a.data.arapca} | ${a.data.ebced} | ${a.data.cinsiyet} | ${a.kaynak}`);
}
reportLines.push('');
reportLines.push('=== ATLANAN CAKISMALAR ===');
reportLines.push(`Toplam: ${atlananCakisma.length}`);
for (const c of atlananCakisma) {
  reportLines.push(`  ${c.key} (sebep: ${c.sebep}, liste: ${c.kaynak})`);
}
reportLines.push('');
reportLines.push('=== 10 ORNEK ISIM (UTF-8 detay) ===');
reportLines.push('isim | kaynak | arapca | ebced | esma | fark');
for (const t of ornekTest) {
  const hit = lookupYeni(t);
  if (!hit) {
    const { arapca, ebced } = algoritmikEbced(t);
    const en = enYakinEsma(ebced);
    reportLines.push(`${t} | algoritma | ${arapca} | ${ebced} | ${en ? en.esma : 'yok'} (no:${en ? en.no : '-'}) | ${en ? Math.abs(ebced - en.ebced) : 0}`);
  } else {
    const en = enYakinEsma(hit.data.ebced);
    reportLines.push(`${t} | sozluk | ${hit.data.arapca} | ${hit.data.ebced} | ${en ? en.esma : 'yok'} (no:${en ? en.no : '-'}) | ${en ? Math.abs(hit.data.ebced - en.ebced) : 0}`);
  }
}

fs.writeFileSync(REPORT_PATH, reportLines.join('\n'), 'utf8');
console.log('');
console.log(`(Detayli rapor: ${path.basename(REPORT_PATH)})`);
console.log(`(Yedek: ${path.basename(BACKUP_PATH)})`);
