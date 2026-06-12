import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { CategoryBadge } from './Badge';
import {
  detectExcelColumns,
  parseRows,
  ExcelDetectionResult,
  ParsedRow,
} from '../../utils/detectExcelColumns';
import { Competitor, RiderCategory } from '../../core/models/Competidor';

const CATEGORIES: { label: string; value: RiderCategory }[] = [
  { label: 'Aberta (Open)', value: 'Open' },
  { label: 'Amador', value: 'Amateur19' },
  { label: 'Amador Light', value: 'AmateurLight' },
  { label: 'Principiante', value: 'Beginner' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (competitors: Omit<Competitor, 'id' | 'passes'>[]) => void;
  numRounds: number;
}

type Step = 'mapping' | 'preview';

export function CompetitorImportModal({ isOpen, onClose, onImport, numRounds }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [detection, setDetection] = useState<ExcelDetectionResult | null>(null);
  const [nameCol, setNameCol] = useState<string>('');
  const [categoryCol, setCategoryCol] = useState<string>('');
  const [step, setStep] = useState<Step>('mapping');
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setDetection(null);
      setNameCol('');
      setCategoryCol('');
      setStep('mapping');
      setPreview([]);
      setError(null);
    }
  }, [isOpen]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await detectExcelColumns(f);
      setFile(f);
      setDetection(result);
      setNameCol(result.nameCol ?? result.headers[0] ?? '');
      setCategoryCol(result.categoryCol ?? '');
    } catch {
      setError('Não foi possível ler o arquivo. Verifique se é um .xlsx ou .xls válido.');
    } finally {
      setIsLoading(false);
    }
    e.target.value = '';
  }

  async function handlePreview() {
    if (!file || !nameCol) return;
    setIsLoading(true);
    try {
      const rows = await parseRows(file, nameCol, categoryCol || null);
      setPreview(rows);
      setStep('preview');
    } catch {
      setError('Erro ao processar o arquivo.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleConfirmImport() {
    const competitors = preview.map((r) => ({ name: r.name, category: r.category }));
    onImport(competitors);
    onClose();
  }

  const unrecognized = preview.filter((r) => !r.categoryRecognized && categoryCol);
  const confidenceLabel = {
    high: { text: 'Alta confiança — colunas detectadas pelos cabeçalhos', color: 'text-pasture-700 bg-pasture-50 border-pasture-200' },
    medium: { text: 'Confiança média — colunas detectadas pelos valores', color: 'text-hay-700 bg-hay-50 border-hay-200' },
    low: { text: 'Não foi possível detectar as colunas automaticamente', color: 'text-brand-700 bg-brand-50 border-brand-200' },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar Competidores via Excel"
      size="lg"
      footer={
        step === 'mapping' ? (
          <>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handlePreview} loading={isLoading} disabled={!file || !nameCol}>
              Visualizar →
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setStep('mapping')}>← Voltar</Button>
            <Button onClick={handleConfirmImport} disabled={preview.length === 0}>
              Importar {preview.length} competidor{preview.length !== 1 ? 'es' : ''}
            </Button>
          </>
        )
      }
    >
      {step === 'mapping' ? (
        <div className="flex flex-col gap-5">
          {/* File picker */}
          {!file ? (
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-dust-300 rounded-xl cursor-pointer hover:border-saddle-400 hover:bg-dust-50 transition-colors">
              <span className="text-4xl">📂</span>
              <div className="text-center">
                <p className="font-medium text-rope-700">Clique para selecionar a planilha</p>
                <p className="text-xs text-rope-400 mt-1">Formatos suportados: .xlsx, .xls</p>
              </div>
              <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-dust-50 border border-dust-200 rounded-lg">
              <span className="text-2xl">📊</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-rope-800 text-sm truncate">{file.name}</p>
                <p className="text-xs text-rope-400">{detection?.totalRows} linhas encontradas</p>
              </div>
              <label className="text-xs text-saddle-600 font-medium cursor-pointer hover:text-saddle-800 underline">
                Trocar
                <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
              </label>
            </div>
          )}

          {error && (
            <p className="text-sm text-brand-600 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {isLoading && <div className="flex justify-center py-4"><Spinner /></div>}

          {detection && !isLoading && (
            <>
              {/* Confidence indicator */}
              <div className={`text-xs font-medium px-3 py-2 rounded-lg border ${confidenceLabel[detection.confidence].color}`}>
                {confidenceLabel[detection.confidence].text}
              </div>

              {/* Column mapping */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-rope-700 block mb-1.5">
                    Coluna do nome <span className="text-brand-500">*</span>
                  </label>
                  <select
                    value={nameCol}
                    onChange={(e) => setNameCol(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-dust-300 text-sm text-rope-800 focus:outline-none focus:ring-2 focus:ring-hay-400 bg-white"
                  >
                    <option value="">— não importar —</option>
                    {detection.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-rope-700 block mb-1.5">
                    Coluna da categoria
                  </label>
                  <select
                    value={categoryCol}
                    onChange={(e) => setCategoryCol(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-dust-300 text-sm text-rope-800 focus:outline-none focus:ring-2 focus:ring-hay-400 bg-white"
                  >
                    <option value="">— não importar (usar Open) —</option>
                    {detection.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview of first 5 rows */}
              {detection.previewRows.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-rope-500 uppercase tracking-wide mb-2">
                    Prévia das primeiras {detection.previewRows.length} linhas
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-dust-200">
                    <table className="w-full text-xs">
                      <thead className="bg-dust-50">
                        <tr>
                          {detection.headers.map((h) => (
                            <th
                              key={h}
                              className={[
                                'px-3 py-2 text-left font-semibold uppercase tracking-wide whitespace-nowrap',
                                h === nameCol ? 'text-saddle-700 bg-hay-50' : h === categoryCol ? 'text-pasture-700 bg-pasture-50' : 'text-rope-400',
                              ].join(' ')}
                            >
                              {h}
                              {h === nameCol && ' 👤'}
                              {h === categoryCol && ' 🏷️'}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dust-100">
                        {detection.previewRows.map((row, i) => (
                          <tr key={i} className="hover:bg-dust-50">
                            {detection.headers.map((h) => (
                              <td
                                key={h}
                                className={[
                                  'px-3 py-2 text-rope-700',
                                  h === nameCol ? 'font-medium' : '',
                                ].join(' ')}
                              >
                                {row[h] ?? ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Preview step
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 bg-pasture-50 border border-pasture-200 rounded-lg text-center">
              <p className="text-2xl font-bold text-pasture-700">{preview.length}</p>
              <p className="text-xs text-pasture-600">competidores</p>
            </div>
            {unrecognized.length > 0 && (
              <div className="flex-1 p-3 bg-hay-50 border border-hay-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-hay-700">{unrecognized.length}</p>
                <p className="text-xs text-hay-600">categoria desconhecida → Open</p>
              </div>
            )}
          </div>

          {unrecognized.length > 0 && (
            <div className="p-3 bg-hay-50 border border-hay-200 rounded-lg text-xs text-hay-800">
              <p className="font-semibold mb-1">Categorias não reconhecidas (serão importados como Aberta/Open):</p>
              <p className="text-hay-700">{unrecognized.map((r) => `"${r.rawCategory}"`).slice(0, 8).join(', ')}{unrecognized.length > 8 ? ` e mais ${unrecognized.length - 8}...` : ''}</p>
              <p className="mt-1.5 text-hay-600">Valores aceitos: Open/Aberta · Amador · Amador Light · Principiante</p>
            </div>
          )}

          <div className="overflow-y-auto max-h-72 rounded-lg border border-dust-200">
            <table className="w-full text-sm">
              <thead className="bg-dust-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">Nome</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">Categoria</th>
                  {categoryCol && <th className="px-4 py-2.5 text-left text-xs font-semibold text-rope-500 uppercase tracking-wide">Original</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-dust-100">
                {preview.map((r, i) => (
                  <tr key={i} className={r.categoryRecognized || !categoryCol ? 'hover:bg-dust-50' : 'bg-hay-50/50'}>
                    <td className="px-4 py-2 text-rope-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-rope-800">{r.name}</td>
                    <td className="px-4 py-2"><CategoryBadge category={r.category} /></td>
                    {categoryCol && (
                      <td className="px-4 py-2 text-xs text-rope-400">
                        {r.categoryRecognized ? '' : <span className="text-hay-600">⚠ {r.rawCategory}</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
