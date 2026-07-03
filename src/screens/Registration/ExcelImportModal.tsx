import React, { useRef, useState } from 'react';
import { Competitor } from 'core/models/Competidor';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { CategoryBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { saveAthlete, listAthletes } from '../../services/firebase/athletes';
import { tryAutoLinkCompetitor } from '../../services/competitorLinking';
import {
  importCompetitorsFromExcel,
  ImportedCompetitorRow,
} from '../../utils/importExcel';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitors: Competitor[];
  setCompetitors: (c: Competitor[]) => void;
  numRounds: number;
  competitionId: string | undefined;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  competitors,
  setCompetitors,
  numRounds,
  competitionId,
}: ExcelImportModalProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [sheetRows, setSheetRows] = useState<ImportedCompetitorRow[]>([]);
  const [sheetStep, setSheetStep] = useState<'upload' | 'confirm'>('upload');
  const [importToCompetition, setImportToCompetition] = useState(true);
  const [importToBase, setImportToBase] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const sheetInputRef = useRef<HTMLInputElement>(null);

  function closeSheetModal() {
    setSheetRows([]);
    setSheetStep('upload');
    setImportToCompetition(true);
    setImportToBase(false);
    onClose();
  }

  async function handleSheetFile(file: File) {
    try {
      const rows = await importCompetitorsFromExcel(file);
      if (rows.length === 0) {
        toast('Nenhum competidor encontrado na planilha. Verifique as colunas Nome e Categoria.', 'error');
        return;
      }
      setSheetRows(rows);
      setSheetStep('confirm');
    } catch {
      toast('Erro ao ler a planilha. Verifique o formato do arquivo.', 'error');
    }
  }

  async function handleSheetImport() {
    if (!importToCompetition && !importToBase) {
      toast('Selecione pelo menos um destino para importar.', 'error');
      return;
    }
    setIsImporting(true);
    try {
      // Snapshot competitors before any await so we work with a consistent list
      const currentCompetitors = competitors;
      const existingNames = new Set(currentCompetitors.map((c) => c.name.toLowerCase()));
      const toAdd = sheetRows.filter((r) => !existingNames.has(r.name.toLowerCase()));

      if (importToCompetition) {
        const newCompetitors: Competitor[] = toAdd.map((r) => ({
          id: crypto.randomUUID(),
          name: r.name,
          category: r.category,
          passes: numRounds,
        }));
        setCompetitors([...currentCompetitors, ...newCompetitors]);
        if (competitionId) newCompetitors.forEach((c) => tryAutoLinkCompetitor(c, competitionId));
      }

      let baseSaveError = false;
      if (importToBase && user?.uid) {
        // Fetch existing athletes to avoid duplicates in the base
        let existingAthleteNames = new Set<string>();
        try {
          const existing = await listAthletes(user.uid);
          existingAthleteNames = new Set(existing.map((a) => a.name.toLowerCase()));
        } catch {
          // If fetch fails, proceed without dedup rather than blocking the import
        }
        const candidates = importToCompetition ? toAdd : sheetRows;
        const toSave = candidates.filter((r) => !existingAthleteNames.has(r.name.toLowerCase()));
        if (toSave.length > 0) {
          const results = await Promise.allSettled(
            toSave.map((r) => saveAthlete(user.uid!, { name: r.name, category: r.category }))
          );
          const failed = results.filter((r) => r.status === 'rejected').length;
          if (failed > 0) {
            console.error('[handleSheetImport] saveAthlete failed for', failed, 'athletes');
            baseSaveError = true;
          }
        }
      }

      const added = toAdd.length;
      // Only report "skipped" when actually adding to competition
      const skipped = importToCompetition ? sheetRows.length - toAdd.length : 0;
      const parts: string[] = [];
      if (importToCompetition && added > 0) parts.push(`${added} adicionado(s) à competição`);
      if (skipped > 0) parts.push(`${skipped} ignorado(s) (já cadastrados)`);
      if (importToBase && !baseSaveError) parts.push('salvos na base');
      if (baseSaveError) parts.push('falha ao salvar na base — verifique as regras do Firestore');
      toast(
        parts.join(', ') || 'Nenhum competidor novo para importar.',
        baseSaveError ? 'warning' : added > 0 ? 'success' : 'info'
      );

      closeSheetModal();
    } catch {
      toast('Erro ao importar competidores.', 'error');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={closeSheetModal} title="Importar Competidores via Planilha" size="md">
      {sheetStep === 'upload' ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-rope-600">
            Selecione uma planilha <span className="font-medium">.xlsx</span> ou <span className="font-medium">.xls</span> com as colunas <span className="font-medium">Nome</span> e <span className="font-medium">Categoria</span>.
          </p>
          <div className="rounded-lg border-2 border-dashed border-dust-300 bg-dust-50 p-6 text-center">
            <p className="text-xs text-rope-400 mb-3">Valores aceitos em Categoria: Profissional, Open, 1D, Amador, AmateurLight, 2D</p>
            <input
              ref={sheetInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSheetFile(file);
                e.target.value = '';
              }}
            />
            <Button onClick={() => sheetInputRef.current?.click()} variant="outline">
              Selecionar arquivo
            </Button>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={closeSheetModal}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-rope-600">
            <span className="font-semibold text-rope-800">{sheetRows.length}</span> competidor(es) encontrado(s). Escolha onde deseja importar:
          </p>

          <div className="flex flex-col gap-2 p-3 rounded-lg bg-dust-50 border border-dust-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={importToCompetition}
                onChange={(e) => setImportToCompetition(e.target.checked)}
                className="w-4 h-4 rounded border-dust-400 text-saddle-600 focus:ring-hay-400"
              />
              <div>
                <p className="text-sm font-medium text-rope-800">Adicionar à competição atual</p>
                <p className="text-xs text-rope-500">Competidores ficam disponíveis nesta competição</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={importToBase}
                onChange={(e) => setImportToBase(e.target.checked)}
                className="w-4 h-4 rounded border-dust-400 text-saddle-600 focus:ring-hay-400"
              />
              <div>
                <p className="text-sm font-medium text-rope-800">Salvar na base de atletas</p>
                <p className="text-xs text-rope-500">Ficam disponíveis para reutilizar em futuras competições</p>
              </div>
            </label>
          </div>

          <ul className="divide-y divide-dust-200 max-h-56 overflow-y-auto border border-dust-200 rounded-lg">
            {sheetRows.map((r) => (
              <li key={r.name} className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-rope-800">{r.name}</span>
                <CategoryBadge category={r.category} />
              </li>
            ))}
          </ul>

          <div className="flex justify-between gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setSheetStep('upload')}>
              ← Voltar
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={closeSheetModal}>
                Cancelar
              </Button>
              <Button
                onClick={handleSheetImport}
                loading={isImporting}
                disabled={!importToCompetition && !importToBase}
              >
                Importar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
