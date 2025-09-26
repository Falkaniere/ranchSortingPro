import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { getDuoKey } from '../Qualifiers';

export default function Final({
  rounds = [],
  results = [], // qualificatórias
  finalResults = [],
  setFinalResults,
}) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ bullNumber: '', cattle: '', time: '' });

  // Flatten rounds
  const allDuosWithPass = useMemo(() => {
    return rounds.flat().map((duo, idx) => ({
      duo,
      pass: idx + 1,
    }));
  }, [rounds]);

  // 🔹 Calcular médias da qualif
  const calcQualifAvg = (duo) => {
    const key = getDuoKey(duo);
    const qualif = results.filter((r) => getDuoKey(r.duo) === key);
    if (qualif.length === 0) return { avgBois: 0, avgTempo: 0 };

    const avgBois = qualif.reduce((s, r) => s + r.cattle, 0) / qualif.length;
    const avgTempo = qualif.reduce((s, r) => s + r.time, 0) / qualif.length;
    return { avgBois, avgTempo };
  };

  // 🔹 Duplas anotadas com médias
  const annotatedDuos = useMemo(() => {
    return allDuosWithPass.map((item) => {
      const { avgBois, avgTempo } = calcQualifAvg(item.duo);
      return { ...item, avgBois, avgTempo };
    });
  }, [allDuosWithPass, results]);

  // 🔹 Ordenar (maior tempo primeiro, depois menor bois)
  const orderedDuos = useMemo(() => {
    return [...annotatedDuos].sort((a, b) => {
      if (b.avgTempo !== a.avgTempo) return b.avgTempo - a.avgTempo;
      return a.avgBois - b.avgBois;
    });
  }, [annotatedDuos]);

  const pendingDuos = orderedDuos.filter(
    (d) =>
      !finalResults.some(
        (fr) => fr.pass === d.pass && getDuoKey(fr.duo) === getDuoKey(d.duo)
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

    const previousTime = selected.avgTempo || 0;

    const already = finalResults.find(
      (r) =>
        r.pass === selected.pass && getDuoKey(r.duo) === getDuoKey(selected.duo)
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
        {/* Duplas restantes */}
        <div className="card">
          <h3>Duplas Restantes</h3>
          <div className="duo-cards">
            {pendingDuos.length === 0 && <p>Todas as duplas já registradas.</p>}
            {pendingDuos.map((d) => (
              <div key={d.pass} className="duo-card">
                <div className="duo-info">
                  <strong>
                    #{d.pass} — {d.duo[0].name} & {d.duo[1].name}
                  </strong>
                  <span>
                    Qualif med:{' '}
                    {d.avgTempo > 0 ? `${d.avgTempo.toFixed(3)}s` : '-'} • med
                    bois: {d.avgBois ? d.avgBois.toFixed(2) : '-'}
                  </span>
                </div>
                <button onClick={() => handleSelect(d)}>Selecionar</button>
              </div>
            ))}
          </div>
        </div>

        {/* Painel de médias */}
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
                    fr.pass === d.pass && getDuoKey(fr.duo) === getDuoKey(d.duo)
                );
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
                      {d.duo[0].name} & {d.duo[1].name}
                    </td>
                    <td>{d.avgTempo > 0 ? d.avgTempo.toFixed(3) : '-'}</td>
                    <td>{finalRec ? finalRec.time.toFixed(3) : '-'}</td>
                    <td>{finalRec ? finalRec.cattle : '-'}</td>
                    <td>{combinedBois ? combinedBois.toFixed(2) : '-'}</td>
                    <td>{combinedTime ? combinedTime.toFixed(3) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3>
            Registrar Final — #{selected.pass} {selected.duo[0].name} &{' '}
            {selected.duo[1].name}
          </h3>
          <div className="flex">
            <input
              type="number"
              placeholder="Número do boi (0-9)"
              value={form.bullNumber}
              onChange={(e) => setForm({ ...form, bullNumber: e.target.value })}
            />
            <input
              type="number"
              placeholder="Qtd bois (0-10)"
              value={form.cattle}
              onChange={(e) => setForm({ ...form, cattle: e.target.value })}
            />
            <input
              type="number"
              placeholder="Tempo (s)"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
            <button onClick={() => saveFinal(false)}>Salvar</button>
            <button className="danger" onClick={() => saveFinal(true)}>
              S.A.T (120s)
            </button>
          </div>
        </div>
      )}

      {/* Lista parcial */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Resultados Finais Registrados</h3>
        <ul>
          {finalResults.map((r, i) => (
            <li key={`${r.pass}-${i}`}>
              #{r.pass} — {r.duo[0].name} & {r.duo[1].name} → 🐂 {r.cattle} | ⏱{' '}
              {r.time}s
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          className="primary"
          disabled={finalResults.length < orderedDuos.length}
          onClick={() =>
            navigate('/final-results', { state: { results, finalResults } })
          }
        >
          Ver Resultado Final
        </button>
      </div>
    </div>
  );
}
