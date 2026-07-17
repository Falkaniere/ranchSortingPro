import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageSpinner } from '../ui/Spinner';

export function PrivateRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageSpinner />;
  // Preserve the intended destination so login can return here (enables share deep links).
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
