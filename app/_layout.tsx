import { useEffect } from 'react';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SplashScreen } from 'expo-router';
import { Platform } from 'react-native';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.frameworkReady?.();
      }
    }
  }, [fontsLoaded, fontError]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setTimeout(() => {
          if (!session) {
            // No session, redirect to sign in
            router.replace('/auth/signIn');
          }
          setInitialAuthCheckComplete(true);
        }, 0);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setTimeout(() => {
          router.replace('/auth/signIn');
          setInitialAuthCheckComplete(true);
        }, 0);
      }
    };

    if (fontsLoaded || fontError) {
      checkAuth();
    }
  }, [fontsLoaded, fontError, router]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (initialAuthCheckComplete) {
        setTimeout(() => {
          if (event === 'SIGNED_IN' && session) {
            router.replace('/(tabs)');
          } else if (event === 'SIGNED_OUT' || !session) {
            router.replace('/auth/signIn');
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, initialAuthCheckComplete]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/signIn" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}