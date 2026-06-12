import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Android channel'lari icin sabit anahtarlar
const CH_NAMAZ = 'default';
const CH_MUHASEBE = 'muhasebe';

// Cross-platform custom ses (Android: kanal sound, iOS: notification sound dosya adi)
const EZAN_SESI = 'ezan.mp3';

// Bildirim metin havuzlari — Yusuf geri bildirimi: "bildirim gunu baglayalim
// mi yerine 'bugun Allah icin ne yaptin' gibi seyler yazalim, daha etkili".
// Mekanik hatirlatma yerine dusunduren, manevi vurgulu kisa promptlar.
// Rotasyon: gun + vakit indeksi -> stabil secim. Ayni gun farkli vakit farkli
// metin gorur, ama gun degisene kadar tutarli (debugging icin).

// Vakit oncesi (~30 dk) — hazirlik / nefes / niyet vurgu
const HAZIRLIK_METINLERI = [
  '{vakit} yaklaşıyor. Telâşı bırak, gönlünü hazırla.',
  '{vakit}\'e yarım saat. Bir bardak suya niyet et — abdestin başlasın.',
  'Yarım saat sonra Allah\'ın huzurundasın. Şu an ne düşünüyorsun?',
  '{vakit}\'e az kaldı. Son yarım saatte kimseye gücendin mi?',
  '{vakit} yakın. "Ne olursan ol, yine gel" — Mevlânâ.',
  '{vakit}\'e 30 dakika. Bir tesbihe başla — kalbini ısıt.',
  'Yarım saat sonra namaz. Bu yarım saati Allah için sakla.',
  '{vakit} yaklaşıyor. Telefonu bırakmaya hazır mısın?',
];

// Vakit oncesi (~15 dk) — aciliyet / abdest / sıyrılma
const ACILIYET_METINLERI = [
  '{vakit}\'e 15 dakika. Bir "Bismillah" de, dünyadan sıyrıl.',
  '{vakit} kapıda. Abdest al — su, kalbi de yıkar.',
  '15 dakika sonra Allah seni çağırıyor.',
  '{vakit}\'e 15 dakika. "Beni anmak için namazı kıl." (Tâhâ 14)',
  '{vakit} kapıda. Bir Estağfirullah ile başla.',
  '15 dakika kaldı. Niyet et, gerisi gelir.',
  '{vakit}\'e az kaldı. Şu an bıraktığın işi Allah için bırak.',
];

// Vakit girdi — ayet vurgusu (mevcut korundu + genisletildi)
const NAMAZ_AYETLERI = [
  { metin: 'Namaz, mü\'minler üzerine vakitleri belli bir farz olarak yazılmıştır.', kaynak: 'Nisâ 103' },
  { metin: 'Sabır ve namazla yardım dileyin. Allah sabredenlerle beraberdir.', kaynak: 'Bakara 153' },
  { metin: 'Beni anın, Ben de sizi anayım. Bana şükredin, nankörlük etmeyin.', kaynak: 'Bakara 152' },
  { metin: 'Kullarım sana Beni sorarsa, Ben yakınım. Bana dua edeni işitirim.', kaynak: 'Bakara 186' },
  { metin: 'Şüphesiz namaz, hayâsızlıktan ve kötülükten alıkoyar.', kaynak: 'Ankebût 45' },
  { metin: 'Beni anmak için namazı kıl.', kaynak: 'Tâhâ 14' },
  { metin: 'Günün iki ucunda ve gecenin yakın saatlerinde namaz kıl. İyilikler kötülükleri giderir.', kaynak: 'Hûd 114' },
  { metin: 'Mü\'minler felâha erdi. Onlar namazlarında huşû içindedirler.', kaynak: 'Mü\'minûn 1-2' },
  { metin: 'Kalpler ancak Allah\'ı anmakla mutmain olur.', kaynak: 'Ra\'d 28' },
  { metin: 'Sizin işiniz Allah\'a yönelmektir; O da size yönelir.', kaynak: 'Şûrâ 47 (meal-i münîf)' },
  { metin: 'Eğer şükrederseniz, andolsun ki size (nimetlerimi) artırırım.', kaynak: 'İbrâhim 7' },
];

// Aksam muhasebesi (22:00 daily) — reflective prompt havuzu
// "Bugun Allah icin ne yaptin" tarzi dusunduren sorular
const MUHASABE_METINLERI = [
  'Bugün Allah için ne yaptın?',
  'Bugün kaç kez "Estağfirullah" dedin?',
  'Yatmadan önce kimseyle dargınlığını barışa çevirdin mi?',
  'Bugün Kur\'ân\'dan bir âyet tattın mı?',
  'Defterini temiz bağladın mı bugün?',
  'Bugün bir "Subhânallah" çıktı mı dilinden?',
  'Yarın sabaha çıkabileceğine emin misin? Vasiyetini yaptın mı?',
  'Bugün bir hayır kapısına ne attın?',
  'Bugün birinin kalbini sevindirdin mi?',
  'Bugün Allah\'ı kaç saniye düşündün?',
  'Bir gün daha verildi. Şükür mü, gaflet mi?',
  'Yatmadan önce: bir tövbe, bir tesbih, bir salavât.',
];

// Cuma sabah (Cuma 09:00 weekly) — Cuma'nin bereketine vurgu
const CUMA_METINLERI = [
  'Bugün Cuma. Kehf sûresi okumak Peygamber\'imizin tavsiyesi (Sahîh).',
  'Cuma bereket günü. Büyük salavâtı kalbinden geçir.',
  'Cuma: dua kabul saati ikindi-akşam arasıdır (Rivayet).',
  'Peygamber\'imiz: "Cuma günü salavâtı çoğaltın." (Ebû Dâvûd)',
  'Hafta Cuma\'dan başlar. Bugün bir vaktini Allah\'a ver.',
  'Bugün Cuma. Kalbini güzel kokulardan önce niyetle ıtırla.',
];

function gunIndeksi(tarih) {
  return Math.floor(tarih.getTime() / (24 * 60 * 60 * 1000));
}

function havuzdanSec(havuz, tarih, vakitIndeks = 0) {
  if (!havuz || havuz.length === 0) return null;
  try {
    const gun = gunIndeksi(tarih);
    const idx = ((gun + vakitIndeks) % havuz.length + havuz.length) % havuz.length;
    return havuz[idx];
  } catch (e) {
    return havuz[0];
  }
}

function ayetSec(tarih, vakitIndeks = 0) {
  return havuzdanSec(NAMAZ_AYETLERI, tarih, vakitIndeks) || NAMAZ_AYETLERI[0];
}

function vakitYerlestir(sablon, ad) {
  return sablon.replace(/\{vakit\}/g, ad);
}

const OTUZ_DK_METNI = (ad, tarih, vakitIndeks) => {
  const sablon = havuzdanSec(HAZIRLIK_METINLERI, tarih, vakitIndeks) || HAZIRLIK_METINLERI[0];
  return vakitYerlestir(sablon, ad);
};
const ONBES_DK_METNI = (ad, tarih, vakitIndeks) => {
  const sablon = havuzdanSec(ACILIYET_METINLERI, tarih, vakitIndeks) || ACILIYET_METINLERI[0];
  return vakitYerlestir(sablon, ad);
};
const GIRDI_METNI = (ad, ayet) => `${ad} vakti girdi. — "${ayet.metin}" (${ayet.kaynak})`;

export async function izinIste() {
  try {
    const mevcut = await Notifications.getPermissionsAsync();
    let izin = mevcut.status;
    if (izin !== 'granted') {
      const istek = await Notifications.requestPermissionsAsync();
      izin = istek.status;
    }
    if (Platform.OS === 'android') {
      // Namaz vakti bildirimleri — ezan sesi
      await Notifications.setNotificationChannelAsync(CH_NAMAZ, {
        name: 'Hu',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'ezan.mp3',
        vibrationPattern: [0, 120, 80, 120],
        lightColor: '#B08D2E',
      });
      // Muhasebe ve Cuma sabah — yumusak, default ses
      await Notifications.setNotificationChannelAsync(CH_MUHASEBE, {
        name: 'Hu Muhasebe',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 100],
        lightColor: '#B08D2E',
      });
    }
    return izin === 'granted';
  } catch (e) {
    return false;
  }
}

async function planla(baslik, govde, tarih, ekstra = {}, opts = {}) {
  if (!tarih || !(tarih instanceof Date)) return null;
  if (tarih.getTime() <= Date.now() + 1000) return null;
  const { ses = true, kanal = CH_NAMAZ } = opts;
  try {
    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: tarih,
    };
    if (Platform.OS === 'android') {
      trigger.channelId = kanal;
    }
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: baslik,
        body: govde,
        data: ekstra,
        sound: ses,
      },
      trigger,
    });
  } catch (e) {
    return null;
  }
}

export async function namazBildirimleriniKur(vakitler) {
  if (!vakitler) return [];
  await tumBildirimleriIptal();

  const idler = [];
  const sira = [
    ['imsak', 'İmsak'],
    ['ogle', 'Öğle'],
    ['ikindi', 'İkindi'],
    ['aksam', 'Akşam'],
    ['yatsi', 'Yatsı'],
  ];

  for (let i = 0; i < sira.length; i++) {
    const [anahtar, ad] = sira[i];
    const zaman = vakitler[anahtar];
    if (!zaman) continue;

    const t30 = new Date(zaman.getTime() - 30 * 60 * 1000);
    const t15 = new Date(zaman.getTime() - 15 * 60 * 1000);
    const ayet = ayetSec(zaman, i);

    // 30 dk once — havuzdan rotasyon, daha dusunduren prompt
    const id30 = await planla(
      'Hu',
      OTUZ_DK_METNI(ad, zaman, i),
      t30,
      { tip: 'namaz_oncesi_30', vakit: anahtar },
      { ses: true, kanal: CH_MUHASEBE }
    );
    // 15 dk once — havuzdan rotasyon (farkli indeks)
    const id15 = await planla(
      'Hu',
      ONBES_DK_METNI(ad, zaman, i + 7),
      t15,
      { tip: 'namaz_oncesi_15', vakit: anahtar },
      { ses: true, kanal: CH_MUHASEBE }
    );
    // Vakit girdi — ezan sesi + ayet
    const idVakit = await planla(
      ad,
      GIRDI_METNI(ad, ayet),
      zaman,
      { tip: 'namaz_vakti', vakit: anahtar, ayetKaynak: ayet.kaynak },
      { ses: EZAN_SESI, kanal: CH_NAMAZ }
    );

    if (id30) idler.push(id30);
    if (id15) idler.push(id15);
    if (idVakit) idler.push(idVakit);
  }

  await aksamMuhasabesiBildirimi();
  await cumaBildirimi();
  return idler;
}

export async function aksamMuhasabesiBildirimi() {
  // DAILY trigger ile schedule edildiginde metin SABIT kalir. Her
  // namazBildirimleriniKur cagrisinda (genelde app acilisinda) cancel +
  // reschedule oldugu icin metin gun-bazli rotasyon ile yenilenir. Kullanici
  // app'i sik aciyorsa cesitlilik gorur; uzun sure acmazsa ayni metin tekrar
  // eder (kabul edilebilir).
  try {
    const metin = havuzdanSec(MUHASABE_METINLERI, new Date(), 0) || MUHASABE_METINLERI[0];
    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 22,
      minute: 0,
    };
    if (Platform.OS === 'android') {
      trigger.channelId = CH_MUHASEBE;
    }
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hu',
        body: metin,
        data: { tip: 'aksam_muhasabesi' },
        sound: true,
      },
      trigger,
    });
  } catch (e) {
    return null;
  }
}

export async function cumaBildirimi() {
  // Expo WEEKLY: 1=Pazar, 2=Pazartesi, ..., 6=Cuma, 7=Cumartesi
  // Doc: https://docs.expo.dev/versions/v54.0.0/sdk/notifications/ (WeeklyTriggerInput)
  // Muhasebe ile ayni mantik: schedule edildigi anda metin secilir.
  try {
    const metin = havuzdanSec(CUMA_METINLERI, new Date(), 0) || CUMA_METINLERI[0];
    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6,
      hour: 9,
      minute: 0,
    };
    if (Platform.OS === 'android') {
      trigger.channelId = CH_MUHASEBE;
    }
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hu',
        body: metin,
        data: { tip: 'cuma_sabah' },
        sound: true,
      },
      trigger,
    });
  } catch (e) {
    return null;
  }
}

export async function tumBildirimleriIptal() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {}
}
