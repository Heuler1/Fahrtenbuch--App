import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabaseClient';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react-native';

export default function SignInScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Fehler', 'Bitte geben Sie E-Mail und Passwort ein.');
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Sign in error:', error);
        Alert.alert('Anmeldung fehlgeschlagen', error.message);
        return;
      }

      if (data.user) {
        console.log('Sign in successful');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError('');

    if (!formData.email || !formData.password || !formData.name) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting sign up process...');
      console.log('Email:', formData.email);

      // Test connection first
      try {
        const { data: testData, error: testError } = await supabase.auth.getSession();
        console.log('Connection test:', { testData, testError });
      } catch (testErr) {
        console.error('Connection test failed:', testErr);
      }

      // Try to sign up
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        }
      });

      console.log('Sign up response:', { data, error });

      if (error) {
        console.error('Sign up error:', error);
        setError(`Registrierung fehlgeschlagen: ${error.message || error.toString()}`);
        return;
      }

      if (data?.user) {
        console.log('Sign up successful, user:', data.user);
        console.log('Session:', data.session);

        // Create user profile in database
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: data.user.id,
              name: formData.name,
              phone: '',
              image_url: ''
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
          } else {
            console.log('Profile created successfully');
          }
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
        }

        // Check if email confirmation is required
        if (data.session) {
          // User is signed in immediately
          console.log('User signed in, redirecting to tabs...');
          router.replace('/(tabs)');
        } else {
          // Email confirmation required
          setError('Konto erstellt! Bitte bestätigen Sie Ihre E-Mail-Adresse. (Für diese Demo können Sie sich direkt anmelden)');
          // For demo purposes, try to sign in anyway
          setTimeout(() => {
            setIsSignUp(false);
            setError('');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error during sign up:', error);
      const errorMessage = error instanceof Error ? error.message : 'Netzwerkfehler';
      setError(`Ein unerwarteter Fehler ist aufgetreten: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    });
    setError('');
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isSignUp ? 'Konto erstellen' : 'Willkommen zurück'}
        </Text>
        <Text style={styles.subtitle}>
          {isSignUp 
            ? 'Erstellen Sie Ihr Konto für das Oldtimer Fahrtenbuch' 
            : 'Melden Sie sich in Ihrem Konto an'
          }
        </Text>
      </View>

      <View style={styles.form}>
        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={20} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {isSignUp && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ihr vollständiger Name"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                autoCapitalize="words"
              />
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>E-Mail</Text>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ihre.email@beispiel.de"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Passwort</Text>
          <View style={styles.inputContainer}>
            <Lock size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ihr Passwort"
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#666" />
              ) : (
                <Eye size={20} color="#666" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isSignUp && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Passwort bestätigen</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Passwort wiederholen"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={isSignUp ? handleSignUp : handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isSignUp ? 'Konto erstellen' : 'Anmelden'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>
            {isSignUp ? 'Haben Sie bereits ein Konto?' : 'Noch kein Konto?'}
          </Text>
          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.switchLink}>
              {isSignUp ? 'Anmelden' : 'Registrieren'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Ihre Daten werden sicher in der Cloud gespeichert und zwischen Ihren Geräten synchronisiert.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
  },
  eyeButton: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#FFF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginRight: 8,
  },
  switchLink: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#8B4513',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#DC2626',
    lineHeight: 20,
  },
});