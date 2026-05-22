// Gregoryan -> Hicri takvim cevirimi ve mubarek gun tespiti.
// Algoritma: Kuwaiti (yaygin tabular Islamic calendar) - gun hassasiyetinde
// +/- 1 gun sapma kabul edilir (gercek hilal gorusu astronomi ile tam ortusmez).
//
// Not: TR karakterli string'ler bu dosyada JS source UTF-8 ile yazilir; sadece
// console.print/Write-Output gibi cp1254 console'una basmaktan kacinilmali.

const AY_ADLARI = [
  'Muharrem',
  'Safer',
  'Rebiülevvel',
  'Rebiülahir',
  'Cemâziyelevvel',
  'Cemâziyelahir',
  'Receb',
  'Şâban',
  'Ramazan',
  'Şevval',
  'Zilkâde',
  'Zilhicce',
];

// Gregoryan tarihi Julian Day Number'a cevirir.
function gregoryanToJD(yil, ay, gun) {
  if (ay < 3) {
    yil -= 1;
    ay += 12;
  }
  const a = Math.floor(yil / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (yil + 4716)) +
    Math.floor(30.6001 * (ay + 1)) +
    gun +
    b -
    1524
  );
}

// JD -> Hicri tarihe cevirim (Kuwaiti algoritmasi).
function jdToHicri(jd) {
  jd = Math.floor(jd) + 0.5;
  const epoch = 1948439.5; // 1 Muharrem 1 AH
  const days = Math.floor(jd - epoch);
  const yil = Math.floor((30 * days + 10646) / 10631);
  const ayBasi = Math.ceil(29.5 * 0) + (yil - 1) * 354 + Math.floor((3 + 11 * yil) / 30);
  const yilIciGun = days - ayBasi;
  let ay = Math.min(12, Math.ceil(yilIciGun / 29.5));
  if (ay < 1) ay = 1;
  const ayBasGun = Math.ceil(29.5 * (ay - 1));
  const gun = yilIciGun - ayBasGun + 1;
  return { gun, ay, yil };
}

// Daha guvenilir Kuwaiti varyanti (Fatoohi & van Gent referansi).
function gregorianToIslamicKuwaiti(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const jd = gregoryanToJD(y, m, d);

  // Islamic epoch JD = 1948440 (16 Temmuz 622 Julian, asagi yuvarlanmis)
  const offset = jd - 1948440 + 10632;
  const n = Math.floor((offset - 1) / 10631);
  const offset2 = offset - 10631 * n + 354;
  const j =
    Math.floor((10985 - offset2) / 5316) * Math.floor((50 * offset2) / 17719) +
    Math.floor(offset2 / 5670) * Math.floor((43 * offset2) / 15238);
  const offset3 =
    offset2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const ay = Math.floor((24 * offset3) / 709);
  const gun = offset3 - Math.floor((709 * ay) / 24);
  const yil = 30 * n + j - 30;

  return { gun, ay, yil };
}

export function hicriTarih(date = new Date()) {
  const { gun, ay, yil } = gregorianToIslamicKuwaiti(date);
  return {
    gun,
    ay,
    ayAdi: AY_ADLARI[ay - 1] || '',
    yil,
  };
}

// Mubarek gun tablosu (kesin hicri tarihler).
const MUBAREK_GUNLER = {
  '1-1': {
    ad: 'Hicri Yılbaşı',
    vurgu: 'Allah yeni hicri yıla hayırla erdirsin. Bugün tevbe ve şükür günüdür.',
  },
  '1-10': {
    ad: 'Aşure Günü',
    vurgu: 'Hz. Mûsâ aleyhisselâmın kavmiyle kurtulduğu gün. Oruç tut, sadaka ver.',
  },
  '3-12': {
    ad: 'Mevlid Kandili',
    vurgu: 'Peygamberimiz aleyhisselâmın doğduğu mübarek gece. Salavat çoğalt.',
  },
  '7-1': {
    ad: 'Üç Aylar Başlangıcı',
    vurgu: 'Receb, Şâban, Ramazan. Üç ayların bereketi başladı, ibadeti artır.',
  },
  '7-27': {
    ad: 'Miraç Kandili',
    vurgu: 'Peygamberimizin Allah\'ın huzuruna çıktığı mübarek gece. Namaz ve duâ vakti.',
  },
  '8-15': {
    ad: 'Berat Kandili',
    vurgu: 'Bu gece günahların affı için duâ et. Affediliş gecesidir.',
  },
  '9-1': {
    ad: 'Ramazan Başlangıcı',
    vurgu: 'Ramazan-ı şerif başladı. Oruç, Kur\'ân ve sadaka ayı mübarek olsun.',
  },
  '9-27': {
    ad: 'Kadir Gecesi',
    vurgu: 'Bin aydan hayırlı gece. Çokça istiğfar et: "Allâhumme inneke afuvvun..."',
  },
  '10-1': {
    ad: 'Ramazan Bayramı',
    vurgu: 'Bayramın mübarek olsun. Tekbir getir, akrabayı ziyaret et.',
  },
  '12-9': {
    ad: 'Arefe Günü',
    vurgu: 'Hac duâlarının kabul olduğu gün. Çokça "Lebbeyk Allâhumme lebbeyk" de.',
  },
  '12-10': {
    ad: 'Kurban Bayramı',
    vurgu: 'Bayramın mübarek olsun. Kurban kes, akrabayı ziyaret et, tekbir getir.',
  },
};

export function mubarekGun(date = new Date()) {
  const { gun, ay } = hicriTarih(date);
  const anahtar = `${ay}-${gun}`;
  return MUBAREK_GUNLER[anahtar] || null;
}

// Yardimci: bir sonraki mubarek gunu bulur (en fazla 365 gun ileri tarar).
export function sonrakiMubarekGun(date = new Date()) {
  const baslangic = new Date(date);
  baslangic.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 365; i += 1) {
    const t = new Date(baslangic);
    t.setDate(baslangic.getDate() + i);
    const m = mubarekGun(t);
    if (m) {
      return { tarih: t, ...m, kalanGun: i };
    }
  }
  return null;
}

export const HICRI_AY_ADLARI = AY_ADLARI;
