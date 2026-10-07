import React from 'react';
import { View, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const CategoryPieChart = ({ data }) => {
  // Default data if none provided
  const chartData = data || [
    {
      name: 'Freizeit',
      population: 65,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Geschäftlich',
      population: 20,
      color: '#2196F3',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
    {
      name: 'Oldtimertreffen',
      population: 15,
      color: '#FF9800',
      legendFontColor: '#333',
      legendFontSize: 12,
    },
  ];

  // Check if we're on web platform
  if (Platform.OS === 'web') {
    // Simple fallback for web to avoid chart library issues
    const total = chartData.reduce((sum, item) => sum + item.population, 0);
    
    return (
      <View style={styles.webFallbackContainer}>
        <View style={styles.webChartHeader}>
          <Text style={styles.webChartTitle}>Fahrleistung nach Kategorien</Text>
        </View>
        <View style={styles.webChartContent}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.webPieItem}>
              <View style={[styles.webPieColor, { backgroundColor: item.color }]} />
              <Text style={styles.webPieName}>{item.name}</Text>
              <View style={styles.webPieBarWrapper}>
                <View 
                  style={[
                    styles.webPieBar, 
                    { 
                      width: `${(item.population / total) * 100}%`,
                      backgroundColor: item.color 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.webPieValue}>{Math.round((item.population / total) * 100)}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // For native platforms, use the chart library
  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        width={width - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#FFF',
          backgroundGradientFrom: '#FFF',
          backgroundGradientTo: '#FFF',
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  // Web fallback styles
  webFallbackContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  webChartHeader: {
    marginBottom: 16,
  },
  webChartTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
  },
  webChartContent: {
    width: '100%',
  },
  webPieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  webPieColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  webPieName: {
    width: 100,
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  webPieBarWrapper: {
    flex: 1,
    height: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  webPieBar: {
    height: '100%',
    borderRadius: 8,
  },
  webPieValue: {
    width: 40,
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    textAlign: 'right',
  }
});

export default CategoryPieChart;