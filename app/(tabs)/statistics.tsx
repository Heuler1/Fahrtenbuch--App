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
  
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenanceEntries, setMaintenanceEntries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        try {
          // Load current vehicle
          const vehicle = await getCurrentVehicle();
          setCurrentVehicle(vehicle);
          
          // Load all vehicles
          const allVehicles = await getVehicles();
          if (allVehicles) {
            setVehicles(allVehicles);
          }
          
          // Load fuel entries, trips, and maintenance entries
          const allFuelEntries = await getFuelEntries();
          const allTrips = await getTrips();
          const allMaintenanceEntries = await getMaintenanceEntries();
          
          // Set data with fallbacks to empty arrays
          setFuelEntries(allFuelEntries || []);
          setTrips(allTrips || []);
          setMaintenanceEntries(allMaintenanceEntries || []);
        } catch (storageError) {
          console.warn('Storage error, using default data:', storageError);
          setFuelEntries([]);
          setTrips([]);
          setMaintenanceEntries([]);
          setCurrentVehicle(null);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Calculate statistics based on the selected period
  const getFilteredData = () => {
    const now = new Date();
    let startDate;
    
    switch (selectedPeriod) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }
    
    // Convert date strings (DD.MM.YYYY) to Date objects for comparison
    const isAfterStartDate = (dateStr) => {
      if (!dateStr) return false;
      
      try {
        const parts = dateStr.split('.');
        if (parts.length !== 3) return false;
        
        const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        return date >= startDate;
      } catch (e) {
        console.error('Error parsing date:', e);
        return false;
      }
    };
    
    // Filter data based on date
    const filteredFuelEntries = fuelEntries.filter(entry => entry && entry.date && isAfterStartDate(entry.date));
    const filteredTrips = trips.filter(trip => trip && trip.date && isAfterStartDate(trip.date));
    const filteredMaintenanceEntries = maintenanceEntries.filter(entry => entry && entry.date && isAfterStartDate(entry.date));
    
    return {
      fuelEntries: filteredFuelEntries,
      trips: filteredTrips,
      maintenanceEntries: filteredMaintenanceEntries
    };
  };
  
  // Get filtered data based on selected period
  const { fuelEntries: filteredFuelEntries, trips: filteredTrips, maintenanceEntries: filteredMaintenanceEntries } = getFilteredData();
  
  // Calculate statistics
  const totalDistance = filteredTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0);
  const avgConsumption = filteredFuelEntries.length > 0 
    ? filteredFuelEntries.reduce((sum, entry) => sum + (entry.consumption || 0), 0) / filteredFuelEntries.length 
    : 0;
  const maintenanceCosts = filteredMaintenanceEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
  const fuelCosts = filteredFuelEntries.reduce((sum, entry) => sum + (entry.totalCost || 0), 0);
  
  // Additional costs for classic cars (estimated)
  const insuranceCostPerYear = 901.10; // Annual insurance cost
  const depreciationPerYear = 0; // Classic cars often appreciate instead of depreciate
  const storageCostPerYear = 1200; // Storage/garage cost per year
  const registrationCostPerYear = 200; // Annual registration fees
  const miscCostsPerYear = 500; // Miscellaneous costs
  
  // Calculate period-adjusted additional costs
  let periodFactor;
  switch (selectedPeriod) {
    case 'month':
      periodFactor = 1/12;
      break;
    case 'quarter':
      periodFactor = 3/12;
      break;
    case 'year':
      periodFactor = 1;
      break;
    case 'all':
      // Estimate 3 years of data for "all time" view
      periodFactor = 3;
      break;
    default:
      periodFactor = 1;
  }
  
  // Calculate additional costs for the period
  const additionalCosts = (
    (insuranceCostPerYear + 
    depreciationPerYear + 
    storageCostPerYear + 
    registrationCostPerYear + 
    miscCostsPerYear) * periodFactor
  );
  
  // Total costs including additional costs
  const totalCosts = maintenanceCosts + fuelCosts + additionalCosts;
  
  // Calculate cost per km (with a minimum to avoid unrealistically low values)
  const costPerKm = totalDistance > 0 
    ? Math.max(totalCosts / totalDistance, 0.50) // Minimum 0.50€/km for classic cars
    : 0.85; // Default value if no distance data
  
  // Prepare chart data
  const costData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun"],
    datasets: [
      {
        data: [450, 680, 520, 390, 750, 620],
      }
    ]
  };

  // Prepare category data
  const categoryData = [
    {
      name: 'Freizeit',
      population: filteredTrips.filter(trip => trip.category === 'Freizeit').length || 5,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Geschäftlich',
      population: filteredTrips.filter(trip => trip.category === 'Geschäftlich').length || 2,
      color: '#2196F3',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Oldtimertreffen',
      population: filteredTrips.filter(trip => trip.category === 'Oldtimertreffen').length || 3,
      color: '#FF9800',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
  ].filter(item => item.population > 0);

  // Prepare consumption data
  const consumptionData = {
    labels: filteredFuelEntries.length > 0 
      ? filteredFuelEntries.slice(0, 6).map(entry => {
          const dateParts = entry.date.split('.');
          return dateParts[1] + '/' + dateParts[2].substring(2);
        })
      : ["Jun", "Jul", "Aug", "Sep", "Okt", "Nov"],
    datasets: [
      {
        data: filteredFuelEntries.length > 0
          ? filteredFuelEntries.slice(0, 6).map(entry => entry.consumption || 0)
          : [9.8, 10.2, 9.5, 9.7, 10.1, 9.6],
        color: (opacity = 1) => `rgba(139, 69, 19, ${opacity})`, // Brown color
        strokeWidth: 2
      }
    ],
    legend: ["L/100km"]
  };

  // Prepare mileage data
  const mileageData = {
    labels: filteredTrips.length > 0
      ? filteredTrips.slice(0, 6).map(trip => {
          const dateParts = trip.date.split('.');
          return dateParts[1] + '/' + dateParts[2].substring(2);
        })
      : ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun"],
    datasets: [
      {
        data: filteredTrips.length > 0
          ? filteredTrips.slice(0, 6).map(trip => trip.endMileage || 0)
          : [76800, 77200, 77500, 77890, 78167, 78432],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue color
        strokeWidth: 2
      }
    ],
    legend: ["Kilometer"]
  };

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
        vehicleName: currentVehicle ? currentVehicle.name : 'Unbekanntes Fahrzeug',
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
      Alert.alert('Erfolg', 'Statistiken wurden erfolgreich exportiert.');
    } catch (error) {
      console.error('Error exporting statistics:', error);
      Alert.alert('Fehler', 'Beim Exportieren der Statistiken ist ein Fehler aufgetreten.');
    }
  };

  // Calculate detailed statistics
  const totalKilometers = currentVehicle ? parseInt(currentVehicle.mileage) || 0 : 0;
  const totalMaintenanceCosts = maintenanceEntries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
  const totalFuelCosts = fuelEntries.reduce((sum, entry) => sum + (entry.totalCost || 0), 0);
  const totalInsuranceCosts = 901.10; // Example value, would be calculated from insurance data
  
  // Additional costs for detailed statistics
  const totalStorageCosts = 1200 * 3; // 3 years of storage costs
  const totalRegistrationCosts = 200 * 3; // 3 years of registration costs
  const totalMiscCosts = 500 * 3; // 3 years of miscellaneous costs
  
  // Total all costs including additional costs
  const totalAllCosts = totalMaintenanceCosts + totalFuelCosts + totalInsuranceCosts + 
                        totalStorageCosts + totalRegistrationCosts + totalMiscCosts;
  
  const monthlyAvgCosts = totalAllCosts / 36; // 36 months (3 years)
  
  // Calculate overall cost per km with a realistic minimum for classic cars
  const overallCostPerKm = totalKilometers > 0 
    ? Math.max(totalAllCosts / totalKilometers, 0.50) // Minimum 0.50€/km
    : 0.85; // Default value
  
  const totalTripsCount = trips.length;
  const totalFuelEntriesCount = fuelEntries.length;
  const totalMaintenanceEntriesCount = maintenanceEntries.length;

  return (
    <ScrollView style={styles.container}>
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
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Calendar size={24} color="#8B4513" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{totalDistance} km</Text>
            <Text style={styles.summaryLabel}>Gefahrene Kilometer</Text>
          </View>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Fuel size={24} color="#8B4513" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{avgConsumption.toFixed(1)} L/100km</Text>
            <Text style={styles.summaryLabel}>Durchschn. Verbrauch</Text>
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
            <Text style={styles.summaryValue}>{costPerKm.toFixed(2)} €/km</Text>
            <Text style={styles.summaryLabel}>Kosten pro km</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.categorySelector}>
        <Text style={styles.sectionTitle}>Kategorien</Text>
        <View style={styles.categoryButtons}>
          <TouchableOpacity 
            style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>Alle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.categoryButton, selectedCategory === 'fuel' && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory('fuel')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'fuel' && styles.categoryTextActive]}>Kraftstoff</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.categoryButton, selectedCategory === 'maintenance' && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory('maintenance')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'maintenance' && styles.categoryTextActive]}>Wartung</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.categoryButton, selectedCategory === 'trips' && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory('trips')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'trips' && styles.categoryTextActive]}>Fahrten</Text>
          </TouchableOpacity>
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
        {showMileageChart && <MileageChart data={mileageData} />}
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
              <Text style={styles.statLabel}>Gefahrene Kilometer:</Text>
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
              <Text style={styles.statLabel}>Versicherungskosten:</Text>
              <Text style={styles.statValue}>{totalInsuranceCosts.toFixed(2)} €</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Garagenkosten:</Text>
              <Text style={styles.statValue}>{totalStorageCosts.toFixed(2)} €</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Zulassungskosten:</Text>
              <Text style={styles.statValue}>{totalRegistrationCosts.toFixed(2)} €</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Sonstige Kosten:</Text>
              <Text style={styles.statValue}>{totalMiscCosts.toFixed(2)} €</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Durchschn. monatliche Kosten:</Text>
              <Text style={styles.statValue}>{monthlyAvgCosts.toFixed(2)} €</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Kosten pro Kilometer:</Text>
              <Text style={styles.statValue}>{overallCostPerKm.toFixed(2)} €</Text>
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
          {currentVehicle ? `Daten für ${currentVehicle.name}` : 'Fahrzeugdaten werden geladen...'}
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