import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import ReportScreen from './src/screens/ReportScreen';
import ConfirmationScreen from './src/screens/ConfirmationScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Import services
import { AuthProvider } from './src/services/AuthContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2E7D32', // Green theme
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'Roadkill Reporter' }}
            />
            <Stack.Screen 
              name="Report" 
              component={ReportScreen} 
              options={{ title: 'Report Incident' }}
            />
            <Stack.Screen 
              name="Confirmation" 
              component={ConfirmationScreen} 
              options={{ title: 'Report Submitted' }}
            />
            <Stack.Screen 
              name="History" 
              component={HistoryScreen} 
              options={{ title: 'My Reports' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
} 