import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
  
  if (!adminEmails.includes(user.email.trim())) {
    return <Navigate to="/" replace />;
  }

  return children;
}