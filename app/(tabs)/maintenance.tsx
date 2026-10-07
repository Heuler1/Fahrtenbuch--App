import { useFocusEffect } from 'expo-router';
import VehicleSelect from '../../components/VehicleSelect';
import { useRecordVehicles } from '../../hooks/useRecordVehicles';
import { showMessage, errorMessage } from '../../utils/showMessage';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { Plus, Calendar, Wrench, Banknote, FileText, ChevronRight, Tag, Clock, X, Save, Trash2, CreditCard as Edit, Camera, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import CostChart from '../../components/CostChart';
import { getMaintenanceEntries, addMaintenanceEntry, updateMaintenanceEntry, deleteMaintenanceEntry, getTodayFormatted } from '../../utils/storage';

export default function MaintenanceScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentMaintenanceEntry, setCurrentMaintenanceEntry] = useState(null);
  const [showCostChart, setShowCostChart] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newMaintenanceEntry, setNewMaintenanceEntry] = useState({
    date: getTodayFormatted(),
    type: 'Wartung',
    title: '',
    workshop: '',
    cost: '',
    mileage: '',
    description: '',
    parts: [],
    newPart: '',
    receiptImage: ''
  });
  
  const [allMaintenanceEntries, setMaintenanceEntriesState] = useState([]);
  const { vehicles, scope, setScope, newRecordVehicleId, setNewVehicleId, matchesVehicle, vehicleName, isSaving, runMutation } = useRecordVehicles();
  const maintenanceEntries = allMaintenanceEntries.filter(matchesVehicle);

  // Load maintenance entries from storage
  useFocusEffect(React.useCallback(() => {
    const loadEntries = async () => {
      try {
        setIsLoading(true);
        const entries = await getMaintenanceEntries();
        if (entries) {
          setMaintenanceEntriesState(entries);
        }
      } catch (error) {
        console.error('Error loading maintenance entries:', error);
        showMessage('Fehler', errorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };
    loadEntries();
  }, []));

  const [selectedType, setSelectedType] = useState('Alle');
  const maintenanceTypes = ['Alle', 'Wartung', 'Reparatur', 'Ersatzteile', 'Zubehör'];

  const handleAddMaintenanceEntry = () => runMutation(async () => {
    // Validate required fields
    if (!newMaintenanceEntry.date || !newMaintenanceEntry.title || !newMaintenanceEntry.cost || !newMaintenanceEntry.mileage) {
      showMessage('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    // Validate numeric inputs
    const cost = parseFloat(newMaintenanceEntry.cost);
    const mileage = parseInt(newMaintenanceEntry.mileage);
    
    if (isNaN(cost) || cost < 0) {
      showMessage('Fehler', 'Bitte geben Sie gültige Kosten ein.');
      return;
    }
    
    if (isNaN(mileage) || mileage < 0) {
      showMessage('Fehler', 'Bitte geben Sie einen gültigen Kilometerstand ein.');
      return;
    }
    const maintenanceEntryToAdd = {
      vehicleId: newRecordVehicleId,
      date: newMaintenanceEntry.date,
      type: newMaintenanceEntry.type,
      title: newMaintenanceEntry.title,
      workshop: newMaintenanceEntry.workshop || 'Keine Angabe',
      cost: cost,
      mileage: mileage,
      description: newMaintenanceEntry.description || 'Keine Beschreibung',
      parts: newMaintenanceEntry.parts,
      receiptImage: newMaintenanceEntry.receiptImage
    };

    try {
      const saved = await addMaintenanceEntry(maintenanceEntryToAdd);
      setMaintenanceEntriesState(previous => [saved, ...previous]);
      setShowAddModal(false);
      resetNewMaintenanceEntry();
      showMessage('Erfolg', 'Eintrag wurde erfolgreich hinzugefügt.');
    } catch (error) {
      console.error('Error adding maintenance entry:', error);
      showMessage('Fehler', errorMessage(error));
    }
  });

  const handleEditMaintenanceEntry = () => runMutation(async () => {
    // Validate required fields
    if (!currentMaintenanceEntry.date || !currentMaintenanceEntry.title || (currentMaintenanceEntry.cost === null || currentMaintenanceEntry.cost === undefined || currentMaintenanceEntry.cost === '') || (currentMaintenanceEntry.mileage === null || currentMaintenanceEntry.mileage === undefined || currentMaintenanceEntry.mileage === '')) {
      showMessage('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    const updatedEntry = {
      ...currentMaintenanceEntry,
      cost: typeof currentMaintenanceEntry.cost === 'string' ? parseFloat(currentMaintenanceEntry.cost) : currentMaintenanceEntry.cost,
      mileage: typeof currentMaintenanceEntry.mileage === 'string' ? parseInt(currentMaintenanceEntry.mileage) : currentMaintenanceEntry.mileage,
      workshop: currentMaintenanceEntry.workshop || 'Keine Angabe',
      description: currentMaintenanceEntry.description || 'Keine Beschreibung'
    };

    try {
      const saved = await updateMaintenanceEntry(updatedEntry);
      setMaintenanceEntriesState(previous => previous.map(entry => entry.id === saved.id ? saved : entry));
      setShowEditModal(false);
      setCurrentMaintenanceEntry(null);
      showMessage('Erfolg', 'Eintrag wurde erfolgreich aktualisiert.');
    } catch (error) {
      console.error('Error editing maintenance entry:', error);
      showMessage('Fehler', errorMessage(error));
    }
  });

  const handleDeleteMaintenanceEntry = () => runMutation(async () => {
    if (!currentMaintenanceEntry) return;
    
    try {
      await deleteMaintenanceEntry(currentMaintenanceEntry);
      setMaintenanceEntriesState(previous => previous.filter(entry => entry.id !== currentMaintenanceEntry.id));
      setShowDeleteModal(false);
      setCurrentMaintenanceEntry(null);
      showMessage('Erfolg', 'Eintrag wurde erfolgreich gelöscht.');
    } catch (error) {
      console.error('Error deleting maintenance entry:', error);
      showMessage('Fehler', errorMessage(error));
    }
  });

  const resetNewMaintenanceEntry = () => {
    setNewMaintenanceEntry({
      date: getTodayFormatted(),
      type: 'Wartung',
      title: '',
      workshop: '',
      cost: '',
      mileage: '',
      description: '',
      parts: [],
      newPart: '',
      receiptImage: ''
    });
  };

  const openEditModal = (entry) => {
    setCurrentMaintenanceEntry({...entry, newPart: ''});
    setShowEditModal(true);
  };

  const openDeleteModal = (entry) => {
    setCurrentMaintenanceEntry(entry);
    setShowDeleteModal(true);
  };

  const handleAddPart = (isEdit = false) => {
    if (isEdit) {
      if (currentMaintenanceEntry.newPart && currentMaintenanceEntry.newPart.trim() !== '') {
        setCurrentMaintenanceEntry({
          ...currentMaintenanceEntry,
          parts: [...currentMaintenanceEntry.parts, currentMaintenanceEntry.newPart.trim()],
          newPart: ''
        });
      }
    } else {
      if (newMaintenanceEntry.newPart && newMaintenanceEntry.newPart.trim() !== '') {
        setNewMaintenanceEntry({
          ...newMaintenanceEntry,
          parts: [...newMaintenanceEntry.parts, newMaintenanceEntry.newPart.trim()],
          newPart: ''
        });
      }
    }
  };

  const handleRemovePart = (index, isEdit = false) => {
    if (isEdit) {
      const updatedParts = [...currentMaintenanceEntry.parts];
      updatedParts.splice(index, 1);
      setCurrentMaintenanceEntry({
        ...currentMaintenanceEntry,
        parts: updatedParts
      });
    } else {
      const updatedParts = [...newMaintenanceEntry.parts];
      updatedParts.splice(index, 1);
      setNewMaintenanceEntry({
        ...newMaintenanceEntry,
        parts: updatedParts
      });
    }
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
        setCurrentMaintenanceEntry({
          ...currentMaintenanceEntry,
          receiptImage: result.assets[0].uri
        });
      } else {
        setNewMaintenanceEntry({
          ...newMaintenanceEntry,
          receiptImage: result.assets[0].uri
        });
      }
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Wartung':
        return '#4CAF50';
      case 'Reparatur':
        return '#F44336';
      case 'Ersatzteile':
        return '#2196F3';
      case 'Zubehör':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  const filteredEntries = maintenanceEntries.filter(entry => {
    return selectedType === 'Alle' || entry.type === selectedType;
  }).sort((a, b) => {
    // Convert dates to comparable format (assuming DD.MM.YYYY format)
    const dateA = a.date.split('.').reverse().join('');
    const dateB = b.date.split('.').reverse().join('');
    return dateB.localeCompare(dateA); // Sort descending (newest first)
  });

  // Prepare chart data
  const costData = {
    labels: maintenanceEntries.slice(0, 6).reverse().map(entry => {
      const dateParts = entry.date.split('.');
      return dateParts[1] + '/' + dateParts[2].substring(2);
    }),
    datasets: [
      {
        data: maintenanceEntries.slice(0, 6).reverse().map(entry => entry.cost),
      }
    ]
  };

  const renderMaintenanceItem = ({ item }) => (
    <TouchableOpacity style={styles.maintenanceItem} onPress={() => openEditModal(item)}>
      <Text style={{ color: '#666', padding: 8 }}>{vehicleName(item)}</Text>
      <View style={styles.maintenanceHeader}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#666" />
          <Text style={styles.maintenanceDate}>{item.date}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>
      
      <Text style={styles.maintenanceTitle}>{item.title}</Text>
      
      <View style={styles.workshopContainer}>
        <Wrench size={16} color="#666" />
        <Text style={styles.workshopText}>{item.workshop}</Text>
      </View>
      
      <View style={styles.maintenanceDetails}>
        <View style={styles.detailItem}>
          <Banknote size={16} color="#666" />
          <Text style={styles.detailText}>{item.cost.toFixed(2)} €</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Clock size={16} color="#666" />
          <Text style={styles.detailText}>{item.mileage} km</Text>
        </View>
      </View>
      
      <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
      
      {item.parts && item.parts.length > 0 && (
        <View style={styles.partsContainer}>
          <Text style={styles.partsLabel}>Teile:</Text>
          <View style={styles.partsList}>
            {item.parts.map((part, index) => (
              <View key={index} style={styles.partItem}>
                <Tag size={12} color="#8B4513" />
                <Text style={styles.partText}>{part}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
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
      
      <View style={styles.maintenanceFooter}>
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

  const renderMaintenanceForm = (isEdit = false) => {
    const maintenanceData = isEdit ? currentMaintenanceEntry : newMaintenanceEntry;
    const setMaintenanceData = isEdit 
      ? (data) => setCurrentMaintenanceEntry({...currentMaintenanceEntry, ...data}) 
      : (data) => setNewMaintenanceEntry({...newMaintenanceEntry, ...data});

    return (
      <>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Datum*</Text>
          <TextInput
            style={styles.input}
            placeholder="DD.MM.YYYY"
            value={maintenanceData.date}
            onChangeText={(text) => setMaintenanceData({date: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Typ</Text>
          <View style={styles.typeSelector}>
            {maintenanceTypes.filter(type => type !== 'Alle').map((type, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.typeSelectorButton, 
                  maintenanceData.type === type && styles.typeSelectorButtonActive,
                  { borderColor: getTypeColor(type) }
                ]}
                onPress={() => setMaintenanceData({type: type})}
              >
                <Text 
                  style={[
                    styles.typeSelectorText, 
                    maintenanceData.type === type && styles.typeSelectorTextActive,
                    { color: maintenanceData.type === type ? '#FFF' : getTypeColor(type) }
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Titel*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. Ölwechsel & Inspektion"
            value={maintenanceData.title}
            onChangeText={(text) => setMaintenanceData({title: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Werkstatt</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. Classic Car Service München"
            value={maintenanceData.workshop}
            onChangeText={(text) => setMaintenanceData({workshop: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kosten (€)*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. 450.80"
            value={maintenanceData.cost.toString()}
            onChangeText={(text) => setMaintenanceData({cost: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kilometerstand*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. 77500"
            value={maintenanceData.mileage.toString()}
            onChangeText={(text) => setMaintenanceData({mileage: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Beschreibung</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Beschreibung der durchgeführten Arbeiten"
            value={maintenanceData.description}
            onChangeText={(text) => setMaintenanceData({description: text})}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Teile</Text>
          <View style={styles.partsInputContainer}>
            <TextInput
              style={styles.partsInput}
              placeholder="Teil hinzufügen"
              value={maintenanceData.newPart}
              onChangeText={(text) => setMaintenanceData({newPart: text})}
            />
            <TouchableOpacity 
              style={styles.addPartButton}
              onPress={() => handleAddPart(isEdit)}
            >
              <Plus color="#FFF" size={20} />
            </TouchableOpacity>
          </View>

          {maintenanceData.parts.length > 0 && (
            <View style={styles.addedPartsList}>
              {maintenanceData.parts.map((part, index) => (
                <View key={index} style={styles.addedPartItem}>
                  <Text style={styles.addedPartText}>{part}</Text>
                  <TouchableOpacity 
                    style={styles.removePartButton}
                    onPress={() => handleRemovePart(index, isEdit)}
                  >
                    <X color="#666" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Rechnung</Text>
          <View style={styles.receiptImageContainer}>
            {maintenanceData.receiptImage ? (
              <Image 
                source={{ uri: maintenanceData.receiptImage }} 
                style={styles.receiptImagePreview} 
              />
            ) : (
              <View style={styles.receiptImagePreview}>
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

  // Calculate total costs
  const totalCost = filteredEntries.reduce((sum, entry) => sum + entry.cost, 0);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Lade Wartungseinträge...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VehicleSelect vehicles={vehicles} value={scope} onChange={setScope} filter disabled={isSaving} />
      {isSaving ? <Text accessibilityLiveRegion="polite" style={{ padding: 8 }}>Speichert …</Text> : null}

      <View style={styles.header}>
        <Text style={styles.title}>Wartung & Reparaturen</Text>
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
          <Text style={styles.statValue}>{filteredEntries.length}</Text>
          <Text style={styles.statLabel}>Einträge</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {filteredEntries.length > 0 
              ? (totalCost / filteredEntries.length).toFixed(2) 
              : '0.00'} €
          </Text>
          <Text style={styles.statLabel}>Ø pro Eintrag</Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Kosten pro Monat</Text>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setShowCostChart(!showCostChart)}
          >
            {showCostChart ? (
              <ChevronUp size={20} color="#8B4513" />
            ) : (
              <ChevronDown size={20} color="#8B4513" />
            )}
          </TouchableOpacity>
        </View>
        {showCostChart && <CostChart data={costData} />}
      </View>
      
      <View style={styles.filterContainer}>
        {maintenanceTypes.map((type, index) => (
          <TouchableOpacity 
            key={index}
            style={[
              styles.filterButton, 
              selectedType === type && styles.filterButtonActive
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text 
              style={[
                styles.filterText, 
                selectedType === type && styles.filterTextActive
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <FlatList
        data={filteredEntries}
        renderItem={renderMaintenanceItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.maintenanceList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Keine Einträge gefunden</Text>
          </View>
        }
      />

      {/* Add Maintenance Entry Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { if (!isSaving) setShowAddModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Neuen Eintrag hinzufügen</Text>
              <TouchableOpacity 
                disabled={isSaving}
                style={styles.closeButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetNewMaintenanceEntry();
                }}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              {isSaving ? <Text accessibilityLiveRegion="polite" style={{ padding: 12 }}>Speichert …</Text> : null}

              <VehicleSelect vehicles={vehicles} value={newRecordVehicleId} onChange={setNewVehicleId} disabled={isSaving} />
              {renderMaintenanceForm(false)}

              <TouchableOpacity 
                disabled={isSaving}
                style={[styles.saveButton, isSaving && { opacity: 0.5 }]}
                onPress={handleAddMaintenanceEntry}
              >
                <Save color="#FFF" size={20} />
                <Text style={styles.saveButtonText}>Eintrag speichern</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Maintenance Entry Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { if (!isSaving) setShowEditModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Eintrag bearbeiten</Text>
              <TouchableOpacity 
                disabled={isSaving}
                style={styles.closeButton}
                onPress={() => {
                  setShowEditModal(false);
                  setCurrentMaintenanceEntry(null);
                }}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              {isSaving ? <Text accessibilityLiveRegion="polite" style={{ padding: 12 }}>Speichert …</Text> : null}

              <VehicleSelect vehicles={vehicles} value={currentMaintenanceEntry?.vehicleId} onChange={vehicleId => setCurrentMaintenanceEntry({...currentMaintenanceEntry, vehicleId})} disabled={isSaving} />
              {currentMaintenanceEntry && renderMaintenanceForm(true)}

              <TouchableOpacity 
                disabled={isSaving}
                style={[styles.saveButton, isSaving && { opacity: 0.5 }]}
                onPress={handleEditMaintenanceEntry}
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
              <Wrench color="#D32F2F" size={24} />
              <Text style={styles.confirmModalTitle}>Eintrag löschen</Text>
            </View>
            
            <Text style={styles.confirmModalText}>
              Möchten Sie diesen Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </Text>
            
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setCurrentMaintenanceEntry(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmDeleteButton]}
                onPress={handleDeleteMaintenanceEntry}
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
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F0F0F0',
  },
  filterButtonActive: {
    backgroundColor: '#8B4513',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
  },
  maintenanceList: {
    padding: 16,
    paddingTop: 0,
  },
  maintenanceItem: {
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
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maintenanceDate: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    marginLeft: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#FFF',
  },
  maintenanceTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  workshopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workshopText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
    marginLeft: 6,
  },
  maintenanceDetails: {
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
    fontFamily: 'Montserrat-Medium',
    color: '#333',
    marginLeft: 6,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginBottom: 12,
  },
  partsContainer: {
    marginBottom: 12,
  },
  partsLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
    marginBottom: 6,
  },
  partsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  partItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  partText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginLeft: 4,
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
  maintenanceFooter: {
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#999',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeSelectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  typeSelectorButtonActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  typeSelectorText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
  typeSelectorTextActive: {
    color: '#FFF',
  },
  partsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partsInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
    marginRight: 8,
  },
  addPartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedPartsList: {
    marginTop: 12,
  },
  addedPartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  addedPartText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
  },
  removePartButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
