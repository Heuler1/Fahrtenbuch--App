import { validFuel, fuelMetrics, averageConsumption, dateValue } from '../../utils/metrics';
import { useFocusEffect } from 'expo-router';
import VehicleSelect from '../../components/VehicleSelect';
import { useRecordVehicles } from '../../hooks/useRecordVehicles';
import { showMessage, errorMessage } from '../../utils/showMessage';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { Plus, Calendar, Compass as GasPump, Banknote, TrendingUp, ChevronRight, MapPin, X, Save, Trash2, CreditCard as Edit, Camera, ChevronDown, ChevronUp, FileText } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import ConsumptionChart from '../../components/ConsumptionChart';
import { getFuelEntries, addFuelEntry, updateFuelEntry, deleteFuelEntry, getTodayFormatted } from '../../utils/storage';

export default function FuelScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentFuelEntry, setCurrentFuelEntry] = useState(null);
  const [showConsumptionChart, setShowConsumptionChart] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newFuelEntry, setNewFuelEntry] = useState({
    date: getTodayFormatted(),
    station: '',
    location: '',
    amount: '',
    price: '',
    mileage: '',
    receiptImage: ''
  });
  
  const [allFuelEntries, setFuelEntriesState] = useState([]);
  const { vehicles, scope, setScope, newRecordVehicleId, setNewVehicleId, matchesVehicle, vehicleName, isSaving, runMutation } = useRecordVehicles();
  const fuelEntries = fuelMetrics(allFuelEntries).filter(matchesVehicle);

  // Load fuel entries from storage
  useFocusEffect(React.useCallback(() => {
    const loadFuelEntries = async () => {
      try {
        setIsLoading(true);
        const entries = await getFuelEntries();
        if (entries) {
          // Sort by date (newest first)
          const sortedEntries = entries.sort((a, b) => {
            const dateA = a.date.split('.').reverse().join('');
            const dateB = b.date.split('.').reverse().join('');
            return dateB.localeCompare(dateA);
          });
          setFuelEntriesState(sortedEntries);
        }
      } catch (error) {
        console.error('Error loading fuel entries:', error);
        showMessage('Fehler', errorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    loadFuelEntries();
  }, []));

  const handleAddFuelEntry = () => runMutation(async () => {
    // Validate required fields
    if (!newFuelEntry.date || !newFuelEntry.station || !newFuelEntry.amount || !newFuelEntry.price || !newFuelEntry.mileage) {
      showMessage('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      const { amount, price, mileage, totalCost } = validFuel(newFuelEntry);
      const fuelEntryToAdd = {
        vehicleId: newRecordVehicleId,
        date: newFuelEntry.date,
        station: newFuelEntry.station,
        location: newFuelEntry.location || 'Keine Angabe',
        amount: amount,
        price: price,
        totalCost: totalCost,
        mileage: mileage,
        consumption: 0,
        receiptImage: newFuelEntry.receiptImage
      };

      const saved = await addFuelEntry(fuelEntryToAdd);
      setFuelEntriesState(previous => [saved, ...previous]);
      
      setShowAddModal(false);
      resetNewFuelEntry();
      
      showMessage('Erfolg', 'Tankstopp wurde erfolgreich hinzugefügt.');
    } catch (error) {
      console.error('Error adding fuel entry:', error);
      showMessage('Fehler', errorMessage(error));
    }
  });

  const handleEditFuelEntry = () => runMutation(async () => {
    // Validate required fields
    if (!currentFuelEntry.date || !currentFuelEntry.station || !currentFuelEntry.amount || !currentFuelEntry.price || (currentFuelEntry.mileage === null || currentFuelEntry.mileage === undefined || currentFuelEntry.mileage === '')) {
      showMessage('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      const { amount, price, mileage, totalCost } = validFuel(currentFuelEntry);
      const updatedEntry = {
        ...currentFuelEntry,
        amount: amount,
        price: price,
        totalCost: totalCost,
        mileage: mileage,
        consumption: 0,
        location: currentFuelEntry.location || 'Keine Angabe'
      };

      const saved = await updateFuelEntry(updatedEntry);
      setFuelEntriesState(previous => previous.map(entry => entry.id === saved.id ? saved : entry));
      
      setShowEditModal(false);
      setCurrentFuelEntry(null);
      
      showMessage('Erfolg', 'Tankstopp wurde erfolgreich aktualisiert.');
    } catch (error) {
      console.error('Error editing fuel entry:', error);
      showMessage('Fehler', errorMessage(error));
    }
  });

  const handleDeleteFuelEntry = () => runMutation(async () => {
    if (!currentFuelEntry) return;
    
    try {
      await deleteFuelEntry(currentFuelEntry);
      setFuelEntriesState(previous => previous.filter(entry => entry.id !== currentFuelEntry.id));
      
      setShowDeleteModal(false);
      setCurrentFuelEntry(null);
      
      showMessage('Erfolg', 'Tankstopp wurde erfolgreich gelöscht.');
    } catch (error) {
      console.error('Error deleting fuel entry:', error);
      showMessage('Fehler', errorMessage(error));
    }
  });

  const resetNewFuelEntry = () => {
    setNewFuelEntry({
      date: getTodayFormatted(),
      station: '',
      location: '',
      amount: '',
      price: '',
      mileage: '',
      receiptImage: ''
    });
  };

  const openEditModal = (entry) => {
    setCurrentFuelEntry({...entry});
    setShowEditModal(true);
  };

  const openDeleteModal = (entry) => {
    setCurrentFuelEntry(entry);
    setShowDeleteModal(true);
  };

  const handleChangeReceiptImage = async (isEdit = false) => {
    // Request permission to access the photo library
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showMessage('Fehler', 'Wir benötigen die Berechtigung, um auf Ihre Fotos zuzugreifen.');
        return;
      }
    }

    // Launch the image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (isEdit) {
        setCurrentFuelEntry({
          ...currentFuelEntry,
          receiptImage: result.assets[0].uri
        });
      } else {
        setNewFuelEntry({
          ...newFuelEntry,
          receiptImage: result.assets[0].uri
        });
      }
    }
  };

  const renderFuelItem = ({ item }) => (
    <TouchableOpacity style={styles.fuelItem} onPress={() => openEditModal(item)}>
      <Text style={{ color: '#666', padding: 8 }}>{vehicleName(item)}</Text>
      <View style={styles.fuelHeader}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#666" />
          <Text style={styles.fuelDate}>{item.date}</Text>
        </View>
        <View style={styles.stationContainer}>
          <Text style={styles.stationName}>{item.station}</Text>
        </View>
      </View>
      
      <View style={styles.fuelDetails}>
        <View style={styles.fuelMainInfo}>
          <View style={styles.fuelInfoItem}>
            <GasPump size={18} color="#8B4513" />
            <Text style={styles.fuelInfoValue}>{(item.amount || 0).toFixed(1)} L</Text>
          </View>
          
          <View style={styles.fuelInfoItem}>
            <Banknote size={18} color="#8B4513" />
            <Text style={styles.fuelInfoValue}>{(item.totalCost || 0).toFixed(2)} €</Text>
          </View>
          
          <View style={styles.fuelInfoItem}>
            <TrendingUp size={18} color="#8B4513" />
            <Text style={styles.fuelInfoValue}>{(item.consumption === null ? '–' : item.consumption.toFixed(1))} L/100km</Text>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <MapPin size={14} color="#666" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        
        <View style={styles.fuelSecondaryInfo}>
          <View style={styles.secondaryInfoItem}>
            <Text style={styles.secondaryInfoLabel}>Preis/L</Text>
            <Text style={styles.secondaryInfoValue}>{(item.price || 0).toFixed(2)} €</Text>
          </View>
          
          <View style={styles.secondaryInfoItem}>
            <Text style={styles.secondaryInfoLabel}>Kilometerstand</Text>
            <Text style={styles.secondaryInfoValue}>{item.mileage || 0} km</Text>
          </View>
        </View>
      </View>
      
      {item.receiptImage && (
        <View style={styles.receiptContainer}>
          <Image 
            source={{ uri: item.receiptImage }} 
            style={styles.receiptImage}
            resizeMode="cover"
          />
          <View style={styles.receiptInfo}>
            <Text style={styles.receiptLabel}>Rechnung</Text>
            <TouchableOpacity style={styles.viewReceiptButton}>
              <FileText size={14} color="#8B4513" />
              <Text style={styles.viewReceiptText}>Anzeigen</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <View style={styles.fuelFooter}>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Edit size={16} color="#8B4513" />
            <Text style={styles.editButtonText}>Bearbeiten</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            disabled={isSaving}
                style={styles.deleteButton}
            onPress={() => openDeleteModal(item)}
          >
            <Trash2 size={16} color="#D32F2F" />
            <Text style={styles.deleteButtonText}>Löschen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFuelForm = (isEdit = false) => {
    const fuelData = isEdit ? currentFuelEntry : newFuelEntry;
    const setFuelData = isEdit 
      ? (data) => setCurrentFuelEntry({...currentFuelEntry, ...data}) 
      : (data) => setNewFuelEntry({...newFuelEntry, ...data});

    return (
      <>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Datum*</Text>
          <TextInput
            style={styles.input}
            placeholder="DD.MM.YYYY"
            value={fuelData.date}
            onChangeText={(text) => setFuelData({date: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tankstelle*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. Aral, Shell, Esso"
            value={fuelData.station}
            onChangeText={(text) => setFuelData({station: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ort</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. München"
            value={fuelData.location}
            onChangeText={(text) => setFuelData({location: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Getankte Menge (Liter)*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. 45.5"
            value={fuelData.amount.toString()}
            onChangeText={(text) => setFuelData({amount: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Preis pro Liter (€)*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. 2.15"
            value={fuelData.price.toString()}
            onChangeText={(text) => setFuelData({price: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kilometerstand*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. 78432"
            value={fuelData.mileage.toString()}
            onChangeText={(text) => setFuelData({mileage: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Quittung</Text>
          <View style={styles.receiptImageContainer}>
            {fuelData.receiptImage ? (
              <Image 
                source={{ uri: fuelData.receiptImage }} 
                style={styles.receiptImagePreview} 
              />
            ) : (
              <View style={[styles.receiptImagePreview, styles.receiptImagePlaceholder]}>
                <Camera color="#CCC" size={32} />
                <Text style={styles.noReceiptText}>Kein Foto</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.changeReceiptButton}
              onPress={() => handleChangeReceiptImage(isEdit)}
            >
              <Camera color="#FFF" size={20} />
              <Text style={styles.changeReceiptText}>Bild ändern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  // Calculate statistics
  const totalCost = fuelEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
  const totalFuel = fuelEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const avgConsumption = averageConsumption(fuelEntries);
  const consumptionEntries = fuelEntries.filter(entry => entry.consumption !== null).sort((a,b) => dateValue(a.date) - dateValue(b.date)).slice(-6);
  const consumptionData = { labels: consumptionEntries.map(entry => entry.date), datasets: [{ data: consumptionEntries.map(entry => Math.round(entry.consumption * 100) / 100) }] };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Lade Tankstopps...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{ padding: 12, color: '#666' }}>Verbrauch ist ein Schätzwert zwischen Tankstopps desselben Fahrzeugs. Nur bei vergleichbarem Tankfüllstand aussagekräftig; der erste Tankstopp hat keinen Verbrauchswert.</Text>
      <VehicleSelect vehicles={vehicles} value={scope} onChange={setScope} filter disabled={isSaving} />
      {isSaving ? <Text accessibilityLiveRegion="polite" style={{ padding: 8 }}>Speichert …</Text> : null}

      <View style={styles.header}>
        <Text style={styles.title}>Tankstopps</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus color="#FFF" size={24} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCost.toFixed(2)} €</Text>
          <Text style={styles.statLabel}>Gesamtkosten</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalFuel.toFixed(1)} L</Text>
          <Text style={styles.statLabel}>Getankt</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{(avgConsumption === null ? '–' : avgConsumption.toFixed(1))}</Text>
          <Text style={styles.statLabel}>Ø L/100km</Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Verbrauchstrend</Text>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setShowConsumptionChart(!showConsumptionChart)}
          >
            {showConsumptionChart ? (
              <ChevronUp size={20} color="#8B4513" />
            ) : (
              <ChevronDown size={20} color="#8B4513" />
            )}
          </TouchableOpacity>
        </View>
        {showConsumptionChart && fuelEntries.length > 0 && <ConsumptionChart data={consumptionData} />}
        {showConsumptionChart && fuelEntries.length === 0 && (
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>Keine Daten verfügbar</Text>
          </View>
        )}
      </View>
      
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Letzte Tankstopps</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>Alle anzeigen</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={fuelEntries}
        renderItem={renderFuelItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.fuelList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Keine Tankstopps vorhanden</Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyAddButtonText}>Tankstopp hinzufügen</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Fuel Entry Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { if (!isSaving) setShowAddModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Neuen Tankstopp hinzufügen</Text>
              <TouchableOpacity 
                disabled={isSaving}
                style={styles.closeButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetNewFuelEntry();
                }}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              {isSaving ? <Text accessibilityLiveRegion="polite" style={{ padding: 12 }}>Speichert …</Text> : null}

              <VehicleSelect vehicles={vehicles} value={newRecordVehicleId} onChange={setNewVehicleId} disabled={isSaving} />
              {renderFuelForm(false)}

              <TouchableOpacity 
                disabled={isSaving}
                style={[styles.saveButton, isSaving && { opacity: 0.5 }]}
                onPress={handleAddFuelEntry}
              >
                <Save color="#FFF" size={20} />
                <Text style={styles.saveButtonText}>Tankstopp speichern</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Fuel Entry Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { if (!isSaving) setShowEditModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tankstopp bearbeiten</Text>
              <TouchableOpacity 
                disabled={isSaving}
                style={styles.closeButton}
                onPress={() => {
                  setShowEditModal(false);
                  setCurrentFuelEntry(null);
                }}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              {isSaving ? <Text accessibilityLiveRegion="polite" style={{ padding: 12 }}>Speichert …</Text> : null}

              <VehicleSelect vehicles={vehicles} value={currentFuelEntry?.vehicleId} onChange={vehicleId => setCurrentFuelEntry({...currentFuelEntry, vehicleId})} disabled={isSaving} />
              {currentFuelEntry && renderFuelForm(true)}

              <TouchableOpacity 
                disabled={isSaving}
                style={[styles.saveButton, isSaving && { opacity: 0.5 }]}
                onPress={handleEditFuelEntry}
              >
                <Save color="#FFF" size={20} />
                <Text style={styles.saveButtonText}>Änderungen speichern</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { if (!isSaving) setShowDeleteModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <GasPump color="#D32F2F" size={24} />
              <Text style={styles.confirmModalTitle}>Tankstopp löschen</Text>
            </View>
            
            <Text style={styles.confirmModalText}>
              Möchten Sie diesen Tankstopp wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </Text>
            
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setCurrentFuelEntry(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmDeleteButton]}
                onPress={handleDeleteFuelEntry}
              >
                <Text style={styles.confirmDeleteButtonText}>Löschen</Text>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
    marginBottom: 16,
  },
  emptyAddButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#FFF',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#999',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#8B4513',
  },
  fuelList: {
    padding: 16,
    paddingTop: 8,
  },
  fuelItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fuelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fuelDate: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    marginLeft: 6,
  },
  stationContainer: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stationName: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
  },
  fuelDetails: {
    marginBottom: 12,
  },
  fuelMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fuelInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fuelInfoValue: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    marginLeft: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginLeft: 6,
  },
  fuelSecondaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryInfoItem: {
    flex: 1,
  },
  secondaryInfoLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#999',
    marginBottom: 2,
  },
  secondaryInfoValue: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
  },
  receiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  receiptImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  receiptInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  viewReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewReceiptText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#8B4513',
    marginLeft: 4,
  },
  fuelFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#8B4513',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#D32F2F',
    marginLeft: 4,
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
    maxHeight: '80%',
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
  receiptImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 8,
  },
  receiptImagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  receiptImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noReceiptText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#999',
  },
  changeReceiptButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeReceiptText: {
    color: '#FFF',
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginLeft: 6,
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
  // Confirmation modal styles
  confirmModalContainer: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
    marginLeft: 12,
  },
  confirmModalText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confirmModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  confirmDeleteButton: {
    backgroundColor: '#D32F2F',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
  },
  confirmDeleteButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#FFF',
  }
});
