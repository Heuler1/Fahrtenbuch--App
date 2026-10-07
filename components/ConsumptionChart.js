import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const ConsumptionChart = ({ data }) => {
  // Default data if none provided
  const chartData = data || {
    labels: ["Jun", "Jul", "Aug", "Sep", "Okt", "Nov"],
    datasets: [
      {
        data: [9.8, 10.2, 9.5, 9.7, 10.1, 9.6],
        color: (opacity = 1) => `rgba(139, 69, 19, ${opacity})`, // Brown color
        strokeWidth: 2
      }
    ],
    legend: ["L/100km"]
  };

  // Check if we're on web platform
  if (Platform.OS === 'web') {
    // Simple fallback for web to avoid chart library issues
    const maxValue = Math.max(...chartData.datasets[0].data);
    
    return (
      <View style={styles.webFallbackContainer}>
        <View style={styles.webChartHeader}>
          <Text style={styles.webChartTitle}>Verbrauchstrend</Text>
        </View>
        <View style={styles.webChartContent}>
          {chartData.labels.map((label, index) => (
            <View key={index} style={styles.webLineContainer}>
              <Text style={styles.webLineLabel}>{label}</Text>
              <View style={styles.webLineWrapper}>
                <View 
                  style={[
                    styles.webLine, 
                    { 
                      width: `${(chartData.datasets[0].data[index] / maxValue) * 100}%`,
                      backgroundColor: '#8B4513' 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.webLineValue}>{chartData.datasets[0].data[index]} L/100km</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // For native platforms, use the chart library
  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={width - 40}
        height={180}
        chartConfig={{
          backgroundColor: '#FFF',
          backgroundGradientFrom: '#FFF',
          backgroundGradientTo: '#FFF',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#8B4513'
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#E0E0E0',
          }
        }}
        bezier
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
  webLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  webLineLabel: {
    width: 40,
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  webLineWrapper: {
    flex: 1,
    height: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  webLine: {
    height: '100%',
    borderRadius: 10,
  },
  webLineValue: {
    width: 80,
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    textAlign: 'right',
  }
});

export default ConsumptionChart;