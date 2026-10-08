import { validTrip, tripDistance, validateTripTimeline } from '../../utils/metrics';
import { useFocusEffect } from 'expo-router';
import VehicleSelect from '../../components/VehicleSelect';
import { useRecordVehicles } from '../../hooks/useRecordVehicles';
import { showMessage, errorMessage } from '../../utils/showMessage';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Modal, Platform, Alert } from 'react-native';
import { Plus, MapPin, Calendar, Navigation, Clock, Tag, ChevronRight, Search, X, Save, Trash2, CreditCard as Edit, Download } from 'lucide-react-native';
import { exportTripsPdf } from '../../utils/pdfExport';
import { getTrips, addTrip, updateTrip, deleteTrip, getTodayFormatted, sortDatesDESC } from '../../utils/storage';

export default function LogbookScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newTrip, setNewTrip] = useState({
    date: getTodayFormatted(),
    start: '',
    destination: '',
    distance: '',
    category: 'Freizeit',
    startMileage: '',
    endMileage: '',
    notes: '',
    weather: ''
  });
  
  const [allTrips, setTripsState] = useState([]);
  const { vehicles, scope, setScope, newRecordVehicleId, setNewVehicleId, matchesVehicle, vehicleName, isSaving, runMutation } = useRecordVehicles();
  const trips = allTrips.filter(matchesVehicle).map(trip => ({ ...trip, distance: tripDistance(trip) }));
  const currentVehicle = vehicles.find(vehicle => vehicle.id === scope) || null;

  // Load trips from storage
  useFocusEffect(React.useCallback(() => {
    const loadTrips = async () => {
      try {
        setIsLoading(true);
        const loadedTrips = await getTrips();
        if (loadedTrips) {
          const sortedTrips = loadedTrips.sort((a, b) => {
            const dateA = a.date.split('.').reverse().join('');
            const dateB = b.date.split('.').reverse().join('');
            return dateB.localeCompare(dateA);
          });
          setTripsState(sortedTrips);
        }

      } catch (error) {
        console.error('Error loading trips:', error);
        showMessage('Fehler', errorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    loadTrips();
  }, []));

  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const categories = ['Alle', 'Freizeit', 'Geschäftlich', 'Oldtimertreffen', 'Ausstellung'];

  const filteredTrips = trips.filter(trip => {
    const query = searchQuery.toLowerCase();
    const categoryMatch = selectedCategory === 'Alle' || trip.category === selectedCategory;
    
    const searchMatch = (
      (trip.start || '').toLowerCase().includes(query) ||
      (trip.destination || '').toLowerCase().includes(query) ||
      (trip.category || '').toLowerCase().includes(query) ||
      (trip.date || '').includes(query)
    );
    
    return categoryMatch && searchMatch;
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Freizeit':
        return '#4CAF50';
      case 'Geschäftlich':
        return '#2196F3';
      case 'Oldtimertreffen':
        return '#FF9800';
      case 'Ausstellung':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  const handleAddTrip = () => runMutation(async () => {
    // Validate required fields
    if (!newTrip.date || !newTrip.start || !newTrip.destination || !newTrip.startMileage || !newTrip.endMileage) {
      showMessage('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      const validated = validateTripTimeline({ ...newTrip, vehicleId: newRecordVehicleId }, allTrips);
      const tripToAdd = {
        vehicleId: newRecordVehicleId,
        date: newTrip.date,
        start: newTrip.start,
        destination: newTrip.destination,
        distance: validated.distance,
        category: newTrip.category,
        startMileage: validated.startMileage,
        endMileage: validated.endMileage,
        notes: newTrip.notes,
        weather: newTrip.weather || 'Keine Angabe'
      };

      const saved = await addTrip(tripToAdd);
      setTripsState(previous => [saved, ...previous]);
      
      setShowAddModal(false);
      resetNewTrip();
      
      showMessage('Erfolg', 'Fahrt wurde erfolgreich hinzugefügt.');
    } catch (error) {
      console.error('Error adding trip:', error);
      showMessage('Fehler', errorMessage(error));
    }
  });

  const handleEditTrip = () => runMutation(async () => {
    // Validate required fields
    if (!currentTrip.date || !currentTrip.start || !currentTrip.destination || (currentTrip.startMileage === null || currentTrip.startMileage === undefined || currentTrip.startMileage === '') || (currentTrip.endMileage === null || currentTrip.endMileage === undefined || currentTrip.endMileage === '')) {
      showMessage('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      const validated = validateTripTimeline(currentTrip, allTrips);
      const updatedTrip = {
        ...currentTrip,
        distance: validated.distance,
        startMileage: validated.startMileage,
        endMileage: validated.endMileage,
        weather: currentTrip.weather || 'Keine Angabe'
      };

      const saved = await updateTrip(updatedTrip);
      setTripsState(previous => previous.map(entry => entry.id === saved.id ? saved : entry));
      
      setShowEditModal(false);
      setCurrentTrip(null);
      
      showMessage('Erfolg', 'Fahrt wurde erfolgreich aktualisiert.');
    } catch (error) {
      console.error('Error editing trip:', error);
      showMessage('Fehler', errorMessage(error));
    }
  });

  const handleDeleteTrip = () => runMutation(async () => {
    if (!currentTrip) return;
    
    try {
      await deleteTrip(currentTrip);
      setTripsState(previous => previous.filter(entry => entry.id !== currentTrip.id));
      
      setShowDeleteModal(false);
      setCurrentTrip(null);
      
      showMessage('Erfolg', 'Fahrt wurde erfolgreich gelöscht.');
    } catch (error) {
      console.error('Error deleting trip:', error);
      showMessage('Fehler', errorMessage(error));
    }
  });

  const resetNewTrip = () => {
    setNewTrip({
      date: getTodayFormatted(),
      start: '',
      destination: '',
      distance: '',
      category: 'Freizeit',
      startMileage: '',
      endMileage: '',
      notes: '',
      weather: ''
    });
  };

  const openEditModal = (trip) => {
    setCurrentTrip({...trip});
    setShowEditModal(true);
  };

  const openDeleteModal = (trip) => {
    setCurrentTrip(trip);
    setShowDeleteModal(true);
  };

  const handleExportPDF = async (exportType) => {
    if (!currentVehicle) { showMessage('Fahrzeug auswählen', 'Bitte vor dem PDF-Export genau ein Fahrzeug im Fahrzeugfilter auswählen.'); return; }
    try {
      let tripsToExport = filteredTrips;

      
      if (exportType === 'business') {
        tripsToExport = filteredTrips.filter(trip => trip.category === 'Geschäftlich');

      }
      
      const vehicleInfo = currentVehicle ? {
        name: currentVehicle.name || 'Unbekannt',
        licensePlate: currentVehicle.licensePlate || '',
        year: currentVehicle.year || ''
      } : {
        name: 'Unbekanntes Fahrzeug',
        licensePlate: '',
        year: ''
      };
      
      const options = {
        vehicleInfo,
        exportType,
        dateRange: 'Alle erfassten Zeiträume'
      };
      
      await exportTripsPdf(tripsToExport, options);
      setShowExportModal(false);
      showMessage('PDF bereit', 'Der Druck- oder Teilen-Dialog wurde geöffnet. Bitte schließen Sie dort das Speichern ab.');
    } catch (error) {
      console.error('Error exporting trips PDF:', error);
      showMessage('Fehler', errorMessage(error));
    }
  };

  const renderTripItem = ({ item }) => (
    <TouchableOpacity style={styles.tripItem} onPress={() => openEditModal(item)}>
      <Text style={{ color: '#666', padding: 8 }}>{vehicleName(item)}</Text>
      <View style={styles.tripHeader}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#666" />
          <Text style={styles.tripDate}>{item.date}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      
      <View style={styles.tripRoute}>
        <View style={styles.locationContainer}>
          <MapPin size={16} color="#666" />
          <Text style={styles.locationText}>{item.start}</Text>
        </View>
        <View style={styles.routeLineContainer}>
          <View style={styles.routeLine} />
        </View>
        <View style={styles.locationContainer}>
          <MapPin size={16} color="#666" />
          <Text style={styles.locationText}>{item.destination}</Text>
        </View>
      </View>
      
      <View style={styles.tripDetails}>
        <View style={styles.detailItem}>
          <Navigation size={16} color="#666" />
          <Text style={styles.detailText}>{item.distance} km</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock size={16} color="#666" />
          <Text style={styles.detailText}>{item.startMileage || 0} - {item.endMileage || 0} km</Text>
        </View>
      </View>
      {item.notes && (
        <Text style={styles.tripNotes} numberOfLines={2}>{(item.notes || '').toString()}</Text>
      )}
      
      <View style={styles.tripFooter}>
        <Text style={styles.weatherText}>{(item.weather || '').toString()}</Text>
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

  const renderTripForm = (isEdit = false) => {
    const tripData = isEdit ? currentTrip : newTrip;
    const setTripData = isEdit 
      ? (data) => setCurrentTrip({...currentTrip, ...data}) 
      : (data) => setNewTrip({...newTrip, ...data});

    return (
      <>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Datum*</Text>
          <TextInput
            style={styles.input}
            placeholder="DD.MM.YYYY"
            value={tripData.date}
            onChangeText={(text) => setTripData({date: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Startort*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. München"
            value={tripData.start}
            onChangeText={(text) => setTripData({start: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Zielort*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. Starnberger See"
            value={tripData.destination}
            onChangeText={(text) => setTripData({destination: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kategorie</Text>
          <View style={styles.categorySelector}>
            {categories.filter(cat => cat !== 'Alle').map((category, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.categorySelectorButton, 
                  tripData.category === category && styles.categorySelectorButtonActive
                ]}
                onPress={() => setTripData({category: category})}
              >
                <Text 
                  style={[
                    styles.categorySelectorText, 
                    tripData.category === category && styles.categorySelectorTextActive
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kilometerstand Start*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. 78397"
            value={tripData.startMileage?.toString() || ''}
            onChangeText={(text) => setTripData({startMileage: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kilometerstand Ende*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. 78432"
            value={tripData.endMileage?.toString() || ''}
            onChangeText={(text) => setTripData({endMileage: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Wetter</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. Sonnig, 24°C"
            value={tripData.weather}
            onChangeText={(text) => setTripData({weather: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Notizen</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notizen zur Fahrt"
            value={tripData.notes}
            onChangeText={(text) => setTripData({notes: text})}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Lade Fahrten...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VehicleSelect vehicles={vehicles} value={scope} onChange={setScope} filter disabled={isSaving} />
      {isSaving ? <Text accessibilityLiveRegion="polite" style={{ padding: 8 }}>Speichert …</Text> : null}

      <View style={styles.header}>
        <Text style={styles.title}>Fahrtenbuch</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.exportButton} onPress={() => setShowExportModal(true)}>
            <Download color="#8B4513" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Plus color="#FFF" size={24} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Suche nach Ort, Datum oder Kategorie"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((category, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.filterButton, 
                selectedCategory === category && styles.filterButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text 
                style={[
                  styles.filterText, 
                  selectedCategory === category && styles.filterTextActive
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredTrips}
        renderItem={renderTripItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.tripsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Keine Fahrten gefunden</Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyAddButtonText}>Fahrt hinzufügen</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {filteredTrips.reduce((sum, trip) => sum + trip.distance, 0)} km
          </Text>
          <Text style={styles.statLabel}>Diesen Monat</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredTrips.length}</Text>
          <Text style={styles.statLabel}>Fahrten</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {filteredTrips.length > 0 
              ? Math.round(filteredTrips.reduce((sum, trip) => sum + trip.distance, 0) / filteredTrips.length) 
              : 0} km
          </Text>
          <Text style={styles.statLabel}>Ø pro Fahrt</Text>
        </View>
      </View>

      {/* Add Trip Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { if (!isSaving) setShowAddModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Neue Fahrt hinzufügen</Text>
              <TouchableOpacity 
                disabled={isSaving}
                style={styles.closeButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetNewTrip();
                }}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              {isSaving ? <Text accessibilityLiveRegion="polite" style={{ padding: 12 }}>Speichert …</Text> : null}

              <VehicleSelect vehicles={vehicles} value={newRecordVehicleId} onChange={setNewVehicleId} disabled={isSaving} />
              {renderTripForm(false)}

              <TouchableOpacity 
                disabled={isSaving}
                style={[styles.saveButton, isSaving && { opacity: 0.5 }]}
                onPress={handleAddTrip}
              >
                <Save color="#FFF" size={20} />
                <Text style={styles.saveButtonText}>Fahrt speichern</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Trip Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { if (!isSaving) setShowEditModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fahrt bearbeiten</Text>
              <TouchableOpacity 
                disabled={isSaving}
                style={styles.closeButton}
                onPress={() => {
                  setShowEditModal(false);
                  setCurrentTrip(null);
                }}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              {isSaving ? <Text accessibilityLiveRegion="polite" style={{ padding: 12 }}>Speichert …</Text> : null}

              <VehicleSelect vehicles={vehicles} value={currentTrip?.vehicleId} onChange={vehicleId => setCurrentTrip({...currentTrip, vehicleId})} disabled={isSaving} />
              {currentTrip && renderTripForm(true)}

              <TouchableOpacity 
                disabled={isSaving}
                style={[styles.saveButton, isSaving && { opacity: 0.5 }]}
                onPress={handleEditTrip}
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
              <Calendar color="#D32F2F" size={24} />
              <Text style={styles.confirmModalTitle}>Fahrt löschen</Text>
            </View>
            
            <Text style={styles.confirmModalText}>
              Möchten Sie diese Fahrt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </Text>
            
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setCurrentTrip(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmDeleteButton]}
                onPress={handleDeleteTrip}
              >
                <Text style={styles.confirmDeleteButtonText}>Löschen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { if (!isSaving) setShowExportModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.exportModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fahrtenbuch exportieren</Text>
              <TouchableOpacity 
                disabled={isSaving}
                style={styles.closeButton}
                onPress={() => setShowExportModal(false)}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.exportOptions}>
              <Text style={styles.exportDescription}>
                Wählen Sie den gewünschten Export-Typ für behördliche Nachweise:
              </Text>
              
              <TouchableOpacity 
                style={styles.exportOptionButton}
                onPress={() => handleExportPDF('all')}
              >
                <View style={styles.exportOptionContent}>
                  <Text style={styles.exportOptionTitle}>Alle Fahrten</Text>
                  <Text style={styles.exportOptionSubtitle}>Komplettes Fahrtenbuch für TÜV und Behörden</Text>
                </View>
                <ChevronRight size={20} color="#8B4513" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.exportOptionButton}
                onPress={() => handleExportPDF('business')}
              >
                <View style={styles.exportOptionContent}>
                  <Text style={styles.exportOptionTitle}>Nur Geschäftsfahrten</Text>
                  <Text style={styles.exportOptionSubtitle}>Für steuerliche Zwecke und Finanzamt</Text>
                </View>
                <ChevronRight size={20} color="#8B4513" />
              </TouchableOpacity>
            </View>

            <View style={styles.exportNote}>
              <Text style={styles.exportNoteText}>
                Das PDF wird automatisch in Ihren Downloads gespeichert und kann direkt an Behörden weitergeleitet werden.
              </Text>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#333',
  },
  filterContainer: {
    marginVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
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
  tripsList: {
    padding: 16,
  },
  tripItem: {
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDate: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    marginLeft: 6,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#FFF',
  },
  tripRoute: {
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  locationText: {
    fontSize: 15,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
    marginLeft: 8,
  },
  routeLineContainer: {
    paddingLeft: 8,
    height: 16,
  },
  routeLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#DDD',
    marginLeft: 7,
  },
  tripDetails: {
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
  tripNotes: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginBottom: 12,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginTop: 8,
  },
  weatherText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: '#888',
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#EEE',
    alignSelf: 'center',
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
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categorySelectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
  },
  categorySelectorButtonActive: {
    backgroundColor: '#8B4513',
  },
  categorySelectorText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  categorySelectorTextActive: {
    color: '#FFF',
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
  },
  // Export modal styles
  exportModalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  exportOptions: {
    padding: 20,
  },
  exportDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  exportOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exportOptionContent: {
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  exportOptionSubtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
  },
  exportNote: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  exportNoteText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
