import React, { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bookverse_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data);
        } catch (err) {
          console.error('Session expired or invalid token');
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    const data = res.data;
    setUser(data);
    setToken(data.token);
    localStorage.setItem('bookverse_token', data.token);
    return data;
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    const data = res.data;
    if (data?.token) {
      setUser(data);
      setToken(data.token);
      localStorage.setItem('bookverse_token', data.token);
    }
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bookverse_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
