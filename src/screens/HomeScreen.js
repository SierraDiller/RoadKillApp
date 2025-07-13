import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { apiService } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({ monthlyReports: 0, totalReports: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to report roadkill incidents accurately.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getStats();
      setStats(response.data);
    } catch (error) {
      console.log('Could not load stats:', error);
    }
  };

  const handleReportPress = () => {
    setLoading(true);
    // Check if we're in Oak Ridge area
    checkLocationAndNavigate();
  };

  const checkLocationAndNavigate = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Basic Oak Ridge bounds check (approximate)
      const { latitude, longitude } = location.coords;
      const isInOakRidge = isWithinOakRidge(latitude, longitude);

      if (isInOakRidge) {
        navigation.navigate('Report', { location });
      } else {
        Alert.alert(
          'Location Outside Service Area',
          'This app is currently only available for Oak Ridge, TN. Please ensure you are within city limits.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please check your GPS settings and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const isWithinOakRidge = (lat, lng) => {
    // Approximate Oak Ridge city limits
    const oakRidgeBounds = {
      north: 36.05,
      south: 35.95,
      east: -84.25,
      west: -84.35,
    };

    return (
      lat >= oakRidgeBounds.south &&
      lat <= oakRidgeBounds.north &&
      lng >= oakRidgeBounds.west &&
      lng <= oakRidgeBounds.east
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="car" size={60} color="#2E7D32" />
          <Text style={styles.title}>Roadkill Reporter</Text>
          <Text style={styles.subtitle}>Oak Ridge, TN</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.monthlyReports}</Text>
            <Text style={styles.statLabel}>Reports This Month</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalReports}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleReportPress}
            disabled={loading}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.primaryButtonText}>
              {loading ? 'Checking Location...' : 'Report Roadkill'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('History')}
          >
            <Ionicons name="list" size={20} color="#2E7D32" />
            <Text style={styles.secondaryButtonText}>View My Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.infoText}>1. Take a photo and mark location</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="send" size={16} color="#666" />
            <Text style={styles.infoText}>2. Submit report to city</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#666" />
            <Text style={styles.infoText}>3. City handles cleanup</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
}); 