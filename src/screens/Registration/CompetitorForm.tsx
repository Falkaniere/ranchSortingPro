import React, { useRef, useState } from 'react';
import { Competitor, RiderCategory } from 'core/models/Competidor';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { UpgradeBadge, UpgradeModal } from '../../components/ui/UpgradePrompt';
import { saveAthlete } from '../../services/firebase/athletes';
import { tryAutoLinkCompetitor } from '../../services/competitorLinking';
import { CATEGORIES } from '../../core/constants';

interface CompetitorFormProps {
  competitors: Competitor[];
  setCompetitors: (c: Competitor[]) => void;
  numRounds: number;
  setNumRounds: (n: number) => void;
  competitionId: string | undefined;
  onOpenAthletePicker: () => void;
  onOpenSheetImport: () => void;
}

export function CompetitorForm({
  competitors,
  setCompetitors,
  numRounds,
  setNumRounds,
  competitionId,
  onOpenAthletePicker,
  onOpenSheetImport,
}: CompetitorFormProps) {
  const toast = useToast();
  const { user } = useAuth();
  const { isPro, limits } = useSubscription();
  const atCompetitorLimit = !isPro && limits.maxCompetitors !== null && competitors.length >= limits.maxCompetitors;
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<RiderCategory>('Open'); // 'Open' = Profissional
  const [nameError, setNameError] = useState('');
  const [saveToBase, setSaveToBase] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  async function addCompetitor() {
    if (!name.trim()) { setNameError('O nome é obrigatório'); return; }
    const newCompetitor: Competitor = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      passes: numRounds,
    };
    setCompetitors([...competitors, newCompetitor]);

    // Auto-link in background — fire and forget, never blocks the organizer
    if (competitionId) tryAutoLinkCompetitor(newCompetitor, competitionId);

    if (saveToBase && user?.uid) {
      try {
        await saveAthlete(user.uid, { name: newCompetitor.name, category: newCompetitor.category });
      } catch (err) {
        console.error('[saveAthlete] failed:', err);
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

  return (
    <Card className="md:col-span-1 lg:col-span-2" title="Adicionar competidor">
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

        <Button variant="outline" size="sm" onClick={onOpenAthletePicker} fullWidth>
          Importar da Base
        </Button>

        <Button variant="outline" size="sm" onClick={onOpenSheetImport} fullWidth>
          Importar Planilha
        </Button>

        <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      </div>
    </Card>
  );
}
