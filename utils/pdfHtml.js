export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const formatDate = (value) => {
  const text = String(value ?? '');
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(text)) return text;
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(text);
  return iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : text;
};
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;

// Generate HTML for statistics PDF
export const generateStatisticsHtml = (data) => {
  const {
    vehicleName,
    period,
    totalDistance,
    avgConsumption,
    maintenanceCosts,
    fuelCosts,
    totalCosts,
    costPerKm,
    totalTrips,
    totalFuelEntries,
    totalMaintenanceEntries
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Fahrzeug-Statistiken</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #8B4513;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #8B4513;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 16px;
          color: #666;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #8B4513;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }
        .stat-item {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #8B4513;
        }
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
        td { overflow-wrap: anywhere; }
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Fahrzeug-Statistiken</div>
        <div class="subtitle">${escapeHtml(vehicleName)} - ${escapeHtml(period)}</div>
      </div>

      <div class="section">
        <div class="section-title">Fahrleistung & Verbrauch</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Gefahrene Kilometer</div>
            <div class="stat-value">${number(totalDistance)} km</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Durchschnittlicher Verbrauch</div>
            <div class="stat-value">${avgConsumption.toFixed(1)} L/100km</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Anzahl Fahrten</div>
            <div class="stat-value">${number(totalTrips)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Anzahl Tankstopps</div>
            <div class="stat-value">${number(totalFuelEntries)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Kostenübersicht</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Kraftstoffkosten</div>
            <div class="stat-value">${fuelCosts.toFixed(2)} €</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Wartungskosten</div>
            <div class="stat-value">${maintenanceCosts.toFixed(2)} €</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Gesamtkosten</div>
            <div class="stat-value">${totalCosts.toFixed(2)} €</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Kosten pro Kilometer</div>
            <div class="stat-value">${costPerKm.toFixed(2)} €/km</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Wartung & Service</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Wartungseinträge</div>
            <div class="stat-value">${number(totalMaintenanceEntries)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Durchschnittliche Wartungskosten</div>
            <div class="stat-value">${totalMaintenanceEntries > 0 ? (maintenanceCosts / totalMaintenanceEntries).toFixed(2) : '0.00'} €</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
        <p>Oldtimer Fahrtenbuch - Elektronisch erstellt</p>
      </div>
    </body>
    </html>
  `;
};

// Generate HTML for trips PDF
export const generateTripsHtml = (trips, options = {}) => {
  const { vehicleInfo, exportType, dateRange } = options;
  
  const filteredTrips = exportType === 'business' 
    ? trips.filter(trip => trip.category === 'Geschäftlich')
    : trips;

  const totalDistance = filteredTrips.reduce((sum, trip) => sum + number(trip.distance), 0);
  const totalTrips = filteredTrips.length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Fahrtenbuch Export</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #8B4513;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #8B4513;
          margin-bottom: 10px;
        }
        .vehicle-info {
          font-size: 16px;
          color: #666;
          margin-bottom: 5px;
        }
        .summary {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #8B4513;
        }
        .summary-title {
          font-size: 18px;
          font-weight: bold;
          color: #8B4513;
          margin-bottom: 10px;
        }
        .summary-item {
          margin-bottom: 5px;
        }
        .trips-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .trips-table th,
        .trips-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }
        .trips-table th {
          background-color: #8B4513;
          color: white;
          font-weight: bold;
        }
        .trips-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .business-trip {
          background-color: #e8f5e8 !important;
        }
        .signature-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          width: 200px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 5px;
          font-size: 12px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
        td { overflow-wrap: anywhere; }
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Fahrtenbuch</div>
        <div class="vehicle-info">${escapeHtml(vehicleInfo?.name || 'Fahrzeug')}</div>
        <div class="vehicle-info">Kennzeichen: ${escapeHtml(vehicleInfo?.licensePlate || 'N/A')}</div>
        <div class="vehicle-info">Baujahr: ${escapeHtml(vehicleInfo?.year || 'N/A')}</div>
        ${dateRange ? `<div class="vehicle-info">Zeitraum: ${escapeHtml(dateRange)}</div>` : ''}
      </div>

      <div class="summary">
        <div class="summary-title">Zusammenfassung</div>
        <div class="summary-item"><strong>Gesamtkilometer:</strong> ${totalDistance.toFixed(1)} km</div>
        <div class="summary-item"><strong>Anzahl Fahrten:</strong> ${number(totalTrips)}</div>
        <div class="summary-item"><strong>Exporttyp:</strong> ${exportType === 'business' ? 'Nur Geschäftsfahrten' : 'Alle Fahrten'}</div>
        <div class="summary-item"><strong>Erstellt am:</strong> ${new Date().toLocaleDateString('de-DE')}</div>
      </div>

      <table class="trips-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Start</th>
            <th>Ziel</th>
            <th>Zweck</th>
            <th>Km-Stand Start</th>
            <th>Km-Stand Ende</th>
            <th>Distanz (km)</th>
            <th>Geschäftlich</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTrips.map(trip => `
            <tr class="${trip.category === 'Geschäftlich' ? 'business-trip' : ''}">
              <td>${escapeHtml(formatDate(trip.date))}</td>
              <td>${escapeHtml(trip.start || '-')}</td>
              <td>${escapeHtml(trip.destination || '-')}</td>
              <td>${escapeHtml(trip.category || '-')}</td>
              <td>${escapeHtml(trip.startMileage ?? '-')}</td>
              <td>${escapeHtml(trip.endMileage ?? '-')}</td>
              <td>${number(trip.distance).toFixed(1)}</td>
              <td>${trip.category === 'Geschäftlich' ? 'Ja' : 'Nein'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line">Datum, Unterschrift Fahrzeughalter</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Datum, Unterschrift Prüfer</div>
        </div>
      </div>

      <div class="footer">
        <p>Elektronisch erstellte Übersicht. Änderungen werden derzeit nicht revisionssicher protokolliert; eine steuerliche Anerkennung wird nicht zugesichert.</p>
        <p>Oldtimer Fahrtenbuch - Digitale Fahrzeugverwaltung</p>
      </div>
    </body>
    </html>
  `;
};

