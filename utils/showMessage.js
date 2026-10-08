import { Alert, Platform } from 'react-native';
export function showMessage(title, message) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export const errorMessage = error => error?.message || 'Die Änderung konnte nicht gespeichert werden. Bitte neu laden.';
