// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userPlan, setUserPlan] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');
    const plan = localStorage.getItem('userPlan');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setUserRole(role || parsedUser.role || 'user');
        setUserPlan(plan || parsedUser.plan || 'free');
      } catch (error) {
        console.error('❌ خطأ في تحميل بيانات المستخدم:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', userData.role || 'user');
      localStorage.setItem('userPlan', userData.plan || 'free');
      
      setUser(userData);
      setIsAuthenticated(true);
      setUserRole(userData.role || 'user');
      setUserPlan(userData.plan || 'free');
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userPlan');
      
      setUser(null);
      setIsAuthenticated(false);
      setUserRole(null);
      setUserPlan(null);
    } catch (error) {
      console.error('❌ خطأ في تسجيل الخروج:', error);
    }
  };

  const updateUser = (userData) => {
    try {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (userData.role) {
        localStorage.setItem('userRole', userData.role);
        setUserRole(userData.role);
      }
      if (userData.plan) {
        localStorage.setItem('userPlan', userData.plan);
        setUserPlan(userData.plan);
      }
      setUser(updatedUser);
    } catch (error) {
      console.error('❌ خطأ في تحديث بيانات المستخدم:', error);
    }
  };

  const refreshUser = () => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setUserRole(localStorage.getItem('userRole') || parsedUser.role || 'user');
        setUserPlan(localStorage.getItem('userPlan') || parsedUser.plan || 'free');
      } catch (error) {
        console.error('❌ خطأ في تحديث بيانات المستخدم:', error);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    loading,
    userRole,
    userPlan,
    login,
    logout,
    updateUser,
    refreshUser,
    isAdmin: userRole === 'admin',
    isPremium: userPlan === 'premium',
    isStandard: userPlan === 'standard' || userPlan === 'premium',
    isFree: userPlan === 'free' || !userPlan
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;