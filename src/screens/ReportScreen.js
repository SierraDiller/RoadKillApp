import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import PhotoCapture from '../components/report/PhotoCapture';
import { apiService } from '../services/api';

const ANIMAL_TYPES = [
  'Deer',
  'Raccoon',
  'Opossum',
  'Cat',
  'Dog',
  'Squirrel',
  'Rabbit',
  'Other',
];

const SIZE_OPTIONS = ['Small', 'Medium', 'Large'];

export default function ReportScreen({ navigation, route }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: null,
    address: '',
    animalType: '',
    size: '',
    description: '',
    photoUrl: '',
    contactEmail: '',
    contactPhone: '',
    sendUpdates: false,
  });

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      let location;
      if (route.params?.location) {
        location = route.params.location;
      } else {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      }

      const { latitude, longitude } = location.coords;
      const address = await reverseGeocode(latitude, longitude);

      setFormData(prev => ({
        ...prev,
        location: { latitude, longitude },
        address: address || '',
      }));
    } catch (error) {
      Alert.alert('Location Error', 'Unable to get your location. Please try again.');
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (response.length > 0) {
        const address = response[0];
        return `${address.street || ''} ${address.name || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
      }
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
    }
    return '';
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.location && formData.address;
      case 2:
        return formData.animalType && formData.size;
      case 3:
        return formData.contactEmail || formData.contactPhone;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        location: formData.location,
        address: formData.address,
        animalType: formData.animalType,
        size: formData.size,
        description: formData.description,
        photoUrl: formData.photoUrl,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        sendUpdates: formData.sendUpdates,
      };

      const response = await apiService.submitReport(reportData);
      
      navigation.navigate('Confirmation', {
        reportId: response.data.reportId,
        reportData: reportData,
      });
    } catch (error) {
      Alert.alert('Submission Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(step => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step ? styles.activeStep : styles.inactiveStep
          ]}>
            <Text style={[
              styles.stepText,
              currentStep >= step ? styles.activeStepText : styles.inactiveStepText
            ]}>
              {step}
            </Text>
          </View>
          <Text style={styles.stepLabel}>
            {step === 1 ? 'Location' : step === 2 ? 'Details' : step === 3 ? 'Contact' : 'Review'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Where is the incident located?</Text>
      
      {formData.location && (
        <MapView
          style={styles.map}
          initialRegion={{
            ...formData.location,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={formData.location} />
        </MapView>
      )}

      <TextInput
        style={styles.input}
        placeholder="Address"
        value={formData.address}
        onChangeText={(text) => updateFormData('address', text)}
      />

      <TouchableOpacity
        style={styles.locationButton}
        onPress={initializeLocation}
      >
        <Ionicons name="location" size={20} color="#2E7D32" />
        <Text style={styles.locationButtonText}>Use Current Location</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tell us about the incident</Text>

      <Text style={styles.label}>Animal Type *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.animalType}
          onValueChange={(value) => updateFormData('animalType', value)}
          style={styles.picker}
        >
          <Picker.Item label="Select animal type..." value="" />
          {ANIMAL_TYPES.map(type => (
            <Picker.Item key={type} label={type} value={type} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Size *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.size}
          onValueChange={(value) => updateFormData('size', value)}
          style={styles.picker}
        >
          <Picker.Item label="Select size..." value="" />
          {SIZE_OPTIONS.map(size => (
            <Picker.Item key={size} label={size} value={size} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Description (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Additional details about the incident..."
        value={formData.description}
        onChangeText={(text) => updateFormData('description', text)}
        multiline
        numberOfLines={4}
      />

      <PhotoCapture
        photoUrl={formData.photoUrl}
        onPhotoTaken={(url) => updateFormData('photoUrl', url)}
      />
    </View>
  );

  const renderContactStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      <Text style={styles.stepSubtitle}>
        We'll use this to send you updates about your report
      </Text>

      <Text style={styles.label}>Email (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="your.email@example.com"
        value={formData.contactEmail}
        onChangeText={(text) => updateFormData('contactEmail', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Phone (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="(865) 555-0123"
        value={formData.contactPhone}
        onChangeText={(text) => updateFormData('contactPhone', text)}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => updateFormData('sendUpdates', !formData.sendUpdates)}
      >
        <Ionicons
          name={formData.sendUpdates ? "checkbox" : "square-outline"}
          size={24}
          color="#2E7D32"
        />
        <Text style={styles.checkboxText}>
          Send me updates on this report
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review Your Report</Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Location:</Text>
        <Text style={styles.reviewValue}>{formData.address}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Animal Type:</Text>
        <Text style={styles.reviewValue}>{formData.animalType}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Size:</Text>
        <Text style={styles.reviewValue}>{formData.size}</Text>
      </View>

      {formData.description && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Description:</Text>
          <Text style={styles.reviewValue}>{formData.description}</Text>
        </View>
      )}

      {formData.photoUrl && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Photo:</Text>
          <Text style={styles.reviewValue}>Photo attached</Text>
        </View>
      )}

      {(formData.contactEmail || formData.contactPhone) && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Contact:</Text>
          <Text style={styles.reviewValue}>
            {formData.contactEmail || formData.contactPhone}
          </Text>
        </View>
      )}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderLocationStep();
      case 2:
        return renderDetailsStep();
      case 3:
        return renderContactStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView}>
          {renderStepIndicator()}
          {renderStepContent()}
        </ScrollView>

        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {currentStep < 4 ? (
            <TouchableOpacity
              style={[styles.primaryButton, !validateStep() && styles.disabledButton]}
              onPress={nextStep}
              disabled={!validateStep()}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeStep: {
    backgroundColor: '#2E7D32',
  },
  inactiveStep: {
    backgroundColor: '#e0e0e0',
  },
  stepText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeStepText: {
    color: '#fff',
  },
  inactiveStepText: {
    color: '#666',
  },
  stepLabel: {
    fontSize: 12,
    color: '#666',
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  map: {
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  locationButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  reviewSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
}); 