import * as SQLite from 'expo-sqlite';

let _db = null;

export async function getDb() {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('hu.db');
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS zikir_gecmisi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zikir_id TEXT,
      esma_no INTEGER,
      sayim INTEGER NOT NULL,
      hedef INTEGER,
      baslangic TEXT,
      bitis TEXT
    );
    CREATE TABLE IF NOT EXISTS gunluk_kayit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarih TEXT NOT NULL,
      namaz_sayisi INTEGER,
      sukur_notu TEXT,
      iyilik_notu TEXT,
      olusturma_zamani TEXT
    );
    CREATE TABLE IF NOT EXISTS gunluk_sayim_toplam (
      tarih TEXT PRIMARY KEY,
      toplam INTEGER NOT NULL
    );
  `);
  return _db;
}

export async function zikirKaydet({ zikirId = null, esmaNo = null, sayim, hedef, baslangic, bitis }) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO zikir_gecmisi (zikir_id, esma_no, sayim, hedef, baslangic, bitis) VALUES (?, ?, ?, ?, ?, ?)',
    [zikirId, esmaNo, sayim, hedef ?? null, baslangic ?? null, bitis ?? null]
  );
}

export async function gunlukKayitEkle({ tarih, namazSayisi, sukurNotu, iyilikNotu }) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO gunluk_kayit (tarih, namaz_sayisi, sukur_notu, iyilik_notu, olusturma_zamani) VALUES (?, ?, ?, ?, ?)',
    [tarih, namazSayisi ?? null, sukurNotu ?? null, iyilikNotu ?? null, new Date().toISOString()]
  );
}

export async function gunlukKayitlar(limit = 30) {
  const db = await getDb();
  return await db.getAllAsync(
    'SELECT * FROM gunluk_kayit ORDER BY tarih DESC LIMIT ?',
    [limit]
  );
}

export async function bugunkuToplamSayim(tarih) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    'SELECT toplam FROM gunluk_sayim_toplam WHERE tarih = ?',
    [tarih]
  );
  return row?.toplam ?? 0;
}

export async function toplamSayimArtir(tarih, miktar = 1) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO gunluk_sayim_toplam (tarih, toplam) VALUES (?, ?)
     ON CONFLICT(tarih) DO UPDATE SET toplam = toplam + excluded.toplam`,
    [tarih, miktar]
  );
}

// ---------------------------------------------------------------------------
// Esma okuma sayaci - istatistik query'leri
// ---------------------------------------------------------------------------
// zikir_gecmisi tablosundaki bitis sutunu ISO timestamp tutar; gun grupla-
// masi icin substr(bitis, 1, 10) ile YYYY-MM-DD parcasi kullanilir.
// Tum fonksiyonlar hata durumunda guvenli default (0, [], null) doner.

// Yardimci: YYYY-MM-DD formatinda lokal tarih uretir (UTC kaymasi olmadan).
function _yerelTarih(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 1) Tum zamanlar boyunca bu esma icin toplam sayim.
export async function esmaToplamSayim(esmaNo) {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync(
      'SELECT COALESCE(SUM(sayim), 0) AS toplam FROM zikir_gecmisi WHERE esma_no = ?',
      [Number(esmaNo)]
    );
    return row?.toplam ?? 0;
  } catch (e) {
    return 0;
  }
}

// 2) Belirli bir gunde bu esma icin sayim. tarih: 'YYYY-MM-DD'.
export async function esmaGunlukSayim(esmaNo, tarih) {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync(
      `SELECT COALESCE(SUM(sayim), 0) AS toplam
       FROM zikir_gecmisi
       WHERE esma_no = ? AND substr(bitis, 1, 10) = ?`,
      [Number(esmaNo), tarih]
    );
    return row?.toplam ?? 0;
  } catch (e) {
    return 0;
  }
}

// 3) Son 7 gunun her biri icin sayim. Sira: 6 gun once -> bugun.
export async function esmaHaftalikSayim(esmaNo) {
  try {
    const db = await getDb();
    const bugun = new Date();
    const tarihler = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(bugun);
      d.setDate(bugun.getDate() - i);
      tarihler.push(_yerelTarih(d));
    }
    // Tek query'de 7 gunu cek (en eski tarihi alt sinir olarak ver).
    const altSinir = tarihler[0];
    const rows = await db.getAllAsync(
      `SELECT substr(bitis, 1, 10) AS tarih, COALESCE(SUM(sayim), 0) AS sayim
       FROM zikir_gecmisi
       WHERE esma_no = ? AND substr(bitis, 1, 10) >= ?
       GROUP BY substr(bitis, 1, 10)`,
      [Number(esmaNo), altSinir]
    );
    const map = new Map();
    for (const r of rows || []) {
      map.set(r.tarih, r.sayim ?? 0);
    }
    return tarihler.map((t) => ({ tarih: t, sayim: map.get(t) ?? 0 }));
  } catch (e) {
    return [];
  }
}

// 4) Streak: bugunden geriye kesintisiz okuma yapilan gun sayisi.
// Bugun kayit yoksa streak = 0. Bugun varsa, geriye dogru ilk bos gune kadar say.
export async function esmaStreak(esmaNo) {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync(
      `SELECT DISTINCT substr(bitis, 1, 10) AS tarih
       FROM zikir_gecmisi
       WHERE esma_no = ? AND bitis IS NOT NULL
       ORDER BY tarih DESC`,
      [Number(esmaNo)]
    );
    const gunler = new Set((rows || []).map((r) => r.tarih));
    if (gunler.size === 0) return 0;

    let streak = 0;
    const imlec = new Date();
    // Bugun yoksa direkt 0 don.
    if (!gunler.has(_yerelTarih(imlec))) return 0;
    while (gunler.has(_yerelTarih(imlec))) {
      streak += 1;
      imlec.setDate(imlec.getDate() - 1);
    }
    return streak;
  } catch (e) {
    return 0;
  }
}

// 5) Tum esma istatistik ozeti: en az 1 kaydi olanlar, toplamSayim desc.
export async function tumEsmaIstatistik() {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync(
      `SELECT esma_no AS esmaNo,
              SUM(sayim) AS toplamSayim,
              MAX(bitis) AS sonOkuma
       FROM zikir_gecmisi
       WHERE esma_no IS NOT NULL
       GROUP BY esma_no
       ORDER BY toplamSayim DESC`
    );
    return (rows || []).map((r) => ({
      esmaNo: r.esmaNo,
      toplamSayim: r.toplamSayim ?? 0,
      sonOkuma: r.sonOkuma ?? null,
    }));
  } catch (e) {
    return [];
  }
}
