// ManeviSureDetay — ayet ayet tilavet senkronu.
// Aktif ayet kart highlight olur, biten ayet sonrasi sonraki ayete otomatik gecer,
// auto-scroll aktif ayete kayar. Kullanici basana kadar otomatik PLAY ETMEZ.
//
// Onemli notlar:
//  - useAudioPlayer top-level cagrilir; ses kaynagi degisince Expo player kaynagi degistirir.
//  - MANEVI_SES_HARITASI henuz BOS — backend (BEN ajan) ses dosyalarini ekleyecek.
//    Stub durumda useAudioPlayer(null) — oynat butonu pasif, "Ses henuz hazir degil" placeholder.
//  - 347 toplam ayet potansiyeli var — animasyon YOK, sadece border highlight yeterli.
//  - Cleanup: useFocusEffect blur'da player.pause().

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors } from '../constants/colors';
import { radii } from '../constants/radii';
import { useTipScale } from '../context/YaziKademesiContext';
import { maneviSureler } from '../lib/data';
import GradientArkaPlan from '../components/GradientArkaPlan';

// Metro require resolve derleme zamani — bu yuzden ayet ayet eslestirme gerekli.
// Backend ajan (BEN) ses dosyalarini ekledikçe BU MAP'i genisletecek.
// Format: ses_dosyasi alani '036001' gibi 6 haneli string (sure_no(3) + ayet_no(3))
// ORNEK ESLESME (gercek dosya YOK — yorum satirinda kalmali, build kirilmasin):
const MANEVI_SES_HARITASI = {
  '036001': require('../../assets/sounds/manevi/036001.mp3'),
  '036002': require('../../assets/sounds/manevi/036002.mp3'),
  '036003': require('../../assets/sounds/manevi/036003.mp3'),
  '036004': require('../../assets/sounds/manevi/036004.mp3'),
  '036005': require('../../assets/sounds/manevi/036005.mp3'),
  '036006': require('../../assets/sounds/manevi/036006.mp3'),
  '036007': require('../../assets/sounds/manevi/036007.mp3'),
  '036008': require('../../assets/sounds/manevi/036008.mp3'),
  '036009': require('../../assets/sounds/manevi/036009.mp3'),
  '036010': require('../../assets/sounds/manevi/036010.mp3'),
  '036011': require('../../assets/sounds/manevi/036011.mp3'),
  '036012': require('../../assets/sounds/manevi/036012.mp3'),
  '036013': require('../../assets/sounds/manevi/036013.mp3'),
  '036014': require('../../assets/sounds/manevi/036014.mp3'),
  '036015': require('../../assets/sounds/manevi/036015.mp3'),
  '036016': require('../../assets/sounds/manevi/036016.mp3'),
  '036017': require('../../assets/sounds/manevi/036017.mp3'),
  '036018': require('../../assets/sounds/manevi/036018.mp3'),
  '036019': require('../../assets/sounds/manevi/036019.mp3'),
  '036020': require('../../assets/sounds/manevi/036020.mp3'),
  '036021': require('../../assets/sounds/manevi/036021.mp3'),
  '036022': require('../../assets/sounds/manevi/036022.mp3'),
  '036023': require('../../assets/sounds/manevi/036023.mp3'),
  '036024': require('../../assets/sounds/manevi/036024.mp3'),
  '036025': require('../../assets/sounds/manevi/036025.mp3'),
  '036026': require('../../assets/sounds/manevi/036026.mp3'),
  '036027': require('../../assets/sounds/manevi/036027.mp3'),
  '036028': require('../../assets/sounds/manevi/036028.mp3'),
  '036029': require('../../assets/sounds/manevi/036029.mp3'),
  '036030': require('../../assets/sounds/manevi/036030.mp3'),
  '036031': require('../../assets/sounds/manevi/036031.mp3'),
  '036032': require('../../assets/sounds/manevi/036032.mp3'),
  '036033': require('../../assets/sounds/manevi/036033.mp3'),
  '036034': require('../../assets/sounds/manevi/036034.mp3'),
  '036035': require('../../assets/sounds/manevi/036035.mp3'),
  '036036': require('../../assets/sounds/manevi/036036.mp3'),
  '036037': require('../../assets/sounds/manevi/036037.mp3'),
  '036038': require('../../assets/sounds/manevi/036038.mp3'),
  '036039': require('../../assets/sounds/manevi/036039.mp3'),
  '036040': require('../../assets/sounds/manevi/036040.mp3'),
  '036041': require('../../assets/sounds/manevi/036041.mp3'),
  '036042': require('../../assets/sounds/manevi/036042.mp3'),
  '036043': require('../../assets/sounds/manevi/036043.mp3'),
  '036044': require('../../assets/sounds/manevi/036044.mp3'),
  '036045': require('../../assets/sounds/manevi/036045.mp3'),
  '036046': require('../../assets/sounds/manevi/036046.mp3'),
  '036047': require('../../assets/sounds/manevi/036047.mp3'),
  '036048': require('../../assets/sounds/manevi/036048.mp3'),
  '036049': require('../../assets/sounds/manevi/036049.mp3'),
  '036050': require('../../assets/sounds/manevi/036050.mp3'),
  '036051': require('../../assets/sounds/manevi/036051.mp3'),
  '036052': require('../../assets/sounds/manevi/036052.mp3'),
  '036053': require('../../assets/sounds/manevi/036053.mp3'),
  '036054': require('../../assets/sounds/manevi/036054.mp3'),
  '036055': require('../../assets/sounds/manevi/036055.mp3'),
  '036056': require('../../assets/sounds/manevi/036056.mp3'),
  '036057': require('../../assets/sounds/manevi/036057.mp3'),
  '036058': require('../../assets/sounds/manevi/036058.mp3'),
  '036059': require('../../assets/sounds/manevi/036059.mp3'),
  '036060': require('../../assets/sounds/manevi/036060.mp3'),
  '036061': require('../../assets/sounds/manevi/036061.mp3'),
  '036062': require('../../assets/sounds/manevi/036062.mp3'),
  '036063': require('../../assets/sounds/manevi/036063.mp3'),
  '036064': require('../../assets/sounds/manevi/036064.mp3'),
  '036065': require('../../assets/sounds/manevi/036065.mp3'),
  '036066': require('../../assets/sounds/manevi/036066.mp3'),
  '036067': require('../../assets/sounds/manevi/036067.mp3'),
  '036068': require('../../assets/sounds/manevi/036068.mp3'),
  '036069': require('../../assets/sounds/manevi/036069.mp3'),
  '036070': require('../../assets/sounds/manevi/036070.mp3'),
  '036071': require('../../assets/sounds/manevi/036071.mp3'),
  '036072': require('../../assets/sounds/manevi/036072.mp3'),
  '036073': require('../../assets/sounds/manevi/036073.mp3'),
  '036074': require('../../assets/sounds/manevi/036074.mp3'),
  '036075': require('../../assets/sounds/manevi/036075.mp3'),
  '036076': require('../../assets/sounds/manevi/036076.mp3'),
  '036077': require('../../assets/sounds/manevi/036077.mp3'),
  '036078': require('../../assets/sounds/manevi/036078.mp3'),
  '036079': require('../../assets/sounds/manevi/036079.mp3'),
  '036080': require('../../assets/sounds/manevi/036080.mp3'),
  '036081': require('../../assets/sounds/manevi/036081.mp3'),
  '036082': require('../../assets/sounds/manevi/036082.mp3'),
  '036083': require('../../assets/sounds/manevi/036083.mp3'),
  '055001': require('../../assets/sounds/manevi/055001.mp3'),
  '055002': require('../../assets/sounds/manevi/055002.mp3'),
  '055003': require('../../assets/sounds/manevi/055003.mp3'),
  '055004': require('../../assets/sounds/manevi/055004.mp3'),
  '055005': require('../../assets/sounds/manevi/055005.mp3'),
  '055006': require('../../assets/sounds/manevi/055006.mp3'),
  '055007': require('../../assets/sounds/manevi/055007.mp3'),
  '055008': require('../../assets/sounds/manevi/055008.mp3'),
  '055009': require('../../assets/sounds/manevi/055009.mp3'),
  '055010': require('../../assets/sounds/manevi/055010.mp3'),
  '055011': require('../../assets/sounds/manevi/055011.mp3'),
  '055012': require('../../assets/sounds/manevi/055012.mp3'),
  '055013': require('../../assets/sounds/manevi/055013.mp3'),
  '055014': require('../../assets/sounds/manevi/055014.mp3'),
  '055015': require('../../assets/sounds/manevi/055015.mp3'),
  '055016': require('../../assets/sounds/manevi/055016.mp3'),
  '055017': require('../../assets/sounds/manevi/055017.mp3'),
  '055018': require('../../assets/sounds/manevi/055018.mp3'),
  '055019': require('../../assets/sounds/manevi/055019.mp3'),
  '055020': require('../../assets/sounds/manevi/055020.mp3'),
  '055021': require('../../assets/sounds/manevi/055021.mp3'),
  '055022': require('../../assets/sounds/manevi/055022.mp3'),
  '055023': require('../../assets/sounds/manevi/055023.mp3'),
  '055024': require('../../assets/sounds/manevi/055024.mp3'),
  '055025': require('../../assets/sounds/manevi/055025.mp3'),
  '055026': require('../../assets/sounds/manevi/055026.mp3'),
  '055027': require('../../assets/sounds/manevi/055027.mp3'),
  '055028': require('../../assets/sounds/manevi/055028.mp3'),
  '055029': require('../../assets/sounds/manevi/055029.mp3'),
  '055030': require('../../assets/sounds/manevi/055030.mp3'),
  '055031': require('../../assets/sounds/manevi/055031.mp3'),
  '055032': require('../../assets/sounds/manevi/055032.mp3'),
  '055033': require('../../assets/sounds/manevi/055033.mp3'),
  '055034': require('../../assets/sounds/manevi/055034.mp3'),
  '055035': require('../../assets/sounds/manevi/055035.mp3'),
  '055036': require('../../assets/sounds/manevi/055036.mp3'),
  '055037': require('../../assets/sounds/manevi/055037.mp3'),
  '055038': require('../../assets/sounds/manevi/055038.mp3'),
  '055039': require('../../assets/sounds/manevi/055039.mp3'),
  '055040': require('../../assets/sounds/manevi/055040.mp3'),
  '055041': require('../../assets/sounds/manevi/055041.mp3'),
  '055042': require('../../assets/sounds/manevi/055042.mp3'),
  '055043': require('../../assets/sounds/manevi/055043.mp3'),
  '055044': require('../../assets/sounds/manevi/055044.mp3'),
  '055045': require('../../assets/sounds/manevi/055045.mp3'),
  '055046': require('../../assets/sounds/manevi/055046.mp3'),
  '055047': require('../../assets/sounds/manevi/055047.mp3'),
  '055048': require('../../assets/sounds/manevi/055048.mp3'),
  '055049': require('../../assets/sounds/manevi/055049.mp3'),
  '055050': require('../../assets/sounds/manevi/055050.mp3'),
  '055051': require('../../assets/sounds/manevi/055051.mp3'),
  '055052': require('../../assets/sounds/manevi/055052.mp3'),
  '055053': require('../../assets/sounds/manevi/055053.mp3'),
  '055054': require('../../assets/sounds/manevi/055054.mp3'),
  '055055': require('../../assets/sounds/manevi/055055.mp3'),
  '055056': require('../../assets/sounds/manevi/055056.mp3'),
  '055057': require('../../assets/sounds/manevi/055057.mp3'),
  '055058': require('../../assets/sounds/manevi/055058.mp3'),
  '055059': require('../../assets/sounds/manevi/055059.mp3'),
  '055060': require('../../assets/sounds/manevi/055060.mp3'),
  '055061': require('../../assets/sounds/manevi/055061.mp3'),
  '055062': require('../../assets/sounds/manevi/055062.mp3'),
  '055063': require('../../assets/sounds/manevi/055063.mp3'),
  '055064': require('../../assets/sounds/manevi/055064.mp3'),
  '055065': require('../../assets/sounds/manevi/055065.mp3'),
  '055066': require('../../assets/sounds/manevi/055066.mp3'),
  '055067': require('../../assets/sounds/manevi/055067.mp3'),
  '055068': require('../../assets/sounds/manevi/055068.mp3'),
  '055069': require('../../assets/sounds/manevi/055069.mp3'),
  '055070': require('../../assets/sounds/manevi/055070.mp3'),
  '055071': require('../../assets/sounds/manevi/055071.mp3'),
  '055072': require('../../assets/sounds/manevi/055072.mp3'),
  '055073': require('../../assets/sounds/manevi/055073.mp3'),
  '055074': require('../../assets/sounds/manevi/055074.mp3'),
  '055075': require('../../assets/sounds/manevi/055075.mp3'),
  '055076': require('../../assets/sounds/manevi/055076.mp3'),
  '055077': require('../../assets/sounds/manevi/055077.mp3'),
  '055078': require('../../assets/sounds/manevi/055078.mp3'),
  '056001': require('../../assets/sounds/manevi/056001.mp3'),
  '056002': require('../../assets/sounds/manevi/056002.mp3'),
  '056003': require('../../assets/sounds/manevi/056003.mp3'),
  '056004': require('../../assets/sounds/manevi/056004.mp3'),
  '056005': require('../../assets/sounds/manevi/056005.mp3'),
  '056006': require('../../assets/sounds/manevi/056006.mp3'),
  '056007': require('../../assets/sounds/manevi/056007.mp3'),
  '056008': require('../../assets/sounds/manevi/056008.mp3'),
  '056009': require('../../assets/sounds/manevi/056009.mp3'),
  '056010': require('../../assets/sounds/manevi/056010.mp3'),
  '056011': require('../../assets/sounds/manevi/056011.mp3'),
  '056012': require('../../assets/sounds/manevi/056012.mp3'),
  '056013': require('../../assets/sounds/manevi/056013.mp3'),
  '056014': require('../../assets/sounds/manevi/056014.mp3'),
  '056015': require('../../assets/sounds/manevi/056015.mp3'),
  '056016': require('../../assets/sounds/manevi/056016.mp3'),
  '056017': require('../../assets/sounds/manevi/056017.mp3'),
  '056018': require('../../assets/sounds/manevi/056018.mp3'),
  '056019': require('../../assets/sounds/manevi/056019.mp3'),
  '056020': require('../../assets/sounds/manevi/056020.mp3'),
  '056021': require('../../assets/sounds/manevi/056021.mp3'),
  '056022': require('../../assets/sounds/manevi/056022.mp3'),
  '056023': require('../../assets/sounds/manevi/056023.mp3'),
  '056024': require('../../assets/sounds/manevi/056024.mp3'),
  '056025': require('../../assets/sounds/manevi/056025.mp3'),
  '056026': require('../../assets/sounds/manevi/056026.mp3'),
  '056027': require('../../assets/sounds/manevi/056027.mp3'),
  '056028': require('../../assets/sounds/manevi/056028.mp3'),
  '056029': require('../../assets/sounds/manevi/056029.mp3'),
  '056030': require('../../assets/sounds/manevi/056030.mp3'),
  '056031': require('../../assets/sounds/manevi/056031.mp3'),
  '056032': require('../../assets/sounds/manevi/056032.mp3'),
  '056033': require('../../assets/sounds/manevi/056033.mp3'),
  '056034': require('../../assets/sounds/manevi/056034.mp3'),
  '056035': require('../../assets/sounds/manevi/056035.mp3'),
  '056036': require('../../assets/sounds/manevi/056036.mp3'),
  '056037': require('../../assets/sounds/manevi/056037.mp3'),
  '056038': require('../../assets/sounds/manevi/056038.mp3'),
  '056039': require('../../assets/sounds/manevi/056039.mp3'),
  '056040': require('../../assets/sounds/manevi/056040.mp3'),
  '056041': require('../../assets/sounds/manevi/056041.mp3'),
  '056042': require('../../assets/sounds/manevi/056042.mp3'),
  '056043': require('../../assets/sounds/manevi/056043.mp3'),
  '056044': require('../../assets/sounds/manevi/056044.mp3'),
  '056045': require('../../assets/sounds/manevi/056045.mp3'),
  '056046': require('../../assets/sounds/manevi/056046.mp3'),
  '056047': require('../../assets/sounds/manevi/056047.mp3'),
  '056048': require('../../assets/sounds/manevi/056048.mp3'),
  '056049': require('../../assets/sounds/manevi/056049.mp3'),
  '056050': require('../../assets/sounds/manevi/056050.mp3'),
  '056051': require('../../assets/sounds/manevi/056051.mp3'),
  '056052': require('../../assets/sounds/manevi/056052.mp3'),
  '056053': require('../../assets/sounds/manevi/056053.mp3'),
  '056054': require('../../assets/sounds/manevi/056054.mp3'),
  '056055': require('../../assets/sounds/manevi/056055.mp3'),
  '056056': require('../../assets/sounds/manevi/056056.mp3'),
  '056057': require('../../assets/sounds/manevi/056057.mp3'),
  '056058': require('../../assets/sounds/manevi/056058.mp3'),
  '056059': require('../../assets/sounds/manevi/056059.mp3'),
  '056060': require('../../assets/sounds/manevi/056060.mp3'),
  '056061': require('../../assets/sounds/manevi/056061.mp3'),
  '056062': require('../../assets/sounds/manevi/056062.mp3'),
  '056063': require('../../assets/sounds/manevi/056063.mp3'),
  '056064': require('../../assets/sounds/manevi/056064.mp3'),
  '056065': require('../../assets/sounds/manevi/056065.mp3'),
  '056066': require('../../assets/sounds/manevi/056066.mp3'),
  '056067': require('../../assets/sounds/manevi/056067.mp3'),
  '056068': require('../../assets/sounds/manevi/056068.mp3'),
  '056069': require('../../assets/sounds/manevi/056069.mp3'),
  '056070': require('../../assets/sounds/manevi/056070.mp3'),
  '056071': require('../../assets/sounds/manevi/056071.mp3'),
  '056072': require('../../assets/sounds/manevi/056072.mp3'),
  '056073': require('../../assets/sounds/manevi/056073.mp3'),
  '056074': require('../../assets/sounds/manevi/056074.mp3'),
  '056075': require('../../assets/sounds/manevi/056075.mp3'),
  '056076': require('../../assets/sounds/manevi/056076.mp3'),
  '056077': require('../../assets/sounds/manevi/056077.mp3'),
  '056078': require('../../assets/sounds/manevi/056078.mp3'),
  '056079': require('../../assets/sounds/manevi/056079.mp3'),
  '056080': require('../../assets/sounds/manevi/056080.mp3'),
  '056081': require('../../assets/sounds/manevi/056081.mp3'),
  '056082': require('../../assets/sounds/manevi/056082.mp3'),
  '056083': require('../../assets/sounds/manevi/056083.mp3'),
  '056084': require('../../assets/sounds/manevi/056084.mp3'),
  '056085': require('../../assets/sounds/manevi/056085.mp3'),
  '056086': require('../../assets/sounds/manevi/056086.mp3'),
  '056087': require('../../assets/sounds/manevi/056087.mp3'),
  '056088': require('../../assets/sounds/manevi/056088.mp3'),
  '056089': require('../../assets/sounds/manevi/056089.mp3'),
  '056090': require('../../assets/sounds/manevi/056090.mp3'),
  '056091': require('../../assets/sounds/manevi/056091.mp3'),
  '056092': require('../../assets/sounds/manevi/056092.mp3'),
  '056093': require('../../assets/sounds/manevi/056093.mp3'),
  '056094': require('../../assets/sounds/manevi/056094.mp3'),
  '056095': require('../../assets/sounds/manevi/056095.mp3'),
  '056096': require('../../assets/sounds/manevi/056096.mp3'),
  '067001': require('../../assets/sounds/manevi/067001.mp3'),
  '067002': require('../../assets/sounds/manevi/067002.mp3'),
  '067003': require('../../assets/sounds/manevi/067003.mp3'),
  '067004': require('../../assets/sounds/manevi/067004.mp3'),
  '067005': require('../../assets/sounds/manevi/067005.mp3'),
  '067006': require('../../assets/sounds/manevi/067006.mp3'),
  '067007': require('../../assets/sounds/manevi/067007.mp3'),
  '067008': require('../../assets/sounds/manevi/067008.mp3'),
  '067009': require('../../assets/sounds/manevi/067009.mp3'),
  '067010': require('../../assets/sounds/manevi/067010.mp3'),
  '067011': require('../../assets/sounds/manevi/067011.mp3'),
  '067012': require('../../assets/sounds/manevi/067012.mp3'),
  '067013': require('../../assets/sounds/manevi/067013.mp3'),
  '067014': require('../../assets/sounds/manevi/067014.mp3'),
  '067015': require('../../assets/sounds/manevi/067015.mp3'),
  '067016': require('../../assets/sounds/manevi/067016.mp3'),
  '067017': require('../../assets/sounds/manevi/067017.mp3'),
  '067018': require('../../assets/sounds/manevi/067018.mp3'),
  '067019': require('../../assets/sounds/manevi/067019.mp3'),
  '067020': require('../../assets/sounds/manevi/067020.mp3'),
  '067021': require('../../assets/sounds/manevi/067021.mp3'),
  '067022': require('../../assets/sounds/manevi/067022.mp3'),
  '067023': require('../../assets/sounds/manevi/067023.mp3'),
  '067024': require('../../assets/sounds/manevi/067024.mp3'),
  '067025': require('../../assets/sounds/manevi/067025.mp3'),
  '067026': require('../../assets/sounds/manevi/067026.mp3'),
  '067027': require('../../assets/sounds/manevi/067027.mp3'),
  '067028': require('../../assets/sounds/manevi/067028.mp3'),
  '067029': require('../../assets/sounds/manevi/067029.mp3'),
  '067030': require('../../assets/sounds/manevi/067030.mp3'),
  '073001': require('../../assets/sounds/manevi/073001.mp3'),
  '073002': require('../../assets/sounds/manevi/073002.mp3'),
  '073003': require('../../assets/sounds/manevi/073003.mp3'),
  '073004': require('../../assets/sounds/manevi/073004.mp3'),
  '073005': require('../../assets/sounds/manevi/073005.mp3'),
  '073006': require('../../assets/sounds/manevi/073006.mp3'),
  '073007': require('../../assets/sounds/manevi/073007.mp3'),
  '073008': require('../../assets/sounds/manevi/073008.mp3'),
  '073009': require('../../assets/sounds/manevi/073009.mp3'),
  '073010': require('../../assets/sounds/manevi/073010.mp3'),
  '073011': require('../../assets/sounds/manevi/073011.mp3'),
  '073012': require('../../assets/sounds/manevi/073012.mp3'),
  '073013': require('../../assets/sounds/manevi/073013.mp3'),
  '073014': require('../../assets/sounds/manevi/073014.mp3'),
  '073015': require('../../assets/sounds/manevi/073015.mp3'),
  '073016': require('../../assets/sounds/manevi/073016.mp3'),
  '073017': require('../../assets/sounds/manevi/073017.mp3'),
  '073018': require('../../assets/sounds/manevi/073018.mp3'),
  '073019': require('../../assets/sounds/manevi/073019.mp3'),
  '073020': require('../../assets/sounds/manevi/073020.mp3'),
  '078001': require('../../assets/sounds/manevi/078001.mp3'),
  '078002': require('../../assets/sounds/manevi/078002.mp3'),
  '078003': require('../../assets/sounds/manevi/078003.mp3'),
  '078004': require('../../assets/sounds/manevi/078004.mp3'),
  '078005': require('../../assets/sounds/manevi/078005.mp3'),
  '078006': require('../../assets/sounds/manevi/078006.mp3'),
  '078007': require('../../assets/sounds/manevi/078007.mp3'),
  '078008': require('../../assets/sounds/manevi/078008.mp3'),
  '078009': require('../../assets/sounds/manevi/078009.mp3'),
  '078010': require('../../assets/sounds/manevi/078010.mp3'),
  '078011': require('../../assets/sounds/manevi/078011.mp3'),
  '078012': require('../../assets/sounds/manevi/078012.mp3'),
  '078013': require('../../assets/sounds/manevi/078013.mp3'),
  '078014': require('../../assets/sounds/manevi/078014.mp3'),
  '078015': require('../../assets/sounds/manevi/078015.mp3'),
  '078016': require('../../assets/sounds/manevi/078016.mp3'),
  '078017': require('../../assets/sounds/manevi/078017.mp3'),
  '078018': require('../../assets/sounds/manevi/078018.mp3'),
  '078019': require('../../assets/sounds/manevi/078019.mp3'),
  '078020': require('../../assets/sounds/manevi/078020.mp3'),
  '078021': require('../../assets/sounds/manevi/078021.mp3'),
  '078022': require('../../assets/sounds/manevi/078022.mp3'),
  '078023': require('../../assets/sounds/manevi/078023.mp3'),
  '078024': require('../../assets/sounds/manevi/078024.mp3'),
  '078025': require('../../assets/sounds/manevi/078025.mp3'),
  '078026': require('../../assets/sounds/manevi/078026.mp3'),
  '078027': require('../../assets/sounds/manevi/078027.mp3'),
  '078028': require('../../assets/sounds/manevi/078028.mp3'),
  '078029': require('../../assets/sounds/manevi/078029.mp3'),
  '078030': require('../../assets/sounds/manevi/078030.mp3'),
  '078031': require('../../assets/sounds/manevi/078031.mp3'),
  '078032': require('../../assets/sounds/manevi/078032.mp3'),
  '078033': require('../../assets/sounds/manevi/078033.mp3'),
  '078034': require('../../assets/sounds/manevi/078034.mp3'),
  '078035': require('../../assets/sounds/manevi/078035.mp3'),
  '078036': require('../../assets/sounds/manevi/078036.mp3'),
  '078037': require('../../assets/sounds/manevi/078037.mp3'),
  '078038': require('../../assets/sounds/manevi/078038.mp3'),
  '078039': require('../../assets/sounds/manevi/078039.mp3'),
  '078040': require('../../assets/sounds/manevi/078040.mp3'),
  '094001': require('../../assets/sounds/manevi/094001.mp3'),
  '094002': require('../../assets/sounds/manevi/094002.mp3'),
  '094003': require('../../assets/sounds/manevi/094003.mp3'),
  '094004': require('../../assets/sounds/manevi/094004.mp3'),
  '094005': require('../../assets/sounds/manevi/094005.mp3'),
  '094006': require('../../assets/sounds/manevi/094006.mp3'),
  '094007': require('../../assets/sounds/manevi/094007.mp3'),
  '094008': require('../../assets/sounds/manevi/094008.mp3'),
};

function dakSn(sn) {
  if (sn == null || Number.isNaN(sn)) return '0:00';
  const m = Math.floor(sn / 60);
  const s = Math.floor(sn % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ManeviSureDetayScreen({ navigation, route }) {
  const tip = useTipScale();
  const sureNo = route?.params?.sureNo;

  const sure = useMemo(
    () => (maneviSureler || []).find((s) => s.no === sureNo),
    [sureNo]
  );

  const ayetler = sure?.ayetler || [];
  const ayetSayisi = ayetler.length;

  // Aktif ayet indeksi (0-based)
  const [aktifAyetIdx, setAktifAyetIdx] = useState(0);
  const aktifAyet = ayetler[aktifAyetIdx];

  // Ses kaynagi — aktif ayetin ses_dosyasi key'ine gore. Stub donemde null gelir.
  const sesKaynak = aktifAyet ? (MANEVI_SES_HARITASI[aktifAyet.ses_dosyasi] || null) : null;
  const sesVar = !!sesKaynak;

  // Player — hooks rule: top-level, kosullu return ONCESI.
  const player = useAudioPlayer(sesKaynak);
  const status = useAudioPlayerStatus(player);

  const oynaniyor = !!status?.playing;
  const sureSn = status?.duration ?? 0;
  const suSn = status?.currentTime ?? 0;
  const ilerleme = sureSn > 0 ? Math.min(1, suSn / sureSn) : 0;

  // Auto-scroll icin pozisyon ref'leri
  const ayetPozisyonRef = useRef({}); // { ses_dosyasi: y koordinat }
  const scrollViewRef = useRef(null);

  // Race condition guard: didJustFinish her status update'inde true kalabilir.
  // Bir kez tetiklenince son islenmis tamamlanma zamanini tut.
  const sonTamamlananIdxRef = useRef(-1);
  // Kullanici manuel aktif degistirince otomatik "bitti->ileri" mantigi yanlis indekse atlamasin.
  // Mevcut aktif idx degistiginde sayaci sifirla.
  useEffect(() => {
    sonTamamlananIdxRef.current = -1;
  }, [aktifAyetIdx]);

  // didJustFinish: aktif ayet bittiginde sonrakine gec
  useEffect(() => {
    if (!status?.didJustFinish) return;
    if (sonTamamlananIdxRef.current === aktifAyetIdx) return; // ayni tetik tekrar gelmesin
    sonTamamlananIdxRef.current = aktifAyetIdx;

    if (aktifAyetIdx < ayetler.length - 1) {
      const sonraki = aktifAyetIdx + 1;
      setAktifAyetIdx(sonraki);
      // Kucuk delay — yeni kaynak yuklensin
      setTimeout(() => {
        try { player?.play(); } catch (_) {}
      }, 120);
    } else {
      // Sure bitti — pause + basa al
      try { player?.pause(); } catch (_) {}
      setAktifAyetIdx(0);
    }
  }, [status?.didJustFinish, aktifAyetIdx, ayetler.length, player]);

  // Aktif ayet degisince auto-scroll
  useEffect(() => {
    if (!aktifAyet || !scrollViewRef.current) return;
    const pozisyon = ayetPozisyonRef.current[aktifAyet.ses_dosyasi];
    if (typeof pozisyon === 'number') {
      scrollViewRef.current.scrollTo({ y: Math.max(0, pozisyon - 100), animated: true });
    }
  }, [aktifAyetIdx, aktifAyet]);

  // Ekran blur olunca player'i durdur
  useFocusEffect(
    useCallback(() => {
      return () => {
        try { player?.pause(); } catch (_) {}
      };
    }, [player])
  );

  const oynatDurdur = useCallback(() => {
    if (!player || !sesVar) return;
    try {
      if (oynaniyor) {
        player.pause();
      } else {
        // Eger aktif ayetin sonuna yakinsa basa al
        if (sureSn > 0 && suSn >= sureSn - 0.2) {
          try { player.seekTo(0); } catch (_) {}
          sonTamamlananIdxRef.current = -1;
        }
        player.play();
      }
    } catch (_) {}
  }, [player, sesVar, oynaniyor, sureSn, suSn]);

  // Empty / hata durumu
  if (!sure) {
    return (
      <GradientArkaPlan>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
              <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
            </TouchableOpacity>
            <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>Sûre</Text>
            <View style={{ width: 60 }} />
          </View>
          <Text style={styles.bos}>Sûre bulunamadı.</Text>
        </SafeAreaView>
      </GradientArkaPlan>
    );
  }

  return (
    <GradientArkaPlan>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.geri, { fontSize: tip.geri.fontSize, lineHeight: tip.geri.lineHeight }]}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={[styles.baslik, { fontSize: tip.lg.fontSize, lineHeight: tip.lg.lineHeight }]}>
            {sure.ad} Sûresi
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ paddingBottom: 36 }}
          scrollEventThrottle={32}
        >
          {/* Bas kart — sure adi + bilgi */}
          <View style={styles.basKart}>
            <Text style={styles.basArapcaAd}>{sure.arapca_ad}</Text>
            <Text style={[styles.basTurkceAd, { fontSize: tip.xl.fontSize, lineHeight: tip.xl.lineHeight }]}>
              {sure.ad} Sûresi
            </Text>
            <Text style={[styles.basAlt, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
              {sure.ayet_sayisi} âyet · {sure.inis_yeri}
            </Text>
          </View>

          {/* Tilavet kontrol kartı */}
          <View style={styles.tilavetKart}>
            <TouchableOpacity
              style={[
                styles.oynatBtn,
                oynaniyor && styles.oynatBtnAktif,
                !sesVar && styles.oynatBtnPasif,
              ]}
              onPress={oynatDurdur}
              activeOpacity={0.85}
              disabled={!sesVar}
              accessibilityLabel={oynaniyor ? 'Tilâveti duraklat' : 'Tilâveti başlat'}
              accessibilityRole="button"
              accessibilityState={{ selected: oynaniyor, disabled: !sesVar }}
            >
              <Text style={styles.oynatIcon}>{oynaniyor ? '❚❚' : '▶'}</Text>
            </TouchableOpacity>
            <View style={styles.tilavetBilgi}>
              {sesVar ? (
                <>
                  <View style={styles.barArka}>
                    <View style={[styles.barDolu, { width: `${ilerleme * 100}%` }]} />
                  </View>
                  <View style={styles.zamanSatir}>
                    <Text style={[styles.zamanYazi, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                      {dakSn(suSn)}
                    </Text>
                    <Text style={[styles.zamanYazi, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                      {dakSn(sureSn)}
                    </Text>
                  </View>
                  <Text style={[styles.kariYazi, { fontSize: tip.xs.fontSize, lineHeight: tip.xs.lineHeight }]}>
                    Aktif âyet: {aktifAyet?.no} / {ayetSayisi}  ·  {sure.tilavet_kari}
                  </Text>
                </>
              ) : (
                <Text style={[styles.kariYazi, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                  Ses kayıtları hazırlanıyor. Şimdilik metni okuyabilirsiniz.
                </Text>
              )}
            </View>
          </View>

          {/* Ayetler — kompakt blok layout (Yorum A) */}
          {ayetler.map((ayet, idx) => {
            const aktif = idx === aktifAyetIdx && sesVar;
            return (
              <View
                key={`${sure.no}-${ayet.no}`}
                style={[styles.ayetKart, aktif && styles.ayetKartAktif]}
                onLayout={(e) => {
                  ayetPozisyonRef.current[ayet.ses_dosyasi] = e.nativeEvent.layout.y;
                }}
              >
                <View style={styles.ayetUstSatir}>
                  <Text style={[styles.ayetNo, aktif && styles.ayetNoAktif]}>{ayet.no}</Text>
                  {aktif ? (
                    <Text style={styles.aktifRozet}>● Okunuyor</Text>
                  ) : null}
                </View>
                <Text style={[styles.arapca, { fontSize: tip.arapca?.fontSize || 28, lineHeight: (tip.arapca?.lineHeight || 44) + 4 }]}>
                  {ayet.arapca}
                </Text>
                {ayet.okunus ? (
                  <Text style={[styles.okunus, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.25 }]}>
                    {ayet.okunus}
                  </Text>
                ) : null}
                <View style={styles.cizgi} />
                <Text style={[styles.meal, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.35 }]}>
                  {ayet.meal}
                </Text>
              </View>
            );
          })}

          {sure.fazilet ? (
            <View style={styles.faziletKart}>
              <Text style={[styles.faziletBaslik, { fontSize: tip.sm.fontSize, lineHeight: tip.sm.lineHeight }]}>
                HAKKINDA
              </Text>
              <Text style={[styles.faziletMetin, { fontSize: tip.base.fontSize, lineHeight: tip.base.lineHeight * 1.35 }]}>
                {sure.fazilet}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </GradientArkaPlan>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  geri: { color: colors.altin, width: 60 },
  baslik: { color: colors.anaYesil, fontWeight: '600', flex: 1, textAlign: 'center' },
  bos: {
    textAlign: 'center',
    color: colors.ikincilMetin,
    marginTop: 60,
    paddingHorizontal: 20,
  },

  basKart: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: radii.md,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  basArapcaAd: {
    fontSize: 38,
    lineHeight: 54,
    color: colors.anaYesil,
    fontWeight: '600',
  },
  basTurkceAd: {
    color: colors.anaMetin,
    fontWeight: '700',
    marginTop: 6,
  },
  basAlt: {
    color: colors.altin,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  tilavetKart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: radii.md,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  oynatBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.anaYesil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oynatBtnAktif: { backgroundColor: colors.ortaYesil },
  oynatBtnPasif: { backgroundColor: colors.cizgi, opacity: 0.6 },
  oynatIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  tilavetBilgi: { flex: 1, marginLeft: 14 },
  barArka: {
    height: 6,
    backgroundColor: '#EFE9D8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barDolu: {
    height: '100%',
    backgroundColor: colors.altin,
  },
  zamanSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  zamanYazi: { color: colors.ikincilMetin },
  kariYazi: {
    color: colors.altin,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Ayet kart — kompakt blok (Yorum A)
  ayetKart: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  ayetKartAktif: {
    backgroundColor: '#FDFAF1',
    borderWidth: 2,
    borderColor: colors.ortaYesil,
    elevation: 3,
    shadowOpacity: 0.10,
  },
  ayetUstSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ayetNo: {
    color: '#fff',
    backgroundColor: colors.altin,
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  ayetNoAktif: {
    backgroundColor: colors.anaYesil,
  },
  aktifRozet: {
    color: colors.ortaYesil,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  arapca: {
    color: colors.anaMetin,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4, // kompakt blok: arapca-okunus arasi az
  },
  okunus: {
    color: colors.ortaYesil,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cizgi: {
    height: 1,
    backgroundColor: '#EFE9D8',
    marginBottom: 8,
  },
  meal: { color: colors.anaMetin },

  faziletKart: {
    backgroundColor: '#FDFAF1',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cizgi,
  },
  faziletBaslik: {
    color: colors.altin,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  faziletMetin: { color: colors.anaMetin },
});
