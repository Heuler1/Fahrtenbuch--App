import { Share } from 'react-native';
import { Platform } from 'react-native';

// Helper function to share PDF across platforms
const sharePdf = async (htmlContent, filename) => {
  try {
    if (Platform.OS === 'web') {
      // For web, create a blob and download
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Pop-up wurde blockiert! Bitte erlauben Sie Pop-ups für diese Seite, um das PDF zu exportieren.');
        return;
      }
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    } else {
      // For mobile platforms, use Share API
      await Share.share({
        message: `${filename}.pdf`,
        title: filename,
      });
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
};

// Generate HTML for statistics PDF
const generateStatisticsHtml = (data) => {
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
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Fahrzeug-Statistiken</div>
        <div class="subtitle">${vehicleName} - ${period}</div>
      </div>

      <div class="section">
        <div class="section-title">Fahrleistung & Verbrauch</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Gefahrene Kilometer</div>
            <div class="stat-value">${totalDistance} km</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Durchschnittlicher Verbrauch</div>
            <div class="stat-value">${avgConsumption.toFixed(1)} L/100km</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Anzahl Fahrten</div>
            <div class="stat-value">${totalTrips}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Anzahl Tankstopps</div>
            <div class="stat-value">${totalFuelEntries}</div>
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
            <div class="stat-value">${totalMaintenanceEntries}</div>
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
const generateTripsHtml = (trips, options = {}) => {
  const { vehicleInfo, exportType, dateRange } = options;
  
  const filteredTrips = exportType === 'business' 
    ? trips.filter(trip => trip.purpose === 'Geschäftlich')
    : trips;

  const totalDistance = filteredTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
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
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Fahrtenbuch</div>
        <div class="vehicle-info">${vehicleInfo?.name || 'Fahrzeug'}</div>
        <div class="vehicle-info">Kennzeichen: ${vehicleInfo?.licensePlate || 'N/A'}</div>
        <div class="vehicle-info">Baujahr: ${vehicleInfo?.year || 'N/A'}</div>
        ${dateRange ? `<div class="vehicle-info">Zeitraum: ${dateRange}</div>` : ''}
      </div>

      <div class="summary">
        <div class="summary-title">Zusammenfassung</div>
        <div class="summary-item"><strong>Gesamtkilometer:</strong> ${totalDistance.toFixed(1)} km</div>
        <div class="summary-item"><strong>Anzahl Fahrten:</strong> ${totalTrips}</div>
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
            <tr class="${trip.purpose === 'Geschäftlich' ? 'business-trip' : ''}">
              <td>${new Date(trip.date).toLocaleDateString('de-DE')}</td>
              <td>${trip.startLocation || '-'}</td>
              <td>${trip.endLocation || '-'}</td>
              <td>${trip.purpose || '-'}</td>
              <td>${trip.startMileage || '-'}</td>
              <td>${trip.endMileage || '-'}</td>
              <td>${trip.distance ? trip.distance.toFixed(1) : '-'}</td>
              <td>${trip.purpose === 'Geschäftlich' ? 'Ja' : 'Nein'}</td>
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
        <p>Dieses Fahrtenbuch wurde elektronisch erstellt und entspricht den gesetzlichen Anforderungen.</p>
        <p>Oldtimer Fahrtenbuch - Digitale Fahrzeugverwaltung</p>
      </div>
    </body>
    </html>
  `;
};

// Export statistics as PDF
export const exportStatisticsPdf = async (statisticsData) => {
  try {
    const htmlContent = generateStatisticsHtml(statisticsData);
    const filename = `Statistiken_${statisticsData.vehicleName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    
    await sharePdf(htmlContent, filename);
    return true;
  } catch (error) {
    console.error('Error exporting statistics PDF:', error);
    throw error;
  }
};

// Export trips as PDF
export const exportTripsPdf = async (trips, options = {}) => {
  try {
    const htmlContent = generateTripsHtml(trips, options);
    const filename = `Fahrtenbuch_${options.vehicleInfo?.licensePlate || 'Export'}_${new Date().toISOString().split('T')[0]}`;
    
    await sharePdf(htmlContent, filename);
    return true;
  } catch (error) {
    console.error('Error exporting trips PDF:', error);
    throw error;
  }
};