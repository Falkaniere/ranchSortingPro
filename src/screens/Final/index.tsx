import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResults } from 'context/ResultContext';
import { PassResult } from 'core/models/PassResult';
import { DuoGroup } from 'core/models/Duo';
import ResultsTable, { ResultsRow } from 'components/ResultsTable';
import './index.css';

interface FinalsProps {
  duos: { id: string; label: string; group: DuoGroup }[];
}

export default function Finals({ duos }: FinalsProps) {
  const navigate = useNavigate();
  const { addResult, getFinalists, getFinalAggregates } = useResults();

  const [selectedDuoId, setSelectedDuoId] = useState<string | null>(null);
  const [form, setForm] = useState({ cattleCount: '', timeSeconds: '' });

  function saveFinalResult(isSAT = false) {
    if (!selectedDuoId) {
      alert('Please select a duo first.');
      return;
    }

    const cattle = isSAT ? 0 : Number(form.cattleCount);
    const time = isSAT ? 120 : Number(form.timeSeconds);

    if (!isSAT) {
      if (isNaN(cattle) || cattle < 0 || cattle > 10) {
        alert('Invalid cattle count. Must be between 0 and 10.');
        return;
      }
      if (isNaN(time) || time <= 0) {
        alert('Invalid time.');
        return;
      }
    }

    const newResult: PassResult = {
      duoId: selectedDuoId,
      stage: 'Final',
      cattleCount: cattle,
      timeSeconds: time,
      isSAT,
      createdAtISO: new Date().toISOString(),
    };

    addResult(newResult);
    setForm({ cattleCount: '', timeSeconds: '' });
  }

  const groupMap = new Map(duos.map((d) => [d.id, d.group]));
  const { finalists1D, finalists2D, finalsOrder1D, finalsOrder2D } =
    getFinalists(groupMap);
  const aggregates = getFinalAggregates(groupMap);

  const finalRows: ResultsRow[] = aggregates.map((a, idx) => {
    const duo = duos.find((d) => d.id === a.duoId);
    return {
      duoId: a.duoId,
      duoLabel: duo?.label ?? a.duoId,
      group: a.group,
      totalCattle: a.totalCattle,
      totalTimeSeconds: a.totalTimeSeconds,
      position: idx + 1,
    };
  });

  return (
    <div className="finals-container">
      <h1>Finals</h1>

      {/* Duo selector */}
      <select
        value={selectedDuoId ?? ''}
        onChange={(e) => setSelectedDuoId(e.target.value)}
      >
        <option value="">-- Select Finalist Duo --</option>
        {duos
          .filter((d) => [...finalsOrder1D, ...finalsOrder2D].includes(d.id))
          .map((duo) => (
            <option key={duo.id} value={duo.id}>
              {duo.label} ({duo.group})
            </option>
          ))}
      </select>

      {/* Form */}
      <div className="form">
        <input
          type="number"
          placeholder="Cattle count"
          value={form.cattleCount}
          onChange={(e) => setForm({ ...form, cattleCount: e.target.value })}
        />
        <input
          type="number"
          placeholder="Time (s)"
          value={form.timeSeconds}
          onChange={(e) => setForm({ ...form, timeSeconds: e.target.value })}
        />
        <button onClick={() => saveFinalResult(false)}>Save</button>
        <button onClick={() => saveFinalResult(true)}>SAT</button>
      </div>

      <ResultsTable
        title="Final Results (Aggregated)"
        rows={finalRows}
        showTotals
      />

      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
}
