import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DuoGroup } from 'core/models/Duo';
import { standingsFromScores } from 'core/logic/scoring';
import './index.css';
import { PassResult } from 'core/models/PassResult';
import { ResultsRow } from 'components/ResultsTable';
import ResultsTable from 'components/ResultsTable';
import { useResults } from 'context/ResultContext';

interface QualifiersProps {
  duos: { id: string; label: string; group: DuoGroup }[];
}

export default function Qualifiers({ duos }: QualifiersProps) {
  const navigate = useNavigate();
  const { addResult, getQualifierStandings } = useResults();

  const [selectedDuoId, setSelectedDuoId] = useState<string | null>(null);
  const [form, setForm] = useState({ cattleCount: '', timeSeconds: '' });
  const bottomRef = useRef<HTMLDivElement | null>(null);

  function saveResult(isSAT = false) {
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
      stage: 'Qualifier',
      cattleCount: cattle,
      timeSeconds: time,
      isSAT,
      createdAtISO: new Date().toISOString(),
    };

    addResult(newResult);
    setForm({ cattleCount: '', timeSeconds: '' });
  }

  const standings = (() => {
    const groupMap = new Map(duos.map((d) => [d.id, d.group]));
    const scores = getQualifierStandings(groupMap);
    return standingsFromScores(scores);
  })();

  const standings1D: ResultsRow[] = standings
    .filter((s) => s.group === '1D')
    .map((s) => {
      const duo = duos.find((d) => d.id === s.duoId);
      return {
        duoId: s.duoId,
        duoLabel: duo?.label ?? s.duoId,
        group: s.group,
        cattleCount: s.cattleCount,
        timeSeconds: s.timeSeconds,
        position: s.position,
      };
    });

  const standings2D: ResultsRow[] = standings
    .filter((s) => s.group === '2D')
    .map((s) => {
      const duo = duos.find((d) => d.id === s.duoId);
      return {
        duoId: s.duoId,
        duoLabel: duo?.label ?? s.duoId,
        group: s.group,
        cattleCount: s.cattleCount,
        timeSeconds: s.timeSeconds,
        position: s.position,
      };
    });

  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="qualifiers-container">
      <h1>Qualifiers</h1>

      {/* Duo selector */}
      <select
        value={selectedDuoId ?? ''}
        onChange={(e) => setSelectedDuoId(e.target.value)}
      >
        <option value="">-- Select Duo --</option>
        {duos.map((duo) => (
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
        <button onClick={() => saveResult(false)}>Save</button>
        <button onClick={() => saveResult(true)}>SAT</button>
      </div>

      <ResultsTable title="Standings 1D" rows={standings1D} />
      <ResultsTable title="Standings 2D" rows={standings2D} />

      {showScrollTop && (
        <button
          className="scroll-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑ Top
        </button>
      )}

      <div ref={bottomRef}></div>
    </div>
  );
}
