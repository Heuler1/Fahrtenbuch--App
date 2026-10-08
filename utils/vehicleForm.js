// Validate before any request; never silently truncate an odometer value.
export function validateVehicleForm(vehicle, currentYear = new Date().getFullYear()) {
  const missing = [['name', 'Fahrzeugname'], ['year', 'Baujahr'], ['licensePlate', 'Kennzeichen'], ['mileage', 'Kilometerstand']]
    .filter(([key]) => !String(vehicle[key] ?? '').trim()).map(([, label]) => label);
  if (missing.length) throw new Error(`Bitte ausfüllen: ${missing.join(', ')}.`);
  const yearText = String(vehicle.year).trim();
  const year = Number(yearText);
  if (!/^\d{4}$/.test(yearText) || year < 1886 || year > currentYear) {
    throw new Error(`Bitte ein Baujahr zwischen 1886 und ${currentYear} eingeben.`);
  }
  const mileageText = String(vehicle.mileage).trim();
  // Plain digits or German thousands separators, e.g. 78.432 / 78 432.
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+|\d{1,3}(?:[ \u00a0]\d{3})+)$/.test(mileageText)) {
    throw new Error('Kilometerstand als ganze Zahl eingeben, z. B. 78432 oder 78.432.');
  }
  const mileage = Number(mileageText.replace(/[. \u00a0]/g, ''));
  if (!Number.isSafeInteger(mileage) || mileage > 2147483647) throw new Error('Der Kilometerstand ist zu groß.');
  const fuelText = String(vehicle.fuelLevel ?? '').trim();
  const fuelLevel = fuelText === '' ? 50 : Number(fuelText);
  if (!Number.isInteger(fuelLevel) || fuelLevel < 0 || fuelLevel > 100) {
    throw new Error('Tankfüllstand als ganze Zahl zwischen 0 und 100 eingeben.');
  }
  return { ...vehicle, name: vehicle.name.trim(), licensePlate: vehicle.licensePlate.trim(), year, mileage, fuelLevel,
    nextInspection: String(vehicle.nextInspection ?? '').trim() };
}

export function vehicleSaveError(error) {
  if (error?.message === 'User not authenticated' || error?.code === 'PGRST301') {
    return 'Deine Anmeldung ist abgelaufen. Bitte erneut anmelden und das Fahrzeug nochmals speichern.';
  }
  if (error?.code === '42501') return 'Die Datenbank hat das Speichern abgelehnt. Bitte die Zugriffsregeln für Fahrzeuge prüfen lassen.';
  if (['PGRST204', 'PGRST205', '42P01', '42703'].includes(error?.code)) {
    return 'Die Fahrzeugdatenbank ist noch nicht vollständig eingerichtet. Bitte diese Meldung weitergeben: ' + error.code;
  }
  if (/fetch|network|offline/i.test(error?.message ?? '')) return 'Keine Verbindung zur Datenbank. Bitte Internetverbindung prüfen und erneut versuchen.';
  return error?.message ? `Speichern fehlgeschlagen: ${error.message}` : 'Das Fahrzeug konnte nicht gespeichert werden. Bitte erneut versuchen.';
}
