import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CompetitorProfile } from '../../../core/models/CompetitorProfile';
import { getCompetitorProfile } from '../../../services/firebase/competitorProfiles';
import {
  getCompetitorHistory,
  CompetitionHistoryEntry,
} from '../../../services/firebase/competitorHistory';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function CompetitorPublicProfile() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CompetitorProfile | null>(null);
  const [history, setHistory] = useState<CompetitionHistoryEntry[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    setLoadingProfile(true);
    getCompetitorProfile(profileId)
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
  }, [profileId]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-dust-100 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dust-100 flex items-center justify-center">
        <EmptyState
          icon="👤"
          title="Perfil não encontrado"
          description="Este perfil não existe ou foi removido."
          action={<Button variant="outline" onClick={() => navigate('/competitor/search')}>Buscar outro perfil</Button>}
        />
      </div>
    );
  }

  const totalCattle = history.flatMap((h) => h.passes).reduce((s, p) => s + p.cattleCount, 0);
  const totalPasses = history.flatMap((h) => h.passes).length;

  return (
    <div className="min-h-screen bg-dust-100">
      <header className="bg-saddle-800 text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button
          onClick={() => navigate('/competitor/search')}
          className="text-saddle-300 hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="font-serif font-bold text-lg">{profile.displayName}</h1>
          <p className="text-saddle-300 text-xs">Perfil público · Ranch Sorting Pro</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Profile card */}
        <Card>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-serif font-bold text-rope-800 text-2xl">{profile.displayName}</h2>
              <span
                className={[
                  'text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block',
                  profile.status === 'claimed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-hay-100 text-hay-700',
                ].join(' ')}
              >
                {profile.status === 'claimed' ? 'Perfil reivindicado' : 'Perfil disponível para reivindicação'}
              </span>
            </div>
            {profile.status !== 'claimed' && (
              <Link to={`/portal/claim?profileId=${profile.id}`}>
                <Button>Este sou eu</Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-dust-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-saddle-700">{history.length}</p>
              <p className="text-xs text-rope-400 mt-0.5">Competições</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-saddle-700">{totalPasses}</p>
              <p className="text-xs text-rope-400 mt-0.5">Passadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-saddle-700">{totalCattle}</p>
              <p className="text-xs text-rope-400 mt-0.5">Total de bois</p>
            </div>
          </div>
        </Card>

        {/* Competition history */}
        <Card title="Competições" noPadding>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon="📋"
              title="Nenhuma competição registrada"
              description="As competições aparecerão aqui quando forem vinculadas a este perfil."
            />
          ) : (
            <ul className="divide-y divide-dust-200">
              {history.map((entry) => (
                <CompetitionRow key={entry.competitionId} entry={entry} />
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}

function CompetitionRow({ entry }: { entry: CompetitionHistoryEntry }) {
  const date = entry.eventDate
    ? new Date(entry.eventDate + 'T12:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;
  const totalCattle = entry.passes.reduce((s, p) => s + p.cattleCount, 0);

  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-rope-800 text-sm">{entry.competitionName}</p>
          {entry.location && (
            <p className="text-rope-400 text-xs mt-0.5">📍 {entry.location}</p>
          )}
          {date && <p className="text-rope-400 text-xs mt-0.5">📅 {date}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-saddle-700">{totalCattle} bois</p>
          <p className="text-xs text-rope-400">{entry.passes.length} passada{entry.passes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </li>
  );
}
