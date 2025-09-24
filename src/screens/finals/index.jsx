import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Final() {
  const location = useLocation();
  const navigate = useNavigate();
  const ranking = location.state?.ranking || [];

  // ordenar para final: pior desempenho primeiro
  const classificados = [...ranking].sort((a, b) => {
    if (a.totalBois !== b.totalBois) {
      return a.totalBois - b.totalBois; // menos bois primeiro
    }
    return b.menorTempo - a.menorTempo; // mais lento primeiro
  });

  const [resultados, setResultados] = useState([]);
  const [duplaSelecionada, setDuplaSelecionada] = useState(null);
  const [form, setForm] = useState({
    numeroBoi: '',
    quantidade: '',
    tempo: '',
  });

  function handleSalvar() {
    if (!duplaSelecionada) return;

    const jaRegistrou = resultados.find(
      (r) =>
        r.dupla[0] === duplaSelecionada[0] && r.dupla[1] === duplaSelecionada[1]
    );

    if (jaRegistrou) {
      alert('⚠️ Essa dupla já possui 1 rodada registrada na final!');
      return;
    }

    const rodada = {
      dupla: duplaSelecionada,
      numeroBoi: form.numeroBoi,
      quantidade: Number(form.quantidade),
      tempo: Number(form.tempo),
    };

    setResultados([...resultados, rodada]);
    setForm({ numeroBoi: '', quantidade: '', tempo: '' });
    setDuplaSelecionada(null);
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Final</h2>
      <h3>Ordem das Duplas (pior → melhor)</h3>
      <ol>
        {classificados.map((d, i) => (
          <li key={i}>
            {d.dupla[0]} 🤝 {d.dupla[1]}{' '}
            <button onClick={() => setDuplaSelecionada(d.dupla)}>
              Selecionar
            </button>
          </li>
        ))}
      </ol>

      {/* Formulário */}
      {duplaSelecionada && (
        <div style={{ marginTop: '20px' }}>
          <h3>
            Registrar Final - {duplaSelecionada[0]} & {duplaSelecionada[1]}
          </h3>
          <input
            type="text"
            placeholder="Número do boi"
            value={form.numeroBoi}
            onChange={(e) => setForm({ ...form, numeroBoi: e.target.value })}
          />
          <input
            type="number"
            placeholder="Quantidade de bois"
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
          />
          <input
            type="number"
            placeholder="Tempo (segundos)"
            value={form.tempo}
            onChange={(e) => setForm({ ...form, tempo: e.target.value })}
          />
          <button onClick={handleSalvar}>Salvar</button>
        </div>
      )}

      {/* Resultados parciais */}
      <h3 style={{ marginTop: '30px' }}>Resultados da Final</h3>
      <ul>
        {resultados.map((r, i) => (
          <li key={i}>
            {r.dupla[0]} & {r.dupla[1]} → 🐂 {r.numeroBoi} | {r.quantidade} bois
            | ⏱ {r.tempo}s
          </li>
        ))}
      </ul>

      <button
        style={{ marginTop: '20px' }}
        disabled={resultados.length < classificados.length}
        onClick={() => navigate('/resultado-final', { state: { resultados } })}
      >
        Ver Resultados
      </button>
    </div>
  );
}

export default Final;
