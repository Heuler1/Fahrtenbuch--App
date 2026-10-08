import * as SupabaseStorage from './supabaseStorage';
import { toSupabaseVehicle, normalizeVehicles, normalizeFuelEntry, normalizeTrip, normalizeMaintenanceEntry, normalizeReminder } from './vehicleUtils';

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
export const updateVehicle = async (id, updates, expectedUpdatedAt, original) => {
  const raw = await SupabaseStorage.updateVehicle(id, updates, expectedUpdatedAt, original ? 'id,updated_at' : '*');
  return normalizeVehicles([original ? { ...toSupabaseVehicle(original), ...updates, ...raw } : raw])[0];
};
export const { deleteVehicle, getUserProfile, setUserProfile, generateId, sortDatesDESC, sortDatesASC, getTodayFormatted } = SupabaseStorage;
export const addFuelEntry = async e => normalizeFuelEntry(await SupabaseStorage.addFuelEntry(e));
export const updateFuelEntry = async e => normalizeFuelEntry(await SupabaseStorage.updateFuelEntry(e));
export const deleteFuelEntry = SupabaseStorage.deleteFuelEntry;
export const addTrip = async e => normalizeTrip(await SupabaseStorage.addTrip(e));
export const updateTrip = async e => normalizeTrip(await SupabaseStorage.updateTrip(e));
export const deleteTrip = SupabaseStorage.deleteTrip;
export const addMaintenanceEntry = async e => normalizeMaintenanceEntry(await SupabaseStorage.addMaintenanceEntry(e));
export const updateMaintenanceEntry = async e => normalizeMaintenanceEntry(await SupabaseStorage.updateMaintenanceEntry(e));
export const deleteMaintenanceEntry = SupabaseStorage.deleteMaintenanceEntry;
export const addReminder = async e => normalizeReminder(await SupabaseStorage.addReminder(e));
export const updateReminder = async e => normalizeReminder(await SupabaseStorage.updateReminder(e));
export const deleteReminder = SupabaseStorage.deleteReminder;

export const getOdometerReadings = SupabaseStorage.getOdometerReadings;
