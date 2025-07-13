import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiService } from './api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsVerified(true);
      }
    } catch (error) {
      console.log('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email) => {
    try {
      const response = await apiService.verifyEmail(email);
      
      // Store email for verification
      await SecureStore.setItemAsync('pendingEmail', email);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const verifyCode = async (email, code) => {
    try {
      const response = await apiService.verifyCode(email, code);
      
      if (response.data.token) {
        // Store auth token and user data
        await SecureStore.setItemAsync('authToken', response.data.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        setIsVerified(true);
        
        // Clear pending email
        await SecureStore.deleteItemAsync('pendingEmail');
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('pendingEmail');
      
      setUser(null);
      setIsVerified(false);
    } catch (error) {
      console.log('Error during logout:', error);
    }
  };

  const getPendingEmail = async () => {
    try {
      return await SecureStore.getItemAsync('pendingEmail');
    } catch (error) {
      return null;
    }
  };

  const value = {
    user,
    loading,
    isVerified,
    verifyEmail,
    verifyCode,
    logout,
    getPendingEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 