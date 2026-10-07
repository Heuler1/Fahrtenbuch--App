import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isAuthenticated } from './supabaseClient';
import * as SupabaseStorage from './supabaseStorage';
import { normalizeVehicles, normalizeFuelEntry, normalizeTrip, normalizeMaintenanceEntry, normalizeReminder } from './vehicleUtils';

// Storage keys
const STORAGE_KEYS = {
  FUEL_ENTRIES: 'fuel_entries',
  TRIPS: 'trips',
  MAINTENANCE_ENTRIES: 'maintenance_entries',
  REMINDERS: 'reminders',
  VEHICLES: 'vehicles',
  CURRENT_VEHICLE: 'current_vehicle',
  USER_PROFILE: 'user_profile'
};

// Default data
const DEFAULT_DATA = {
  fuelEntries: [
    {
      id: '1',
      date: '15.07.2024',
      station: 'Aral',
      location: 'München',
      amount: 45.5,
      price: 2.15,
      totalCost: 97.83,
      mileage: 78432,
      consumption: 9.8,
      receiptImage: ''
    },
    {
      id: '2',
      date: '28.06.2024',
      station: 'Shell',
      location: 'Garmisch-Partenkirchen',
      amount: 42.0,
      price: 2.18,
      totalCost: 91.56,
      mileage: 78167,
      consumption: 10.2,
      receiptImage: ''
    },
    {
      id: '3',
      date: '15.06.2024',
      station: 'Esso',
      location: 'München',
      amount: 48.2,
      price: 2.12,
      totalCost: 102.18,
      mileage: 77890,
      consumption: 9.5,
      receiptImage: ''
    },
  ],
  trips: [
    {
      id: '1',
      date: '15.07.2024',
      start: 'München',
      destination: 'Starnberger See',
      distance: 35,
      category: 'Freizeit',
      startMileage: 78397,
      endMileage: 78432,
      notes: 'Schöne Fahrt bei Sonnenschein',
      weather: 'Sonnig, 24°C'
    },
    {
      id: '2',
      date: '10.07.2024',
      start: 'München',
      destination: 'Tegernsee',
      distance: 60,
      category: 'Oldtimertreffen',
      startMileage: 78337,
      endMileage: 78397,
      notes: 'Oldtimertreffen am Tegernsee',
      weather: 'Sonnig, 26°C'
    },
    {
      id: '3',
      date: '05.07.2024',
      start: 'München',
      destination: 'Augsburg',
      distance: 80,
      category: 'Geschäftlich',
      startMileage: 78257,
      endMileage: 78337,
      notes: 'Geschäftstermin',
      weather: 'Bewölkt, 22°C'
    },
    {
      id: '4',
      date: '28.06.2024',
      start: 'München',
      destination: 'Garmisch-Partenkirchen',
      distance: 90,
      category: 'Freizeit',
      startMileage: 78167,
      endMileage: 78257,
      notes: 'Bergfahrt',
      weather: 'Sonnig, 28°C'
    },
  ],
  maintenanceEntries: [
    {
      id: '1',
      date: '05.06.2024',
      type: 'Wartung',
      title: 'Ölwechsel & Inspektion',
      workshop: 'Classic Car Service München',
      cost: 450.80,
      mileage: 77500,
      description: 'Ölwechsel, Filterwechsel, Bremsflüssigkeit erneuert, allgemeine Inspektion',
      parts: ['Motoröl', 'Ölfilter', 'Luftfilter', 'Bremsflüssigkeit'],
      receiptImage: ''
    },
    {
      id: '2',
      date: '15.04.2024',
      type: 'Reparatur',
      title: 'Vergaser überholt',
      workshop: 'Oldtimer Werkstatt Schmid',
      cost: 680.50,
      mileage: 77200,
      description: 'Vergaser ausgebaut, gereinigt und neu eingestellt. Neue Dichtungen verbaut.',
      parts: ['Vergaserdichtung', 'Düsennadel', 'Schwimmerkammer-Dichtung'],
      receiptImage: ''
    },
    {
      id: '3',
      date: '10.02.2024',
      type: 'Ersatzteile',
      title: 'Neue Reifen',
      workshop: 'Reifen Schmidt',
      cost: 520.00,
      mileage: 76800,
      description: 'Neue Sommerreifen montiert und gewuchtet',
      parts: ['4x Sommerreifen 185/70 R15'],
      receiptImage: ''
    },
  ],
  reminders: [
    {
      id: '1',
      title: 'TÜV Termin',
      date: '15.06.2025',
      type: 'inspection',
      description: 'Hauptuntersuchung fällig',
      notifyDays: 30,
      active: true,
      priority: 'high'
    },
    {
      id: '2',
      title: 'Ölwechsel',
      date: '10.08.2024',
      type: 'maintenance',
      description: 'Ölwechsel nach 5.000 km oder 12 Monaten',
      notifyDays: 14,
      active: true,
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Saisonkennzeichen Ende',
      date: '31.10.2024',
      type: 'registration',
      description: 'Saisonkennzeichen endet',
      notifyDays: 14,
      active: true,
      priority: 'high'
    },
    {
      id: '4',
      title: 'Versicherung',
      date: '01.01.2025',
      type: 'insurance',
      description: 'Versicherungsbeitrag fällig',
      notifyDays: 21,
      active: true,
      priority: 'medium'
    },
    {
      id: '5',
      title: 'Winterlager vorbereiten',
      date: '15.10.2024',
      type: 'storage',
      description: 'Fahrzeug für Winterlagerung vorbereiten',
      notifyDays: 14,
      active: true,
      priority: 'medium'
    },
  ],
  vehicles: [
    {
      id: '1',
      name: 'Mercedes-Benz 280 SL',
      year: '1969',
      licensePlate: 'M-OT 280',
      vin: 'WDB10704522000123',
      mileage: '78432',
      fuelLevel: 75,
      nextInspection: '15.06.2025',
      purchaseDate: '10.03.2020',
      purchasePrice: '85000',
      engine: '2.8L 6-Zylinder',
      power: '170 PS',
      displacement: '2778 ccm',
      transmission: '4-Gang Schaltgetriebe',
      color: 'Silber',
      interior: 'Schwarzes Leder',
      insurance: {
        company: 'Allianz Classic',
        policyNumber: 'CL-12345678',
        expiryDate: '01.01.2025',
        cost: '420',
      },
      image: '',
      additionalImages: [],
      notes: 'Originaler Zustand, Matching Numbers, H-Kennzeichen seit 2019. Letzte Restaurierung 2018.',
      documents: [
        { name: 'Fahrzeugschein', date: '15.03.2019' },
        { name: 'Fahrzeugbrief', date: '15.03.2019' },
        { name: 'H-Gutachten', date: '10.02.2019' },
        { name: 'Wertgutachten', date: '05.05.2020' },
      ],
      history: [
        { owner: 'Hans Müller', period: '1969-1985' },
        { owner: 'Klaus Schmidt', period: '1985-2002' },
        { owner: 'Oldtimer Sammlung GmbH', period: '2002-2020' },
        { owner: 'Aktueller Besitzer', period: '2020-heute' },
      ],
      isActive: true,
      isSeasonal: true,
      seasonStart: '01.04',
      seasonEnd: '31.10',
    },
    {
      id: '2',
      name: 'Porsche 911 Targa',
      year: '1973',
      licensePlate: 'M-OT 911',
      mileage: '92145',
      fuelLevel: 45,
      nextInspection: '10.08.2025',
      isActive: true,
      image: ''
    },
    {
      id: '3',
      name: 'Volkswagen Käfer',
      year: '1965',
      licensePlate: 'M-OT 1965',
      mileage: '65320',
      fuelLevel: 30,
      nextInspection: '22.05.2026',
      isActive: false,
      image: ''
    },
  ],
  currentVehicle: {
    id: '1',
    name: 'Mercedes-Benz 280 SL',
    year: 1969,
    mileage: 78432,
    fuelLevel: 75,
    nextInspection: '15.06.2025',
    image: ''
  },
  userProfile: {
    name: 'Max Mustermann',
    email: 'max.mustermann@example.com',
    phone: '+49 123 456789',
    image: ''
  }
};

// Local fallback functions (used when Supabase fails for authenticated users)
const getFuelEntriesLocal = async () => {
  return (await getData(STORAGE_KEYS.FUEL_ENTRIES)) || [];
};
const setFuelEntriesLocal = async (entries) => {
  return setData(STORAGE_KEYS.FUEL_ENTRIES, entries);
};
const getTripsLocal = async () => {
  return (await getData(STORAGE_KEYS.TRIPS)) || [];
};
const setTripsLocal = async (trips) => {
  return setData(STORAGE_KEYS.TRIPS, trips);
};
const getMaintenanceEntriesLocal = async () => {
  return (await getData(STORAGE_KEYS.MAINTENANCE_ENTRIES)) || [];
};
const setMaintenanceEntriesLocal = async (entries) => {
  return setData(STORAGE_KEYS.MAINTENANCE_ENTRIES, entries);
};
const getRemindersLocal = async () => {
  return (await getData(STORAGE_KEYS.REMINDERS)) || [];
};
const setRemindersLocal = async (reminders) => {
  return setData(STORAGE_KEYS.REMINDERS, reminders);
};
const getVehiclesLocal = async () => {
  const local = await getData(STORAGE_KEYS.VEHICLES);
  return normalizeVehicles(local);
};
const getCurrentVehicleLocal = async () => {
  const vehicles = await getVehiclesLocal();
  return vehicles.find(v => v.isActive) || vehicles[0] || null;
};
const setCurrentVehicleLocal = async (vehicle) => {
  return setData(STORAGE_KEYS.CURRENT_VEHICLE, vehicle);
};
const getUserProfileLocal = async () => {
  return (await getData(STORAGE_KEYS.USER_PROFILE)) || null;
};
const setUserProfileLocal = async (profile) => {
  return setData(STORAGE_KEYS.USER_PROFILE, profile);
};

// Check if user is authenticated and database is available
const isSupabaseAvailable = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Test database connection by trying to fetch from a simple table
    await supabase.from('user_profiles').select('id').limit(1);
    return true;
  } catch (error) {
    console.warn('Supabase not available, using local storage:', error.message);
    return false;
  }
};

// Initialize storage with default data if empty
export const initializeStorage = async () => {
  try {
    // Check if user is authenticated and use Supabase
    const authenticated = await isAuthenticated();
    if (authenticated) {
      console.log('User authenticated, using Supabase storage');
      return; // Supabase will handle data storage
    }
    
    try {
      // Check if storage is already initialized
      const initialized = await AsyncStorage.getItem('storage_initialized');
      
      if (!initialized) {
        // Store default data
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.FUEL_ENTRIES, JSON.stringify(DEFAULT_DATA.fuelEntries)),
          AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(DEFAULT_DATA.trips)),
          AsyncStorage.setItem(STORAGE_KEYS.MAINTENANCE_ENTRIES, JSON.stringify(DEFAULT_DATA.maintenanceEntries)),
          AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(DEFAULT_DATA.reminders)),
          AsyncStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(DEFAULT_DATA.vehicles)),
          AsyncStorage.setItem(STORAGE_KEYS.CURRENT_VEHICLE, JSON.stringify(DEFAULT_DATA.currentVehicle)),
          AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_DATA.userProfile)),
          AsyncStorage.setItem('storage_initialized', 'true')
        ]);
        
        console.log('Storage initialized with default data');
      } else {
        console.log('Storage already initialized');
      }
    } catch (storageError) {
      console.warn('AsyncStorage not available, using in-memory storage');
      // Fallback for web or when AsyncStorage is not available
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// Generic get function
export const getData = async (key) => {
  try {
    // Check if user is authenticated and use Supabase
    const authenticated = await isAuthenticated();
    if (authenticated) {
      return null; // Use specific Supabase functions instead
    }
    
    let jsonValue;
    try {
      jsonValue = await AsyncStorage.getItem(key);
    } catch {
      return null; // Fallback if AsyncStorage is not available
    }
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error getting data for key ${key}:`, error);
    return null;
  }
};

// Generic set function
export const setData = async (key, value) => {
  try {
    // Check if user is authenticated and use Supabase
    const authenticated = await isAuthenticated();
    if (authenticated) {
      return true; // Use specific Supabase functions instead
    }
    
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch {
      console.warn('AsyncStorage not available, data not persisted');
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Error setting data for key ${key}:`, error);
    return false;
  }
};

// Specific functions for each data type
export const getFuelEntries = async () => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      const raw = await SupabaseStorage.getFuelEntries();
      return (raw || []).map(normalizeFuelEntry).filter(Boolean);
    } catch (error) {
      console.warn('Supabase getFuelEntries failed, using local storage:', error);
      return await getFuelEntriesLocal();
    }
  }
  const local = await getData(STORAGE_KEYS.FUEL_ENTRIES);
  return local || [];
};

export const setFuelEntries = async (entries) => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      return await SupabaseStorage.setFuelEntries(entries);
    } catch (error) {
      console.warn('Supabase setFuelEntries failed, using local storage:', error);
      return await setFuelEntriesLocal(entries);
    }
  }
  return setData(STORAGE_KEYS.FUEL_ENTRIES, entries);
};

export const getTrips = async () => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      const raw = await SupabaseStorage.getTrips();
      return (raw || []).map(normalizeTrip).filter(Boolean);
    } catch (error) {
      console.warn('Supabase getTrips failed, using local storage:', error);
      return await getTripsLocal();
    }
  }
  const local = await getData(STORAGE_KEYS.TRIPS);
  return local || [];
};

export const setTrips = async (trips) => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      return await SupabaseStorage.setTrips(trips);
    } catch (error) {
      console.warn('Supabase setTrips failed, using local storage:', error);
      return await setTripsLocal(trips);
    }
  }
  return setData(STORAGE_KEYS.TRIPS, trips);
};

export const getMaintenanceEntries = async () => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      const raw = await SupabaseStorage.getMaintenanceEntries();
      return (raw || []).map(normalizeMaintenanceEntry).filter(Boolean);
    } catch (error) {
      console.warn('Supabase getMaintenanceEntries failed, using local storage:', error);
      return await getMaintenanceEntriesLocal();
    }
  }
  const local = await getData(STORAGE_KEYS.MAINTENANCE_ENTRIES);
  return local || [];
};

export const setMaintenanceEntries = async (entries) => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      return await SupabaseStorage.setMaintenanceEntries(entries);
    } catch (error) {
      console.warn('Supabase setMaintenanceEntries failed, using local storage:', error);
      return await setMaintenanceEntriesLocal(entries);
    }
  }
  return setData(STORAGE_KEYS.MAINTENANCE_ENTRIES, entries);
};

export const getReminders = async () => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      const raw = await SupabaseStorage.getReminders();
      return (raw || []).map(normalizeReminder).filter(Boolean);
    } catch (error) {
      console.warn('Supabase getReminders failed, using local storage:', error);
      return await getRemindersLocal();
    }
  }
  const local = await getData(STORAGE_KEYS.REMINDERS);
  return local || [];
};

export const setReminders = async (reminders) => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      return await SupabaseStorage.setReminders(reminders);
    } catch (error) {
      console.warn('Supabase setReminders failed, using local storage:', error);
      return await setRemindersLocal(reminders);
    }
  }
  return setData(STORAGE_KEYS.REMINDERS, reminders);
};

export const getVehicles = async () => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      const raw = await SupabaseStorage.getVehicles();
      return normalizeVehicles(raw);
    } catch (error) {
      console.warn('Supabase getVehicles failed, using local storage:', error);
      return await getVehiclesLocal();
    }
  }
  const local = await getData(STORAGE_KEYS.VEHICLES);
  return normalizeVehicles(local);
};

export const setVehicles = async (vehicles) => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      return await SupabaseStorage.setVehicles(vehicles);
    } catch (error) {
      console.warn('Supabase setVehicles failed, using local storage:', error);
      return setData(STORAGE_KEYS.VEHICLES, vehicles);
    }
  }
  return setData(STORAGE_KEYS.VEHICLES, vehicles);
};

export const getCurrentVehicle = async () => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      const raw = await SupabaseStorage.getCurrentVehicle();
      return raw ? normalizeVehicles([raw])[0] : null;
    } catch (error) {
      console.warn('Supabase getCurrentVehicle failed, using local storage:', error);
      return await getCurrentVehicleLocal();
    }
  }
  const local = await getData(STORAGE_KEYS.CURRENT_VEHICLE);
  return local;
};

export const setCurrentVehicle = async (vehicle) => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      return await SupabaseStorage.setCurrentVehicle(vehicle);
    } catch (error) {
      console.warn('Supabase setCurrentVehicle failed, using local storage:', error);
      return await setCurrentVehicleLocal(vehicle);
    }
  }
  return setData(STORAGE_KEYS.CURRENT_VEHICLE, vehicle);
};

export const getUserProfile = async () => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      return await SupabaseStorage.getUserProfile();
    } catch (error) {
      console.warn('Supabase getUserProfile failed, using local storage:', error);
      return await getUserProfileLocal();
    }
  }
  return getData(STORAGE_KEYS.USER_PROFILE);
};

export const setUserProfile = async (profile) => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      return await SupabaseStorage.setUserProfile(profile);
    } catch (error) {
      console.warn('Supabase setUserProfile failed, using local storage:', error);
      return await setUserProfileLocal(profile);
    }
  }
  return setData(STORAGE_KEYS.USER_PROFILE, profile);
};

export const addVehicle = async (vehicle) => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      const raw = await SupabaseStorage.addVehicle(vehicle);
      return normalizeVehicles([raw])[0];
    } catch (error) {
      console.warn('Supabase addVehicle failed, using local storage:', error);
      const vehicles = await getVehicles() || [];
      const vehicleWithId = {
        ...vehicle,
        id: generateId()
      };
      vehicles.push(vehicleWithId);
      await setData(STORAGE_KEYS.VEHICLES, vehicles);
      return vehicleWithId;
    }
  }
  const vehicles = await getVehicles() || [];
  const vehicleWithId = {
    ...vehicle,
    id: generateId()
  };
  vehicles.push(vehicleWithId);
  await setData(STORAGE_KEYS.VEHICLES, vehicles);
  return vehicleWithId;
};

export const updateVehicle = async (vehicleId, updates) => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      return await SupabaseStorage.updateVehicle(vehicleId, updates);
    } catch (error) {
      console.warn('Supabase updateVehicle failed, using local storage:', error);
      const vehicles = await getVehicles() || [];
      const index = vehicles.findIndex(v => v.id === vehicleId);
      if (index !== -1) {
        vehicles[index] = { ...vehicles[index], ...updates };
        await setData(STORAGE_KEYS.VEHICLES, vehicles);
        return vehicles[index];
      }
      return null;
    }
  }
  const vehicles = await getVehicles() || [];
  const index = vehicles.findIndex(v => v.id === vehicleId);
  if (index !== -1) {
    vehicles[index] = { ...vehicles[index], ...updates };
    await setData(STORAGE_KEYS.VEHICLES, vehicles);
    return vehicles[index];
  }
  return null;
};

export const deleteVehicle = async (vehicleId) => {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      return await SupabaseStorage.deleteVehicle(vehicleId);
    } catch (error) {
      console.warn('Supabase deleteVehicle failed, using local storage:', error);
      const vehicles = await getVehicles() || [];
      const filtered = vehicles.filter(v => v.id !== vehicleId);
      await setData(STORAGE_KEYS.VEHICLES, filtered);
      return true;
    }
  }
  const vehicles = await getVehicles() || [];
  const filtered = vehicles.filter(v => v.id !== vehicleId);
  await setData(STORAGE_KEYS.VEHICLES, filtered);
  return true;
};

// Helper function to generate a unique ID
export const generateId = SupabaseStorage.generateId;

// Helper function to sort dates in DD.MM.YYYY format
export const sortDatesDESC = SupabaseStorage.sortDatesDESC;

export const sortDatesASC = SupabaseStorage.sortDatesASC;

// Helper function to format today's date as DD.MM.YYYY
export const getTodayFormatted = SupabaseStorage.getTodayFormatted;

// Initialize storage when the app starts
initializeStorage();