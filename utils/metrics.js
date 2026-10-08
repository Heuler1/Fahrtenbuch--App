// Pure calculations shared by screens, charts and exports.
export function dateValue(value) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value || '');
  if (!match) return NaN;
  const [, d, m, y] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? +date : NaN;
}
export function inputNumber(value, label, { integer = false, positive = false } = {}) {
  let text = String(value ?? '').trim().replace(/\s/g, '');
  if (text.includes(',')) {
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/.test(text)) throw new Error(`${label}: Bitte eine gültige Zahl eingeben.`);
    text = text.replace(/\./g, '').replace(',', '.');
  }
  else if (integer && /^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
  if (!/^\d+(\.\d+)?$/.test(text)) throw new Error(`${label}: Bitte eine gültige Zahl eingeben.`);
  const n = Number(text);
  if (!Number.isFinite(n) || (integer && !Number.isSafeInteger(n)) || (positive && n <= 0)) throw new Error(`${label}: Bitte einen gültigen Wert eingeben.`);
  return n;
}
export function validateDate(value) {
  if (!Number.isFinite(dateValue(value))) throw new Error('Bitte ein gültiges Datum im Format TT.MM.JJJJ eingeben.');
}
export function validTrip(entry) {
  validateDate(entry.date);
  const startMileage = inputNumber(entry.startMileage, 'Start-Kilometerstand', { integer: true });
  const endMileage = inputNumber(entry.endMileage, 'End-Kilometerstand', { integer: true });
  if (endMileage <= startMileage) throw new Error('Der End-Kilometerstand muss höher als der Start-Kilometerstand sein.');
  return { ...entry, startMileage, endMileage, distance: endMileage - startMileage };
}
export function validFuel(entry) {
  validateDate(entry.date);
  const amount = inputNumber(entry.amount, 'Liter', { positive: true });
  const price = inputNumber(entry.price, 'Literpreis', { positive: true });
  const mileage = inputNumber(entry.mileage, 'Kilometerstand', { integer: true });
  return { ...entry, amount, price, mileage, totalCost: Math.round(amount * price * 100) / 100 };
}
export function validMaintenance(entry) {
  validateDate(entry.date);
  return { ...entry, cost: inputNumber(entry.cost, 'Kosten'), mileage: inputNumber(entry.mileage, 'Kilometerstand', { integer: true }) };
}
const number = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
export const tripDistance = trip => Number(trip.endMileage) > Number(trip.startMileage) ? number(trip.endMileage) - number(trip.startMileage) : 0;
const round = n => Math.round(n * 100) / 100;
export function fuelMetrics(entries) {
  const result = entries.map(e => ({ ...e, totalCost: round(number(e.amount) * number(e.price)), consumption: null, consumptionDistance: 0 }));
  const groups = new Map();
  for (const entry of result) {
    if (!entry.vehicleId || !Number.isFinite(dateValue(entry.date))) continue;
    if (!groups.has(entry.vehicleId)) groups.set(entry.vehicleId, []);
    groups.get(entry.vehicleId).push(entry);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => dateValue(a.date) - dateValue(b.date) || number(a.mileage) - number(b.mileage));
    for (let i = 1; i < group.length; i++) {
      const current = group[i], previous = group[i - 1];
      const distance = Number(current.mileage) - Number(previous.mileage);
      if (distance > 0 && Number(current.amount) > 0) {
        current.consumptionDistance = distance;
        current.consumption = Number(current.amount) / distance * 100;
      }
    }
  }
  return result;
}
export function averageConsumption(entries) {
  const valid = entries.filter(e => e.consumptionDistance > 0 && e.consumption !== null);
  const distance = valid.reduce((sum, e) => sum + e.consumptionDistance, 0);
  return distance > 0 ? valid.reduce((sum, e) => sum + Number(e.amount), 0) / distance * 100 : null;
}
export function inPeriod(date, period, now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const months = { month: 1, quarter: 3, year: 12 }[period];
  const start = months ? new Date(end.getFullYear(), end.getMonth() - months, 1) : new Date(0);
  if (months) start.setDate(Math.min(end.getDate(), new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()));
  const value = dateValue(date);
  return value >= +start && value <= +end;
}
const chart = (items, value) => ({ labels: items.map(e => e.date), datasets: [{ data: items.map(value) }] });
export function statistics({ fuelEntries = [], trips = [], maintenanceEntries = [], scope = 'all', period = 'all', now = new Date() }) {
  const matches = e => scope === 'all' || (scope === 'unassigned' ? !e.vehicleId : e.vehicleId === scope);
  const filter = e => matches(e) && inPeriod(e.date, period, now);
  const fuel = fuelMetrics(fuelEntries).filter(filter);
  const journeys = trips.filter(filter);
  const maintenance = maintenanceEntries.filter(filter);
  const totalDistance = journeys.reduce((s, e) => s + tripDistance(e), 0);
  const fuelCosts = round(fuel.reduce((s, e) => s + e.totalCost, 0));
  const maintenanceCosts = round(maintenance.reduce((s, e) => s + number(e.cost), 0));
  const totalCosts = round(fuelCosts + maintenanceCosts);
  const months = new Map();
  for (const e of [...fuel, ...maintenance]) {
    const date = new Date(dateValue(e.date));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.set(key, (months.get(key) || 0) + (e.totalCost ?? number(e.cost)));
  }
  const costs = [...months].sort(([a], [b]) => a.localeCompare(b));
  const categories = new Map();
  for (const e of journeys) categories.set(e.category || 'Ohne Kategorie', (categories.get(e.category || 'Ohne Kategorie') || 0) + tripDistance(e));
  const sortedFuel = fuel.filter(e => e.consumption !== null).sort((a, b) => dateValue(a.date) - dateValue(b.date));
  const sortedTrips = journeys.slice().sort((a, b) => dateValue(a.date) - dateValue(b.date) || number(a.endMileage) - number(b.endMileage));
  return {
    fuelEntries: fuel, trips: journeys, maintenanceEntries: maintenance,
    totalDistance, fuelCosts, maintenanceCosts, totalCosts,
    avgConsumption: averageConsumption(fuel), costPerKm: totalDistance > 0 ? totalCosts / totalDistance : null,
    costData: { labels: costs.map(([key]) => key.slice(5) + '/' + key.slice(0, 4)), datasets: [{ data: costs.map(([, cost]) => round(cost)) }] },
    categoryData: [...categories].filter(([, km]) => km > 0).map(([name, population], i) => ({ name, population, color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'][i % 4], legendFontColor: '#333', legendFontSize: 12 })),
    consumptionData: chart(sortedFuel.slice(-6), e => round(e.consumption)),
    mileageData: chart(scope !== 'all' && scope !== 'unassigned' ? sortedTrips.slice(-6) : [], e => number(e.endMileage)),
  };
}

export function validateTripTimeline(entry, others) {
  const current = validTrip(entry);
  for (const other of others.filter(e => e.id !== current.id && e.vehicleId && e.vehicleId === current.vehicleId)) {
    if (!Number.isFinite(dateValue(other.date)) || tripDistance(other) <= 0) continue;
    const overlap = current.startMileage < Number(other.endMileage) && current.endMileage > Number(other.startMileage);
    const reversed = dateValue(other.date) < dateValue(current.date) ? Number(other.endMileage) > current.startMileage
      : dateValue(other.date) > dateValue(current.date) ? Number(other.startMileage) < current.endMileage : false;
    if (overlap || reversed) throw new Error('Die Kilometerstände überschneiden sich mit einer anderen Fahrt dieses Fahrzeugs oder passen nicht zur zeitlichen Reihenfolge.');
  }
  return current;
}
