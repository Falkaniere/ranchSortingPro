import React from 'react';
import { Duo } from 'core/models/Duo';
import { useNavigate } from 'react-router-dom';
import { Competitor } from 'core/index';
import { exportToExcel } from 'utils/exportExcel';
import { importDuosFromExcel } from 'utils/importExcel';
import { useResults } from 'context/ResultContext';

import './index.css';

export interface DuosProps {
  competitors: Competitor[];
  rounds: Duo[];
  setRounds: React.Dispatch<React.SetStateAction<Duo[]>>;
  setCompetitors: React.Dispatch<React.SetStateAction<Competitor[]>>;
}

export default function Duos({
  competitors,
  rounds,
  setRounds,
  setCompetitors,
}: DuosProps) {
  const navigate = useNavigate();
  const { setDuosMeta } = useResults();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedDuos = await importDuosFromExcel(
        file,
        competitors,
        setCompetitors
      );

      setRounds(importedDuos);
      setDuosMeta(importedDuos); // ✅ adiciona no contexto global

      alert(`✅ ${importedDuos.length} duplas importadas com sucesso!`);
      e.target.value = '';
    } catch (err) {
      console.error(err);
      alert('❌ Erro ao importar o arquivo. Verifique o formato.');
    }
  };

  return (
    <div className="duos-container">
      <h1>Duplas sorteadas</h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem' }}>
        {/* Exportar */}
        <button
          onClick={() =>
            exportToExcel(
              rounds.map((duo) => {
                const riderOne = competitors.find(
                  (c) => c.id === duo.riderOneId
                );
                const riderTwo = competitors.find(
                  (c) => c.id === duo.riderTwoId
                );
                return {
                  Dupla: `${riderOne?.name ?? '?'} 🤝 ${riderTwo?.name ?? '?'}`,
                  Categoria: duo.group,
                };
              }),
              'Duplas_Cadastradas'
            )
          }
        >
          Exportar Duplas
        </button>

        {/* Importar */}
        <label
          style={{
            background: '#22a31b',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          📥 Importar Duplas
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {rounds.length === 0 && <p>Nenhuma dupla sorteada ainda.</p>}

      {rounds.length > 0 && (
        <ul>
          {rounds.map((duo) => {
            const riderOne = competitors.find((c) => c.id === duo.riderOneId);
            const riderTwo = competitors.find((c) => c.id === duo.riderTwoId);
            return (
              <li key={duo.id} className="duo-item">
                {riderOne?.name ?? '??'} 🤝 {riderTwo?.name ?? '??'} —{' '}
                {duo.group}
              </li>
            );
          })}
        </ul>
      )}

      {rounds.length > 0 && (
        <button onClick={() => navigate('/record')}>
          Ir para as Eliminatórias
        </button>
      )}
    </div>
  );
}
