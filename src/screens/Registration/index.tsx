import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Competitor, RiderCategory } from 'core/models/Competidor';
import { generateUniqueDuos } from 'core/logic/pairing';
import { useResults } from 'context/ResultContext';
import { useCompetition } from '../../context/CompetitionContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CategoryBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { UpgradeBadge, UpgradeModal } from '../../components/ui/UpgradePrompt';
import {
  AthleteProfile,
  listAthletes,
  saveAthlete,
  importProfilesAsCompetitors,
} from '../../services/firebase/athletes';

const CATEGORIES: { label: string; value: RiderCategory; hint: string }[] = [
  { label: 'Profissional', value: 'Open', hint: 'Grupo 1D' },
  { label: 'Amador', value: 'AmateurLight', hint: 'Grupo 2D' },
];

export default function Registration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isPro, limits } = useSubscription();
  const { setDuosMeta } = useResults();
  const { competitors, numRounds, setCompetitors, setDuos, setNumRounds } = useCompetition();

  const atCompetitorLimit = !isPro && limits.maxCompetitors !== null && competitors.length >= limits.maxCompetitors;
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<RiderCategory>('Open'); // 'Open' = Profissional
  const [nameError, setNameError] = useState('');
  const [saveToBase, setSaveToBase] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<RiderCategory>('Open'); // 'Open' = Profissional

  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null);
  const [isSorting, setIsSorting] = useState(false);

  // Base de atletas
  const [athletePickerOpen, setAthletePickerOpen] = useState(false);
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [athleteSearch, setAthleteSearch] = useState('');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());
  const [loadingAthletes, setLoadingAthletes] = useState(false);

  useEffect(() => {
    if (!athletePickerOpen || !user?.uid) return;
    setLoadingAthletes(true);
    listAthletes(user.uid)
      .then(setAthletes)
      .catch(() => toast('Erro ao carregar base de atletas', 'error'))
      .finally(() => setLoadingAthletes(false));
  }, [athletePickerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addCompetitor() {
    if (!name.trim()) { setNameError('O nome é obrigatório'); return; }
    const newCompetitor: Competitor = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      passes: numRounds,
    };
    setCompetitors([...competitors, newCompetitor]);

    if (saveToBase && user?.uid) {
      try {
        await saveAthlete(user.uid, { name: newCompetitor.name, category: newCompetitor.category });
      } catch {
        toast('Competidor adicionado, mas falha ao salvar na base', 'warning');
      }
    }

    setName('');
    setNameError('');
    setCategory('Open');
    setSaveToBase(false);
    nameInputRef.current?.focus();
    toast(`${newCompetitor.name} adicionado!`, 'success');
  }

  function startEdit(c: Competitor) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditCategory(c.category);
  }

  function saveEdit() {
    if (!editingId) return;
    if (!editName.trim()) { toast('O nome é obrigatório', 'error'); return; }
    setCompetitors(
      competitors.map((c) =>
        c.id === editingId ? { ...c, name: editName.trim(), category: editCategory } : c
      )
    );
    setEditingId(null);
    toast('Competidor atualizado!', 'success');
  }

  function confirmDelete(c: Competitor) {
    setDeleteTarget(c);
  }

  function doDelete() {
    if (!deleteTarget) return;
    setCompetitors(competitors.filter((c) => c.id !== deleteTarget.id));
    toast(`${deleteTarget.name} removido.`, 'info');
    setDeleteTarget(null);
  }

  function handleSortDuos() {
    if (competitors.length < 2) {
      toast('É necessário pelo menos 2 competidores para sortear as duplas.', 'error');
      return;
    }
    setIsSorting(true);
    try {
      const normalized = competitors.map((c) => ({ ...c, passes: numRounds }));
      const { duos, warnings } = generateUniqueDuos(normalized, {
        passesPerCompetitor: numRounds,
        method: 'auto',
      });

      const duosWithLabels = duos.map((duo) => {
        const riderOne = competitors.find((c) => c.id === duo.riderOneId);
        const riderTwo = competitors.find((c) => c.id === duo.riderTwoId);
        const label = `${riderOne?.name ?? '?'} & ${riderTwo?.name ?? '?'}`;
        return { ...duo, label };
      });

      setDuos(duosWithLabels);
      setDuosMeta(duosWithLabels);

      if (warnings.length > 0) {
        warnings.forEach((w) => toast(w, 'warning'));
      } else {
        toast(`${duosWithLabels.length} duplas geradas com sucesso!`, 'success');
      }
      navigate(`/competition/${id}/duos`);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setIsSorting(false);
    }
  }

  function handleImportAthletes() {
    const selected = athletes.filter((a) => selectedAthleteIds.has(a.id));
    const imported = importProfilesAsCompetitors(selected, numRounds);
    // Deduplica por nome (case-insensitive)
    const existingNames = new Set(competitors.map((c) => c.name.toLowerCase()));
    const toAdd = imported.filter((c) => !existingNames.has(c.name.toLowerCase()));
    if (toAdd.length === 0) {
      toast('Todos os atletas selecionados já estão cadastrados.', 'info');
    } else {
      setCompetitors([...competitors, ...toAdd]);
      toast(`${toAdd.length} atleta(s) importado(s)!`, 'success');
    }
    setAthletePickerOpen(false);
    setSelectedAthleteIds(new Set());
    setAthleteSearch('');
  }

  const filteredAthletes = athletes.filter((a) =>
    a.name.toLowerCase().includes(athleteSearch.toLowerCase())
  );

  const canSort = competitors.length >= 2;

  return (
    <div>
      <PageHeader
        title="Inscrições"
        subtitle={`${competitors.length} competidor${competitors.length !== 1 ? 'es' : ''} cadastrado${competitors.length !== 1 ? 's' : ''}`}
        actions={
          canSort ? (
            <Button onClick={handleSortDuos} loading={isSorting}>
              Sortear Duplas →
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Form */}
        <Card className="lg:col-span-2" title="Adicionar competidor">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-rope-700 block mb-1">
                Número de passadas
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={numRounds}
                onChange={(e) => setNumRounds(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-dust-300 hover:border-saddle-400 focus:outline-none focus:ring-2 focus:ring-hay-400 focus:border-hay-400 text-sm text-rope-800"
              />
            </div>

            <Input
              ref={nameInputRef}
              label="Nome do competidor"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              error={nameError}
              autoFocus
            />

            <div>
              <p className="text-sm font-medium text-rope-700 mb-2">Categoria</p>
              <div className="flex gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    title={cat.hint}
                    className={[
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all text-center',
                      category === cat.value
                        ? 'bg-saddle-600 text-white border-saddle-700 shadow-sm'
                        : 'bg-white text-rope-600 border-dust-300 hover:border-saddle-400',
                    ].join(' ')}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveToBase}
                onChange={(e) => setSaveToBase(e.target.checked)}
                className="w-4 h-4 rounded border-dust-400 text-saddle-600 focus:ring-hay-400"
              />
              <span className="text-sm text-rope-600">Salvar na base de competidores</span>
            </label>

            {atCompetitorLimit ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-hay-50 border border-hay-200">
                  <span className="text-xs text-hay-800 font-medium">
                    Limite de {limits.maxCompetitors} competidores atingido
                  </span>
                  <UpgradeBadge />
                </div>
                <Button onClick={() => setUpgradeOpen(true)} variant="outline" fullWidth disabled>
                  Adicionar Competidor
                </Button>
              </div>
            ) : (
              <Button onClick={addCompetitor} fullWidth>
                Adicionar Competidor
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => setAthletePickerOpen(true)} fullWidth>
              Importar da Base
            </Button>

            <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
          </div>
        </Card>

        {/* List */}
        <Card
          className="lg:col-span-3"
          title={`Competidores (${competitors.length})`}
          noPadding
        >
          {competitors.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Nenhum competidor ainda"
              description="Adicione competidores usando o formulário ao lado."
            />
          ) : (
            <ul className="divide-y divide-dust-200">
              {competitors.map((c, index) => (
                <li key={c.id} className="px-4 py-3">
                  {editingId === c.id ? (
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-hay-400 focus:outline-none focus:ring-2 focus:ring-hay-400 text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setEditCategory(cat.value)}
                            className={[
                              'flex-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                              editCategory === cat.value
                                ? 'bg-saddle-600 text-white border-saddle-700'
                                : 'bg-white text-rope-500 border-dust-300 hover:border-saddle-400',
                            ].join(' ')}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-rope-400 text-xs w-5 text-right shrink-0">{index + 1}.</span>
                        <span className="font-medium text-rope-800 text-sm truncate">{c.name}</span>
                        <CategoryBadge category={c.category} />
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => navigate(`/competition/${id}/competitor/${c.id}/history`)}
                          className="p-1.5 rounded-md text-rope-400 hover:text-saddle-700 hover:bg-dust-100 transition-colors"
                          title="Histórico"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </button>
                        <button
                          onClick={() => startEdit(c)}
                          className="p-1.5 rounded-md text-rope-400 hover:text-saddle-700 hover:bg-dust-100 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDelete(c)}
                          className="p-1.5 rounded-md text-rope-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                          title="Remover"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canSort && (
            <div className="px-4 py-3 border-t border-dust-200 bg-dust-50 rounded-b-xl">
              <Button onClick={handleSortDuos} loading={isSorting} fullWidth>
                Sortear Duplas ({competitors.length} competidores, {numRounds} passada{numRounds !== 1 ? 's' : ''})
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Modal: Importar da Base */}
      <Modal
        isOpen={athletePickerOpen}
        onClose={() => { setAthletePickerOpen(false); setSelectedAthleteIds(new Set()); setAthleteSearch(''); }}
        title="Importar da Base de Atletas"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={athleteSearch}
            onChange={(e) => setAthleteSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-dust-300 focus:outline-none focus:ring-2 focus:ring-hay-400 text-sm"
            autoFocus
          />
          {loadingAthletes ? (
            <p className="text-center text-rope-400 py-4">Carregando...</p>
          ) : filteredAthletes.length === 0 ? (
            <p className="text-center text-rope-400 py-4">
              {athletes.length === 0 ? 'Nenhum atleta cadastrado na base.' : 'Nenhum atleta encontrado.'}
            </p>
          ) : (
            <ul className="divide-y divide-dust-200 max-h-72 overflow-y-auto border border-dust-200 rounded-lg">
              {filteredAthletes.map((a) => (
                <li key={a.id}>
                  <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-dust-50">
                    <input
                      type="checkbox"
                      checked={selectedAthleteIds.has(a.id)}
                      onChange={(e) => {
                        const next = new Set(selectedAthleteIds);
                        e.target.checked ? next.add(a.id) : next.delete(a.id);
                        setSelectedAthleteIds(next);
                      }}
                      className="w-4 h-4 rounded border-dust-400 text-saddle-600 focus:ring-hay-400"
                    />
                    <span className="flex-1 text-sm text-rope-800">{a.name}</span>
                    <CategoryBadge category={a.category} />
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => { setAthletePickerOpen(false); setSelectedAthleteIds(new Set()); setAthleteSearch(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleImportAthletes} disabled={selectedAthleteIds.size === 0}>
              Adicionar {selectedAthleteIds.size > 0 ? `(${selectedAthleteIds.size})` : ''}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Remover competidor"
        message={`Tem certeza que deseja remover ${deleteTarget?.name}?`}
        confirmLabel="Remover"
      />
    </div>
  );
}
