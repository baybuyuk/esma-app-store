export function gununIcerigi(liste, offset = 0) {
  if (!Array.isArray(liste) || liste.length === 0) return null;
  const bugun = new Date();
  const tarihKodu =
    bugun.getFullYear() * 10000 +
    (bugun.getMonth() + 1) * 100 +
    bugun.getDate();
  const idx = ((tarihKodu + offset) % liste.length + liste.length) % liste.length;
  return liste[idx];
}

export function bugunCumaMi() {
  return new Date().getDay() === 5;
}
