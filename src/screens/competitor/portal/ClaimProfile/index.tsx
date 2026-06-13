import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CompetitorProfile } from '../../../../core/models/CompetitorProfile';
import {
  searchProfilesForUser,
  getCompetitorProfile,
  claimCompetitorProfile,
  createCompetitorProfile,
} from '../../../../services/firebase/competitorProfiles';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../components/ui/Toast';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Card } from '../../../../components/ui/Card';
import { Spinner } from '../../../../components/ui/Spinner';

export default function ClaimProfile() {
  const { user, competitorProfileId, refreshUserDoc } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const preselectedId = params.get('profileId');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ profile: CompetitorProfile; score: number }>>([]);
  const [searched, setSearched] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // If a profileId was pre-selected (from public search), load it
  useEffect(() => {
    if (!preselectedId) return;
    getCompetitorProfile(preselectedId).then((p) => {
      if (p) setResults([{ profile: p, score: 1 }]);
      setSearched(true);
    });
  }, [preselectedId]);

  if (!user) return null;

  async function handleSearch() {
    if (!query.trim()) return;
    setLoadingSearch(true);
    setSearched(false);
    try {
      const found = await searchProfilesForUser(query.trim());
      setResults(found);
    } catch {
      setResults([]);
    } finally {
      setLoadingSearch(false);
      setSearched(true);
    }
  }

  async function handleClaim(profile: CompetitorProfile) {
    if (!user?.email) return;
    setClaimingId(profile.id);
    try {
      await claimCompetitorProfile(profile.id, user.uid, user.email);
      await refreshUserDoc();
      toast(`Perfil "${profile.displayName}" vinculado com sucesso!`, 'success');
      navigate('/portal');
    } catch {
      toast('Erro ao vincular perfil. Tente novamente.', 'error');
    } finally {
      setClaimingId(null);
    }
  }

  async function handleCreateNew() {
    if (!user?.displayName && !user?.email) return;
    const name = user.displayName || user.email!.split('@')[0];
    setCreating(true);
    try {
      const profile = await createCompetitorProfile(name, user.uid, user.email ?? undefined);
      await refreshUserDoc();
      toast(`Perfil "${profile.displayName}" criado com sucesso!`, 'success');
      navigate('/portal');
    } catch {
      toast('Erro ao criar perfil. Tente novamente.', 'error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif font-bold text-rope-800 text-xl mb-1">Vincular meu perfil</h2>
        <p className="text-rope-400 text-sm">
          Busque pelo nome que o organizador usou para te cadastrar nas competições.
        </p>
      </div>

      {/* Already has a profile */}
      {competitorProfileId && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
          Você já possui um perfil vinculado.{' '}
          <button onClick={() => navigate('/portal')} className="underline font-medium">
            Ir para o portal
          </button>
        </div>
      )}

      {/* Search box */}
      <Card title="Pesquisar pelo nome">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Ex: João da Silva"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus={!preselectedId}
            />
          </div>
          <Button onClick={handleSearch} loading={loadingSearch} className="shrink-0">
            Buscar
          </Button>
        </div>
      </Card>

      {loadingSearch && (
        <div className="flex justify-center py-6">
          <Spinner size="lg" />
        </div>
      )}

      {/* Results */}
      {searched && !loadingSearch && (
        <>
          {results.length === 0 ? (
            <Card>
              <div className="text-center py-4">
                <p className="text-rope-400 mb-2">Nenhum perfil encontrado.</p>
                <p className="text-rope-500 text-sm mb-4">
                  Isso pode acontecer se você ainda não foi cadastrado em nenhuma competição, ou se o nome foi digitado diferente.
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-rope-500 font-medium">
                {results.length} perfil{results.length !== 1 ? 'is' : ''} encontrado{results.length !== 1 ? 's' : ''}. Selecione o seu:
              </p>
              {results.map(({ profile }) => (
                <Card key={profile.id}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-rope-800">{profile.displayName}</p>
                      {profile.status === 'claimed' ? (
                        <span className="text-xs text-green-600 font-medium">Perfil já reivindicado</span>
                      ) : (
                        <span className="text-xs text-rope-400">Perfil disponível</span>
                      )}
                    </div>
                    {profile.status !== 'claimed' && (
                      <Button
                        size="sm"
                        onClick={() => handleClaim(profile)}
                        loading={claimingId === profile.id}
                        disabled={!!claimingId || !!competitorProfileId}
                      >
                        Este sou eu
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Create new profile option */}
          <div className="border-t border-dust-300 pt-5 mt-2">
            <p className="text-sm text-rope-500 mb-3">
              Não encontrou seu perfil? Crie um novo:
            </p>
            <Button
              variant="outline"
              onClick={handleCreateNew}
              loading={creating}
              disabled={!!claimingId || !!competitorProfileId}
            >
              Criar perfil com meu nome
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
