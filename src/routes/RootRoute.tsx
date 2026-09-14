import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { PageSpinner } from '../components/ui/Spinner';
import LandingScreen from '../screens/Landing';
import DashboardScreen from '../screens/Dashboard';

// Raiz "/": visitantes veem a landing page; usuários autenticados vão para a home da sua persona.
export function RootRoute() {
  const { user, userType, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (!user) return <LandingScreen />;
  if (userType === 'competitor') return <Navigate to="/competitor/provas" replace />;
  return <DashboardScreen />;
}
