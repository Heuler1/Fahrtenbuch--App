import React from 'react';
import { View, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const CostChart = ({ data, title }) => {
  // Default data if none provided
  const chartData = data || {
    labels: ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun"],
    datasets: [
      {
        data: [450, 680, 520, 390, 750, 620],
      }
    ]
  };

  // Check if we're on web platform
  if (Platform.OS === 'web') {
    // Simple fallback for web to avoid chart library issues
    return (
      <View style={styles.webFallbackContainer}>
        <View style={styles.webChartHeader}>
          <Text style={styles.webChartTitle}>Kosten pro Monat</Text>
        </View>
        <View style={styles.webChartContent}>
          {chartData.labels.map((label, index) => (
            <View key={index} style={styles.webBarContainer}>
              <Text style={styles.webBarLabel}>{label}</Text>
              <View style={styles.webBarWrapper}>
                <View 
                  style={[
                    styles.webBar, 
                    { 
                      width: `${(chartData.datasets[0].data[index] / Math.max(...chartData.datasets[0].data)) * 100}%`,
                      backgroundColor: '#8B4513' 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.webBarValue}>{chartData.datasets[0].data[index]}€</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // For native platforms, use the chart library
  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        width={width - 40}
        height={220}
        yAxisLabel="€"
        chartConfig={{
          backgroundColor: '#FFF',
          backgroundGradientFrom: '#FFF',
          backgroundGradientTo: '#FFF',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(139, 69, 19, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 0.6,
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: '#E0E0E0',
          }
        }}
        style={styles.chart}
        showValuesOnTopOfBars={true}
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
  webBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  webBarLabel: {
    width: 40,
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    color: '#666',
  },
  webBarWrapper: {
    flex: 1,
    height: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  webBar: {
    height: '100%',
    borderRadius: 10,
  },
  webBarValue: {
    width: 60,
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    textAlign: 'right',
  }
});

export default CostChart;