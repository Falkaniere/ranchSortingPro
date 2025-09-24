import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import RegistroProvas from '../events';
import Qualifiers from '../qualifiers';
import ResultadoFinal from '../finalResults';
import Final from '../finals';

function Home({ competidores, setCompetidores }) {
  const navigate = useNavigate();

  function iniciarNovaCompeticao() {
    setCompetidores([]); // limpa lista
    navigate('/cadastro');
  }

  function continuarMesmosCompetidores() {
    if (competidores.length < 2) {
      alert('⚠️ Cadastre pelo menos 2 competidores para sortear duplas!');
      return;
    }
    navigate('/duplas');
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>🏇 Ranch Sort</h1>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <button onClick={() => navigate('/cadastro')}>Nova Competição</button>
        <button onClick={iniciarNovaCompeticao}>Iniciar Nova Competição</button>
        {competidores.length > 1 && (
          <button onClick={continuarMesmosCompetidores}>
            Continuar com Competidores Atuais
          </button>
        )}
      </div>

      {competidores.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h2>Competidores Cadastrados</h2>
          <p>Total: {competidores.length}</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {competidores.map((c, i) => (
              <li key={i}>👤 {c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Cadastro({ competidores, setCompetidores }) {
  const [nome, setNome] = useState('');
  const navigate = useNavigate();

  function adicionarCompetidor() {
    if (nome.trim() !== '') {
      setCompetidores([...competidores, nome]);
      setNome('');
    }
  }

  function sortear() {
    navigate('/duplas');
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Cadastro de Competidores</h2>
      <input
        type="text"
        placeholder="Nome do competidor"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <button onClick={adicionarCompetidor}>Adicionar</button>

      <ul>
        {competidores.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>

      <button disabled={competidores.length < 2} onClick={sortear}>
        Sortear Duplas
      </button>
    </div>
  );
}

function Duplas({ competidores }) {
  const navigate = useNavigate();

  // Sorteio simples (a lógica mais complexa de evitar repetição vem depois)
  function gerarDuplas(lista) {
    const copia = [...lista].sort(() => Math.random() - 0.5);
    const pares = [];
    for (let i = 0; i < copia.length; i += 2) {
      pares.push([copia[i], copia[i + 1]]);
    }
    return pares;
  }

  const duplas = gerarDuplas(competidores);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Duplas Sorteadas</h2>
      <ul>
        {duplas.map((d, i) => (
          <li key={i}>
            {d[0]} 🤝 {d[1]}
          </li>
        ))}
      </ul>
      <button onClick={() => navigate('/registro')}>
        Iniciar Registro de Provas
      </button>
    </div>
  );
}

export default function App() {
  const [competidores, setCompetidores] = useState([]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              competidores={competidores}
              setCompetidores={setCompetidores}
            />
          }
        />

        <Route
          path="/cadastro"
          element={
            <Cadastro
              competidores={competidores}
              setCompetidores={setCompetidores}
            />
          }
        />
        <Route
          path="/duplas"
          element={<Duplas competidores={competidores} />}
        />
        <Route
          path="/registro"
          element={<RegistroProvas competidores={competidores} />}
        />
        <Route
          path="/qualifiers"
          element={<Qualifiers competidores={competidores} />}
        />
        <Route path="/final" element={<Final competidores={competidores} />} />
        <Route path="/resultado-final" element={<ResultadoFinal />} />
      </Routes>
    </Router>
  );
}
