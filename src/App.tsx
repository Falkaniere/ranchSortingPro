import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { CompetitionProvider } from './context/CompetitionContext';
import { ResultsProvider } from './context/ResultContext';
import { ToastProvider } from './components/ui/Toast';

import { PrivateRoute } from './components/layout/PrivateRoute';
import { CompetitionLayout } from './components/layout/CompetitionLayout';

import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import DashboardScreen from './screens/Dashboard';

import Registration from './screens/Registration';
import Duos from './screens/Duos';
import Qualifiers from './screens/Qualifiers';
import Finals from './screens/Final';
import FinalResults from './screens/FinalResults';
import RoundsOverview from './screens/RoundsOverview';

export default function App() {
  return (
    <AuthProvider>
      <CompetitionProvider>
        <ResultsProvider>
          <ToastProvider>
            <Router>
              <Routes>
                {/* Public */}
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />

                {/* Protected */}
                <Route element={<PrivateRoute />}>
                  <Route path="/" element={<DashboardScreen />} />

                  <Route path="/competition/:id" element={<CompetitionLayout />}>
                    <Route path="registration" element={<Registration />} />
                    <Route path="duos" element={<Duos />} />
                    <Route path="record" element={<Qualifiers />} />
                    <Route path="final" element={<Finals />} />
                    <Route path="final-results" element={<FinalResults />} />
                    <Route path="overview" element={<RoundsOverview />} />
                    <Route index element={<Navigate to="registration" replace />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </ToastProvider>
        </ResultsProvider>
      </CompetitionProvider>
    </AuthProvider>
  );
}
