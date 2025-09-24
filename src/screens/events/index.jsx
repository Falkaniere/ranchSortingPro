import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegistroProvas({ competidores }) {
  const navigate = useNavigate();

  // Gera duplas aleatórias
  function gerarDuplas(lista) {
    const copia = [...lista].sort(() => Math.random() - 0.5);
    const pares = [];
    for (let i = 0; i < copia.length; i += 2) {
      pares.push([copia[i], copia[i + 1]]);
    }
    return pares;
  }

  const [duplas] = useState(gerarDuplas(competidores));
  const [resultados, setResultados] = useState([]);
  const [duplaSelecionada, setDuplaSelecionada] = useState(null);
  const [form, setForm] = useState({
    numeroBoi: '',
    quantidade: '',
    tempo: '',
  });

  function handleSalvar() {
    if (!duplaSelecionada) return;

    // quantas rodadas já existem para essa dupla?
    const rodadasDaDupla = resultados.filter(
      (r) =>
        r.dupla[0] === duplaSelecionada[0] && r.dupla[1] === duplaSelecionada[1]
    );

    if (rodadasDaDupla.length >= 2) {
      alert('⚠️ Essa dupla já possui 2 rodadas registradas!');
      return;
    }

    const novaRodada = {
      dupla: duplaSelecionada,
      numeroRodada: rodadasDaDupla.length + 1,
      numeroBoi: form.numeroBoi,
      quantidade: Number(form.quantidade),
      tempo: Number(form.tempo),
    };

    setResultados([...resultados, novaRodada]);
    setForm({ numeroBoi: '', quantidade: '', tempo: '' });
    setDuplaSelecionada(null);
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Registro de Provas</h2>

      {/* Lista de duplas */}
      <h3>Duplas</h3>
      <ul>
        {duplas.map((d, i) => (
          <li key={i}>
            {d[0]} 🤝 {d[1]}{' '}
            <button onClick={() => setDuplaSelecionada(d)}>Selecionar</button>
          </li>
        ))}
      </ul>

      {/* Formulário */}
      {duplaSelecionada && (
        <div style={{ marginTop: '20px' }}>
          <h3>
            Registrar Prova - {duplaSelecionada[0]} & {duplaSelecionada[1]}
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

      {/* Resultados */}
      <h3 style={{ marginTop: '30px' }}>Resultados</h3>
      <ul>
        {resultados.map((r, i) => (
          <li key={i}>
            {r.dupla[0]} & {r.dupla[1]} → Rodada {r.numeroRodada} | 🐂{' '}
            {r.numeroBoi} | {r.quantidade} bois | ⏱ {r.tempo}s
          </li>
        ))}
      </ul>

      <button
        style={{ marginTop: '20px' }}
        disabled={resultados.length === 0}
        onClick={() => navigate('/qualifiers', { state: { resultados } })}
      >
        Ver Classificação
      </button>
    </div>
  );
}

export default RegistroProvas;
