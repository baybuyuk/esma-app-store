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

// Android'de custom ses; iOS'ta default ses
const EZAN_SESI = Platform.OS === 'android' ? 'ezan.oga' : true;

// Yasli dostu, namaza ozendiren kisa ayet havuzu — ASCII transliterasyon
// Konsol/JSON guvenligi icin Turkce karakter yok. Apostrof ihtiyaclarinda escape.
const NAMAZ_AYETLERI = [
  {
    metin: 'Namaz, mu\'minler uzerine vakitleri belli bir farz olarak yazilmistir.',
    kaynak: 'Nisa 103',
  },
  {
    metin: 'Sabir ve namazla yardim dileyin. Allah sabredenlerle beraberdir.',
    kaynak: 'Bakara 153',
  },
  {
    metin: 'Beni anin, Ben de sizi anayim. Bana sukredin, nankorluk etmeyin.',
    kaynak: 'Bakara 152',
  },
  {
    metin: 'Kullarim sana Beni sorarsa, Ben yakinim. Bana dua edeni isitirim.',
    kaynak: 'Bakara 186',
  },
  {
    metin: 'Suphesiz namaz, hayasizliktan ve kotulukten alikoyar.',
    kaynak: 'Ankebut 45',
  },
  {
    metin: 'Beni anmak icin namazi kil.',
    kaynak: 'Taha 14',
  },
  {
    metin: 'Gundun iki ucunda ve gecenin yakin saatlerinde namaz kil. Iyilikler kotulukleri giderir.',
    kaynak: 'Hud 114',
  },
  {
    metin: 'Mu\'minler felaha erdi. Onlar namazlarinda husu icindedirler.',
    kaynak: 'Mu\'minun 1-2',
  },
];

function ayetSec(tarih, vakitIndeks = 0) {
  // Gunun tarihine ve vakit indeksine gore stabil secim
  // Ayni gun farkli vakitler farkli ayet gorebilir ama gun degisene kadar tutarli
  try {
    const gun = Math.floor(tarih.getTime() / (24 * 60 * 60 * 1000));
    const idx = ((gun + vakitIndeks) % NAMAZ_AYETLERI.length + NAMAZ_AYETLERI.length) % NAMAZ_AYETLERI.length;
    return NAMAZ_AYETLERI[idx];
  } catch (e) {
    return NAMAZ_AYETLERI[0];
  }
}

const OTUZ_DK_METNI = (ad) => `${ad} vaktine yarim saat var, yavasca toparlanalim.`;
const ONBES_DK_METNI = (ad) => `${ad} vaktine 15 dakika. Abdest ve niyetlen kardesim.`;
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
        sound: 'ezan.oga',
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
    ['imsak', 'Imsak'],
    ['ogle', 'Ogle'],
    ['ikindi', 'Ikindi'],
    ['aksam', 'Aksam'],
    ['yatsi', 'Yatsi'],
  ];

  for (let i = 0; i < sira.length; i++) {
    const [anahtar, ad] = sira[i];
    const zaman = vakitler[anahtar];
    if (!zaman) continue;

    const t30 = new Date(zaman.getTime() - 30 * 60 * 1000);
    const t15 = new Date(zaman.getTime() - 15 * 60 * 1000);
    const ayet = ayetSec(zaman, i);

    // 30 dk once — nazik hatirlatma, default ses (yumusak)
    const id30 = await planla(
      'Hu',
      OTUZ_DK_METNI(ad),
      t30,
      { tip: 'namaz_oncesi_30', vakit: anahtar },
      { ses: true, kanal: CH_MUHASEBE }
    );
    // 15 dk once — aciliyet, default ses
    const id15 = await planla(
      'Hu',
      ONBES_DK_METNI(ad),
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
  try {
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
        body: 'Bugun Allah icin ne yaptin?',
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
  try {
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
        body: 'Bugun Cuma. Kehf suresi okumak Peygamberimizin tavsiyesi (Sahih).',
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
