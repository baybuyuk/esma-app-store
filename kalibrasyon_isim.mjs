// Algoritmik Turkce -> Arapca -> Ebced calibration.
// Compares dictionary ebced (isimler.json) vs algorithmic ebced (translit.js).
// ASCII-only stdout (Windows cp1254 safe). Non-ASCII goes to file via fs.writeFileSync.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { algoritmikEbced, asciiNormalize } from './src/lib/translit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ISIMLER_PATH = path.join(__dirname, 'assets', 'data', 'isimler.json');
const OUTPUT_PATH = path.join(__dirname, 'kalibrasyon_raporu.txt');

const raw = fs.readFileSync(ISIMLER_PATH, 'utf8');
const isimler = JSON.parse(raw);

// ====== CAKISMA RAPORU (asciiNormalize sonrasi ayni key'e dusen isimler) ======
// "Asaf" ve "Aşaf" varsa ikisi 'asaf'a duser — tehlikeli, manuel karar gerek.
const normIndex = new Map(); // norm -> [origKey1, origKey2, ...]
for (const k of Object.keys(isimler)) {
  const n = asciiNormalize(k);
  if (!normIndex.has(n)) normIndex.set(n, []);
  normIndex.get(n).push(k);
}
const cakismalar = [];
for (const [norm, keys] of normIndex.entries()) {
  if (keys.length > 1) {
    cakismalar.push({ norm, keys });
  }
}

const rows = [];
const farklar = [];

for (const isim of Object.keys(isimler)) {
  const sozluk = isimler[isim];
  const { arapca, ebced } = algoritmikEbced(isim);
  const fark = Math.abs(sozluk.ebced - ebced);
  farklar.push(fark);
  rows.push({
    isim,
    sozlukAr: sozluk.arapca,
    sozlukEbced: sozluk.ebced,
    algoAr: arapca,
    algoEbced: ebced,
    fark,
  });
}

farklar.sort((a, b) => a - b);
const n = farklar.length;
const toplam = farklar.reduce((a, b) => a + b, 0);
const ortalama = toplam / n;
const medyan = n % 2 === 0
  ? (farklar[n / 2 - 1] + farklar[n / 2]) / 2
  : farklar[(n - 1) / 2];

const within10 = farklar.filter((f) => f <= 10).length;
const within50 = farklar.filter((f) => f <= 50).length;
const within100 = farklar.filter((f) => f <= 100).length;
const within200 = farklar.filter((f) => f <= 200).length;

const sortedByFark = rows.slice().sort((a, b) => b.fark - a.fark);
const enKotu10 = sortedByFark.slice(0, 10);
const enIyi10 = sortedByFark.slice(-10).reverse();

// stdout (ASCII summary only)
const stdoutLines = [];
stdoutLines.push('=== KALIBRASYON RAPORU (ASCII summary) ===');
stdoutLines.push(`Toplam isim sayisi: ${n}`);
stdoutLines.push(`Ortalama mutlak fark: ${ortalama.toFixed(2)}`);
stdoutLines.push(`Medyan fark: ${medyan}`);
stdoutLines.push(`Min fark: ${farklar[0]}, Max fark: ${farklar[n - 1]}`);
stdoutLines.push('');
stdoutLines.push('--- Yakinsama oranlari (algoritma kalitesi, sozluk disi isimler icin) ---');
stdoutLines.push(`+-10  icinde:  ${within10}/${n} (${((within10 / n) * 100).toFixed(1)}%)`);
stdoutLines.push(`+-50  icinde:  ${within50}/${n} (${((within50 / n) * 100).toFixed(1)}%)`);
stdoutLines.push(`+-100 icinde: ${within100}/${n} (${((within100 / n) * 100).toFixed(1)}%)`);
stdoutLines.push(`+-200 icinde: ${within200}/${n} (${((within200 / n) * 100).toFixed(1)}%)`);
stdoutLines.push('');
stdoutLines.push('--- ASCII normalize cakismalari ---');
stdoutLines.push(`Cakisma sayisi: ${cakismalar.length}`);
if (cakismalar.length > 0) {
  stdoutLines.push('UYARI: Asagidaki normalize key\'lere birden cok orijinal sozluk girisi dustu.');
  stdoutLines.push('Son giris kazanir; manuel karar gerek (sozlukten birini sil veya yeniden adlandir).');
  for (const c of cakismalar) {
    // Detayli liste dosyaya yazilir (Turkce karakter icerebilir).
    stdoutLines.push(`  norm="${c.norm}" -> ${c.keys.length} giris (detay raporda)`);
  }
}
stdoutLines.push('');
stdoutLines.push(`(Detay icin: ${path.basename(OUTPUT_PATH)})`);

console.log(stdoutLines.join('\n'));

// Detailed file output (UTF-8, contains Turkish + Arabic).
const fileLines = [];
fileLines.push('=== KALIBRASYON RAPORU (detayli) ===');
fileLines.push(`Toplam isim: ${n}`);
fileLines.push(`Ortalama mutlak fark: ${ortalama.toFixed(2)}`);
fileLines.push(`Medyan fark: ${medyan}`);
fileLines.push(`Min: ${farklar[0]}  Max: ${farklar[n - 1]}`);
fileLines.push(`+-10:  ${within10}/${n} (${((within10 / n) * 100).toFixed(1)}%)`);
fileLines.push(`+-50:  ${within50}/${n} (${((within50 / n) * 100).toFixed(1)}%)`);
fileLines.push(`+-100: ${within100}/${n} (${((within100 / n) * 100).toFixed(1)}%)`);
fileLines.push(`+-200: ${within200}/${n} (${((within200 / n) * 100).toFixed(1)}%)`);
fileLines.push('');
fileLines.push('=== EN KOTU 10 (en yuksek fark) ===');
fileLines.push('isim | sozlukAr | sozlukEbced | algoAr | algoEbced | fark');
for (const r of enKotu10) {
  fileLines.push(`${r.isim} | ${r.sozlukAr} | ${r.sozlukEbced} | ${r.algoAr} | ${r.algoEbced} | ${r.fark}`);
}
fileLines.push('');
fileLines.push('=== EN IYI 10 (en dusuk fark) ===');
fileLines.push('isim | sozlukAr | sozlukEbced | algoAr | algoEbced | fark');
for (const r of enIyi10) {
  fileLines.push(`${r.isim} | ${r.sozlukAr} | ${r.sozlukEbced} | ${r.algoAr} | ${r.algoEbced} | ${r.fark}`);
}
fileLines.push('');
fileLines.push('=== TUM ISIMLER (alfabetik) ===');
fileLines.push('isim | sozlukAr | sozlukEbced | algoAr | algoEbced | fark');
const alpha = rows.slice().sort((a, b) => a.isim.localeCompare(b.isim, 'tr'));
for (const r of alpha) {
  fileLines.push(`${r.isim} | ${r.sozlukAr} | ${r.sozlukEbced} | ${r.algoAr} | ${r.algoEbced} | ${r.fark}`);
}

// Bonus: spot-check modern names from task spec
const ornek = ['Berke', 'Defne', 'Eylül', 'Kuzey', 'Beste', 'Asaf', 'Ali', 'Ömer', 'Yusuf', 'Mehmet'];
fileLines.push('');
fileLines.push('=== ORNEK ISIMLER (gorev spec listesi) ===');
fileLines.push('isim | algoAr | algoEbced | sozlukteMi');
for (const name of ornek) {
  const norm = asciiNormalize(name);
  // Sozluk lookup'i: hem ASCII normalize index, hem ham key (geri uyumluluk)
  const inDict = !!isimler[norm] || !!isimler[name.toLocaleLowerCase('tr-TR')];
  // Daha hassas check: normalize edilmis sozluk index'inde mi?
  let inNormIdx = false;
  for (const k of Object.keys(isimler)) {
    if (asciiNormalize(k) === norm) { inNormIdx = true; break; }
  }
  const { arapca, ebced } = algoritmikEbced(name);
  fileLines.push(`${name} | ${arapca} | ${ebced} | ${inNormIdx ? 'EVET (norm)' : 'HAYIR'}`);
}

// === ASCII NORMALIZE TESTLERI (bug fix dogrulamasi) ===
// Diakritiksiz yazilan isimler sozluge dussun.
fileLines.push('');
fileLines.push('=== ASCII NORMALIZE TESTLERI ===');
fileLines.push('input | normalize | sozlukKaynak | sozlukEbced');
const fixTests = [
  'Ömer', 'Omer', 'OMER', 'ÖMER', '  ömer ',
  'Hüseyin', 'Huseyin',
  'Çağla', 'Cagla',
  'Mücahit', 'Mucahit',
  'Şener', 'Sener',
  'Berke', // sozlukte yok kontrolu
];
// Inline normalize lookup (sadece rapor icin, esma.js ile ayni mantik)
const normLookup = {};
for (const k of Object.keys(isimler)) {
  normLookup[asciiNormalize(k)] = { origKey: k, data: isimler[k] };
}
for (const t of fixTests) {
  const n2 = asciiNormalize(t);
  const hit = normLookup[n2];
  if (hit) {
    fileLines.push(`"${t}" | "${n2}" | sozluk("${hit.origKey}") | ${hit.data.ebced}`);
  } else {
    const { ebced } = algoritmikEbced(t);
    fileLines.push(`"${t}" | "${n2}" | algoritma | ${ebced}`);
  }
}

// Cakisma detaylari (Turkce karakter icerebilir — sadece dosyaya)
fileLines.push('');
fileLines.push('=== CAKISMA DETAYLARI (asciiNormalize sonrasi) ===');
fileLines.push(`Toplam cakisma sayisi: ${cakismalar.length}`);
if (cakismalar.length > 0) {
  for (const c of cakismalar) {
    fileLines.push(`norm="${c.norm}" -> [${c.keys.map((k) => `"${k}"`).join(', ')}]`);
    for (const k of c.keys) {
      const d = isimler[k];
      fileLines.push(`   "${k}" => ${d.arapca} (${d.ebced}) [${d.cinsiyet}]`);
    }
  }
}

fs.writeFileSync(OUTPUT_PATH, fileLines.join('\n'), 'utf8');
