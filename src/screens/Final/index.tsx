import React, { useState, useMemo } from 'react';
import { useResults } from 'context/ResultContext';
import { PassResult } from 'core/models/PassResult';
import { Duo, DuoGroup } from 'core/models/Duo';
import { FinalsSelection } from 'core/logic/finals';
import './index.css';
import { exportToExcel } from 'utils/exportExcel';
import { useNavigate } from 'react-router-dom';

type PendingEntry = {
  duoId: string;
  label: string;
  group: DuoGroup; // grupo visual (pode ser 2D)
  cattleCount: number;
  timeSeconds: number;
};

export default function Finals() {
  const {
    getFinalists,
    getBestQualifierScores,
    addFinalResult,
    finalResults,
    duosMeta,
  } = useResults();
  const navigate = useNavigate();

  const finalists: FinalsSelection = useMemo(
    () => getFinalists(),
    [finalResults]
  );
  const bestScores = useMemo(() => getBestQualifierScores(), [finalResults]);

  const [forms, setForms] = useState({
    '1D': { cattleCount: '', timeSeconds: '' },
    '2D': { cattleCount: '', timeSeconds: '' },
  });

  const [activeTab, setActiveTab] = useState<'1D' | '2D'>('1D');

  function toPendingEntries(
    entries: Array<{ duoId: string; cattleCount: number; timeSeconds: number }>
  ): PendingEntry[] {
    return entries.map((e) => {
      const duo = duosMeta.find((d: Duo) => d.id === e.duoId);
      return {
        duoId: e.duoId,
        label: duo?.label ?? e.duoId,
        group: duo?.group ?? '1D',
        cattleCount: e.cattleCount,
        timeSeconds: e.timeSeconds,
      };
    });
  }

  function getPendingList(category: '1D' | '2D'): PendingEntry[] {
    const listBase =
      category === '1D'
        ? toPendingEntries(finalists.finalists1D)
        : toPendingEntries(finalists.finalists2D);

    return listBase.filter(
      (entry) =>
        !finalResults.some(
          (r: PassResult) => r.duoId === entry.duoId && r.stage === 'Final'
        )
    );
  }

  const pending1D = getPendingList('1D');
  const pending2D = getPendingList('2D');

  const currentDuo =
    activeTab === '1D'
      ? pending1D[pending1D.length - 1] ?? null
      : pending2D[pending2D.length - 1] ?? null;

  const allRegistered =
    activeTab === '1D' ? pending1D.length === 0 : pending2D.length === 0;

  const partials = useMemo(() => {
    return finalResults
      .filter((r) => r.stage === 'Final')
      .map((r: PassResult) => {
        const duo = duosMeta.find((d: Duo) => d.id === r.duoId);
        const quali = bestScores.get(r.duoId);
        if (!duo || !quali) return null;

        // ⚙️ Se a dupla é 2D mas foi classificada em 1D, tratar internamente como 1D
        const logicalGroup: DuoGroup =
          duo.group === '2D' &&
          finalists.finalists1D.some((f) => f.duoId === duo.id)
            ? '1D'
            : duo.group;

        const avgCattle = (quali.cattleCount + r.cattleCount) / 2;
        const avgTime = (quali.timeSeconds + r.timeSeconds) / 2;

        return {
          duoId: r.duoId,
          label: duo.label,
          group: logicalGroup, // usado para filtro e cálculo
          visualGroup: duo.group, // usado apenas para exibir
          qualiCattle: quali.cattleCount,
          qualiTime: quali.timeSeconds,
          finalCattle: r.cattleCount,
          finalTime: r.timeSeconds,
          avgCattle,
          avgTime,
        };
      })
      .filter(Boolean);
  }, [finalResults, bestScores, duosMeta, finalists]);

  function saveFinalResult(isSAT = false) {
    if (!currentDuo) return;

    const currentForm = forms[activeTab];
    const cattle = isSAT ? 0 : Number(currentForm.cattleCount);
    const time = isSAT ? 120 : Number(currentForm.timeSeconds);

    if (!isSAT) {
      if (isNaN(cattle) || cattle < 0 || cattle > 10) {
        alert('Número de bois inválido (0–10).');
        return;
      }
      if (isNaN(time) || time <= 0) {
        alert('Tempo inválido.');
        return;
      }
    }

    // ⚙️ Se a dupla é 2D mas está na final 1D → registrar como 1D logicamente
    const duo = duosMeta.find((d) => d.id === currentDuo.duoId);
    const logicalGroup: DuoGroup =
      duo?.group === '2D' && activeTab === '1D'
        ? '1D'
        : duo?.group ?? activeTab;

    addFinalResult(currentDuo.duoId, cattle, time, isSAT);

    // apenas limpar o form visualmente
    setForms({
      ...forms,
      [activeTab]: { cattleCount: '', timeSeconds: '' },
    });

    console.log(
      `✅ Registrado ${currentDuo.label} (${duo?.group}) tratado como ${logicalGroup}`
    );
  }

  function handleTabChange(tab: '1D' | '2D') {
    setActiveTab(tab);
    setForms({
      ...forms,
      [tab]: { cattleCount: '', timeSeconds: '' },
    });
  }

  const currentForm = forms[activeTab];

  return (
    <div className="finals-container">
      <h1>Finais</h1>
      <button
        style={{ marginBottom: '16px' }}
        onClick={() => {
          const filtered = partials.filter((p) => p?.group === activeTab);
          exportToExcel(
            filtered.map((p, idx) => ({
              Posição: idx + 1,
              Dupla: p?.label,
              Categoria: p?.visualGroup,
              'Bois Qualif.': p?.qualiCattle,
              'Tempo Qualif.': p?.qualiTime,
              'Bois Final': p?.finalCattle,
              'Tempo Final': p?.finalTime,
              'Média Bois': Math.round(p?.avgCattle ?? 0),
              'Média Tempo': p?.avgTime.toFixed(2),
            })),
            `Resultados_Finais_${activeTab}`
          );
        }}
      >
        Exportar Finais ({activeTab})
      </button>
      {/* Abas */}
      <div className="tabs">
        <button
          className={activeTab === '1D' ? 'active' : ''}
          onClick={() => handleTabChange('1D')}
        >
          Categoria 1D
        </button>
        <button
          className={activeTab === '2D' ? 'active' : ''}
          onClick={() => handleTabChange('2D')}
        >
          Categoria 2D
        </button>
      </div>

      {/* Formulário */}
      {currentDuo && (
        <div className="form">
          <div className="current-duo">
            <strong>Dupla atual:</strong> {currentDuo.label} ({currentDuo.group}
            )
          </div>
          <input
            type="number"
            placeholder="Bois"
            value={currentForm.cattleCount}
            onChange={(e) =>
              setForms({
                ...forms,
                [activeTab]: { ...currentForm, cattleCount: e.target.value },
              })
            }
          />
          <input
            type="number"
            placeholder="Tempo (s)"
            value={currentForm.timeSeconds}
            onChange={(e) =>
              setForms({
                ...forms,
                [activeTab]: { ...currentForm, timeSeconds: e.target.value },
              })
            }
          />
          <button onClick={() => saveFinalResult(false)}>Salvar</button>
          <button onClick={() => saveFinalResult(true)}>SAT</button>
        </div>
      )}

      {/* Pendentes */}
      <div className="pending-list">
        <h2>Duplas pendentes ({activeTab})</h2>
        {(activeTab === '1D' ? pending1D : pending2D).length === 0 ? (
          <p>Todas as duplas desta categoria já foram registradas.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Dupla</th>
                <th>Bois (Qualificatória)</th>
                <th>Tempo (Qualificatória)</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === '1D' ? pending1D : pending2D).map(
                (entry, idx) => (
                  <tr key={entry.duoId}>
                    <td>{idx + 1}</td>
                    <td>
                      {entry.label} ({entry.group})
                    </td>
                    <td>{entry.cattleCount}</td>
                    <td>{entry.timeSeconds}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Parciais */}
      <div className="partials">
        <h2>Resultados parciais ({activeTab})</h2>
        {partials.filter((p) => p?.group === activeTab).length === 0 ? (
          <p>Sem resultados ainda nesta categoria.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Dupla</th>
                <th>Bois (Qualif.)</th>
                <th>Tempo (Qualif.)</th>
                <th>Bois (Final)</th>
                <th>Tempo (Final)</th>
                <th>Média Bois</th>
                <th>Média Tempo</th>
              </tr>
            </thead>
            <tbody>
              {partials
                .filter((p) => p?.group === activeTab)
                .sort((a, b) => {
                  if (!a || !b) return 0;
                  return b.avgCattle - a.avgCattle || a.avgTime - b.avgTime;
                })
                .map((entry, idx) => (
                  <tr key={entry?.duoId}>
                    <td>{idx + 1}</td>
                    <td>{entry?.label}</td>
                    <td>{entry?.qualiCattle}</td>
                    <td>{entry?.qualiTime}</td>
                    <td>{entry?.finalCattle}</td>
                    <td>{entry?.finalTime}</td>
                    <td>{Math.round(entry?.avgCattle ?? 0)}</td>
                    <td>{entry?.avgTime.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {allRegistered && (
        <button style={{ marginTop: '1rem' }} onClick={() => navigate('/ ')}>
          Encerrar Finais
        </button>
      )}
    </div>
  );
}
