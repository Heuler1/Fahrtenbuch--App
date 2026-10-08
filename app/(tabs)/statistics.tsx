import { statistics } from '../../utils/metrics';
import { showMessage, errorMessage } from '../../utils/showMessage';
import { useFocusEffect } from 'expo-router';
import VehicleSelect from '../../components/VehicleSelect';
import { useRecordVehicles } from '../../hooks/useRecordVehicles';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ChartBar as BarChart3, TrendingUp, Calendar, Fuel, Wrench, DollarSign, ChevronDown, ChevronUp, Car } from 'lucide-react-native';
import CostChart from '../../components/CostChart';
import CategoryPieChart from '../../components/CategoryPieChart';
import ConsumptionChart from '../../components/ConsumptionChart';
import MileageChart from '../../components/MileageChart';
import { exportStatisticsPdf } from '../../utils/pdfExport';
import { 
  getFuelEntries, 
  getTrips, 
  getMaintenanceEntries, 
  getCurrentVehicle,
  getVehicles
} from '../../utils/storage';

export default function StatisticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedStats, setExpandedStats] = useState(false);
  const [showConsumptionChart, setShowConsumptionChart] = useState(true);
  const [showCostChart, setShowCostChart] = useState(true);
  const [showCategoryChart, setShowCategoryChart] = useState(true);
  const [showMileageChart, setShowMileageChart] = useState(true);
  
  const { vehicles, scope, setScope, matchesVehicle } = useRecordVehicles();
  const currentVehicle = vehicles.find(vehicle => vehicle.id === scope) || null;
  const scopeLabel = currentVehicle?.name || (scope === 'unassigned' ? 'Ohne Fahrzeugzuordnung' : 'Alle Fahrzeuge');
  const [allFuelEntries, setFuelEntries] = useState([]);
  const fuelEntries = allFuelEntries.filter(matchesVehicle);
  const [allTrips, setTrips] = useState([]);
  const trips = allTrips.filter(matchesVehicle);
  const [allMaintenanceEntries, setMaintenanceEntries] = useState([]);
  const maintenanceEntries = allMaintenanceEntries.filter(matchesVehicle);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  // Load data from storage
  useFocusEffect(React.useCallback(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        
        try {
          // Load fuel entries, trips, and maintenance entries
          const allFuelEntries = await getFuelEntries();
          const allTrips = await getTrips();
          const allMaintenanceEntries = await getMaintenanceEntries();
          
          // Set data with fallbacks to empty arrays
          setFuelEntries(allFuelEntries || []);
          setTrips(allTrips || []);
          setMaintenanceEntries(allMaintenanceEntries || []);
        } catch (storageError) {
          setLoadError(errorMessage(storageError));
          setFuelEntries([]);
          setTrips([]);
          setMaintenanceEntries([]);

        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []));
  
  const summary = statistics({ fuelEntries: allFuelEntries, trips: allTrips, maintenanceEntries: allMaintenanceEntries, scope, period: selectedPeriod });
  const { totalDistance, avgConsumption, maintenanceCosts, fuelCosts, totalCosts, costPerKm, costData, categoryData, consumptionData, mileageData } = summary;
  const filteredFuelEntries = summary.fuelEntries;
  const filteredTrips = summary.trips;
  const filteredMaintenanceEntries = summary.maintenanceEntries;

  const toggleExpandedStats = () => {
    setExpandedStats(!expandedStats);
  };

  const toggleConsumptionChart = () => {
    setShowConsumptionChart(!showConsumptionChart);
  };

  const toggleCostChart = () => {
    setShowCostChart(!showCostChart);
  };

  const toggleCategoryChart = () => {
    setShowCategoryChart(!showCategoryChart);
  };

  const toggleMileageChart = () => {
    setShowMileageChart(!showMileageChart);
  };

  const handleExportStatistics = async () => {
    try {
      const statisticsData = {
        vehicleName: scopeLabel,
        period: selectedPeriod === 'month' ? 'Letzter Monat' : 
                selectedPeriod === 'quarter' ? 'Letztes Quartal' : 
                selectedPeriod === 'year' ? 'Letztes Jahr' : 'Gesamtzeitraum',
        totalDistance,
        avgConsumption,
        maintenanceCosts,
        fuelCosts,
        totalCosts,
        costPerKm,
        totalTrips: filteredTrips.length,
        totalFuelEntries: filteredFuelEntries.length,
        totalMaintenanceEntries: filteredMaintenanceEntries.length
      };

      await exportStatisticsPdf(statisticsData);
      showMessage('Erfolg', 'Statistiken wurden erfolgreich exportiert.');
    } catch (error) {
      console.error('Error exporting statistics:', error);
      showMessage('Fehler', 'Beim Exportieren der Statistiken ist ein Fehler aufgetreten.');
    }
  };

  const totalAllCosts = totalCosts;
  const totalFuelCosts = fuelCosts;
  const totalMaintenanceCosts = maintenanceCosts;
  const overallCostPerKm = costPerKm;
  const totalTripsCount = filteredTrips.length;
  const totalFuelEntriesCount = filteredFuelEntries.length;
  const totalMaintenanceEntriesCount = filteredMaintenanceEntries.length;

  if (isLoading) return <View style={{ padding: 24 }}><Text>Statistiken werden geladen …</Text></View>;
  if (loadError) return <View style={{ padding: 24 }}><Text>{loadError}</Text><Text>Bitte die Ansicht wechseln und erneut öffnen.</Text></View>;
  return (
    <ScrollView style={styles.container}>

      <VehicleSelect vehicles={vehicles} value={scope} onChange={setScope} filter />
      <View style={styles.header}>
        <Text style={styles.title}>Statistiken</Text>
        {currentVehicle && (
          <Text style={styles.subtitle}>{currentVehicle.name}</Text>
        )}
      </View>
      
      <View style={styles.periodSelector}>
        <TouchableOpacity 
          style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>Monat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.periodButton, selectedPeriod === 'quarter' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('quarter')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'quarter' && styles.periodTextActive]}>Quartal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('year')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'year' && styles.periodTextActive]}>Jahr</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.periodButton, selectedPeriod === 'all' && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod('all')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'all' && styles.periodTextActive]}>Gesamt</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={{ padding: 16, color: '#666' }}>Auswertung des gewählten Zeitraums. Kosten enthalten erfassten Kraftstoff und Wartungen; Versicherung und weitere Fixkosten sind nicht enthalten. Verbrauch ist ein Schätzwert und nur bei vergleichbarem Tankfüllstand aussagekräftig.</Text>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Calendar size={24} color="#8B4513" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{totalDistance} km</Text>
            <Text style={styles.summaryLabel}>Erfasste Fahrtkilometer</Text>
          </View>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Fuel size={24} color="#8B4513" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{(avgConsumption === null ? '–' : avgConsumption.toFixed(1))} L/100km</Text>
            <Text style={styles.summaryLabel}>Verbrauch (Schätzwert)</Text>
          </View>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Wrench size={24} color="#8B4513" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{maintenanceCosts.toFixed(2)} €</Text>
            <Text style={styles.summaryLabel}>Wartungskosten</Text>
          </View>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <DollarSign size={24} color="#8B4513" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{(costPerKm === null ? '–' : costPerKm.toFixed(2))} €/km</Text>
            <Text style={styles.summaryLabel}>Kosten pro km</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.chartHeaderRow}>
          <Text style={styles.chartTitle}>Kosten pro Monat</Text>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={toggleCostChart}
          >
            {showCostChart ? (
              <ChevronUp size={20} color="#8B4513" />
            ) : (
              <ChevronDown size={20} color="#8B4513" />
            )}
          </TouchableOpacity>
        </View>
        {showCostChart && <CostChart data={costData} />}
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.chartHeaderRow}>
          <Text style={styles.chartTitle}>Fahrleistung nach Kategorien</Text>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={toggleCategoryChart}
          >
            {showCategoryChart ? (
              <ChevronUp size={20} color="#8B4513" />
            ) : (
              <ChevronDown size={20} color="#8B4513" />
            )}
          </TouchableOpacity>
        </View>
        {showCategoryChart && <CategoryPieChart data={categoryData} />}
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.chartHeaderRow}>
          <Text style={styles.chartTitle}>Verbrauchstrend</Text>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={toggleConsumptionChart}
          >
            {showConsumptionChart ? (
              <ChevronUp size={20} color="#8B4513" />
            ) : (
              <ChevronDown size={20} color="#8B4513" />
            )}
          </TouchableOpacity>
        </View>
        {showConsumptionChart && <ConsumptionChart data={consumptionData} />}
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.chartHeaderRow}>
          <Text style={styles.chartTitle}>Kilometerstand</Text>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={toggleMileageChart}
          >
            {showMileageChart ? (
              <ChevronUp size={20} color="#8B4513" />
            ) : (
              <ChevronDown size={20} color="#8B4513" />
            )}
          </TouchableOpacity>
        </View>
        {showMileageChart && (!currentVehicle ? <Text>Für den Kilometerverlauf bitte ein Fahrzeug auswählen.</Text> : <MileageChart data={mileageData} />)}
      </View>
      
      <View style={styles.detailedStatsContainer}>
        <View style={styles.detailedStatsHeader}>
          <Text style={styles.detailedStatsTitle}>Detaillierte Statistiken</Text>
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={toggleExpandedStats}
          >
            {expandedStats ? (
              <ChevronUp size={20} color="#8B4513" />
            ) : (
              <ChevronDown size={20} color="#8B4513" />
            )}
          </TouchableOpacity>
        </View>
        
        {expandedStats && (
          <>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Erfasste Fahrtkilometer:</Text>
              <Text style={styles.statValue}>{totalDistance} km</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Gesamtkosten:</Text>
              <Text style={styles.statValue}>{totalAllCosts.toFixed(2)} €</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Kraftstoffkosten:</Text>
              <Text style={styles.statValue}>{totalFuelCosts.toFixed(2)} €</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Wartungskosten:</Text>
              <Text style={styles.statValue}>{totalMaintenanceCosts.toFixed(2)} €</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Kosten pro Kilometer:</Text>
              <Text style={styles.statValue}>{(overallCostPerKm === null ? '–' : overallCostPerKm.toFixed(2))} €</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Fahrten gesamt:</Text>
              <Text style={styles.statValue}>{totalTripsCount}</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tankstopps gesamt:</Text>
              <Text style={styles.statValue}>{totalFuelEntriesCount}</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Wartungseinträge:</Text>
              <Text style={styles.statValue}>{totalMaintenanceEntriesCount}</Text>
            </View>
          </>
        )}
      </View>
      
      <View style={styles.exportContainer}>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportStatistics}>
          <Text style={styles.exportButtonText}>Statistiken exportieren</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {`Daten für ${scopeLabel}`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  periodButtonActive: {
    borderBottomColor: '#8B4513',
  },
  periodText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  periodTextActive: {
    color: '#8B4513',
    fontFamily: 'Montserrat-SemiBold',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  summaryCard: {
    width: '50%',
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  categorySelector: {
    padding: 16,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F0F0F0',
  },
  categoryButtonActive: {
    backgroundColor: '#8B4513',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailedStatsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailedStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailedStatsTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
  },
  exportContainer: {
    padding: 16,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exportButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#FFF',
  },
  footer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#999',
  },
});
