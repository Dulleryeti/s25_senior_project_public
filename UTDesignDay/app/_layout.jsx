import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from "@/context/authContext";
import {View, ActivityIndicator} from 'react-native';
import { useAuth } from "@/context/authContext";
import Toast from 'react-native-toast-message';
import * as Updates from 'expo-updates';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// fade splash screen animation
SplashScreen.setOptions({
  fadeDuration: 400,
  fade: true
})

export default function RootLayout() {
  // const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    BisonBold: require('../assets/fonts/Bison-Bold.ttf'),
    AltivoRegular: require('../assets/fonts/Altivo-Regular.otf'),
    AltivoMedium: require('../assets/fonts/Altivo-Medium.otf'),
  });

  // detects if an app has an update if it does then reload the app. This is to prevent having to do new builds.
  useEffect(() => {
    async function checkUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();

          //should reload thee app if it has a new update
          await Updates.reloadAsync(); 
        } else {
          await SplashScreen.hideAsync(); 
        }
      } catch (e) {
        console.log("Update check failed:", e);
        await SplashScreen.hideAsync(); 
      }
    }

    if (loaded) {
      checkUpdate();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor='#003058'  />

      <AuthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false}} />
          <Stack.Screen name="(events)" options={{headerShown: false}} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <Toast />
      </AuthProvider>
    </>

  );
}
