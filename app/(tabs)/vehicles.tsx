import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, Platform, Modal, TextInput, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Car, Calendar, Fuel, Settings, ChevronRight, MoveVertical as MoreVertical, X, Save, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { getVehicles, addVehicle } from '../../utils/storage';

export default function VehiclesScreen() {
  const router = useRouter();
  const [vehicles, setVehiclesState] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load vehicles from storage
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setIsLoading(true);
        const loadedVehicles = await getVehicles();
        if (loadedVehicles) {
          setVehiclesState(loadedVehicles);
        }
      } catch (error) {
        console.error('Error loading vehicles:', error);
        Alert.alert('Fehler', 'Beim Laden der Fahrzeuge ist ein Fehler aufgetreten.');
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicles();
  }, []);

  // Refresh vehicles when returning from vehicle detail screen
  useFocusEffect(
    React.useCallback(() => {
      const loadVehicles = async () => {
        try {
          const loadedVehicles = await getVehicles();
          if (loadedVehicles) {
            setVehiclesState(loadedVehicles);
          }
        } catch (error) {
          console.error('Error refreshing vehicles:', error);
        }
      };
      loadVehicles();
    }, [])
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicleImage, setNewVehicleImage] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    year: '',
    licensePlate: '',
    mileage: '',
    nextInspection: '',
    fuelLevel: '50',
    isActive: true,
    image: ''
  });

  const navigateToVehicle = (id) => {
    router.push(`/(tabs)/vehicle?id=${id}`);
  };

  const handleAddVehicle = async () => {
    setShowAddModal(true);
  };

  const handleChangeVehicleImage = async () => {
    try {
      // Request permission to access the photo library
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Fehler', 'Wir benötigen die Berechtigung, um auf Ihre Fotos zuzugreifen.');
          return;
        }
      }

      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewVehicle({
          ...newVehicle,
          image: result.assets[0].uri
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Fehler', 'Beim Auswählen des Bildes ist ein Fehler aufgetreten.');
    }
  };

  const saveNewVehicle = async () => {
    console.log('saveNewVehicle called');
    console.log('Current vehicle data:', newVehicle);

    // Validate required fields
    if (!newVehicle.name || !newVehicle.year || !newVehicle.licensePlate || !newVehicle.mileage) {
      console.log('Validation failed - missing fields:', {
        name: newVehicle.name,
        year: newVehicle.year,
        licensePlate: newVehicle.licensePlate,
        mileage: newVehicle.mileage
      });
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    // Validate numeric inputs
    const year = parseInt(newVehicle.year);
    const mileage = parseInt(newVehicle.mileage);
    const fuelLevel = parseInt(newVehicle.fuelLevel);

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      Alert.alert('Fehler', 'Bitte geben Sie ein gültiges Baujahr ein.');
      return;
    }

    if (isNaN(mileage) || mileage < 0) {
      Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Kilometerstand ein.');
      return;
    }

    if (isNaN(fuelLevel) || fuelLevel < 0 || fuelLevel > 100) {
      Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Tankfüllstand (0-100%) ein.');
      return;
    }

    console.log('Validation passed, adding vehicle...');

    try {
      // Create a new vehicle (normalized to UI format, addVehicle handles Supabase conversion)
      const vehicleToAdd = {
        name: newVehicle.name,
        year: year,
        licensePlate: newVehicle.licensePlate,
        mileage: mileage,
        nextInspection: newVehicle.nextInspection || '01.01.2026',
        fuelLevel: fuelLevel,
        isActive: newVehicle.isActive,
        image: newVehicle.image,
        vin: '',
        purchaseDate: '',
        purchasePrice: 0,
        engine: '',
        power: '',
        displacement: '',
        transmission: '',
        color: '',
        interior: '',
        insurance: {
          company: '',
          policyNumber: '',
          expiryDate: '',
          cost: '',
        },
        additionalImages: [],
        notes: '',
        documents: [],
        history: [],
        isSeasonal: false,
        seasonStart: '01.04',
        seasonEnd: '31.10',
      };

      console.log('Vehicle data to add:', vehicleToAdd);

      // Add vehicle to database
      const savedVehicle = await addVehicle(vehicleToAdd);

      console.log('Vehicle saved successfully:', savedVehicle);

      // Update local state
      const updatedVehicles = [...vehicles, savedVehicle];
      setVehiclesState(updatedVehicles);

      // Reset form and close modal
      resetNewVehicle();
      setShowAddModal(false);

      Alert.alert('Erfolg', 'Fahrzeug wurde erfolgreich hinzugefügt.');

      // Navigate to the new vehicle's details page
      setTimeout(() => {
        navigateToVehicle(savedVehicle.id);
      }, 500);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Fehler', 'Beim Hinzufügen des Fahrzeugs ist ein Fehler aufgetreten: ' + (error.message || JSON.stringify(error)));
    }
  };

  const resetNewVehicle = () => {
    setNewVehicle({
      name: '',
      year: '',
      licensePlate: '',
      mileage: '',
      nextInspection: '',
      fuelLevel: '50',
      isActive: true,
      image: ''
    });
  };

  const renderVehicleItem = ({ item }) => {
    const isActive = item.is_active ?? item.isActive ?? true;
    const imageUrl = item.image_url || item.image;
    const licensePlate = item.license_plate || item.licensePlate;
    const nextInspection = item.next_inspection || item.nextInspection;
    const fuelLevel = item.fuel_level ?? item.fuelLevel ?? 0;

    return (
      <TouchableOpacity
        style={[styles.vehicleCard, !isActive && styles.inactiveVehicleCard]}
        onPress={() => navigateToVehicle(item.id)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={[styles.vehicleImage, !isActive && styles.inactiveVehicleImage]} resizeMode="cover" />
        ) : (
          <View style={styles.vehicleImagePlaceholder}>
            <Car size={40} color="#8B4513" />
            <Text style={styles.vehicleImagePlaceholderText}>Kein Bild verfügbar</Text>
          </View>
        )}

        <View style={[styles.vehicleInfo, !isActive && styles.inactiveVehicleInfo]}>
          <View style={styles.vehicleHeader}>
            <View>
              <Text style={[styles.vehicleName, !isActive && styles.inactiveVehicleName]}>{item.name}</Text>
              <Text style={styles.vehicleYear}>{item.year || 'N/A'}</Text>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <MoreVertical color="#666" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.vehicleDetails}>
            <View style={styles.detailItem}>
              <Car size={16} color="#666" />
              <Text style={styles.detailText}>{licensePlate || 'N/A'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Calendar size={16} color="#666" />
              <Text style={styles.detailText}>TÜV: {nextInspection || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.vehicleFooter}>
            <View style={styles.mileageContainer}>
              <Text style={styles.mileageLabel}>Kilometerstand</Text>
              <Text style={styles.mileageValue}>{item.mileage || 0} km</Text>
            </View>

            <View style={styles.fuelContainer}>
              <Text style={styles.fuelLabel}>Tankfüllung</Text>
              <View style={styles.fuelBarContainer}>
                <View style={[styles.fuelBar, { width: `${fuelLevel}%` }]} />
                <Text style={styles.fuelText}>{fuelLevel}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Text style={styles.viewDetailsText}>Details anzeigen</Text>
            <ChevronRight size={20} color="#8B4513" />
          </View>
        </View>

        {!isActive && (
          <View style={styles.inactiveOverlay}>
            <Text style={styles.inactiveOverlayText}>Inaktiv</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Meine Fahrzeuge</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddVehicle}
          >
            <Plus color="#FFF" size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Lade Fahrzeuge...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meine Fahrzeuge</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddVehicle}
        >
          <Plus color="#FFF" size={24} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.vehiclesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Vehicle Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          resetNewVehicle();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Neues Fahrzeug hinzufügen</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetNewVehicle();
                }}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.imageContainer}>
                {newVehicle.image ? (
                  <Image source={{ uri: newVehicle.image }} style={styles.vehicleImagePreview} />
                ) : (
                  <View style={styles.vehicleImagePlaceholder}>
                    <Car size={40} color="#8B4513" />
                    <Text style={styles.vehicleImagePlaceholderText}>Kein Bild verfügbar</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.changeImageButton}
                  onPress={handleChangeVehicleImage}
                >
                  <Camera color="#FFF" size={20} />
                  <Text style={styles.changeImageText}>Bild ändern</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fahrzeugname*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="z.B. Mercedes-Benz 280 SL"
                  value={newVehicle.name}
                  onChangeText={(text) => setNewVehicle({...newVehicle, name: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Baujahr*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="z.B. 1969"
                  value={newVehicle.year}
                  onChangeText={(text) => setNewVehicle({...newVehicle, year: text})}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kennzeichen*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="z.B. M-OT 280"
                  value={newVehicle.licensePlate}
                  onChangeText={(text) => setNewVehicle({...newVehicle, licensePlate: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kilometerstand*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="z.B. 78432"
                  value={newVehicle.mileage}
                  onChangeText={(text) => setNewVehicle({...newVehicle, mileage: text})}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nächster TÜV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD.MM.YYYY"
                  value={newVehicle.nextInspection}
                  onChangeText={(text) => setNewVehicle({...newVehicle, nextInspection: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tankfüllung (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="z.B. 75"
                  value={newVehicle.fuelLevel}
                  onChangeText={(text) => setNewVehicle({...newVehicle, fuelLevel: text})}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>Aktiv</Text>
                  <TouchableOpacity 
                    style={[
                      styles.statusButton, 
                      newVehicle.isActive ? styles.statusButtonActive : styles.statusButtonInactive
                    ]}
                    onPress={() => setNewVehicle({...newVehicle, isActive: !newVehicle.isActive})}
                  >
                    <Text style={[
                      styles.statusButtonText, 
                      newVehicle.isActive ? styles.statusButtonTextActive : styles.statusButtonTextInactive
                    ]}>
                      {newVehicle.isActive ? 'Ja' : 'Nein'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.saveButton}
                onPress={() => {
                  console.log('Save button pressed');
                  saveNewVehicle();
                }}
              >
                <Save color="#FFF" size={20} />
                <Text style={styles.saveButtonText}>Fahrzeug speichern</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  vehiclesList: {
    padding: 16,
  },
  vehicleCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  inactiveVehicleCard: {
    backgroundColor: '#E8E8E8',
    opacity: 0.65,
  },
  vehicleImage: {
    width: '100%',
    height: 160,
  },
  inactiveVehicleImage: {
    opacity: 0.5,
  },
  vehicleImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleImagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  vehicleInfo: {
    padding: 16,
  },
  inactiveVehicleInfo: {
    backgroundColor: '#F9F9F9',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleName: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
  },
  inactiveVehicleName: {
    color: '#999',
  },
  vehicleYear: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
    marginTop: 2,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginLeft: 6,
  },
  vehicleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mileageContainer: {
    flex: 1,
    marginRight: 12,
  },
  mileageLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#999',
    marginBottom: 4,
  },
  mileageValue: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
  },
  fuelContainer: {
    flex: 1,
  },
  fuelLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#999',
    marginBottom: 4,
  },
  fuelBarContainer: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  fuelBar: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 10,
  },
  fuelText: {
    position: 'absolute',
    right: 8,
    top: 1,
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
    color: '#FFF',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#8B4513',
    marginRight: 4,
  },
  inactiveOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,69,58,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  inactiveOverlayText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  vehicleImagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  vehicleImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleImagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeImageText: {
    color: '#FFF',
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginLeft: 6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusButtonActive: {
    backgroundColor: '#8B4513',
  },
  statusButtonInactive: {
    backgroundColor: '#E0E0E0',
  },
  statusButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
  statusButtonTextActive: {
    color: '#FFF',
  },
  statusButtonTextInactive: {
    color: '#666',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B4513',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#FFF',
    marginLeft: 8,
  },
});