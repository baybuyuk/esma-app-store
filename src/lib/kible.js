// Kabe yonu (kible) bearing hesaplama.
// Great-circle initial bearing formulu.
//
// Kullanim:
//   const yon = kibleBearing(41.0082, 28.9784); // Istanbul -> ~158 derece
//   const aci = manyetikSapma(yon, deviceHeading); // pusula icin

export const KABE = {
  enlem: 21.4225, // Mescid-i Haram
  boylam: 39.8262,
};

function rad(derece) {
  return (derece * Math.PI) / 180;
}

function deg(radyan) {
  return (radyan * 180) / Math.PI;
}

// Initial bearing: bulundugun noktadan Kabe'ye dogru ilk yon.
// Donus: 0-360 derece (0 = Kuzey, 90 = Dogu, 180 = Guney, 270 = Bati)
export function kibleBearing(enlem, boylam) {
  const lat1 = rad(enlem);
  const lat2 = rad(KABE.enlem);
  const dLon = rad(KABE.boylam - boylam);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const brng = deg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Cihazin pusula yonune gore kible'ye ne kadar donmek gerekir.
// pozitif sonuc = saga don, negatif = sola don, 0'a yakin = kible'desin.
export function kibleSapma(enlem, boylam, deviceHeading) {
  const target = kibleBearing(enlem, boylam);
  let diff = target - deviceHeading;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

// Iki nokta arasi mesafe (km) - bilgi amacli, Kabe'ye uzaklik gostermek icin.
export function kabeMesafeKm(enlem, boylam) {
  const R = 6371; // dunya yaricapi km
  const dLat = rad(KABE.enlem - enlem);
  const dLon = rad(KABE.boylam - boylam);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(enlem)) *
      Math.cos(rad(KABE.enlem)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
