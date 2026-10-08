import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const code = await fs.readFile(new URL('../utils/metrics.js', import.meta.url), 'utf8');
const m = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const now = new Date(2026, 9, 8);
const fuel = (id, vehicleId, date, mileage, amount, price = 2) => ({ id, vehicleId, date, mileage, amount, price });
const entries = [fuel('a0','a','01.09.2026',1000,20), fuel('b0','b','01.09.2026',50000,50), fuel('a1','a','01.10.2026',1200,20), fuel('a2','a','05.10.2026',2000,40), fuel('b1','b','05.10.2026',50100,30)];
test('German numbers, zero and strict invalid input validation', () => {
  assert.equal(m.inputNumber('1,65', 'Preis'),1.65);
  assert.equal(m.inputNumber('12.345', 'km',{integer:true}),12345);
  assert.equal(m.inputNumber('1.234,56', 'Preis'),1234.56);
  assert.equal(m.inputNumber('0','km',{integer:true}),0);
  for (const value of ['12abc','1.2.3','-3','Infinity','','1.2,3']) assert.throws(()=>m.inputNumber(value,'Zahl'));
  assert.throws(()=>m.inputNumber('1,5','km',{integer:true}));
});
test('Trips always derive distance from odometers and reject impossible dates', () => {
  assert.equal(m.validTrip({date:'01.10.2026',startMileage:0,endMileage:200,distance:999}).distance,200);
  assert.throws(()=>m.validTrip({date:'31.02.2026',startMileage:0,endMileage:200}));
  assert.throws(()=>m.validTrip({date:'01.10.2026',startMileage:200,endMileage:100}));
  assert.ok(Number.isFinite(m.dateValue('29.02.2024')));
  assert.ok(Number.isNaN(m.dateValue('29.02.2025')));
});
test('Fuel consumption is isolated per vehicle, weighted by distance and excludes first stops',()=>{
  const rows=m.fuelMetrics(entries);
  assert.equal(rows.find(e=>e.id==='a0').consumption,null);
  assert.equal(rows.find(e=>e.id==='a1').consumption,10);
  assert.equal(rows.find(e=>e.id==='a2').consumption,5);
  assert.equal(m.averageConsumption(rows.filter(e=>e.vehicleId==='a')),6);
  assert.equal(m.fuelMetrics([fuel('legacy',null,'01.10.2026',100,20)])[0].consumption,null);
});
test('editing and deleting stops recalculates subsequent consumption without stale stored values',()=>{
  const changed=entries.map(e=>e.id==='a1'?{...e,mileage:1400,consumption:999}:e);
  assert.ok(Math.abs(m.fuelMetrics(changed).find(e=>e.id==='a2').consumption-40/600*100)<1e-10);
  assert.equal(m.fuelMetrics(entries.filter(e=>e.id!=='a1')).find(e=>e.id==='a2').consumption,4);
});
test('Statistics use actual costs, selected period and vehicle with predecessor outside period',()=>{
  const s=m.statistics({fuelEntries:entries,scope:'a',period:'month',now,trips:[{vehicleId:'a',date:'02.10.2026',startMileage:0,endMileage:1000,distance:3,category:'Freizeit'},{vehicleId:'b',date:'02.10.2026',startMileage:0,endMileage:10000}],maintenanceEntries:[{vehicleId:'a',date:'03.10.2026',cost:20}]});
  assert.equal(s.totalDistance,1000); assert.equal(s.totalCosts,140); assert.equal(s.costPerKm,0.14);
  assert.equal(s.avgConsumption,6); assert.equal(s.categoryData[0].population,1000);
  assert.deepEqual(s.costData.datasets[0].data,[140]);
  assert.equal(s.fuelEntries.length,2);
});
test('Empty statistics and mixed vehicle odometers produce no invented values',()=>{
  const s=m.statistics({now});
  assert.equal(s.totalCosts,0); assert.equal(s.costPerKm,null); assert.equal(s.avgConsumption,null);
  assert.equal(s.costData.labels.length,0); assert.equal(s.categoryData.length,0);
  assert.equal(m.statistics({now,scope:'all',trips:[{date:'01.10.2026',vehicleId:'a',startMileage:0,endMileage:100}]}).mileageData.labels.length,0);
});
test('Period filtering excludes future and invalid dates and includes full start day',()=>{
  assert.equal(m.inPeriod('08.09.2026','month',now),true);
  assert.equal(m.inPeriod('07.09.2026','month',now),false);
  assert.equal(m.inPeriod('09.10.2026','all',now),false);
  assert.equal(m.inPeriod('31.09.2026','all',now),false);
});
test('Trip timeline permits adjacent trips and separate vehicles, rejects overlaps and reversed chronology',()=>{
  const a={id:'one',vehicleId:'a',date:'01.10.2026',startMileage:100,endMileage:200};
  assert.throws(()=>m.validateTripTimeline({...a,id:'two',startMileage:150,endMileage:250},[a]),/überschneiden/);
  assert.equal(m.validateTripTimeline({...a,id:'two',startMileage:200,endMileage:250},[a]).distance,50);
  assert.equal(m.validateTripTimeline({...a,id:'two',vehicleId:'b'},[a]).distance,100);
  assert.throws(()=>m.validateTripTimeline({...a,id:'two',date:'02.10.2026',startMileage:0,endMileage:100},[a]));
});

test('new trip starts at the latest known odometer of its own vehicle', () => {
  const a={id:'a',mileage:1000}, b={id:'b',mileage:50000};
  const trips=[{vehicleId:'a',date:'01.10.2026',endMileage:1200},{vehicleId:'b',date:'02.10.2026',endMileage:50500},{vehicleId:null,date:'02.10.2026',endMileage:99999}];
  const readings=[{vehicleId:'a',date:'03.10.2026',mileage:1250},{vehicleId:'a',date:'09.10.2026',mileage:2000}];
  assert.equal(m.lastKnownMileage(a,trips,readings,now),'1250');
  assert.equal(m.lastKnownMileage(b,trips,readings,now),'50500');
  assert.equal(m.lastKnownMileage({id:'new',mileage:0},trips,readings,now),'0');
  assert.equal(m.lastKnownMileage(null,trips,readings,now),'');
  assert.equal(m.lastKnownMileage(a,[...trips,{vehicleId:'a',date:'08.10.2026',endMileage:1300}],readings,now),'1300');
});
