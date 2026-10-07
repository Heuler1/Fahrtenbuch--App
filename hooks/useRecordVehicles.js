import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getVehicles } from '../utils/storage';
import { showMessage } from '../utils/showMessage';

export function useRecordVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [scope, setScope] = useState('all');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    getVehicles().then(list => { if (active) setVehicles(list); })
      .catch(error => { if (active) showMessage('Fahrzeuge konnten nicht geladen werden', error.message); });
    return () => { active = false; };
  }, []));
  const runMutation = async action => {
    if (saving.current) return;
    saving.current = true;
    setIsSaving(true);
    try { await action(); }
    finally { saving.current = false; setIsSaving(false); }
  };
  const matchesVehicle = record => scope === 'all' || (scope === 'unassigned' ? !record.vehicleId : record.vehicleId === scope);
  const vehicleName = record => vehicles.find(v => v.id === record.vehicleId)?.name || (record.vehicleId ? 'Fahrzeug nicht verfügbar' : 'Ohne Fahrzeugzuordnung');
  const newRecordVehicleId = newVehicleId || (vehicles.some(v => v.id === scope) ? scope : vehicles.length === 1 ? vehicles[0].id : '');
  return { vehicles, scope, setScope, newRecordVehicleId, setNewVehicleId, matchesVehicle, vehicleName, isSaving, runMutation };
}
