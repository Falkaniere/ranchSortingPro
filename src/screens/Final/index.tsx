import React, { useState } from 'react';
import { useResults } from 'context/ResultContext';
import { PassResult } from 'core/models/PassResult';
import { Duo, DuoGroup } from 'core/models/Duo';
import { FinalsSelection } from 'core/logic/finals';
import './index.css';

type PendingEntry = {
  duoId: string;
  label: string;
  group: DuoGroup;
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

  const finalists: FinalsSelection = getFinalists();
  const bestScores = getBestQualifierScores();
  const [form, setForm] = useState({ cattleCount: '', timeSeconds: '' });
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
      (entry) => !finalResults.find((r: PassResult) => r.duoId === entry.duoId)
    );
  }

  // Parciais: já registrados na final
  const partials = finalResults.map((r: PassResult) => {
    const duo = duosMeta.find((d: Duo) => d.id === r.duoId);
    const quali = bestScores.get(r.duoId)!;
    const avgCattle = (quali.cattleCount + r.cattleCount) / 2;
    const avgTime = (quali.timeSeconds + r.timeSeconds) / 2;
    return {
      duoId: r.duoId,
      label: duo?.label ?? r.duoId,
      group: duo?.group ?? '1D',
      qualiCattle: quali.cattleCount,
      qualiTime: quali.timeSeconds,
      finalCattle: r.cattleCount,
      finalTime: r.timeSeconds,
      avgCattle,
      avgTime,
    };
  });

  const currentList = getPendingList(activeTab);
  const currentDuo = currentList[0] ?? null;
  const allRegistered = currentList.length === 0;

  function saveFinalResult(isSAT = false) {
    if (!currentDuo) return;

    const cattle = isSAT ? 0 : Number(form.cattleCount);
    const time = isSAT ? 120 : Number(form.timeSeconds);

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

    addFinalResult(currentDuo.duoId, cattle, time, isSAT);
    setForm({ cattleCount: '', timeSeconds: '' });
  }

  return (
    <div className="finals-container">
      <h1>Finais</h1>

      {/* Abas */}
      <div className="tabs">
        <button
          className={activeTab === '1D' ? 'active' : ''}
          onClick={() => setActiveTab('1D')}
        >
          Categoria 1D
        </button>
        <button
          className={activeTab === '2D' ? 'active' : ''}
          onClick={() => setActiveTab('2D')}
        >
          Categoria 2D
        </button>
      </div>

      {/* Formulário de registro */}
      {currentDuo && (
        <div className="form">
          <div className="current-duo">
            <strong>Dupla atual:</strong> {currentDuo.label} ({currentDuo.group}
            )
          </div>
          <input
            type="number"
            placeholder="Bois"
            value={form.cattleCount}
            onChange={(e) => setForm({ ...form, cattleCount: e.target.value })}
          />
          <input
            type="number"
            placeholder="Tempo (s)"
            value={form.timeSeconds}
            onChange={(e) => setForm({ ...form, timeSeconds: e.target.value })}
          />
          <button onClick={() => saveFinalResult(false)}>Salvar</button>
          <button onClick={() => saveFinalResult(true)}>SAT</button>
        </div>
      )}

      {/* Pendentes */}
      <div className="pending-list">
        <h2>Duplas pendentes ({activeTab})</h2>
        {currentList.length === 0 ? (
          <p>Todas as duplas desta categoria já foram registradas.</p>
        ) : (
          <ul className="pending-list-items">
            {currentList.map((entry) => (
              <li key={entry.duoId}>
                {entry.label} — {entry.group}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Parciais */}
      <div className="partials">
        <h2>Resultados parciais</h2>
        {partials.length === 0 ? (
          <p>Sem resultados ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Dupla</th>
                <th>Categoria</th>
                <th>Bois (Qualificatória)</th>
                <th>Tempo (Qualificatória)</th>
                <th>Bois (Final)</th>
                <th>Tempo (Final)</th>
                <th>Média de Bois</th>
                <th>Média de Tempo</th>
              </tr>
            </thead>
            <tbody>
              {partials
                .sort(
                  (a, b) => b.avgCattle - a.avgCattle || a.avgTime - b.avgTime
                )
                .map((entry, idx) => (
                  <tr key={entry.duoId}>
                    <td>{idx + 1}</td>
                    <td>{entry.label}</td>
                    <td>{entry.group}</td>
                    <td>{entry.qualiCattle}</td>
                    <td>{entry.qualiTime}</td>
                    <td>{entry.finalCattle}</td>
                    <td>{entry.finalTime}</td>
                    <td>{entry.avgCattle.toFixed(1)}</td>
                    <td>{entry.avgTime.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {allRegistered && (
        <button
          style={{ marginTop: '1rem' }}
          onClick={() => alert('Finais concluídas!')}
        >
          Encerrar Finais
        </button>
      )}
    </div>
  );
}
