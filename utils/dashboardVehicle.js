import AsyncStorage from '@react-native-async-storage/async-storage';

const key = userId => `dashboard-vehicle:${userId}`;
export async function loadDashboardVehicle(vehicles, userId) {
  const selectedId = userId ? await AsyncStorage.getItem(key(userId)) : null;
  return vehicles.find(vehicle => vehicle.id === selectedId)
    || vehicles.find(vehicle => vehicle.isActive)
    || vehicles[0] || null;
}
export async function saveDashboardVehicle(vehicleId, userId) {
  if (!userId) throw new Error('Bitte erneut anmelden.');
  await AsyncStorage.setItem(key(userId), vehicleId);
}
