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
  const storage = await load('../utils/storage.js', { './supabaseStorage': { setTrips: fail, getTrips: fail } });
  await assert.rejects(storage.setTrips([trip]), /offline/);
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
