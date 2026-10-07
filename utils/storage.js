import * as SupabaseStorage from './supabaseStorage';
import { normalizeVehicles, normalizeFuelEntry, normalizeTrip, normalizeMaintenanceEntry, normalizeReminder } from './vehicleUtils';

// Cloud-only until an account-scoped offline queue and conflict handling exist.
// Errors must reach the UI; never acknowledge an unpersisted local fallback.
export const getVehicles = async () => normalizeVehicles(await SupabaseStorage.getVehicles());
export const getCurrentVehicle = async () => {
  const raw = await SupabaseStorage.getCurrentVehicle();
  return raw ? normalizeVehicles([raw])[0] : null;
};
export const addVehicle = async (vehicle) => normalizeVehicles([await SupabaseStorage.addVehicle(vehicle)])[0];
export const getFuelEntries = async () => (await SupabaseStorage.getFuelEntries()).map(normalizeFuelEntry).filter(entry => entry !== null);
export const getTrips = async () => (await SupabaseStorage.getTrips()).map(normalizeTrip).filter(entry => entry !== null);
export const getMaintenanceEntries = async () => (await SupabaseStorage.getMaintenanceEntries()).map(normalizeMaintenanceEntry).filter(entry => entry !== null);
export const getReminders = async () => (await SupabaseStorage.getReminders()).map(normalizeReminder).filter(entry => entry !== null);
export const { setVehicles, updateVehicle, deleteVehicle, setCurrentVehicle,
  getUserProfile, setUserProfile, setFuelEntries, setTrips, setMaintenanceEntries,
  setReminders, generateId, sortDatesDESC, sortDatesASC, getTodayFormatted } = SupabaseStorage;
