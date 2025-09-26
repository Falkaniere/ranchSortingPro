// src/screens/Duos.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { exportJSON, importJSON } from '../../utils/storageUtils';

export default function Duos({
  competitors,
  numRounds,
  rounds,
  setRounds,
  setCompetitors,
}) {
  const navigate = useNavigate();

  // Gera rounds de duplas aleatórias sem repetição
  const generateRounds = (list, totalPassadasPorCompetidor) => {
    const n = list.length;
    if (n < 2) return [];

    // 🔹 Criar todas as combinações possíveis de duplas (sem repetição)
    let allCombos = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        allCombos.push([list[i], list[j]]);
      }
    }

    // 🔹 Embaralhar
    allCombos = allCombos.sort(() => Math.random() - 0.5);

    // 🔹 Contador de passadas de cada competidor
    const count = {};
    list.forEach((c) => {
      count[c.name] = 0;
    });

    const rounds = [];
    const usedCombos = new Set();

    while (true) {
      // 🔹 Escolher a próxima dupla que:
      // - ainda não foi usada
      // - nenhum competidor ultrapassou o limite
      const duo = allCombos.find(
        ([a, b]) =>
          !usedCombos.has(a.name + '🤝' + b.name) &&
          count[a.name] < totalPassadasPorCompetidor &&
          count[b.name] < totalPassadasPorCompetidor
      );

      if (!duo) break; // acabou as combinações possíveis

      // Marcar como usada
      usedCombos.add(duo[0].name + '🤝' + duo[1].name);

      // Atualizar contador
      count[duo[0].name]++;
      count[duo[1].name]++;

      rounds.push(duo);
    }

    return [rounds]; // mantém compatibilidade com seu código (array de rounds)
  };

  // 🔹 Garante que rounds só sejam gerados caso não venham do import
  useEffect(() => {
    if (rounds.length === 0 && competitors.length > 0) {
      setRounds(generateRounds(competitors, numRounds));
    }
  }, [competitors, numRounds, rounds, setRounds]);

  // Flatten para tabela
  const duosWithIds = rounds.flat().map((duo, index) => ({
    id: index + 1,
    duo,
  }));

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('Lista de Duplas - Ordem de Passada', 14, 20);

    const tableData = duosWithIds.map((item) => [
      item.id,
      [item.duo[0]?.name || '', item.duo[1]?.name || ''],
      '',
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['ORD', 'Competidor', 'Tempo']],
      body: tableData,
      styles: {
        fontSize: 12,
        cellPadding: 4,
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'left', cellWidth: 100, valign: 'top' },
        2: { halign: 'center', cellWidth: 40 },
      },
    });

    doc.save('duplas.pdf');
  };

  const handleExportExcel = () => {
    const data = duosWithIds.map((item) => ({
      ORD: item.id,
      Competidores: [item.duo[0]?.name || '', item.duo[1]?.name || ''].join(
        '\n'
      ),
      Tempo: '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: false });
    worksheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Duplas');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'Duplas.xlsx');
  };

  return (
    <div className="container">
      <h2>Passadas & Duplas</h2>

      <table className="card" style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Passada</th>
            <th>Competidores</th>
          </tr>
        </thead>
        <tbody>
          {duosWithIds.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                {item.duo[0]?.name} 🤝 {item.duo[1]?.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          marginTop: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <button onClick={() => navigate('/record')}>Start Qualifiers</button>
        <button onClick={generatePDF}>Gerar PDF de Duplas</button>
        <button onClick={handleExportExcel}>Exportar Excel</button>

        {/* 🔹 Exportar sorteio */}
        <button
          onClick={() => exportJSON({ competitors, rounds }, 'sorteio.json')}
        >
          Exportar Sorteio
        </button>

        {/* 🔹 Importar sorteio */}
        <label className="secondary" style={{ cursor: 'pointer' }}>
          Importar Sorteio
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) =>
              importJSON(e, (data) => {
                if (
                  data &&
                  Array.isArray(data.competitors) &&
                  Array.isArray(data.rounds)
                ) {
                  // 🔹 Reset antes para garantir re-render
                  setCompetitors([]);
                  setRounds([]);

                  setTimeout(() => {
                    setCompetitors(data.competitors);
                    setRounds(data.rounds);
                  }, 0);

                  alert('✅ Sorteio importado com sucesso!');
                } else {
                  alert(
                    '❌ Erro ao importar arquivo JSON. Verifique o formato.'
                  );
                }
              })
            }
          />
        </label>
      </div>
    </div>
  );
}
