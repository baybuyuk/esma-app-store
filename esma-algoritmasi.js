/**
 * İsim → Esma Eşleştirme Algoritması
 * 
 * Kullanım:
 * import { isimdenEsma, enYakinEsma } from './esma';
 * const sonuc = isimdenEsma('Hakan');
 * console.log(sonuc.esma.esma); // "Muktedir"
 */

import esmalar from '../../assets/data/esmalar.json';
import isimler from '../../assets/data/isimler.json';

const VARSAYILAN_ESMA_NO = 19; // Fettâh (açan, sıkıntıdan kurtaran)

/**
 * Türkçe isimden en yakın esmayı bulur
 * 
 * @param {string} turkceIsim - Kullanıcının ismi
 * @returns {object} Esma bilgisi ve isim detayları
 */
export function isimdenEsma(turkceIsim) {
  if (!turkceIsim || typeof turkceIsim !== 'string') {
    return getVarsayilan('');
  }

  const isim = turkceIsim.toLowerCase().trim();
  const isimVerisi = isimler[isim];

  // İsim sözlükte yok — varsayılan esma ata
  if (!isimVerisi) {
    return getVarsayilan(turkceIsim);
  }

  // En yakın esmayı bul (kök hali ebced üzerinden)
  const enYakin = enYakinEsma(isimVerisi.ebced);

  return {
    bulundu: true,
    isim_turkce: turkceIsim,
    isim_arapca: isimVerisi.arapca,
    isim_ebced: isimVerisi.ebced,
    cinsiyet: isimVerisi.cinsiyet,
    esma: enYakin,
    fark: Math.abs(isimVerisi.ebced - enYakin.ebced)
  };
}

/**
 * Verilen ebcede en yakın esmayı bulur
 * 
 * @param {number} ebced - Karşılaştırılacak ebced değeri
 * @returns {object} En yakın esma
 */
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

/**
 * Esma numarasına göre esma getir
 * 
 * @param {number} no - Esma numarası (1-100)
 * @returns {object|null}
 */
export function esmaById(no) {
  return esmalar.find(e => e.no === no) || null;
}

/**
 * Sözlükte olmayan isim için varsayılan esma
 */
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
    not: 'İsim sözlüğümüzde bulunamadı, sana en faydalı esmalardan biri olan Fettâh atandı.'
  };
}

/**
 * Belirli bir kategorideki esmaları getir
 * 
 * @param {string} kategori - "rizik", "huzur", "sifa", vb.
 * @returns {array} Eşleşen esmalar
 */
export function tesireGoreEsma(kategori) {
  return esmalar.filter(e => e.tesir.includes(kategori));
}

/**
 * Haftanın gününe göre ideal esmaları getir
 * 
 * @param {string} gun - "Pazartesi", "Salı", vb.
 * @returns {array}
 */
export function guneGoreEsma(gun) {
  return esmalar.filter(e => e.gun === gun);
}

/**
 * Test fonksiyonu - geliştirme sırasında kullan
 */
export function test() {
  console.log('=== İsim → Esma Test ===');
  
  const testler = [
    'Hakan',      // → Muktedir bekleniyor (752 → 744, fark: 8)
    'Ahmet',      // → Mücîb (53 → 55, fark: 2)
    'Mehmet',     // → Melik (92 → 90, fark: 2)
    'Ayşe',       // → ?
    'Nizamettin', // → ?
    'AsdfghjkSilNeyle', // bilinmeyen → Fettâh
  ];
  
  for (const isim of testler) {
    const sonuc = isimdenEsma(isim);
    console.log(`\n${isim}:`);
    console.log(`  Arapça: ${sonuc.isim_arapca || 'YOK'}`);
    console.log(`  Ebced: ${sonuc.isim_ebced || 'YOK'}`);
    console.log(`  Esma: ${sonuc.esma.esma} (${sonuc.esma.ebced})`);
    if (sonuc.fark !== null) {
      console.log(`  Fark: ${sonuc.fark}`);
    }
  }
}
