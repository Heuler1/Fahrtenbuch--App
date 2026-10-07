import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import { Chrome as Home, BookOpen, Compass as GasPump, Wrench, Bell, ChartBar as BarChart3, Car } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8B4513',
        tabBarInactiveTintColor: '#777',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
        tabBarShowLabel: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="logbook"
        options={{
          title: 'Fahrtenbuch',
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="fuel"
        options={{
          title: 'Tankstopps',
          tabBarIcon: ({ color, size }) => (
            <GasPump color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: 'Wartung',
          tabBarIcon: ({ color, size }) => (
            <Wrench color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Erinnerungen',
          tabBarIcon: ({ color, size }) => (
            <Bell color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistik',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Fahrzeuge',
          tabBarIcon: ({ color, size }) => (
            <Car color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicle"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingBottom: Platform.OS === 'ios' ? 30 : 5,
    paddingTop: 5,
  },
  tabBarLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat-Medium',
  },
});