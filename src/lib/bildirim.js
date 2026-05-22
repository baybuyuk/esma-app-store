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

const ONCEKI_METNI = (ad) => `${ad} vaktine 15 dakika var, ne yapiyorsan toparla.`;
const GIRDI_METNI = (ad) => `${ad} vakti girdi.`;

export async function izinIste() {
  try {
    const mevcut = await Notifications.getPermissionsAsync();
    let izin = mevcut.status;
    if (izin !== 'granted') {
      const istek = await Notifications.requestPermissionsAsync();
      izin = istek.status;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Hu',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 120, 80, 120],
        lightColor: '#B08D2E',
      });
    }
    return izin === 'granted';
  } catch (e) {
    return false;
  }
}

async function planla(baslik, govde, tarih, ekstra = {}) {
  if (!tarih || !(tarih instanceof Date)) return null;
  if (tarih.getTime() <= Date.now() + 1000) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: baslik,
        body: govde,
        data: ekstra,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: tarih,
      },
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

  for (const [anahtar, ad] of sira) {
    const zaman = vakitler[anahtar];
    if (!zaman) continue;
    const onceki = new Date(zaman.getTime() - 15 * 60 * 1000);
    const id1 = await planla('Hu', ONCEKI_METNI(ad), onceki, { tip: 'namaz_oncesi', vakit: anahtar });
    const id2 = await planla('Hu', GIRDI_METNI(ad), zaman, { tip: 'namaz_vakti', vakit: anahtar });
    if (id1) idler.push(id1);
    if (id2) idler.push(id2);
  }

  await aksamMuhasabesiBildirimi();
  return idler;
}

export async function aksamMuhasabesiBildirimi() {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hu',
        body: 'Gunu baglayalim mi?',
        data: { tip: 'aksam_muhasabesi' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 22,
        minute: 0,
      },
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
