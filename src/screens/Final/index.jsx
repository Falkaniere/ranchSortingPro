// src/screens/Final/index.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

export default function Final({
  rounds = [],
  results = [], // qualificatórias
  finalResults = [],
  setFinalResults,
}) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null); // { duo, pass, avgTempo, avgBois }
  const [form, setForm] = useState({ bullNumber: '', cattle: '', time: '' });

  // Flatten rounds and keep pass number fixed (sequential index)
  const allDuosWithPass = useMemo(() => {
    return rounds.flat().map((duo, idx) => ({
      duo,
      pass: idx + 1,
    }));
  }, [rounds]);

  // calcula médias das qualificatórias para uma dupla (avg bois e avg tempo)
  const calcQualifAvg = (duo) => {
    const key = duo.join('🤝');
    const qualif = results.filter((r) => r.duo.join('🤝') === key);
    if (qualif.length === 0) return { avgBois: 0, avgTempo: 0 };

    const avgBois = qualif.reduce((s, r) => s + r.cattle, 0) / qualif.length;
    const avgTempo = qualif.reduce((s, r) => s + r.time, 0) / qualif.length;
    return { avgBois, avgTempo };
  };

  // Anotar todas as duplas com as médias da qualif
  const annotatedDuos = useMemo(() => {
    return allDuosWithPass.map((item) => {
      const { avgBois, avgTempo } = calcQualifAvg(item.duo);
      return {
        ...item,
        avgBois,
        avgTempo,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDuosWithPass, results]);

  // Ordenar para final: do pior (maior avgTempo) para o melhor (menor avgTempo)
  const orderedDuos = useMemo(() => {
    return [...annotatedDuos].sort((a, b) => {
      // maior tempo qualif primeiro
      if (b.avgTempo !== a.avgTempo) return b.avgTempo - a.avgTempo;
      // tie-breaker: menor avgBois primeiro (optional) - keeps deterministic
      return a.avgBois - b.avgBois;
    });
  }, [annotatedDuos]);

  // Duplas ainda pendentes na final (não registradas)
  const pendingDuos = orderedDuos.filter(
    (d) =>
      !finalResults.some(
        (fr) => fr.pass === d.pass && fr.duo.join('🤝') === d.duo.join('🤝')
      )
  );

  function handleSelect(d) {
    setSelected(d);
    setForm({ bullNumber: '', cattle: '', time: '' });
  }

  function validateForm(isSAT = false) {
    if (!selected) return 'Selecione uma dupla.';
    if (isSAT) return null;

    const bullNum = Number(form.bullNumber);
    const cattleNum = Number(form.cattle);
    const timeNum = Number(form.time);

    if (isNaN(bullNum) || bullNum < 0 || bullNum > 9)
      return 'Número do boi inválido (0-9).';
    if (isNaN(cattleNum) || cattleNum < 0 || cattleNum > 10)
      return 'Quantidade de bois inválida (0-10).';
    if (isNaN(timeNum) || timeNum <= 0) return 'Tempo inválido (maior que 0).';
    return null;
  }

  function saveFinal(isSAT = false) {
    const err = validateForm(isSAT);
    if (err) return alert(err);

    const bullNum = isSAT ? 0 : Number(form.bullNumber);
    const cattleNum = isSAT ? 0 : Number(form.cattle);
    const timeNum = isSAT ? 120 : Number(form.time);

    // prev time is the avg qualif tempo (could be 0 if not present)
    const previousTime = selected.avgTempo || 0;

    // avoid double registration
    const already = finalResults.find(
      (r) =>
        r.pass === selected.pass && r.duo.join('🤝') === selected.duo.join('🤝')
    );
    if (already) {
      alert('Essa dupla já foi registrada na final.');
      setSelected(null);
      return;
    }

    const newRecord = {
      duo: selected.duo,
      pass: selected.pass,
      previousTime,
      bullNumber: bullNum,
      cattle: cattleNum,
      time: timeNum,
    };

    setFinalResults([...finalResults, newRecord]);
    setSelected(null);
    setForm({ bullNumber: '', cattle: '', time: '' });
  }

  return (
    <div className="container">
      <h2>🏆 Final</h2>

      <div className="final-grid">
        {/* Duplas restantes (cards) */}
        <div className="card">
          <h3>Duplas Restantes (ordem de largada: pior → melhor)</h3>
          <div className="duo-cards">
            {pendingDuos.length === 0 && <p>Todas as duplas já registradas.</p>}
            {pendingDuos.map((d, i) => (
              <div key={d.pass} className="duo-card">
                <div className="duo-info">
                  <strong>
                    #{d.pass} — {d.duo[0]} & {d.duo[1]}
                  </strong>
                  <span>
                    Qualif avg:{' '}
                    {d.avgTempo > 0 ? `${d.avgTempo.toFixed(3)}s` : '-'} • Avg
                    bois: {d.avgBois ? d.avgBois.toFixed(2) : '-'}
                  </span>
                </div>
                <button onClick={() => handleSelect(d)}>Selecionar</button>
              </div>
            ))}
          </div>
        </div>

        {/* Painel de médias (Qualif + Final) */}
        <div className="card">
          <h3>Médias (Qualif + Final)</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Passada</th>
                <th>Dupla</th>
                <th>Qualif Avg (s)</th>
                <th>Final Time (s)</th>
                <th>Final Bois</th>
                <th>Avg Bois Total</th>
                <th>Avg Time Total (s)</th>
              </tr>
            </thead>
            <tbody>
              {orderedDuos.map((d, idx) => {
                const finalRec = finalResults.find(
                  (fr) =>
                    fr.pass === d.pass && fr.duo.join('🤝') === d.duo.join('🤝')
                );
                // Avg combined: if final exists, average qualif avgTempo and final time; else just qualif avg
                const combinedTime =
                  finalRec && d.avgTempo > 0
                    ? (d.avgTempo + finalRec.time) / 2
                    : d.avgTempo;
                const combinedBois = finalRec
                  ? (d.avgBois + finalRec.cattle) / (d.avgBois ? 2 : 1)
                  : d.avgBois;

                return (
                  <tr key={d.pass}>
                    <td>{idx + 1}</td>
                    <td>{d.pass}</td>
                    <td>
                      {d.duo[0]} & {d.duo[1]}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {d.avgTempo > 0 ? d.avgTempo.toFixed(3) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {finalRec ? finalRec.time.toFixed(3) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {finalRec ? finalRec.cattle : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {combinedBois ? combinedBois.toFixed(2) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {combinedTime ? combinedTime.toFixed(3) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulário para registrar final da dupla selecionada */}
      {selected && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>
            Registrar Final — #{selected.pass} {selected.duo[0]} &{' '}
            {selected.duo[1]}
          </h3>
          <div className="flex">
            <input
              type="number"
              placeholder="Número do boi (0-9)"
              value={form.bullNumber}
              onChange={(e) => setForm({ ...form, bullNumber: e.target.value })}
              min={0}
              max={9}
            />
            <input
              type="number"
              placeholder="Qtd bois (0-10)"
              value={form.cattle}
              onChange={(e) => setForm({ ...form, cattle: e.target.value })}
              min={0}
              max={10}
            />
            <input
              type="number"
              placeholder="Tempo (s)"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              step="0.001"
              min="0.001"
            />
            <button onClick={() => saveFinal(false)}>Salvar</button>
            <button className="danger" onClick={() => saveFinal(true)}>
              S.A.T (120s)
            </button>
          </div>
        </div>
      )}

      {/* Lista de resultados parciais da final */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Resultados Finais Registrados</h3>
        <ul>
          {finalResults.map((r, i) => (
            <li key={`${r.pass}-${i}`}>
              #{r.pass} — {r.duo[0]} & {r.duo[1]} → 🐂 {r.cattle} | ⏱ {r.time}s
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          className="primary"
          disabled={finalResults.length < orderedDuos.length}
          onClick={() => navigate('/final-results')}
        >
          Ver Resultado Final
        </button>
      </div>
    </div>
  );
}
