import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendHealthy, setBackendHealthy] = useState(false);

  // Probe backend health
  const checkBackendHealth = useCallback(async () => {
    const isUp = await api.checkHealth();
    setBackendHealthy(isUp);
  }, []);

  // Load user from stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      await checkBackendHealth();
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.user || res);
      } catch (err) {
        console.warn('Session expired or invalid, logging out', err);
        api.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, role) => {
    const data = await api.register({ email, password, role });
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        backendHealthy,
        login,
        register,
        logout,
        checkBackendHealth,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
