import React, { useEffect } from 'react';
import { Outlet, useNavigate, useParams, NavLink } from 'react-router-dom';
import { useCompetition } from '../../context/CompetitionContext';
import { useResults } from '../../context/ResultContext';
import { getCompetition } from '../../services/firebase/competitions';
import { Spinner } from '../ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { ResultSyncBridge } from './ResultSyncBridge';

const steps = [
  { key: 'registration', label: 'Inscrições', icon: '👥' },
  { key: 'duos', label: 'Duplas', icon: '🤝' },
  { key: 'record', label: 'Qualificatória', icon: '🐄' },
  { key: 'final', label: 'Final', icon: '🏆' },
  { key: 'final-results', label: 'Resultados', icon: '📊' },
  { key: 'announcer', label: 'Locutor', icon: '🎙️' },
];

export function CompetitionLayout() {
  const { id } = useParams<{ id: string }>();
  const { competition, loadCompetition, isSaving } = useCompetition();
  const { initializeFromCompetition } = useResults();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id || !user) return;

    if (competition?.id === id) {
      // Hydrate ResultContext from context immediately so every tab has data
      // without waiting for a network round-trip.
      initializeFromCompetition(
        competition.qualifierResults ?? [],
        competition.finalResults ?? [],
        competition.duos ?? []
      );

      // For finished competitions also refresh silently from Firestore —
      // listCompetitions may have served a locally-cached snapshot that
      // predates the last saved results.
      if (competition.status === 'finished') {
        getCompetition(id)
          .then((c) => {
            if (!c || c.ownerId !== user.uid) return;
            loadCompetition(c);
            initializeFromCompetition(
              c.qualifierResults ?? [],
              c.finalResults ?? [],
              c.duos ?? []
            );
          })
          .catch(() => {}); // silent — context data already shown
      }
      return;
    }

    // Competition not yet in context — must fetch before rendering content.
    getCompetition(id)
      .then((c) => {
        if (!c || c.ownerId !== user.uid) { navigate('/'); return; }
        loadCompetition(c);
        initializeFromCompetition(
          c.qualifierResults ?? [],
          c.finalResults ?? [],
          c.duos ?? []
        );
      })
      .catch(() => navigate('/'));
  }, [id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!competition) {
    return (
      <div className="min-h-screen bg-dust-100 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const isFinished = competition.status === 'finished';

  return (
    <div className="min-h-screen bg-dust-100 flex flex-col">
      {/* Competition Header */}
      <header className="bg-saddle-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-saddle-300 hover:text-white transition-colors p-1"
            aria-label="Voltar ao dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="font-serif font-semibold text-white text-base leading-tight">
              {competition.name}
            </h1>
            {competition.location && (
              <p className="text-saddle-300 text-xs">{competition.location}</p>
            )}
          </div>
          {isFinished && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-saddle-600 text-white text-[10px] font-semibold uppercase tracking-wide">
              Encerrada
            </span>
          )}
        </div>
        {isSaving && (
          <div className="flex items-center gap-1.5 text-saddle-300 text-xs">
            <Spinner size="sm" className="text-saddle-300" />
            <span>Salvando...</span>
          </div>
        )}
        {!isSaving && !isFinished && (
          <span className="text-saddle-300 text-xs hidden sm:block">✓ Salvo</span>
        )}
      </header>

      {/* Step Navigation */}
      <nav className="bg-white border-b border-dust-300 overflow-x-auto scrollbar-none">
        <div className="flex gap-0 max-w-5xl mx-auto min-w-max px-1 sm:px-4">
          {steps.map((step) => (
            <NavLink
              key={step.key}
              to={`/competition/${id}/${step.key}`}
              className={({ isActive }) =>
                [
                  'flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-3',
                  'text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'border-saddle-600 text-saddle-700'
                    : 'border-transparent text-rope-400 hover:text-rope-700 hover:border-dust-400',
                ].join(' ')
              }
            >
              <span className="text-base sm:text-sm">{step.icon}</span>
              <span className="text-[10px] sm:text-sm leading-tight">{step.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <ResultSyncBridge />
        <Outlet />
      </main>
    </div>
  );
}
