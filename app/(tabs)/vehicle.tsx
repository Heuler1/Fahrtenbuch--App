import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, Switch, Modal, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Trash2, CreditCard as Edit, Camera, X, Plus, Car } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { getVehicles, updateVehicle, deleteVehicle } from '../../utils/storage';
import { showMessage, errorMessage } from '../../utils/showMessage';
import { toSupabaseVehicle } from '../../utils/vehicleUtils';

export default function VehicleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [vehicle, setVehicle] = useState(null);
  const writeInProgress = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        setIsLoading(true);
        const vehicles = await getVehicles();

        if (vehicles && params.id) {
          const foundVehicle = vehicles.find(v => String(v.id) === String(params.id));

          if (foundVehicle) {
            setVehicle(foundVehicle);
          } else {
            showMessage('Fehler', 'Fahrzeug nicht gefunden.');
            router.back();
          }
        } else {
          showMessage('Fehler', 'Keine Fahrzeug-ID angegeben.');
          router.back();
        }
      } catch (error) {
        console.error('Error loading vehicle:', error);
        showMessage('Fehler', 'Beim Laden des Fahrzeugs ist ein Fehler aufgetreten.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicle();
  }, [params.id]);

  const handleSave = async () => {
    if (writeInProgress.current) return;
    writeInProgress.current = true;
    setIsSaving(true);
    try {
      const supabaseUpdates = toSupabaseVehicle(vehicle);
      const saved = await updateVehicle(vehicle.id, supabaseUpdates, vehicle.updatedAt);
      setVehicle(saved);
      showMessage('Gespeichert', 'Fahrzeugdaten wurden erfolgreich gespeichert.');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showMessage('Fehler', errorMessage(error));
    } finally {
      writeInProgress.current = false;
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (writeInProgress.current) return;
    writeInProgress.current = true;
    setIsSaving(true);
    try {
      await deleteVehicle(vehicle.id, vehicle.updatedAt);
      setShowDeleteModal(false);
      showMessage('Gelöscht', 'Fahrzeug wurde erfolgreich gelöscht.');
      router.replace('/(tabs)/vehicles');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showMessage('Fehler', errorMessage(error));
      setShowDeleteModal(false);
    } finally {
      writeInProgress.current = false;
      setIsSaving(false);
    }
  };

  const handleChangeMainImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showMessage('Fehler', 'Wir benötigen die Berechtigung, um auf Ihre Fotos zuzugreichen.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVehicle({
          ...vehicle,
          image: result.assets[0].uri
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showMessage('Fehler', 'Beim Auswählen des Bildes ist ein Fehler aufgetreten.');
    }
  };

  const handleAddImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showMessage('Fehler', 'Wir benötigen die Berechtigung, um auf Ihre Fotos zuzugreichen.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVehicle({
          ...vehicle,
          additionalImages: [...(vehicle.additionalImages || []), result.assets[0].uri]
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showMessage('Fehler', 'Beim Auswählen des Bildes ist ein Fehler aufgetreten.');
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...(vehicle.additionalImages || [])];
    updatedImages.splice(index, 1);
    setVehicle({
      ...vehicle,
      additionalImages: updatedImages
    });
  };

  const handleAddDocument = () => {
    const newDocument = { name: 'Neues Dokument', date: '01.08.2024' };
    setVehicle({
      ...vehicle,
      documents: [...(vehicle.documents || []), newDocument]
    });
  };

  const handleRemoveDocument = (index) => {
    const updatedDocuments = [...(vehicle.documents || [])];
    updatedDocuments.splice(index, 1);
    setVehicle({
      ...vehicle,
      documents: updatedDocuments
    });
  };

  const handleAddHistoryEntry = () => {
    const newEntry = { owner: 'Neuer Vorbesitzer', period: '1960-1969' };
    setVehicle({
      ...vehicle,
      history: [...(vehicle.history || []), newEntry]
    });
  };

  const handleRemoveHistoryEntry = (index) => {
    const updatedHistory = [...(vehicle.history || [])];
    updatedHistory.splice(index, 1);
    setVehicle({
      ...vehicle,
      history: updatedHistory
    });
  };

  const toggleActive = (value) => {
    setVehicle({
      ...vehicle,
      isActive: value
    });
  };

  const toggleSeasonal = (value) => {
    setVehicle({
      ...vehicle,
      isSeasonal: value
    });
  };

  const renderField = (label, value, fieldName, keyboardType = 'default') => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={String(value ?? '')}
            onChangeText={(text) => {
              if (fieldName.includes('.')) {
                const [parent, child] = fieldName.split('.');
                setVehicle({
                  ...vehicle,
                  [parent]: {
                    ...vehicle[parent],
                    [child]: text
                  }
                });
              } else {
                setVehicle({...vehicle, [fieldName]: text});
              }
            }}
            keyboardType={keyboardType}
          />
        ) : (
          <Text style={styles.fieldValue}>{value || '—'}</Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#333" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Fahrzeugdetails</Text>
          <View style={styles.actionButton} />
        </View>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Lade Fahrzeugdaten...</Text>
        </View>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#333" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Fahrzeugdetails</Text>
          <View style={styles.actionButton} />
        </View>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Fahrzeug nicht gefunden</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Fahrzeugdetails</Text>
        {isEditing ? (
          <TouchableOpacity disabled={isSaving} onPress={handleSave} style={styles.actionButton}>
            <Save color="#8B4513" size={24} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
            <Edit color="#8B4513" size={24} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          {vehicle.image ? (
            <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} resizeMode="cover" />
          ) : (
            <View style={styles.vehicleImagePlaceholder}>
              <Car size={40} color="#8B4513" />
              <Text style={styles.vehicleImagePlaceholderText}>Kein Bild verfügbar</Text>
            </View>
          )}
          {isEditing && (
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={handleChangeMainImage}
            >
              <Camera color="#FFF" size={20} />
              <Text style={styles.changeImageText}>Bild ändern</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.mainInfo}>
          <View style={styles.nameYearContainer}>
            {isEditing ? (
              <>
                <TextInput
                  style={styles.nameInput}
                  value={vehicle.name}
                  onChangeText={(text) => setVehicle({...vehicle, name: text})}
                />
                <TextInput
                  style={styles.yearInput}
                  value={String(vehicle.year ?? '')}
                  onChangeText={(text) => setVehicle({...vehicle, year: text})}
                  keyboardType="number-pad"
                />
              </>
            ) : (
              <>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleYear}>{vehicle.year}</Text>
              </>
            )}
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Aktiv</Text>
              <Switch
                value={vehicle.isActive}
                onValueChange={(value) => toggleActive(value)}
                trackColor={{ false: '#E0E0E0', true: '#D7CCC8' }}
                thumbColor={vehicle.isActive ? '#8B4513' : '#BDBDBD'}
              />
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Saisonkennzeichen</Text>
              <Switch
                value={vehicle.isSeasonal}
                onValueChange={(value) => toggleSeasonal(value)}
                trackColor={{ false: '#E0E0E0', true: '#D7CCC8' }}
                thumbColor={vehicle.isSeasonal ? '#8B4513' : '#BDBDBD'}
              />
            </View>
          </View>

          {vehicle.isSeasonal && (
            <View style={styles.seasonalContainer}>
              <View style={styles.seasonalItem}>
                <Text style={styles.seasonalLabel}>Saisonbeginn</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.seasonalInput}
                    value={vehicle.seasonStart}
                    onChangeText={(text) => setVehicle({...vehicle, seasonStart: text})}
                  />
                ) : (
                  <Text style={styles.seasonalValue}>{vehicle.seasonStart}</Text>
                )}
              </View>
              <View style={styles.seasonalItem}>
                <Text style={styles.seasonalLabel}>Saisonende</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.seasonalInput}
                    value={vehicle.seasonEnd}
                    onChangeText={(text) => setVehicle({...vehicle, seasonEnd: text})}
                  />
                ) : (
                  <Text style={styles.seasonalValue}>{vehicle.seasonEnd}</Text>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grunddaten</Text>
          {renderField('Kennzeichen', vehicle.licensePlate, 'licensePlate')}
          {renderField('Fahrgestellnummer', vehicle.vin, 'vin')}
          {renderField('Kilometerstand', vehicle.mileage, 'mileage', 'number-pad')}
          {renderField('Nächster TÜV', vehicle.nextInspection, 'nextInspection')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technische Daten</Text>
          {renderField('Motor', vehicle.engine, 'engine')}
          {renderField('Leistung', vehicle.power, 'power')}
          {renderField('Hubraum', vehicle.displacement, 'displacement')}
          {renderField('Getriebe', vehicle.transmission, 'transmission')}
          {renderField('Farbe', vehicle.color, 'color')}
          {renderField('Innenausstattung', vehicle.interior, 'interior')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kaufinformationen</Text>
          {renderField('Kaufdatum', vehicle.purchaseDate, 'purchaseDate')}
          {renderField('Kaufpreis (€)', vehicle.purchasePrice, 'purchasePrice', 'number-pad')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Versicherung</Text>
          {renderField('Versicherung', vehicle.insurance?.company, 'insurance.company')}
          {renderField('Versicherungsnummer', vehicle.insurance?.policyNumber, 'insurance.policyNumber')}
          {renderField('Ablaufdatum', vehicle.insurance?.expiryDate, 'insurance.expiryDate')}
          {renderField('Jahresbeitrag (€)', vehicle.insurance?.cost, 'insurance.cost', 'number-pad')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notizen</Text>
          {isEditing ? (
            <TextInput
              style={styles.notesInput}
              value={vehicle.notes}
              onChangeText={(text) => setVehicle({...vehicle, notes: text})}
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={styles.notesText}>{vehicle.notes || '—'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildergalerie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryContainer}>
            {(vehicle.additionalImages || []).map((image, index) => (
              <View key={index} style={styles.galleryImageContainer}>
                <Image source={{ uri: image }} style={styles.galleryImage} />
                {isEditing && (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <X color="#FFF" size={16} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {isEditing && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleAddImage}
              >
                <Plus color="#8B4513" size={24} />
                <Text style={styles.addImageText}>Bild hinzufügen</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dokumente</Text>
          {(vehicle.documents || []).map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <View style={styles.documentIcon}>
                <Text style={styles.documentIconText}>PDF</Text>
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.name}</Text>
                <Text style={styles.documentDate}>{doc.date}</Text>
              </View>
              {isEditing && (
                <TouchableOpacity
                  style={styles.removeDocButton}
                  onPress={() => handleRemoveDocument(index)}
                >
                  <X color="#666" size={16} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {isEditing && (
            <TouchableOpacity
              style={styles.addDocumentButton}
              onPress={handleAddDocument}
            >
              <Plus color="#8B4513" size={20} />
              <Text style={styles.addDocumentText}>Dokument hinzufügen</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fahrzeughistorie</Text>
          {(vehicle.history || []).map((entry, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyPeriod}>{entry.period}</Text>
              <Text style={styles.historyOwner}>{entry.owner}</Text>
              {isEditing && (
                <TouchableOpacity
                  style={styles.removeHistoryButton}
                  onPress={() => handleRemoveHistoryEntry(index)}
                >
                  <X color="#666" size={16} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {isEditing && (
            <TouchableOpacity
              style={styles.addHistoryButton}
              onPress={handleAddHistoryEntry}
            >
              <Plus color="#8B4513" size={20} />
              <Text style={styles.addHistoryText}>Vorbesitzer hinzufügen</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Trash2 color="#FFF" size={20} />
            <Text style={styles.deleteButtonText}>Fahrzeug löschen</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Zuletzt bearbeitet: {new Date().toLocaleDateString('de-DE')}</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Car color="#8B4513" size={24} />
              <Text style={styles.modalTitle}>Fahrzeug löschen</Text>
            </View>
            <Text style={styles.modalText}>
              Möchten Sie dieses Fahrzeug wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                disabled={isSaving} onPress={handleDelete}
              >
                <Text style={styles.confirmButtonText}>Löschen</Text>
              </TouchableOpacity>
            </View>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: 220,
  },
  vehicleImagePlaceholder: {
    width: '100%',
    height: 220,
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
  mainInfo: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  nameYearContainer: {
    marginBottom: 12,
  },
  vehicleName: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
  },
  vehicleYear: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
    marginTop: 2,
  },
  nameInput: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingVertical: 4,
  },
  yearInput: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingVertical: 4,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
    marginRight: 8,
  },
  seasonalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  seasonalItem: {
    flex: 1,
  },
  seasonalLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginBottom: 4,
  },
  seasonalValue: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
  },
  seasonalInput: {
     fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingVertical: 2,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
  },
  input: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingVertical: 4,
  },
  notesInput: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
    lineHeight: 20,
  },
  galleryContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  galleryImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  galleryImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 120,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  addImageText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#8B4513',
    marginTop: 4,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    color: '#8B4513',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
  },
  documentDate: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginTop: 2,
  },
  removeDocButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  addDocumentText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#8B4513',
    marginLeft: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyPeriod: {
    width: 100,
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
  },
  historyOwner: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
  },
  removeHistoryButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  addHistoryText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#8B4513',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    paddingVertical: 12,
    margin: 16,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#FFF',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
    marginLeft: 12,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  confirmButton: {
    backgroundColor: '#D32F2F',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
  },
  confirmButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
});

