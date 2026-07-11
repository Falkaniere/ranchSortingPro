import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';
import { PageSpinner } from 'components/ui/Spinner';

export function PrivateRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
