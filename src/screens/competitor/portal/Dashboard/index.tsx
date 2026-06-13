import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation, NavLink } from 'react-router-dom';
import { CompetitorProfile } from '../../../../core/models/CompetitorProfile';
import {
  getCompetitorProfile,
} from '../../../../services/firebase/competitorProfiles';
import {
  getCompetitorHistory,
  CompetitionHistoryEntry,
} from '../../../../services/firebase/competitorHistory';
import { useAuth } from '../../../../context/AuthContext';
import { signOut } from '../../../../services/firebase/auth';
import { Button } from '../../../../components/ui/Button';
import { Spinner } from '../../../../components/ui/Spinner';
import ClaimProfile from '../ClaimProfile';

const NAV_ITEMS = [
  { to: '/portal', label: 'Minhas Competições', icon: '🏟️', end: true },
  { to: '/portal/passes', label: 'Minhas Passadas', icon: '📋', end: false },
];

export default function PortalDashboard() {
  const { user, competitorProfileId, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<CompetitorProfile | null>(null);
  const [history, setHistory] = useState<CompetitionHistoryEntry[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!competitorProfileId) {
      setProfile(null);
      setHistory([]);
      return;
    }
    setLoadingProfile(true);
    getCompetitorProfile(competitorProfileId)
      .then((p) => {
        setProfile(p);
        if (p) {
          setLoadingHistory(true);
          return getCompetitorHistory(p.id);
        }
        return [];
      })
      .then(setHistory)
      .catch(() => {})
      .finally(() => {
        setLoadingProfile(false);
        setLoadingHistory(false);
      });
  }, [competitorProfileId]);

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-dust-100 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Pass history down via context-like prop to sub-pages through Outlet context
  const isClaimRoute = location.pathname === '/portal/claim';
  const isResultsRoute = location.pathname.startsWith('/portal/results/');

  return (
    <div className="min-h-screen bg-dust-100 flex flex-col">
      {/* Header */}
      <header className="bg-saddle-800 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-saddle-300 hover:text-white transition-colors p-1"
            title="Voltar ao painel do organizador"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="font-serif font-bold text-lg">Portal do Competidor</h1>
            {profile && (
              <p className="text-saddle-300 text-xs">{profile.displayName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-saddle-200 text-sm hidden sm:block">
            {user?.displayName ?? user?.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-saddle-200 hover:text-white hover:bg-saddle-700"
          >
            Sair
          </Button>
        </div>
      </header>

      {/* No profile — show claim flow */}
      {!competitorProfileId && !isClaimRoute && (
        <main className="max-w-2xl mx-auto px-4 py-12 w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔗</div>
            <h2 className="font-serif font-bold text-rope-800 text-2xl mb-2">
              Vincule seu perfil de competidor
            </h2>
            <p className="text-rope-400">
              Para acessar seu histórico, você precisa vincular sua conta a um perfil de competidor.
            </p>
          </div>
          <ClaimProfile />
        </main>
      )}

      {/* No profile — claim sub-route */}
      {!competitorProfileId && isClaimRoute && (
        <main className="max-w-2xl mx-auto px-4 py-8 w-full">
          <ClaimProfile />
        </main>
      )}

      {/* Has profile */}
      {competitorProfileId && (
        <>
          {/* Stats bar */}
          {!isResultsRoute && !isClaimRoute && (
            <div className="bg-white border-b border-dust-300">
              <div className="max-w-5xl mx-auto px-4 py-4 flex gap-6 text-sm">
                <div>
                  <span className="font-bold text-saddle-700 text-xl">{history.length}</span>
                  <span className="text-rope-400 ml-1.5">competição{history.length !== 1 ? 'ões' : ''}</span>
                </div>
                <div>
                  <span className="font-bold text-saddle-700 text-xl">
                    {history.flatMap((h) => h.passes).length}
                  </span>
                  <span className="text-rope-400 ml-1.5">passada{history.flatMap((h) => h.passes).length !== 1 ? 's' : ''}</span>
                </div>
                <div>
                  <span className="font-bold text-saddle-700 text-xl">
                    {history.flatMap((h) => h.passes).reduce((s, p) => s + p.cattleCount, 0)}
                  </span>
                  <span className="text-rope-400 ml-1.5">bois totais</span>
                </div>
              </div>
            </div>
          )}

          {/* Nav tabs */}
          {!isResultsRoute && !isClaimRoute && (
            <nav className="bg-white border-b border-dust-300">
              <div className="max-w-5xl mx-auto px-4 flex gap-0">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                        isActive
                          ? 'border-saddle-600 text-saddle-700'
                          : 'border-transparent text-rope-400 hover:text-rope-700 hover:border-dust-400',
                      ].join(' ')
                    }
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </nav>
          )}

          {/* Content */}
          <main className="max-w-5xl mx-auto w-full px-4 py-6">
            {loadingHistory ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : (
              <Outlet context={{ history, profile }} />
            )}
          </main>
        </>
      )}
    </div>
  );
}
