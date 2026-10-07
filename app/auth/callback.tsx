import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

// This file is no longer needed for email auth, but keeping it for potential future use
export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign in since we're not using OAuth anymore
    router.replace('/auth/signIn');
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Weiterleitung...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  text: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
});