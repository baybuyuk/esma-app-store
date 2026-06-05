import esmalar from '../../assets/data/esmalar.json';
import isimler from '../../assets/data/isimler.json';
import kisaZikirler from '../../assets/data/kisa_zikirler.json';
import hedefler from '../../assets/data/hedefler.json';
import anlikZikirler from '../../assets/data/anlik_zikirler.json';
import haftalikRotasyon from '../../assets/data/haftalik_rotasyon.json';
import hadisler from '../../assets/data/hadisler.json';
import ayetler from '../../assets/data/ayetler.json';
import sabahEvradi from '../../assets/data/sabah_evradi.json';
import aksamEvradi from '../../assets/data/aksam_evradi.json';
import dualar from '../../assets/data/dualar.json';
import salavatlar from '../../assets/data/salavatlar.json';
import sureler from '../../assets/data/sureler.json';
// Manevi sureler — backend ajan (BEN) tarafindan icerigi yazilacak.
// Suanda [] stub. Backend dosyayi overwrite ettiginde 7 sure (36,55,56,67,73,78) gelir.
// 94 (Insirah) asagidaki maneviSureleriHazirla() icinde sureler.json'dan enjekte ediliyor.
import maneviSurelerHam from '../../assets/data/manevi_sureler.json';

// İnşirah (94) — koordinatör talimatı: manevi listesinde de yer almalı.
// Backend manevi_sureler.json'a koymazsa, sureler.json'dan turetip enjekte ediyoruz.
// Backend zaten koymussa, duplicate olusturmuyoruz.
function maneviSureleriHazirla(ham) {
  const liste = Array.isArray(ham) ? [...ham] : [];
  const zatenVar = liste.some((s) => s && s.no === 94);
  if (!zatenVar) {
    const insirahKaynak = (sureler || []).find((s) => s.no === 94);
    if (insirahKaynak && Array.isArray(insirahKaynak.ayetler)) {
      const insirahManevi = {
        no: 94,
        ad: insirahKaynak.ad,
        arapca_ad: insirahKaynak.arapca_ad,
        inis_yeri: insirahKaynak.inis_yeri,
        ayet_sayisi: insirahKaynak.ayet_sayisi,
        kategori: 'manevi',
        tilavet_dosya: null, // tek-mp3 yok, ayet-ayet kullanilacak
        tilavet_kari: insirahKaynak.tilavet_kari || 'Saad al-Ghamdi',
        kisa_aciklama: insirahKaynak.kisa_aciklama,
        // Hadis kaynagi zayif/yok — temkinli ifade.
        fazilet:
          "Hz. Peygamber'in (s.a.v.) göğsünün açılması ve sıkıntısının hafifletilmesi mucizesine işaret eder. " +
          "Klasik müfessirlerin (Taberî, Zemahşerî, Râzî) ortak vurgusu üzere, " +
          'Peygamberimize gönülferahlığı vermesi sebebiyle sıkıntı anlarında okunması tavsiye edilmiştir. ' +
          '"Şüphesiz güçlükle beraber bir kolaylık vardır" âyeti zorluk zamanlarında kalbe ümit ve sebat verir.',
        ayetler: insirahKaynak.ayetler.map((a) => ({
          no: a.no,
          arapca: a.arapca,
          okunus: a.okunus,
          meal: a.meal,
          ses_dosyasi: `094${String(a.no).padStart(3, '0')}`,
        })),
      };
      liste.push(insirahManevi);
    }
  }
  // Sure numarasina gore artan sirala (36, 55, 56, 67, 73, 78, 94)
  liste.sort((a, b) => (a.no || 0) - (b.no || 0));
  return liste;
}

const maneviSureler = maneviSureleriHazirla(maneviSurelerHam);

export {
  esmalar,
  isimler,
  kisaZikirler,
  hedefler,
  anlikZikirler,
  haftalikRotasyon,
  hadisler,
  ayetler,
  sabahEvradi,
  aksamEvradi,
  dualar,
  salavatlar,
  sureler,
  maneviSureler,
};
