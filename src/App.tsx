import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from 'context/AuthContext';
import { CompetitionProvider } from 'context/CompetitionContext';
import { ResultsProvider } from 'context/ResultContext';
import { ToastProvider } from 'components/ui/Toast';

import { PrivateRoute } from 'components/layout/PrivateRoute';
import { PageSpinner } from 'components/ui/Spinner';

// Route components are lazy-loaded so each screen — and the heavy libraries a
// few of them pull in (xlsx for the spreadsheet import/export, pdfjs for the
// PDF import) — ships in its own chunk instead of bloating the initial bundle.
const CompetitionLayout = lazy(() =>
  import('components/layout/CompetitionLayout').then((m) => ({ default: m.CompetitionLayout }))
);

const LoginScreen = lazy(() => import('screens/Login'));
const RegisterScreen = lazy(() => import('screens/Register'));
const DashboardScreen = lazy(() => import('screens/Dashboard'));

const Registration = lazy(() => import('screens/Registration'));
const Duos = lazy(() => import('screens/Duos'));
const Qualifiers = lazy(() => import('screens/Qualifiers'));
const Finals = lazy(() => import('screens/Final'));
const FinalResults = lazy(() => import('screens/FinalResults'));
const RoundsOverview = lazy(() => import('screens/RoundsOverview'));
const CompetitorHistory = lazy(() => import('screens/CompetitorHistory'));
const Announcer = lazy(() => import('screens/Announcer'));

// Competitor Portal — public pages
const CompetitorLanding = lazy(() => import('screens/competitor/Landing'));
const CompetitorSearch = lazy(() => import('screens/competitor/Search'));
const CompetitorPublicProfile = lazy(() => import('screens/competitor/PublicProfile'));

// Competitor Portal — authenticated pages
const PortalDashboard = lazy(() => import('screens/competitor/portal/Dashboard'));
const MyCompetitionsPage = lazy(() => import('screens/competitor/portal/MyCompetitionsPage'));
const MyPassesPage = lazy(() => import('screens/competitor/portal/MyPassesPage'));
const CompetitionResults = lazy(() => import('screens/competitor/portal/CompetitionResults'));
const ClaimProfile = lazy(() => import('screens/competitor/portal/ClaimProfile'));

export default function App() {
  return (
    <AuthProvider>
      <CompetitionProvider>
        <ResultsProvider>
          <ToastProvider>
            <Router>
              <Suspense fallback={<PageSpinner />}>
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
              </Suspense>
            </Router>
          </ToastProvider>
        </ResultsProvider>
      </CompetitionProvider>
    </AuthProvider>
  );
}
