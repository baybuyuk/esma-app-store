import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

const VAKIT_ADLARI = {
  fajr: 'Imsak',
  sunrise: 'Gunes',
  dhuhr: 'Ogle',
  asr: 'Ikindi',
  maghrib: 'Aksam',
  isha: 'Yatsi',
};

const VAKIT_ETIKETLERI = {
  imsak: 'Imsak',
  gunes: 'Gunes',
  ogle: 'Ogle',
  ikindi: 'Ikindi',
  aksam: 'Aksam',
  yatsi: 'Yatsi',
};

function buildTimes(enlem, boylam, tarih) {
  const coords = new Coordinates(enlem, boylam);
  const params = CalculationMethod.Turkey();
  params.madhab = Madhab.Shafi;
  return new PrayerTimes(coords, tarih, params);
}

export function gunlukVakitler(enlem, boylam, tarih = new Date()) {
  const pt = buildTimes(enlem, boylam, tarih);
  return {
    imsak: pt.fajr,
    gunes: pt.sunrise,
    ogle: pt.dhuhr,
    ikindi: pt.asr,
    aksam: pt.maghrib,
    yatsi: pt.isha,
  };
}

export function sonrakiVakit(vakitler, simdi = new Date()) {
  const sira = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];
  for (const ad of sira) {
    const zaman = vakitler[ad];
    if (zaman && zaman.getTime() > simdi.getTime()) {
      const dakikaKaldi = Math.round((zaman.getTime() - simdi.getTime()) / 60000);
      return { ad: VAKIT_ETIKETLERI[ad], anahtar: ad, zaman, dakikaKaldi };
    }
  }
  return null;
}

export function vakitFormat(date) {
  if (!date) return '--:--';
  const ss = String(date.getHours()).padStart(2, '0');
  const dd = String(date.getMinutes()).padStart(2, '0');
  return `${ss}:${dd}`;
}

export function gericiSayim(targetDate, simdi = new Date()) {
  if (!targetDate) return '';
  let ms = targetDate.getTime() - simdi.getTime();
  if (ms <= 0) return 'simdi';
  const totalMin = Math.floor(ms / 60000);
  const saat = Math.floor(totalMin / 60);
  const dk = totalMin % 60;
  if (saat <= 0) return `${dk} dakika`;
  if (dk === 0) return `${saat} saat`;
  return `${saat} saat ${dk} dakika`;
}

export { VAKIT_ADLARI, VAKIT_ETIKETLERI };
