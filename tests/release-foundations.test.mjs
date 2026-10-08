import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

async function load(file, mocks = {}, globals = {}) {
  const context = vm.createContext({ console: { error() {}, warn() {} }, ...globals });
  const modules = new Map();
  async function module(path) {
    if (modules.has(path)) return modules.get(path);
    const source = await fs.readFile(new URL(path, import.meta.url), 'utf8');
    const mod = new vm.SourceTextModule(source, { context, identifier: path });
    modules.set(path, mod);
    await mod.link(async specifier => {
      if (specifier in mocks) {
        const exports = mocks[specifier];
        return new vm.SyntheticModule(Object.keys(exports), function () {
          for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
        }, { context });
      }
      return module('../utils/' + specifier.replace('./', '') + '.js');
    });
    return mod;
  }
  const mod = await module(file);
  await mod.evaluate();
  return mod.namespace;
}
const trip = { date: '07.10.2026', start: 'Linz & Umgebung', destination: 'Wien', category: 'Geschäftlich', startMileage: 0, endMileage: 212, distance: 212 };
test('PDF uses real UI fields, German dates, zero mileage and business filter', async () => {
  const pdf = await load('../utils/pdfHtml.js');
  const html = pdf.generateTripsHtml([trip, { ...trip, category: 'Freizeit', destination: 'PRIVATE' }], { exportType: 'business' });
  for (const text of ['07.10.2026', 'Linz &amp; Umgebung', 'Wien', '<td>0</td>', '212.0 km', 'Nur Geschäftsfahrten']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('PRIVATE'));
  assert.ok(!html.includes('Invalid Date'));
  assert.ok(!html.includes('entspricht den gesetzlichen Anforderungen'));
});
test('PDF escapes user data and accepts numeric strings', async () => {
  const pdf = await load('../utils/pdfHtml.js');
  const html = pdf.generateTripsHtml([{ ...trip, start: '<script>alert(1)</script>', distance: '212' }], { vehicleInfo: { name: '<img src=x onerror=alert(1)>' }, dateRange: '<iframe>' });
  assert.ok(!html.includes('<script>')); assert.ok(!html.includes('<img')); assert.ok(!html.includes('<iframe>'));
  assert.ok(html.includes('212.0 km'));
});
for (const platform of ['android', 'ios']) {
  test(`${platform}: shares the generated PDF URI with PDF metadata`, async () => {
    const calls = [];
    const pdf = await load('../utils/pdfExport.js', {
      'react-native': { Platform: { OS: platform } },
      'expo-print': { printToFileAsync: async options => { calls.push(options); return { uri: 'file:///cache/test.pdf' }; } },
      'expo-sharing': { isAvailableAsync: async () => true, shareAsync: async (uri, options) => calls.push({ uri, ...options }) },
    });
    await pdf.exportTripsPdf([trip]);
    assert.equal(calls[0].width, 595); assert.ok(calls[0].html.includes('Wien'));
    assert.equal(calls[1].uri, 'file:///cache/test.pdf'); assert.equal(calls[1].mimeType, 'application/pdf');
  });
}
test('blocked web popup rejects instead of reporting export success', async () => {
  const pdf = await load('../utils/pdfExport.js', { 'react-native': { Platform: { OS: 'web' } }, 'expo-print': {}, 'expo-sharing': {} }, { window: { open: () => null } });
  await assert.rejects(pdf.exportTripsPdf([trip]), /Pop-up/);
});
test('native print failure propagates', async () => {
  const pdf = await load('../utils/pdfExport.js', {
    'react-native': { Platform: { OS: 'android' } },
    'expo-print': { printToFileAsync: async () => { throw new Error('print failed'); } },
    'expo-sharing': { isAvailableAsync: async () => true },
  });
  await assert.rejects(pdf.exportTripsPdf([trip]), /print failed/);
});
test('cloud read failures are never converted to empty data', async () => {
  const storage = await load('../utils/supabaseStorage.js', { './supabaseClient': { supabase: { auth: { getUser: async () => { throw new Error('offline'); } } } } });
  for (const name of ['getVehicles', 'getTrips', 'getFuelEntries', 'getMaintenanceEntries', 'getReminders', 'getCurrentVehicle', 'getUserProfile']) await assert.rejects(storage[name](), /offline/);
});
test('storage facade propagates writes and never acknowledges a local fallback', async () => {
  const fail = async () => { throw new Error('offline'); };
  const storage = await load('../utils/storage.js', { './supabaseStorage': { addTrip: fail, getTrips: fail } });
  await assert.rejects(storage.addTrip(trip), /offline/);
  await assert.rejects(storage.getTrips(), /offline/);
});
test('mobile session storage uses AsyncStorage and disables URL detection', async () => {
  let options;
  const adapter = { getItem() {}, setItem() {}, removeItem() {} };
  await load('../utils/supabaseClient.js', {
    'react-native-url-polyfill/auto': {},
    '@react-native-async-storage/async-storage': { default: adapter },
    'react-native': { Platform: { OS: 'ios' } },
    '@supabase/supabase-js': { createClient: (url, key, config) => { options = config; return {}; } },
  }, { process: { env: { EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'test' } } });
  assert.equal(options.auth.storage, adapter); assert.equal(options.auth.detectSessionInUrl, false);
});
test('vehicle validation names missing fields and accepts zero mileage', async () => {
  const { validateVehicleForm } = await load('../utils/vehicleForm.js');
  assert.throws(() => validateVehicleForm({}), /Fahrzeugname, Baujahr, Kennzeichen, Kilometerstand/);
  const input = { name: ' Test ', year: '1969', licensePlate: ' RO-TEST ', mileage: '0', fuelLevel: '0' };
  const result = validateVehicleForm(input, 2026);
  assert.equal(result.name, 'Test'); assert.equal(result.mileage, 0); assert.equal(result.fuelLevel, 0);
  assert.equal(result.nextInspection, '');
});
test('vehicle odometer is not silently truncated and numeric input is validated', async () => {
  const { validateVehicleForm } = await load('../utils/vehicleForm.js');
  const input = { name: 'Test', year: '1969', licensePlate: 'TEST', mileage: '78.432', fuelLevel: '50' };
  assert.equal(validateVehicleForm(input, 2026).mileage, 78432);
  for (const mileage of ['78,5', '78abc', '-1', '1.23', '2147483648']) assert.throws(() => validateVehicleForm({ ...input, mileage }, 2026));
  for (const year of ['1969x', '2027']) assert.throws(() => validateVehicleForm({ ...input, year }, 2026));
  assert.throws(() => validateVehicleForm({ ...input, fuelLevel: '101' }, 2026));
});
test('vehicle insert maps fields and surfaces database rejection', async () => {
  let inserted;
  let fail = false;
  const storage = await load('../utils/supabaseStorage.js', { './supabaseClient': { supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } }, error: null }) },
    from: table => { assert.equal(table, 'vehicles'); return { insert: row => {
      inserted = row; return { select: () => ({ single: async () => fail ? { error: { code: '42501', message: 'denied' } } : { data: { id: 'saved', ...row }, error: null } }) };
    } }; },
  } } });
  const result = await storage.addVehicle({ name: 'Test', year: 1969, mileage: 0, fuelLevel: 50, licensePlate: 'TEST' });
  assert.equal(result.id, 'saved'); assert.equal(inserted.user_id, 'owner'); assert.equal(inserted.license_plate, 'TEST');
  assert.equal(inserted.insurance_cost, 0); assert.equal(inserted.next_inspection, '');
  fail = true;
  await assert.rejects(storage.addVehicle({ name: 'Test' }), e => e.code === '42501');
});

// Model the server's filtered atomic mutations and updated_at trigger.
async function recordFixture() {
  const db = { vehicles: [{ id: 'v1', user_id: 'owner' }, { id: 'v2', user_id: 'owner' }, { id: 'foreign', user_id: 'other' }] };
  const operations = [];
  let serial = 1, failWrite = false;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } }, error: null }) },
    from(table) {
      const filters = []; let action = 'select', payload;
      const execute = () => {
        operations.push({ table, action, filters: [...filters], payload });
        const rows = db[table] ||= [];
        const matches = rows.filter(row => filters.every(([k, v]) => row[k] === v));
        if (action !== 'select' && failWrite) return { error: { message: 'network write failed' }, data: null };
        if (action === 'insert') {
          const row = { ...payload, id: `uuid-${serial++}`, updated_at: `version-${serial++}` };
          rows.push(row); return { data: [row], error: null };
        }
        if (action === 'update') for (const row of matches) Object.assign(row, payload, { updated_at: `version-${serial++}` });
        if (action === 'delete') db[table] = rows.filter(row => !matches.includes(row));
        return { data: matches.map(row => ({ ...row })), error: null };
      };
      const q = {
        select: () => q, eq: (k, v) => { filters.push([k, v]); return q; }, order: () => q,
        insert: data => { action = 'insert'; payload = data; return q; },
        update: data => { action = 'update'; payload = data; return q; },
        delete: () => { action = 'delete'; return q; },
        single: async () => { const r = execute(); return { ...r, data: r.data?.[0] ?? null }; },
        then: (resolve, reject) => Promise.resolve(execute()).then(resolve, reject),
      };
      return q;
    },
  };
  const storage = await load('../utils/supabaseStorage.js', { './supabaseClient': { supabase: client } });
  return { storage, db, operations, setFailure: value => { failWrite = value; } };
}

for (const [name, table, fields] of [
  ['Trip', 'trips', { date: '07.10.2026', start: 'Linz', destination: 'Wien', category: 'Freizeit', distance: 200, startMileage: 0, endMileage: 200 }],
  ['FuelEntry', 'fuel_entries', { date: '07.10.2026', station: 'Test', amount: 20, price: 1.5, totalCost: 30, mileage: 200, consumption: 10 }],
  ['MaintenanceEntry', 'maintenance_entries', { date: '07.10.2026', title: 'Service', type: 'Wartung', cost: 10, mileage: 200 }],
  ['Reminder', 'reminders', { date: '07.10.2026', title: 'Service', type: 'inspection', active: true, notifyDays: 14, priority: 'medium' }],
]) {
  test(`${name}: single-row create/update/delete preserves other vehicles and owners`, async () => {
    const { storage, db, operations } = await recordFixture();
    db[table] = [{ id: 'other-owner', user_id: 'other', vehicle_id: 'foreign', updated_at: 'old' }];
    const first = await storage[`add${name}`]({ ...fields, vehicleId: 'v1', id: 'caller-id', user_id: 'other' });
    const second = await storage[`add${name}`]({ ...fields, vehicleId: 'v2' });
    assert.notEqual(first.id, 'caller-id'); assert.equal(first.user_id, 'owner');
    const version = first.updated_at;
    const changed = await storage[`update${name}`]({ ...fields, id: first.id, updatedAt: version, vehicleId: 'v1' });
    assert.equal(changed.id, first.id); assert.notEqual(changed.updated_at, version);
    assert.equal(db[table].find(row => row.id === second.id).updated_at, second.updated_at);
    await assert.rejects(storage[`update${name}`]({ ...fields, id: first.id, updatedAt: version, vehicleId: 'v1' }), /inzwischen geändert/);
    await assert.rejects(storage[`delete${name}`]({ id: first.id, updatedAt: version }), /inzwischen geändert/);
    await storage[`delete${name}`]({ id: first.id, updatedAt: changed.updated_at });
    assert.deepEqual(db[table].map(row => row.id).sort(), ['other-owner', second.id].sort());
    for (const op of operations.filter(op => ['delete', 'update'].includes(op.action))) {
      assert.ok(op.filters.some(([key]) => key === 'id'));
      assert.ok(op.filters.some(([key, value]) => key === 'user_id' && value === 'owner'));
      assert.ok(op.filters.some(([key]) => key === 'updated_at'));
    }
  });
  test(`${name}: failed write, foreign vehicle and missing association leave data intact`, async () => {
    const { storage, db, operations, setFailure } = await recordFixture();
    const first = await storage[`add${name}`]({ ...fields, vehicleId: 'v1' });
    const before = JSON.stringify(db);
    for (const vehicleId of [null, 'foreign']) await assert.rejects(storage[`add${name}`]({ ...fields, vehicleId }));
    await assert.rejects(storage[`update${name}`]({ ...fields, id: first.id, vehicleId: 'v1' }), /Version/);
    setFailure(true);
    await assert.rejects(storage[`update${name}`]({ ...fields, id: first.id, vehicleId: 'v1', updatedAt: first.updated_at }), e => e.message === 'network write failed');
    await assert.rejects(storage[`add${name}`]({ ...fields, vehicleId: 'v1' }));
    assert.equal(JSON.stringify(db), before);
    assert.equal(operations.filter(op => op.action === 'delete').length, 0);
  });
}
test('legacy unassigned record retains ID when explicitly assigned to an owned vehicle', async () => {
  const { storage, db } = await recordFixture();
  db.trips = [{ id: 'legacy', user_id: 'owner', vehicle_id: null, updated_at: 'legacy-version' }];
  const result = await storage.updateTrip({ ...trip, id: 'legacy', updatedAt: 'legacy-version', vehicleId: 'v2' });
  assert.equal(result.id, 'legacy'); assert.equal(result.vehicle_id, 'v2');
});
test('vehicle normalizers preserve exact server version for compare-and-swap', async () => {
  const { normalizeTrip, normalizeVehicle } = await load('../utils/vehicleUtils.js');
  const version = '2026-10-07T19:00:00.123456+00:00';
  assert.equal(normalizeTrip({ id: 't1', updated_at: version }).updatedAt, version);
  assert.equal(normalizeVehicle({ id: 'v1', updated_at: version }).updatedAt, version);
});
test('vehicle edit and deletion reject stale versions without touching siblings', async () => {
  const { storage, db } = await recordFixture();
  db.vehicles[0].updated_at = 'v1-old';
  const saved = await storage.updateVehicle('v1', { name: 'Changed' }, 'v1-old');
  assert.equal(saved.id, 'v1');
  await assert.rejects(storage.updateVehicle('v1', { name: 'Stale' }, 'v1-old'), /inzwischen geändert/);
  await assert.rejects(storage.deleteVehicle('v1', 'v1-old'), /inzwischen geändert/);
  assert.equal(db.vehicles[0].name, 'Changed');
  await storage.deleteVehicle('v1', saved.updated_at);
  assert.deepEqual(db.vehicles.map(row => row.id), ['v2', 'foreign']);
});

test('dashboard can switch between two active vehicles and remembers choice per account', async () => {
  const values = new Map();
  const selection = await load('../utils/dashboardVehicle.js', {
    '@react-native-async-storage/async-storage': { default: {
      getItem: async key => values.get(key) || null,
      setItem: async (key, value) => values.set(key, value),
    } },
  });
  const vehicles = [{ id: 'first', isActive: true }, { id: 'second', isActive: true }];
  assert.equal((await selection.loadDashboardVehicle(vehicles, 'alice')).id, 'first');
  await selection.saveDashboardVehicle('second', 'alice');
  assert.equal((await selection.loadDashboardVehicle(vehicles, 'alice')).id, 'second');
  assert.equal((await selection.loadDashboardVehicle(vehicles, 'bob')).id, 'first');
  assert.equal((await selection.loadDashboardVehicle([vehicles[0]], 'alice')).id, 'first');
  assert.equal(await selection.loadDashboardVehicle([], 'alice'), null);
  assert.ok(vehicles.every(vehicle => vehicle.isActive));
});
test('dashboard selection reports persistence errors and rejects missing account', async () => {
  const selection = await load('../utils/dashboardVehicle.js', {
    '@react-native-async-storage/async-storage': { default: {
      getItem: async () => null,
      setItem: async () => { throw new Error('storage unavailable'); },
    } },
  });
  await assert.rejects(selection.saveDashboardVehicle('second', 'alice'), /storage unavailable/);
  await assert.rejects(selection.saveDashboardVehicle('second', null), /anmelden/);
});
