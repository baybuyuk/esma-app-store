import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingNameScreen from './src/screens/OnboardingNameScreen';
import OnboardingLocationScreen from './src/screens/OnboardingLocationScreen';
import OnboardingNotificationScreen from './src/screens/OnboardingNotificationScreen';
import OnboardingEsmaScreen from './src/screens/OnboardingEsmaScreen';
import AnaEkran from './src/screens/AnaEkran';
import ZikirSayacScreen from './src/screens/ZikirSayacScreen';
import EsmaDetayScreen from './src/screens/EsmaDetayScreen';
import EsmalarListScreen from './src/screens/EsmalarListScreen';
import EsmaIstatistikScreen from './src/screens/EsmaIstatistikScreen';
import KisaZikirlerScreen from './src/screens/KisaZikirlerScreen';
import ZikirDetayScreen from './src/screens/ZikirDetayScreen';
import AnlikZikirScreen from './src/screens/AnlikZikirScreen';
import AksamScreen from './src/screens/AksamScreen';
import TumVakitlerScreen from './src/screens/TumVakitlerScreen';
import GecmisScreen from './src/screens/GecmisScreen';
import AyarlarScreen from './src/screens/AyarlarScreen';
import HakkindaScreen from './src/screens/HakkindaScreen';

import { colors } from './src/constants/colors';
import { getDb } from './src/db/db';

const Stack = createNativeStackNavigator();

export default function App() {
  const [hazir, setHazir] = useState(false);
  const [baslangic, setBaslangic] = useState('OnboardingName');

  useEffect(() => {
    (async () => {
      try {
        try { await getDb(); } catch (e) {}
        const userName = await AsyncStorage.getItem('userName');
        setBaslangic(userName ? 'AnaEkran' : 'OnboardingName');
      } catch {
        setBaslangic('OnboardingName');
      } finally {
        setHazir(true);
      }
    })();
  }, []);

  if (!hazir) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashHu}>Hu</Text>
        <Text style={styles.splashArapca}>هُو</Text>
        <ActivityIndicator color={colors.altin} style={{ marginTop: 18 }} />
        <Text style={styles.splashAlt}>Manevi rutinin</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={baslangic}
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="OnboardingName" component={OnboardingNameScreen} />
          <Stack.Screen name="OnboardingLocation" component={OnboardingLocationScreen} />
          <Stack.Screen name="OnboardingNotification" component={OnboardingNotificationScreen} />
          <Stack.Screen name="OnboardingEsma" component={OnboardingEsmaScreen} />
          <Stack.Screen name="AnaEkran" component={AnaEkran} />
          <Stack.Screen name="ZikirSayac" component={ZikirSayacScreen} />
          <Stack.Screen name="EsmaDetay" component={EsmaDetayScreen} />
          <Stack.Screen name="EsmaListesi" component={EsmalarListScreen} />
          <Stack.Screen name="EsmaIstatistik" component={EsmaIstatistikScreen} />
          <Stack.Screen name="KisaZikirler" component={KisaZikirlerScreen} />
          <Stack.Screen name="ZikirDetay" component={ZikirDetayScreen} />
          <Stack.Screen name="AnlikZikir" component={AnlikZikirScreen} />
          <Stack.Screen name="Aksam" component={AksamScreen} />
          <Stack.Screen name="TumVakitler" component={TumVakitlerScreen} />
          <Stack.Screen name="Gecmis" component={GecmisScreen} />
          <Stack.Screen name="Ayarlar" component={AyarlarScreen} />
          <Stack.Screen name="Hakkinda" component={HakkindaScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.krem,
  },
  splashHu: { fontSize: 80, color: colors.altin, fontWeight: '300' },
  splashArapca: { fontSize: 48, color: colors.anaMetin, marginTop: 4 },
  splashAlt: {
    marginTop: 28,
    fontSize: 12,
    color: colors.ikincilMetin,
    fontStyle: 'italic',
  },
});
