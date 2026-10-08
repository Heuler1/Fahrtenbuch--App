// Normalizes vehicle data between Supabase (snake_case) and UI (camelCase) formats

export const normalizeVehicle = (raw) => {
  if (!raw) return null;
  return {
    id: raw.id,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
    name: raw.name || '',
    year: raw.year ?? '',
    licensePlate: raw.license_plate ?? raw.licensePlate ?? '',
    vin: raw.vin ?? '',
    mileage: raw.mileage ?? 0,
    fuelLevel: raw.fuel_level ?? raw.fuelLevel ?? 0,
    nextInspection: raw.next_inspection ?? raw.nextInspection ?? '',
    purchaseDate: raw.purchase_date ?? raw.purchaseDate ?? '',
    purchasePrice: raw.purchase_price ?? raw.purchasePrice ?? '',
    engine: raw.engine ?? '',
    power: raw.power ?? '',
    displacement: raw.displacement ?? '',
    transmission: raw.transmission ?? '',
    color: raw.color ?? '',
    interior: raw.interior ?? '',
    insurance: {
      company: raw.insurance_company ?? raw.insurance?.company ?? '',
      policyNumber: raw.insurance_policy_number ?? raw.insurance?.policyNumber ?? '',
      expiryDate: raw.insurance_expiry_date ?? raw.insurance?.expiryDate ?? '',
      cost: raw.insurance_cost ?? raw.insurance?.cost ?? '',
    },
    image: raw.image_url ?? raw.image ?? '',
    additionalImages: raw.additional_images ?? raw.additionalImages ?? [],
    notes: raw.notes ?? '',
    documents: raw.documents ?? [],
    history: raw.history ?? [],
    isActive: raw.is_active ?? raw.isActive ?? true,
    isSeasonal: raw.is_seasonal ?? raw.isSeasonal ?? false,
    seasonStart: raw.season_start ?? raw.seasonStart ?? '01.04',
    seasonEnd: raw.season_end ?? raw.seasonEnd ?? '31.10',
  };
};

export const normalizeVehicles = (rawList) => {
  if (!rawList || !Array.isArray(rawList)) return [];
  return rawList.map(normalizeVehicle);
};

// Convert a camelCase UI vehicle object to snake_case for Supabase
export const toSupabaseVehicle = (vehicle) => {
  if (!vehicle) return {};
  return {
    name: vehicle.name,
    year: typeof vehicle.year === 'string' ? parseInt(vehicle.year) || 0 : vehicle.year,
    license_plate: vehicle.licensePlate || '',
    vin: vehicle.vin || '',
    mileage: typeof vehicle.mileage === 'string' ? parseInt(vehicle.mileage) || 0 : vehicle.mileage,
    fuel_level: typeof vehicle.fuelLevel === 'string' ? parseInt(vehicle.fuelLevel) || 0 : vehicle.fuelLevel,
    next_inspection: vehicle.nextInspection || '',
    purchase_date: vehicle.purchaseDate || '',
    purchase_price: typeof vehicle.purchasePrice === 'string' ? parseFloat(vehicle.purchasePrice) || 0 : vehicle.purchasePrice || 0,
    engine: vehicle.engine || '',
    power: vehicle.power || '',
    displacement: vehicle.displacement || '',
    transmission: vehicle.transmission || '',
    color: vehicle.color || '',
    interior: vehicle.interior || '',
    insurance_company: vehicle.insurance?.company || '',
    insurance_policy_number: vehicle.insurance?.policyNumber || '',
    insurance_expiry_date: vehicle.insurance?.expiryDate || '',
    insurance_cost: typeof vehicle.insurance?.cost === 'string' ? parseFloat(vehicle.insurance.cost) || 0 : vehicle.insurance?.cost || 0,
    image_url: vehicle.image || '',
    additional_images: vehicle.additionalImages || [],
    notes: vehicle.notes || '',
    documents: vehicle.documents || [],
    history: vehicle.history || [],
    is_active: vehicle.isActive ?? true,
    is_seasonal: vehicle.isSeasonal ?? false,
    season_start: vehicle.seasonStart || '01.04',
    season_end: vehicle.seasonEnd || '31.10',
  };
};

// Normalize fuel entry from Supabase to UI format
export const normalizeFuelEntry = (raw) => {
  if (!raw) return null;
  return {
    id: raw.id,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
    date: raw.date || '',
    station: raw.station || '',
    location: raw.location || '',
    amount: parseFloat(raw.amount) || 0,
    price: parseFloat(raw.price) || 0,
    totalCost: parseFloat(raw.total_cost) || 0,
    mileage: raw.mileage || 0,
    consumption: parseFloat(raw.consumption) || 0,
    receiptImage: raw.receipt_image_url ?? raw.receiptImage ?? '',
    vehicleId: raw.vehicle_id ?? raw.vehicleId ?? null,
  };
};

// Normalize trip from Supabase to UI format
export const normalizeTrip = (raw) => {
  if (!raw) return null;
  return {
    id: raw.id,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
    date: raw.date || '',
    start: raw.start_location ?? raw.start ?? '',
    destination: raw.destination || '',
    distance: parseFloat(raw.distance) || 0,
    category: raw.category || 'Freizeit',
    startMileage: raw.start_mileage ?? raw.startMileage ?? 0,
    endMileage: raw.end_mileage ?? raw.endMileage ?? 0,
    notes: raw.notes || '',
    weather: raw.weather || '',
    vehicleId: raw.vehicle_id ?? raw.vehicleId ?? null,
  };
};

// Normalize maintenance entry from Supabase to UI format
export const normalizeMaintenanceEntry = (raw) => {
  if (!raw) return null;
  return {
    id: raw.id,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
    date: raw.date || '',
    type: raw.type || 'Wartung',
    title: raw.title || '',
    workshop: raw.workshop || '',
    cost: parseFloat(raw.cost) || 0,
    mileage: raw.mileage || 0,
    description: raw.description || '',
    parts: raw.parts || [],
    receiptImage: raw.receipt_image_url ?? raw.receiptImage ?? '',
    vehicleId: raw.vehicle_id ?? raw.vehicleId ?? null,
  };
};

// Normalize reminder from Supabase to UI format
export const normalizeReminder = (raw) => {
  if (!raw) return null;
  return {
    id: raw.id,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null,
    title: raw.title || '',
    date: raw.date || '',
    type: raw.type || 'inspection',
    description: raw.description || '',
    notifyDays: raw.notify_days ?? raw.notifyDays ?? 14,
    active: raw.active ?? true,
    priority: raw.priority || 'medium',
    vehicleId: raw.vehicle_id ?? raw.vehicleId ?? null,
  };
};


// Compare database fields so unchanged photos and documents are not uploaded again.
export const vehicleChanges = (vehicle, original) => {
  const current = toSupabaseVehicle(vehicle);
  const previous = toSupabaseVehicle(original);
  return Object.fromEntries(Object.entries(current).filter(([key, value]) =>
    JSON.stringify(value) !== JSON.stringify(previous[key])));
};
