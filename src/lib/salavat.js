import AsyncStorage from '@react-native-async-storage/async-storage';
import salavatlarData from '../../assets/data/salavatlar.json';

const KEY_TOPLAM = (id) => `@hu/salavat/${id}/toplam`;
const KEY_BUGUN = (id, tarih) => `@hu/salavat/${id}/bugun/${tarih}`;
const KEY_LOG = '@hu/salavat/log';

const bugunYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${g}`;
};

const safeInt = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function salavatlariGetir() {
  return salavatlarData;
}

export function salavatById(id) {
  return (salavatlarData.salavatlar || []).find((s) => s.id === id) || null;
}

export function bugununSalavati() {
  const gun = new Date().getDay();
  const cuma = gun === 5;
  return {
    id: cuma ? 'salat_munciye' : 'salat_kisa',
    hedef: cuma ? 300 : 100,
    cuma,
  };
}

export async function salavatSayacOku(id) {
  const tarih = bugunYMD();
  const [toplamRaw, bugunRaw] = await Promise.all([
    AsyncStorage.getItem(KEY_TOPLAM(id)),
    AsyncStorage.getItem(KEY_BUGUN(id, tarih)),
  ]);
  return {
    bugun: safeInt(bugunRaw),
    toplam: safeInt(toplamRaw),
    tarih,
  };
}

export async function salavatSayacArtir(id, miktar = 1) {
  const adim = Math.max(1, parseInt(miktar, 10) || 1);
  const tarih = bugunYMD();
  const { bugun, toplam } = await salavatSayacOku(id);
  const yeniBugun = bugun + adim;
  const yeniToplam = toplam + adim;
  await Promise.all([
    AsyncStorage.setItem(KEY_TOPLAM(id), String(yeniToplam)),
    AsyncStorage.setItem(KEY_BUGUN(id, tarih), String(yeniBugun)),
  ]);
  await logaYaz(tarih, adim);
  return { bugun: yeniBugun, toplam: yeniToplam, tarih };
}

export async function salavatSayacSifirla(id, kapsam = 'bugun') {
  const tarih = bugunYMD();
  if (kapsam === 'toplam') {
    await AsyncStorage.removeItem(KEY_TOPLAM(id));
  }
  await AsyncStorage.removeItem(KEY_BUGUN(id, tarih));
  return salavatSayacOku(id);
}

async function logaYaz(tarih, adim) {
  try {
    const raw = await AsyncStorage.getItem(KEY_LOG);
    let log = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(log)) log = [];
    const idx = log.findIndex((g) => g.tarih === tarih);
    if (idx >= 0) {
      log[idx].toplam = (log[idx].toplam || 0) + adim;
    } else {
      log.push({ tarih, toplam: adim });
    }
    const kesme = sonNGunTarihleri(7);
    log = log.filter((g) => kesme.includes(g.tarih));
    log.sort((a, b) => (a.tarih < b.tarih ? -1 : 1));
    await AsyncStorage.setItem(KEY_LOG, JSON.stringify(log));
  } catch (e) {}
}

function sonNGunTarihleri(n) {
  const sonuc = [];
  const t = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const g = String(d.getDate()).padStart(2, '0');
    sonuc.push(`${y}-${m}-${g}`);
  }
  return sonuc;
}

export async function salavatHaftalikOzet() {
  const raw = await AsyncStorage.getItem(KEY_LOG);
  let log = [];
  try {
    log = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(log)) log = [];
  } catch (e) {
    log = [];
  }
  const gunler = sonNGunTarihleri(7).reverse();
  const map = Object.fromEntries(log.map((g) => [g.tarih, g.toplam || 0]));
  const dolu = gunler.map((tarih) => ({ tarih, toplam: map[tarih] || 0 }));
  const haftaToplam = dolu.reduce((acc, g) => acc + g.toplam, 0);
  return { gunler: dolu, haftaToplam };
}

export async function salavatTumSayaclar() {
  const tarih = bugunYMD();
  const liste = salavatlarData.salavatlar || [];
  const sonuc = {};
  await Promise.all(
    liste.map(async (s) => {
      const [toplamRaw, bugunRaw] = await Promise.all([
        AsyncStorage.getItem(KEY_TOPLAM(s.id)),
        AsyncStorage.getItem(KEY_BUGUN(s.id, tarih)),
      ]);
      sonuc[s.id] = {
        bugun: safeInt(bugunRaw),
        toplam: safeInt(toplamRaw),
      };
    })
  );
  return { tarih, sayaclar: sonuc };
}
