import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateStatisticsHtml, generateTripsHtml } from './pdfHtml';

export const sharePdf = async (htmlContent, filename) => {
  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Pop-up wurde blockiert. Bitte erlauben Sie Pop-ups für den PDF-Export.');
    }
    printWindow.opener = null;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.document.title = filename;
    printWindow.focus();
    printWindow.print();
    return;
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Das Teilen von PDF-Dateien ist auf diesem Gerät nicht verfügbar.');
  }
  const { uri } = await Print.printToFileAsync({ html: htmlContent, width: 595, height: 842 });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: filename,
  });
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
