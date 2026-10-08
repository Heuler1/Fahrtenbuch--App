import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function VehicleSelect({ vehicles, value, onChange, filter = false, disabled = false }) {
  const choices = filter ? [{ id: 'all', name: 'Alle Fahrzeuge' }, { id: 'unassigned', name: 'Ohne Zuordnung' }, ...vehicles] : vehicles;
  return (
    <View style={{ padding: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#DDD' }}>
      <Text style={{ fontWeight: '600', marginBottom: 8 }}>{filter ? 'Fahrzeugfilter' : 'Fahrzeug *'}</Text>
      {!filter && !value ? <Text style={{ color: '#9B1C1C', marginBottom: 8 }}>{vehicles.length ? 'Bitte Fahrzeug auswählen.' : 'Bitte zuerst ein Fahrzeug unter „Fahrzeuge“ anlegen.'}</Text> : null}
      <ScrollView horizontal keyboardShouldPersistTaps="handled">
        {choices.map(vehicle => (
          <TouchableOpacity key={vehicle.id} disabled={disabled} accessibilityRole="button"
            accessibilityState={{ selected: value === vehicle.id, disabled }} onPress={() => onChange(vehicle.id)}
            style={{ padding: 10, marginRight: 8, borderRadius: 8, backgroundColor: value === vehicle.id ? '#8B4513' : '#EEE' }}>
            <Text style={{ color: value === vehicle.id ? '#FFF' : '#333' }}>{vehicle.name}{vehicle.licensePlate ? ` (${vehicle.licensePlate})` : ''}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
