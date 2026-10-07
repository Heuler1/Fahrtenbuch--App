import { supabase } from './supabaseClient';
import { toSupabaseVehicle } from './vehicleUtils';

// Helper function to get current user ID
const getCurrentUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

// User Profile functions
export const getUserProfile = async () => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const setUserProfile = async (profile) => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        name: profile.name || '',
        phone: profile.phone || '',
        image_url: profile.image || '',
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Vehicle functions
export const getVehicles = async () => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};


export const addVehicle = async (vehicle) => {
  try {
    const userId = await getCurrentUserId();
    const supabaseVehicle = toSupabaseVehicle(vehicle);
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        ...supabaseVehicle,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    throw error;
  }
};

export const updateVehicle = async (vehicleId, updates, expectedUpdatedAt) => {
  try {
    const userId = await getCurrentUserId();
    requireVersion({ id: vehicleId, updatedAt: expectedUpdatedAt });
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .eq('updated_at', expectedUpdatedAt)
      .select();

    if (error) throw error;
    if (!data?.length) throw new Error(CONFLICT_MESSAGE);
    return data[0];
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

export const deleteVehicle = async (vehicleId, expectedUpdatedAt) => {
  try {
    const userId = await getCurrentUserId();
    requireVersion({ id: vehicleId, updatedAt: expectedUpdatedAt });
    const { data, error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .eq('updated_at', expectedUpdatedAt)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error(CONFLICT_MESSAGE);
    return true;
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

// Fuel entries functions
export const getFuelEntries = async () => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('fuel_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching fuel entries:', error);
    throw error;
  }
};


// Trips functions
export const getTrips = async () => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw error;
  }
};


// Maintenance entries functions
export const getMaintenanceEntries = async () => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('maintenance_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching maintenance entries:', error);
    throw error;
  }
};


// Reminders functions
export const getReminders = async () => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw error;
  }
};


// Helper functions
export const getCurrentVehicle = async () => {
  try {
    const vehicles = await getVehicles();
    return vehicles.find(v => v.is_active) || vehicles[0] || null;
  } catch (error) {
    console.error('Error getting current vehicle:', error);
    throw error;
  }
};


// Generate ID function (for compatibility)
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Date helper functions
export const getTodayFormatted = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}.${month}.${year}`;
};

export const sortDatesDESC = (a, b) => {
  const dateA = a.split('.').reverse().join('');
  const dateB = b.split('.').reverse().join('');
  return dateB.localeCompare(dateA);
};

export const sortDatesASC = (a, b) => {
  const dateA = a.split('.').reverse().join('');
  const dateB = b.split('.').reverse().join('');
  return dateA.localeCompare(dateB);
};

const CONFLICT_MESSAGE = 'Dieser Eintrag wurde inzwischen geändert oder gelöscht. Bitte die Ansicht neu laden und die Änderung erneut prüfen.';
function requireVersion(record) {
  if (!record?.id || !record.updatedAt) throw new Error('Die Version des Eintrags fehlt. Bitte die Ansicht neu laden.');
}

// One HTTP mutation per record. Postgres checks the version in the same UPDATE/DELETE.
// Never replace a user's collection and never send caller-supplied ownership metadata.
async function ownVehicle(userId, vehicleId) {
  if (!vehicleId) throw new Error('Bitte ein Fahrzeug auswählen. Alte Einträge ohne Zuordnung müssen beim Bearbeiten einem Fahrzeug zugeordnet werden.');
  const { data, error } = await supabase.from('vehicles').select('id').eq('id', vehicleId).eq('user_id', userId).single();
  if (error || !data) throw new Error('Das ausgewählte Fahrzeug ist nicht verfügbar. Bitte die Ansicht neu laden.');
}
async function createRecord(table, fields) {
  const userId = await getCurrentUserId();
  await ownVehicle(userId, fields.vehicle_id);
  const { data, error } = await supabase.from(table).insert({ ...fields, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}
async function updateRecord(table, record, fields) {
  requireVersion(record);
  const userId = await getCurrentUserId();
  await ownVehicle(userId, fields.vehicle_id);
  const { data, error } = await supabase.from(table).update(fields)
    .eq('id', record.id).eq('user_id', userId).eq('updated_at', record.updatedAt).select();
  if (error) throw error;
  if (!data?.length) throw new Error(CONFLICT_MESSAGE);
  return data[0];
}
async function deleteRecord(table, record) {
  requireVersion(record);
  const userId = await getCurrentUserId();
  const { data, error } = await supabase.from(table).delete()
    .eq('id', record.id).eq('user_id', userId).eq('updated_at', record.updatedAt).select('id');
  if (error) throw error;
  if (!data?.length) throw new Error(CONFLICT_MESSAGE);
  return record.id;
}

const mapFuelEntry = e => ({ date: e.date, station: e.station, location: e.location || '', amount: e.amount, price: e.price, total_cost: e.totalCost, mileage: e.mileage, consumption: e.consumption, receipt_image_url: e.receiptImage || '', vehicle_id: e.vehicleId });
export const addFuelEntry = e => createRecord('fuel_entries', mapFuelEntry(e));
export const updateFuelEntry = e => updateRecord('fuel_entries', e, mapFuelEntry(e));
export const deleteFuelEntry = e => deleteRecord('fuel_entries', e);

const mapTrip = e => ({ date: e.date, start_location: e.start, destination: e.destination, distance: e.distance, category: e.category, start_mileage: e.startMileage, end_mileage: e.endMileage, notes: e.notes || '', weather: e.weather || '', vehicle_id: e.vehicleId });
export const addTrip = e => createRecord('trips', mapTrip(e));
export const updateTrip = e => updateRecord('trips', e, mapTrip(e));
export const deleteTrip = e => deleteRecord('trips', e);

const mapMaintenanceEntry = e => ({ date: e.date, type: e.type, title: e.title, workshop: e.workshop || '', cost: e.cost, mileage: e.mileage, description: e.description || '', parts: e.parts || [], receipt_image_url: e.receiptImage || '', vehicle_id: e.vehicleId });
export const addMaintenanceEntry = e => createRecord('maintenance_entries', mapMaintenanceEntry(e));
export const updateMaintenanceEntry = e => updateRecord('maintenance_entries', e, mapMaintenanceEntry(e));
export const deleteMaintenanceEntry = e => deleteRecord('maintenance_entries', e);

const mapReminder = e => ({ title: e.title, date: e.date, type: e.type, description: e.description || '', notify_days: e.notifyDays, active: e.active, priority: e.priority, vehicle_id: e.vehicleId });
export const addReminder = e => createRecord('reminders', mapReminder(e));
export const updateReminder = e => updateRecord('reminders', e, mapReminder(e));
export const deleteReminder = e => deleteRecord('reminders', e);
