import React, { useState } from 'react';
import { useResults } from 'context/ResultContext';
import { aggregateFinals } from 'core/logic/finals';
import { PassResult } from 'core/models/PassResult';
import './index.css';

export default function Final() {
  const { getFinalists, finalResults, addFinalResult, getBestQualifierScores } =
    useResults();

  const finalists = getFinalists();
  const bestScores = getBestQualifierScores();

  const [activeTab, setActiveTab] = useState<'1D' | '2D'>('1D');

  function handleRegister(duoId: string, cattle: number, time: number) {
    if (isNaN(cattle) || isNaN(time)) {
      alert('Por favor, insira valores válidos para bois e tempo.');
      return;
    }
    addFinalResult(duoId, cattle, time);
  }

  function renderPending(group: '1D' | '2D') {
    const list = group === '1D' ? finalists.finalists1D : finalists.finalists2D;

    return (
      <div className="pending-list">
        {list.map((entry) => {
          const quali = bestScores.get(entry.duoId)!;
          const alreadyRegistered = finalResults.find(
            (r: PassResult) => r.duoId === entry.duoId
          );

          if (alreadyRegistered) return null;

          return (
            <div key={entry.duoId} className="pending-row">
              <span>
                <strong>{entry.duoId}</strong> — Qualif.:{' '}
                <strong>{quali.cattleCount}</strong> bois,{' '}
                <strong>{quali.timeSeconds}s</strong>
              </span>
              <input
                type="number"
                placeholder="Bois"
                id={`cattle-${entry.duoId}`}
                min={0}
              />
              <input
                type="number"
                placeholder="Tempo (s)"
                id={`time-${entry.duoId}`}
                min={0}
              />
              <button
                onClick={() => {
                  const cattle = Number(
                    (
                      document.querySelector(
                        `#cattle-${entry.duoId}`
                      ) as HTMLInputElement
                    )?.value
                  );
                  const time = Number(
                    (
                      document.querySelector(
                        `#time-${entry.duoId}`
                      ) as HTMLInputElement
                    )?.value
                  );
                  handleRegister(entry.duoId, cattle, time);
                }}
              >
                Salvar
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  function renderPartials(group: '1D' | '2D') {
    const aggregation = aggregateFinals(bestScores, finalResults).filter(
      (a) => a.group === group
    );

    return (
      <table className="partials-table">
        <thead>
          <tr>
            <th>Dupla</th>
            <th>Qualif. (bois)</th>
            <th>Qualif. (tempo)</th>
            <th>Final (bois)</th>
            <th>Final (tempo)</th>
            <th>Média (bois)</th>
            <th>Média (tempo)</th>
          </tr>
        </thead>
        <tbody>
          {aggregation.map((entry) => {
            const quali = bestScores.get(entry.duoId)!;
            const final = finalResults.find(
              (r: PassResult) => r.duoId === entry.duoId
            );
            if (!final) return null;

            const avgCattle = (quali.cattleCount + final.cattleCount) / 2;
            const avgTime = (quali.timeSeconds + final.timeSeconds) / 2;

            return (
              <tr key={entry.duoId}>
                <td>{entry.duoId}</td>
                <td>{quali.cattleCount}</td>
                <td>{quali.timeSeconds}</td>
                <td>{final.cattleCount}</td>
                <td>{final.timeSeconds}</td>
                <td>{avgCattle.toFixed(2)}</td>
                <td>{avgTime.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className="finals-container">
      <h1>Finais</h1>

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

      <div className="tab-content">
        {activeTab === '1D' ? (
          <>
            <h2>Pendentes</h2>
            {renderPending('1D')}
            <h2>Parciais</h2>
            {renderPartials('1D')}
          </>
        ) : (
          <>
            <h2>Pendentes</h2>
            {renderPending('2D')}
            <h2>Parciais</h2>
            {renderPartials('2D')}
          </>
        )}
      </div>
    </div>
  );
}
