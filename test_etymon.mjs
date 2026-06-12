// Etymolojik tahmin algoritmasi (etymolojikTahmin) testi.
// Sozlukte OLMAYAN bilesik isimler icin etymon yolu vs. fonetik algoritma
// karsilastirmasi yapar. ASCII-only stdout (Windows cp1254 safe).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  algoritmikEbced,
  asciiNormalize,
  etymolojikTahmin,
  kelimeEbced,
} from './src/lib/translit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ISIMLER_PATH = path.join(__dirname, 'assets', 'data', 'isimler.json');
const ESMALAR_PATH = path.join(__dirname, 'assets', 'data', 'esmalar.json');
const REPORT_PATH = path.join(__dirname, 'etymon_test_raporu.txt');

const isimler = JSON.parse(fs.readFileSync(ISIMLER_PATH, 'utf8'));
const esmalar = JSON.parse(fs.readFileSync(ESMALAR_PATH, 'utf8'));

const NORMALIZED_INDEX = {};
for (const k of Object.keys(isimler)) {
  const norm = asciiNormalize(k);
  if (norm.length > 0) NORMALIZED_INDEX[norm] = isimler[k];
}

function enYakinEsma(ebced) {
  let best = esmalar[0];
  let bestDiff = Math.abs(ebced - best.ebced);
  for (const e of esmalar) {
    const d = Math.abs(ebced - e.ebced);
    if (d < bestDiff) {
      bestDiff = d;
      best = e;
    }
  }
  return best;
}

// Test isimleri — agirlikli olarak sozlukte OLMAYAN bilesik isimler
const TEST_ISIMLERI = [
  // Klasik *-eddin/*-ettin compound (yasli kusakta yaygin)
  'sukrettin', 'sukreddin', 'serafettin', 'serafeddin',
  'nizameddin', 'nizamettin', 'imadeddin', 'imadettin',
  'sefereddin', 'taceddin', 'tacettin', 'rukneddin', 'ruknettin',
  'zeyneddin', 'zeynettin', 'aziziddin', 'azizettin',
  'celalettin', 'celaleddin',

  // Compound Abdul-X (genis spektrum)
  'abdulkadir', 'abdulkerim', 'abdulhamid', 'abdulhalim', 'abdulhakim',
  'abdulvedud', 'abdulvedut', 'abdurresid', 'abdurrezzak', 'abdurrauf',
  'abdulazim', 'abdulmuhsin', 'abdusselam', 'abdussamed',

  // Esma-derived
  'mukerrem', 'rahime', 'kerime', 'halime', 'selime',
  'munir', 'munire', 'enver', 'ekrem', 'aziziye',
  'mualla', 'nuriye', 'nurullah', 'rahmiye', 'sukriye',
  'mansur', 'mensur', 'nusret', 'nasir',

  // Sahabe / klasik
  'talha', 'ammar', 'bilal', 'hasan', 'huseyin',

  // -ullah suffix
  'hasbullah', 'lutfullah', 'fethullah', 'ayetullah',

  // Pure Turkish — etymon DUSMEMELI (null donmeli, fonetik gitsin)
  'cagla', 'defne', 'kuzey', 'eylul', 'asya',
  'mert', 'berke', 'doruk', 'toprak', 'ela',
];

const lines = [];
function out(s) { lines.push(s); }

out('=== ETYMOLOJIK ALGORITMA TEST RAPORU ===');
out(`Test isim sayisi: ${TEST_ISIMLERI.length}`);
out('');
out('isim | norm | sozluk | etymon | algo | nihai kaynak | nihai ebced | esma');
out('-'.repeat(110));

let sozlukSay = 0, etymonSay = 0, algoSay = 0;
let etymonDuzeltme = 0; // etymon devreye girdi & algo farkliydi
const etymonDetay = [];

for (const isim of TEST_ISIMLERI) {
  const norm = asciiNormalize(isim);
  const sozluk = NORMALIZED_INDEX[norm];
  const etymon = etymolojikTahmin(isim);
  const algo = algoritmikEbced(isim);

  let nihaiKaynak, nihaiEbced, nihaiArapca;
  if (sozluk) {
    nihaiKaynak = 'sozluk';
    nihaiEbced = sozluk.ebced;
    nihaiArapca = sozluk.arapca;
    sozlukSay++;
  } else if (etymon) {
    nihaiKaynak = 'etymon';
    nihaiEbced = etymon.ebced;
    nihaiArapca = etymon.arapca;
    etymonSay++;
    if (etymon.ebced !== algo.ebced) {
      etymonDuzeltme++;
      etymonDetay.push({
        isim, etymonEb: etymon.ebced, etymonAr: etymon.arapca,
        algoEb: algo.ebced, algoAr: algo.arapca,
        morfemSayisi: etymon.morfemSayisi,
        fonetikDoldurma: etymon.fonetikDoldurmaSayisi,
      });
    }
  } else {
    nihaiKaynak = 'algoritma';
    nihaiEbced = algo.ebced;
    nihaiArapca = algo.arapca;
    algoSay++;
  }

  const esma = enYakinEsma(nihaiEbced);
  const sozStr = sozluk ? `EB:${sozluk.ebced}` : '-';
  const etyStr = etymon ? `EB:${etymon.ebced}` : '-';
  const algoStr = `EB:${algo.ebced}`;
  out(
    `${isim.padEnd(15)} | ${norm.padEnd(13)} | ${sozStr.padEnd(8)} | ${etyStr.padEnd(8)} | ` +
    `${algoStr.padEnd(8)} | ${nihaiKaynak.padEnd(10)} | ${String(nihaiEbced).padEnd(6)} | ` +
    `${esma.no}. ${esma.esma}`
  );
}

out('');
out('=== OZET ===');
out(`Sozluk yolu: ${sozlukSay}`);
out(`Etymon yolu: ${etymonSay}  (algoritmadan farkli: ${etymonDuzeltme})`);
out(`Algoritma yolu (puro fonetik): ${algoSay}`);
out('');

out('=== ETYMON DUZELTME DETAYI (etymon != algoritma) ===');
out('isim | etymon (ar=ebced) | algoritma (ar=ebced) | morfem# | fonetik doldurma#');
out('-'.repeat(110));
for (const d of etymonDetay) {
  out(
    `${d.isim.padEnd(15)} | ${d.etymonAr} = ${d.etymonEb}` +
    `  vs  ${d.algoAr} = ${d.algoEb}` +
    `  | morfem:${d.morfemSayisi} fonetik:${d.fonetikDoldurma}`
  );
}

out('');
out('=== PURE TURKISH SANITY (etymon NULL donmeli) ===');
const pureT = ['cagla', 'defne', 'kuzey', 'eylul', 'asya', 'mert', 'berke', 'doruk', 'toprak', 'ela'];
for (const t of pureT) {
  const e = etymolojikTahmin(t);
  out(`  ${t.padEnd(10)} -> ${e ? 'ETYMON (ar=' + e.arapca + ', eb=' + e.ebced + ', morfem=' + e.morfemSayisi + ') -- DIKKAT' : 'null (OK, fonetik)'}`);
}

fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
console.log(`Rapor yazildi: ${REPORT_PATH}`);
console.log(`Toplam: ${TEST_ISIMLERI.length} | sozluk:${sozlukSay} etymon:${etymonSay} algo:${algoSay}`);
console.log(`Etymon duzeltme (algo farkli): ${etymonDuzeltme}`);
