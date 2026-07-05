import React, { useRef, useState } from 'react';
import { Competitor } from 'core/models/Competidor';
import { Duo, DuoGroup } from 'core/models/Duo';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { GroupBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  parseDuoPairsFromPdf,
  buildDuosFromParsedPairs,
  ParsedPdfPair,
} from '../../utils/importPdf';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitors: Competitor[];
  setCompetitors: (c: Competitor[]) => void;
  onImported: (duos: Duo[]) => void;
}

export function PdfImportModal({
  isOpen,
  onClose,
  competitors,
  setCompetitors,
  onImported,
}: PdfImportModalProps) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'confirm'>('upload');
  const [isParsing, setIsParsing] = useState(false);
  const [pairs, setPairs] = useState<ParsedPdfPair[]>([]);
  const [manualGroups, setManualGroups] = useState<Record<number, DuoGroup | ''>>({});

  function reset() {
    setStep('upload');
    setPairs([]);
    setManualGroups({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    setIsParsing(true);
    try {
      const parsed = await parseDuoPairsFromPdf(file);
      if (parsed.length === 0) {
        toast('Nenhuma dupla encontrada no PDF. Verifique se o arquivo segue o formato "Ordem de Entradas na Competição".', 'error');
        return;
      }
      setPairs(parsed);
      setManualGroups({});
      setStep('confirm');
    } catch {
      toast('Erro ao ler o PDF. Verifique se o arquivo não está corrompido.', 'error');
    } finally {
      setIsParsing(false);
    }
  }

  const pendingCount = pairs.filter((p, i) => p.group === null && !manualGroups[i]).length;

  function handleConfirm() {
    const resolved = pairs.map((p, i) => ({
      ...p,
      group: p.group ?? (manualGroups[i] || null),
    }));

    if (resolved.some((p) => p.group === null)) {
      toast('Escolha o grupo (1D/2D) para todas as duplas com categoria não reconhecida.', 'error');
      return;
    }

    const { duos, newCompetitors } = buildDuosFromParsedPairs(
      resolved as Array<ParsedPdfPair & { group: DuoGroup }>,
      competitors
    );

    if (newCompetitors.length > 0) {
      setCompetitors([...competitors, ...newCompetitors]);
    }

    onImported(duos);
    toast(`${duos.length} duplas importadas do PDF!`, 'success');
    handleClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Duplas via PDF" size="lg">
      {step === 'upload' ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-rope-600">
            Selecione o PDF de <span className="font-medium">Ordem de Entradas na Competição</span> (com colunas Insc., Competidor 1, Competidor 2 e Categoria).
          </p>
          <div className="rounded-lg border-2 border-dashed border-dust-300 bg-dust-50 p-6 text-center">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
            <Button onClick={() => fileRef.current?.click()} variant="outline" loading={isParsing}>
              Selecionar arquivo PDF
            </Button>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-rope-600">
            <span className="font-semibold text-rope-800">{pairs.length}</span> dupla(s) encontrada(s) no PDF.
            {pendingCount > 0 && (
              <span className="text-saddle-700"> {pendingCount} precisa(m) de confirmação de grupo.</span>
            )}
          </p>

          <ul className="divide-y divide-dust-200 max-h-80 overflow-y-auto border border-dust-200 rounded-lg">
            {pairs.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-rope-400 text-xs w-8 text-right shrink-0 font-mono">
                    {p.passNumber}.
                  </span>
                  <span className="text-sm text-rope-800 truncate">
                    {p.competitor1Name} &amp; {p.competitor2Name}
                  </span>
                </div>
                {p.group ? (
                  <GroupBadge group={p.group} />
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-saddle-700 font-medium">{p.rawCategory}?</span>
                    <select
                      value={manualGroups[i] ?? ''}
                      onChange={(e) =>
                        setManualGroups((prev) => ({ ...prev, [i]: e.target.value as DuoGroup | '' }))
                      }
                      className="text-xs rounded-md border border-dust-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-hay-400"
                    >
                      <option value="">Escolher...</option>
                      <option value="1D">1D</option>
                      <option value="2D">2D</option>
                    </select>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="flex justify-between gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={reset}>
              ← Voltar
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={pendingCount > 0}>
                Importar {pairs.length} dupla{pairs.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
