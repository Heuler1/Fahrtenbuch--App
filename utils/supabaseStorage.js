import { supabase } from './supabaseClient';

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
    return null;
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
      })
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
    return [];
  }
};

export const setVehicles = async (vehicles) => {
  try {
    const userId = await getCurrentUserId();
    
    // Delete existing vehicles for this user
    await supabase
      .from('vehicles')
      .delete()
      .eq('user_id', userId);

    // Insert new vehicles
    if (vehicles && vehicles.length > 0) {
      const vehiclesWithUserId = vehicles.map(vehicle => ({
        ...vehicle,
        user_id: userId,
        id: vehicle.id || undefined, // Let Supabase generate ID if not provided
      }));

      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehiclesWithUserId)
        .select();

      if (error) throw error;
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error saving vehicles:', error);
    throw error;
  }
};

export const addVehicle = async (vehicle) => {
  try {
    const userId = await getCurrentUserId();
    const { toSupabaseVehicle } = await import('./vehicleUtils');
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

export const updateVehicle = async (vehicleId, updates) => {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

export const deleteVehicle = async (vehicleId) => {
  try {
    const userId = await getCurrentUserId();
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('user_id', userId);

    if (error) throw error;
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
    return [];
  }
};

export const setFuelEntries = async (entries) => {
  try {
    const userId = await getCurrentUserId();
    
    // Delete existing entries for this user
    await supabase
      .from('fuel_entries')
      .delete()
      .eq('user_id', userId);

    // Insert new entries
    if (entries && entries.length > 0) {
      const entriesWithUserId = entries.map(entry => ({
        user_id: userId,
        date: entry.date,
        station: entry.station,
        location: entry.location || '',
        amount: entry.amount,
        price: entry.price,
        total_cost: entry.totalCost,
        mileage: entry.mileage,
        consumption: entry.consumption,
        receipt_image_url: entry.receiptImage || '',
        vehicle_id: entry.vehicleId || null,
      }));

      const { data, error } = await supabase
        .from('fuel_entries')
        .insert(entriesWithUserId)
        .select();

      if (error) throw error;
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error saving fuel entries:', error);
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
    return [];
  }
};

export const setTrips = async (trips) => {
  try {
    const userId = await getCurrentUserId();
    
    // Delete existing trips for this user
    await supabase
      .from('trips')
      .delete()
      .eq('user_id', userId);

    // Insert new trips
    if (trips && trips.length > 0) {
      const tripsWithUserId = trips.map(trip => ({
        user_id: userId,
        date: trip.date,
        start_location: trip.start,
        destination: trip.destination,
        distance: trip.distance,
        category: trip.category,
        start_mileage: trip.startMileage,
        end_mileage: trip.endMileage,
        notes: trip.notes || '',
        weather: trip.weather || '',
        vehicle_id: trip.vehicleId || null,
      }));

      const { data, error } = await supabase
        .from('trips')
        .insert(tripsWithUserId)
        .select();

      if (error) throw error;
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error saving trips:', error);
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
    return [];
  }
};

export const setMaintenanceEntries = async (entries) => {
  try {
    const userId = await getCurrentUserId();
    
    // Delete existing entries for this user
    await supabase
      .from('maintenance_entries')
      .delete()
      .eq('user_id', userId);

    // Insert new entries
    if (entries && entries.length > 0) {
      const entriesWithUserId = entries.map(entry => ({
        user_id: userId,
        date: entry.date,
        type: entry.type,
        title: entry.title,
        workshop: entry.workshop || '',
        cost: entry.cost,
        mileage: entry.mileage,
        description: entry.description || '',
        parts: entry.parts || [],
        receipt_image_url: entry.receiptImage || '',
        vehicle_id: entry.vehicleId || null,
      }));

      const { data, error } = await supabase
        .from('maintenance_entries')
        .insert(entriesWithUserId)
        .select();

      if (error) throw error;
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error saving maintenance entries:', error);
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
    return [];
  }
};

export const setReminders = async (reminders) => {
  try {
    const userId = await getCurrentUserId();
    
    // Delete existing reminders for this user
    await supabase
      .from('reminders')
      .delete()
      .eq('user_id', userId);

    // Insert new reminders
    if (reminders && reminders.length > 0) {
      const remindersWithUserId = reminders.map(reminder => ({
        user_id: userId,
        title: reminder.title,
        date: reminder.date,
        type: reminder.type,
        description: reminder.description || '',
        notify_days: reminder.notifyDays,
        active: reminder.active,
        priority: reminder.priority,
        vehicle_id: reminder.vehicleId || null,
      }));

      const { data, error } = await supabase
        .from('reminders')
        .insert(remindersWithUserId)
        .select();

      if (error) throw error;
      return data;
    }
    return [];
  } catch (error) {
    console.error('Error saving reminders:', error);
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
    return null;
  }
};

export const setCurrentVehicle = async (vehicle) => {
  // This is handled by the is_active flag in the vehicles table
  try {
    const userId = await getCurrentUserId();
    
    // Set all vehicles to inactive
    await supabase
      .from('vehicles')
      .update({ is_active: false })
      .eq('user_id', userId);
    
    // Set the selected vehicle to active
    if (vehicle && vehicle.id) {
      await supabase
        .from('vehicles')
        .update({ is_active: true })
        .eq('id', vehicle.id)
        .eq('user_id', userId);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting current vehicle:', error);
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