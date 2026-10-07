import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ScrollView, Modal, TextInput, Platform, Alert } from 'react-native';
import { Plus, Calendar, Bell, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, ChevronRight, X, Save, Trash2, CreditCard as Edit, ChevronDown, ChevronUp } from 'lucide-react-native';
import ReminderPieChart from '../../components/ReminderPieChart';
import { getReminders, setReminders, generateId, getTodayFormatted } from '../../utils/storage';

export default function RemindersScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newReminder, setNewReminder] = useState({
    title: '',
    date: getTodayFormatted(),
    type: 'inspection',
    description: '',
    notifyDays: '14',
    active: true,
    priority: 'medium'
  });
  
  const [reminders, setRemindersState] = useState([]);

  // Load reminders from storage
  useEffect(() => {
    const loadReminders = async () => {
      try {
        setIsLoading(true);
        const loadedReminders = await getReminders();
        if (loadedReminders) {
          setRemindersState(loadedReminders);
        }
      } catch (error) {
        console.error('Error loading reminders:', error);
        Alert.alert('Fehler', 'Beim Laden der Erinnerungen ist ein Fehler aufgetreten.');
      } finally {
        setIsLoading(false);
      }
    };

    loadReminders();
  }, []);

  const [filterStatus, setFilterStatus] = useState('Alle');
  const [filterCategory, setFilterCategory] = useState('Alle');

  const toggleReminderActive = async (id) => {
    try {
      const updatedReminders = reminders.map(reminder => 
        reminder.id === id ? {...reminder, active: !reminder.active} : reminder
      );
      setRemindersState(updatedReminders);
      await setReminders(updatedReminders);
    } catch (error) {
      console.error('Error toggling reminder active state:', error);
      Alert.alert('Fehler', 'Beim Ändern des Status ist ein Fehler aufgetreten.');
    }
  };

  const handleAddReminder = async () => {
    // Validate required fields
    if (!newReminder.title || !newReminder.date) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      const reminderToAdd = {
        id: generateId(),
        title: newReminder.title,
        date: newReminder.date,
        type: newReminder.type,
        description: newReminder.description || 'Keine Beschreibung',
        notifyDays: parseInt(newReminder.notifyDays),
        active: newReminder.active,
        priority: newReminder.priority
      };

      const updatedReminders = [reminderToAdd, ...reminders];
      setRemindersState(updatedReminders);
      await setReminders(updatedReminders);
      
      setShowAddModal(false);
      resetNewReminder();
      
      Alert.alert('Erfolg', 'Erinnerung wurde erfolgreich hinzugefügt.');
    } catch (error) {
      console.error('Error adding reminder:', error);
      Alert.alert('Fehler', 'Beim Hinzufügen der Erinnerung ist ein Fehler aufgetreten.');
    }
  };

  const handleEditReminder = async () => {
    if (!currentReminder.title || !currentReminder.date) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    try {
      // Ensure notifyDays is a number
      const updatedReminder = {
        ...currentReminder,
        notifyDays: typeof currentReminder.notifyDays === 'string' 
          ? parseInt(currentReminder.notifyDays) 
          : currentReminder.notifyDays
      };

      const updatedReminders = reminders.map(reminder => 
        reminder.id === currentReminder.id ? updatedReminder : reminder
      );
      
      setRemindersState(updatedReminders);
      await setReminders(updatedReminders);
      
      setShowEditModal(false);
      setCurrentReminder(null);
      
      Alert.alert('Erfolg', 'Erinnerung wurde erfolgreich aktualisiert.');
    } catch (error) {
      console.error('Error editing reminder:', error);
      Alert.alert('Fehler', 'Beim Bearbeiten der Erinnerung ist ein Fehler aufgetreten.');
    }
  };

  const handleDeleteReminder = async () => {
    if (!currentReminder) return;
    
    try {
      const updatedReminders = reminders.filter(reminder => reminder.id !== currentReminder.id);
      setRemindersState(updatedReminders);
      await setReminders(updatedReminders);
      
      setShowDeleteModal(false);
      setCurrentReminder(null);
      
      Alert.alert('Erfolg', 'Erinnerung wurde erfolgreich gelöscht.');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      Alert.alert('Fehler', 'Beim Löschen der Erinnerung ist ein Fehler aufgetreten.');
    }
  };

  const resetNewReminder = () => {
    setNewReminder({
      title: '',
      date: getTodayFormatted(),
      type: 'inspection',
      description: '',
      notifyDays: '14',
      active: true,
      priority: 'medium'
    });
  };

  const openEditModal = (reminder) => {
    setCurrentReminder({...reminder});
    setShowEditModal(true);
  };

  const openDeleteModal = (reminder) => {
    setCurrentReminder(reminder);
    setShowDeleteModal(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'inspection':
        return <Calendar size={20} color="#FFF" />;
      case 'maintenance':
        return <Clock size={20} color="#FFF" />;
      case 'registration':
        return <AlertTriangle size={20} color="#FFF" />;
      case 'insurance':
        return <Bell size={20} color="#FFF" />;
      case 'storage':
        return <CheckCircle size={20} color="#FFF" />;
      default:
        return <Bell size={20} color="#FFF" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'inspection':
        return '#0066CC';
      case 'maintenance':
        return '#CC6600';
      case 'registration':
        return '#00994D';
      case 'insurance':
        return '#9C27B0';
      case 'storage':
        return '#607D8B';
      default:
        return '#757575';
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'inspection':
        return 'TÜV';
      case 'maintenance':
        return 'Wartung';
      case 'registration':
        return 'Kennzeichen';
      case 'insurance':
        return 'Versicherung';
      case 'storage':
        return 'Lagerung';
      default:
        return 'Sonstiges';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':
        return styles.highPriority;
      case 'medium':
        return styles.mediumPriority;
      case 'low':
        return styles.lowPriority;
      default:
        return styles.mediumPriority;
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    const statusMatch = filterStatus === 'Alle' || 
                       (filterStatus === 'Aktiv' && reminder.active) || 
                       (filterStatus === 'Inaktiv' && !reminder.active);
    
    const categoryMatch = filterCategory === 'Alle' || getTypeName(reminder.type) === filterCategory;
    
    return statusMatch && categoryMatch;
  }).sort((a, b) => {
    // Convert dates to comparable format (assuming DD.MM.YYYY format)
    const dateA = a.date.split('.').reverse().join('');
    const dateB = b.date.split('.').reverse().join('');
    return dateA.localeCompare(dateB); // Sort ascending (closest date first)
  });

  // Prepare chart data for reminder types
  const reminderTypeData = [
    {
      name: 'TÜV',
      population: reminders.filter(r => r.type === 'inspection').length,
      color: getTypeColor('inspection'),
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Wartung',
      population: reminders.filter(r => r.type === 'maintenance').length,
      color: getTypeColor('maintenance'),
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Kennzeichen',
      population: reminders.filter(r => r.type === 'registration').length,
      color: getTypeColor('registration'),
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Versicherung',
      population: reminders.filter(r => r.type === 'insurance').length,
      color: getTypeColor('insurance'),
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Lagerung',
      population: reminders.filter(r => r.type === 'storage').length,
      color: getTypeColor('storage'),
      legendFontColor: '#333',
      legendFontSize: 12,
    },
  ].filter(item => item.population > 0);

  const renderReminderItem = ({ item }) => (
    <View style={[styles.reminderItem, !item.active && styles.inactiveReminder]}>
      <View style={styles.reminderHeader}>
        <View style={[styles.typeIconContainer, { backgroundColor: getTypeColor(item.type) }]}>
          {getTypeIcon(item.type)}
        </View>
        
        <View style={styles.reminderTitleContainer}>
          <Text style={styles.reminderTitle}>{item.title}</Text>
          <Text style={styles.reminderDate}>{item.date}</Text>
        </View>
        
        <Switch
          value={item.active}
          onValueChange={() => toggleReminderActive(item.id)}
          trackColor={{ false: '#E0E0E0', true: '#D7CCC8' }}
          thumbColor={item.active ? '#8B4513' : '#BDBDBD'}
        />
      </View>
      
      <View style={styles.reminderContent}>
        <Text style={styles.reminderDescription}>{item.description}</Text>
        
        <View style={styles.reminderDetails}>
          <View style={styles.notifyContainer}>
            <Bell size={14} color="#666" />
            <Text style={styles.notifyText}>{item.notifyDays} Tage vorher</Text>
          </View>
          
          <View style={[styles.priorityBadge, getPriorityStyle(item.priority)]}>
            <Text style={styles.priorityText}>
              {item.priority === 'high' ? 'Hoch' : item.priority === 'medium' ? 'Mittel' : 'Niedrig'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Edit size={16} color="#8B4513" />
          <Text style={styles.editButtonText}>Bearbeiten</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => openDeleteModal(item)}
        >
          <Trash2 size={16} color="#D32F2F" />
          <Text style={styles.deleteButtonText}>Löschen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReminderForm = (isEdit = false) => {
    const reminderData = isEdit ? currentReminder : newReminder;
    const setReminderData = isEdit 
      ? (data) => setCurrentReminder({...currentReminder, ...data}) 
      : (data) => setNewReminder({...newReminder, ...data});

    return (
      <>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Titel*</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. TÜV Termin"
            value={reminderData.title}
            onChangeText={(text) => setReminderData({title: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Datum*</Text>
          <TextInput
            style={styles.input}
            placeholder="DD.MM.YYYY"
            value={reminderData.date}
            onChangeText={(text) => setReminderData({date: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kategorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeButton, reminderData.type === 'inspection' && styles.typeButtonActive]}
                onPress={() => setReminderData({type: 'inspection'})}
              >
                <View style={[styles.typeIconSmall, { backgroundColor: getTypeColor('inspection') }]}>
                  <Calendar size={16} color="#FFF" />
                </View>
                <Text style={styles.typeButtonText}>TÜV</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.typeButton, reminderData.type === 'maintenance' && styles.typeButtonActive]}
                onPress={() => setReminderData({type: 'maintenance'})}
              >
                <View style={[styles.typeIconSmall, { backgroundColor: getTypeColor('maintenance') }]}>
                  <Clock size={16} color="#FFF" />
                </View>
                <Text style={styles.typeButtonText}>Wartung</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.typeButton, reminderData.type === 'registration' && styles.typeButtonActive]}
                onPress={() => setReminderData({type: 'registration'})}
              >
                <View style={[styles.typeIconSmall, { backgroundColor: getTypeColor('registration') }]}>
                  <AlertTriangle size={16} color="#FFF" />
                </View>
                <Text style={styles.typeButtonText}>Kennzeichen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.typeButton, reminderData.type === 'insurance' && styles.typeButtonActive]}
                onPress={() => setReminderData({type: 'insurance'})}
              >
                <View style={[styles.typeIconSmall, { backgroundColor: getTypeColor('insurance') }]}>
                  <Bell size={16} color="#FFF" />
                </View>
                <Text style={styles.typeButtonText}>Versicherung</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.typeButton, reminderData.type === 'storage' && styles.typeButtonActive]}
                onPress={() => setReminderData({type: 'storage'})}
              >
                <View style={[styles.typeIconSmall, { backgroundColor: getTypeColor('storage') }]}>
                  <CheckCircle size={16} color="#FFF" />
                </View>
                <Text style={styles.typeButtonText}>Lagerung</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Beschreibung</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Beschreibung der Erinnerung"
            value={reminderData.description}
            onChangeText={(text) => setReminderData({description: text})}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Benachrichtigung (Tage vorher)</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. 14"
            value={reminderData.notifyDays.toString()}
            onChangeText={(text) => setReminderData({notifyDays: text})}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Priorität</Text>
          <View style={styles.prioritySelector}>
            <TouchableOpacity 
              style={[
                styles.priorityButton, 
                reminderData.priority === 'low' && styles.priorityButtonActive,
                reminderData.priority === 'low' && {backgroundColor: '#4CAF50'}
              ]}
              onPress={() => setReminderData({priority: 'low'})}
            >
              <Text style={[
                styles.priorityButtonText, 
                reminderData.priority === 'low' && styles.priorityTextActive
              ]}>Niedrig</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.priorityButton, 
                reminderData.priority === 'medium' && styles.priorityButtonActive,
                reminderData.priority === 'medium' && {backgroundColor: '#FF9800'}
              ]}
              onPress={() => setReminderData({priority: 'medium'})}
            >
              <Text style={[
                styles.priorityButtonText, 
                reminderData.priority === 'medium' && styles.priorityTextActive
              ]}>Mittel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.priorityButton, 
                reminderData.priority === 'high' && styles.priorityButtonActive,
                reminderData.priority === 'high' && {backgroundColor: '#F44336'}
              ]}
              onPress={() => setReminderData({priority: 'high'})}
            >
              <Text style={[
                styles.priorityButtonText, 
                reminderData.priority === 'high' && styles.priorityTextActive
              ]}>Hoch</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Status</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Aktiv</Text>
            <Switch
              value={reminderData.active}
              onValueChange={(value) => setReminderData({active: value})}
              trackColor={{ false: '#E0E0E0', true: '#D7CCC8' }}
              thumbColor={reminderData.active ? '#8B4513' : '#BDBDBD'}
            />
          </View>
        </View>
      </>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Lade Erinnerungen...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Erinnerungen</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus color="#FFF" size={24} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'Alle' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('Alle')}
        >
          <Text style={[styles.filterText, filterStatus === 'Alle' && styles.filterTextActive]}>Alle</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'Aktiv' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('Aktiv')}
        >
          <Text style={[styles.filterText, filterStatus === 'Aktiv' && styles.filterTextActive]}>Aktiv</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'Inaktiv' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('Inaktiv')}
        >
          <Text style={[styles.filterText, filterStatus === 'Inaktiv' && styles.filterTextActive]}>Inaktiv</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <TouchableOpacity 
            style={[styles.categoryButton, filterCategory === 'Alle' && styles.categoryButtonActive]}
            onPress={() => setFilterCategory('Alle')}
          >
            <Text style={[styles.categoryText, filterCategory === 'Alle' && styles.categoryTextActive]}>Alle</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.categoryButton, filterCategory === 'TÜV' && styles.categoryButtonActive]}
            onPress={() => setFilterCategory('TÜV')}
          >
            <Text style={[styles.categoryText, filterCategory === 'TÜV' && styles.categoryTextActive]}>TÜV</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.categoryButton, filterCategory === 'Wartung' && styles.categoryButtonActive]}
            onPress={() => setFilterCategory('Wartung')}
          >
            <Text style={[styles.categoryText, filterCategory === 'Wartung' && styles.categoryTextActive]}>Wartung</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.categoryButton, filterCategory === 'Kennzeichen' && styles.categoryButtonActive]}
            onPress={() => setFilterCategory('Kennzeichen')}
          >
            <Text style={[styles.categoryText, filterCategory === 'Kennzeichen' && styles.categoryTextActive]}>Kennzeichen</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.categoryButton, filterCategory === 'Versicherung' && styles.categoryButtonActive]}
            onPress={() => setFilterCategory('Versicherung')}
          >
            <Text style={[styles.categoryText, filterCategory === 'Versicherung' && styles.categoryTextActive]}>Versicherung</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.categoryButton, filterCategory === 'Lagerung' && styles.categoryButtonActive]}
            onPress={() => setFilterCategory('Lagerung')}
          >
            <Text style={[styles.categoryText, filterCategory === 'Lagerung' && styles.categoryTextActive]}>Lagerung</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Erinnerungen nach Kategorie</Text>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setShowStats(!showStats)}
          >
            {showStats ? (
              <ChevronUp size={20} color="#8B4513" />
            ) : (
              <ChevronDown size={20} color="#8B4513" />
            )}
          </TouchableOpacity>
        </View>
        
        {showStats && reminderTypeData.length > 0 && (
          <ReminderPieChart data={reminderTypeData} />
        )}
        
        {showStats && reminderTypeData.length === 0 && (
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>Keine Daten verfügbar</Text>
          </View>
        )}
      </View>
      
      <FlatList
        data={filteredReminders}
        renderItem={renderReminderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.remindersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Keine Erinnerungen gefunden</Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyAddButtonText}>Erinnerung hinzufügen</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Reminder Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Neue Erinnerung hinzufügen</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowAddModal(false);
                  resetNewReminder();
                }}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {renderReminderForm(false)}

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddReminder}
              >
                <Save color="#FFF" size={20} />
                <Text style={styles.saveButtonText}>Erinnerung speichern</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Reminder Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Erinnerung bearbeiten</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowEditModal(false);
                  setCurrentReminder(null);
                }}
              >
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {currentReminder && renderReminderForm(true)}

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleEditReminder}
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
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <Bell color="#D32F2F" size={24} />
              <Text style={styles.confirmModalTitle}>Erinnerung löschen</Text>
            </View>
            
            <Text style={styles.confirmModalText}>
              Möchten Sie diese Erinnerung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </Text>
            
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setCurrentReminder(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmDeleteButton]}
                onPress={handleDeleteReminder}
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
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#999',
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
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
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
  },
  categoryButtonActive: {
    backgroundColor: '#8B4513',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  statsContainer: {
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
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsTitle: {
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
  remindersList: {
    padding: 16,
  },
  reminderItem: {
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
  inactiveReminder: {
    opacity: 0.6,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderTitleContainer: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
  },
  reminderDate: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginTop: 2,
  },
  reminderContent: {
    marginBottom: 12,
  },
  reminderDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginBottom: 8,
  },
  reminderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifyText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginLeft: 6,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highPriority: {
    backgroundColor: '#FFEBEE',
  },
  mediumPriority: {
    backgroundColor: '#FFF8E1',
  },
  lowPriority: {
    backgroundColor: '#E8F5E9',
  },
  priorityText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  typeButton: {
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    borderColor: '#8B4513',
    backgroundColor: '#FFF8E1',
  },
  typeIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeButtonText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  priorityButtonActive: {
    backgroundColor: '#8B4513',
  },
  priorityButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  priorityTextActive: {
    color: '#FFF',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
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
});