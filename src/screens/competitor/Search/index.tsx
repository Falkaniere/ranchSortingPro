import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CompetitorProfile } from '../../../core/models/CompetitorProfile';
import { searchProfilesForUser } from '../../../services/firebase/competitorProfiles';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Spinner } from '../../../components/ui/Spinner';

export default function CompetitorSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ profile: CompetitorProfile; score: number }>>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(false);
    try {
      const found = await searchProfilesForUser(q);
      setResults(found);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  return (
    <div className="min-h-screen bg-dust-100">
      <header className="bg-saddle-800 text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button
          onClick={() => navigate('/competitor')}
          className="text-saddle-300 hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="font-serif font-bold text-lg">Buscar Perfil</h1>
          <p className="text-saddle-300 text-xs">Encontre seu histórico de competidor</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card title="Pesquisar por nome">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                ref={inputRef}
                placeholder="Ex: João da Silva"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                autoFocus
              />
            </div>
            <Button onClick={handleSearch} loading={loading} className="shrink-0">
              Buscar
            </Button>
          </div>
          <p className="text-xs text-rope-400 mt-2">
            Digite o nome como foi cadastrado pelo organizador da competição.
          </p>
        </Card>

        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {searched && !loading && (
          <div className="mt-6">
            {results.length === 0 ? (
              <Card>
                <div className="text-center py-6">
                  <p className="text-rope-400 mb-4">Nenhum perfil encontrado para "{query}".</p>
                  <p className="text-rope-500 text-sm mb-6">
                    Seu nome pode estar cadastrado de forma diferente. Tente variações ou verifique com o organizador.
                  </p>
                  <Link to="/login">
                    <Button variant="outline">Criar conta e perfil manual</Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-rope-500 font-medium">
                  {results.length !== 1 ? `${results.length} perfis encontrados` : '1 perfil encontrado'}
                </p>
                {results.map(({ profile }) => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ProfileCard({ profile }: { profile: CompetitorProfile }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-rope-800">{profile.displayName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={[
                'text-xs px-2 py-0.5 rounded-full font-medium',
                profile.status === 'claimed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-hay-100 text-hay-700',
              ].join(' ')}
            >
              {profile.status === 'claimed' ? 'Perfil reivindicado' : 'Perfil livre'}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to={`/competitor/profile/${profile.id}`}>
            <Button variant="outline" size="sm">Ver histórico</Button>
          </Link>
          {profile.status !== 'claimed' && (
            <Link to={`/portal/claim?profileId=${profile.id}`}>
              <Button size="sm">Este sou eu</Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
