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
import CompetitorHistory from './screens/CompetitorHistory';
import Announcer from './screens/Announcer';

// Competitor Portal — public pages
import CompetitorLanding from './screens/competitor/Landing';
import CompetitorSearch from './screens/competitor/Search';
import CompetitorPublicProfile from './screens/competitor/PublicProfile';

// Competitor Portal — authenticated pages
import PortalDashboard from './screens/competitor/portal/Dashboard';
import MyCompetitionsPage from './screens/competitor/portal/MyCompetitionsPage';
import MyPassesPage from './screens/competitor/portal/MyPassesPage';
import CompetitionResults from './screens/competitor/portal/CompetitionResults';
import ClaimProfile from './screens/competitor/portal/ClaimProfile';

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

                {/* Competitor Portal — public (no login required) */}
                <Route path="/competitor" element={<CompetitorLanding />} />
                <Route path="/competitor/search" element={<CompetitorSearch />} />
                <Route path="/competitor/profile/:profileId" element={<CompetitorPublicProfile />} />

                {/* Competitor Portal — authenticated */}
                <Route element={<PrivateRoute />}>
                  <Route path="/portal" element={<PortalDashboard />}>
                    <Route index element={<MyCompetitionsPage />} />
                    <Route path="passes" element={<MyPassesPage />} />
                    <Route path="claim" element={<ClaimProfile />} />
                    <Route path="results/:competitionId" element={<CompetitionResults />} />
                  </Route>
                </Route>

                {/* Organizer protected routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/" element={<DashboardScreen />} />

                  <Route path="/competition/:id" element={<CompetitionLayout />}>
                    <Route path="registration" element={<Registration />} />
                    <Route path="duos" element={<Duos />} />
                    <Route path="record" element={<Qualifiers />} />
                    <Route path="final" element={<Finals />} />
                    <Route path="final-results" element={<FinalResults />} />
                    <Route path="overview" element={<RoundsOverview />} />
                    <Route path="competitor/:competitorId/history" element={<CompetitorHistory />} />
                    <Route path="announcer" element={<Announcer />} />
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
