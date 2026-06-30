import React, { useEffect, useState } from 'react';
import { Competitor } from 'core/models/Competidor';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { CategoryBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  AthleteProfile,
  listAthletes,
  importProfilesAsCompetitors,
} from '../../services/firebase/athletes';
import { tryAutoLinkCompetitor } from '../../services/competitorLinking';

interface AthletePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitors: Competitor[];
  setCompetitors: (c: Competitor[]) => void;
  numRounds: number;
  competitionId: string | undefined;
}

export function AthletePickerModal({
  isOpen,
  onClose,
  competitors,
  setCompetitors,
  numRounds,
  competitionId,
}: AthletePickerModalProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [athleteSearch, setAthleteSearch] = useState('');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set());
  const [loadingAthletes, setLoadingAthletes] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.uid) return;
    setLoadingAthletes(true);
    listAthletes(user.uid)
      .then(setAthletes)
      .catch((err) => {
        console.error('[listAthletes] failed:', err);
        toast('Erro ao carregar base de atletas. Verifique as regras do Firestore.', 'error');
      })
      .finally(() => setLoadingAthletes(false));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    setSelectedAthleteIds(new Set());
    setAthleteSearch('');
    onClose();
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
      // Auto-link all imported competitors in background
      if (competitionId) toAdd.forEach((c) => tryAutoLinkCompetitor(c, competitionId));
      toast(`${toAdd.length} atleta(s) importado(s)!`, 'success');
    }
    handleClose();
  }

  const filteredAthletes = athletes.filter((a) =>
    a.name.toLowerCase().includes(athleteSearch.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar da Base de Atletas" size="md">
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
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleImportAthletes} disabled={selectedAthleteIds.size === 0}>
            Adicionar {selectedAthleteIds.size > 0 ? `(${selectedAthleteIds.size})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
