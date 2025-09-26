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

  function generateRounds(competitors, numPassadas) {
    const duos = [];
    const counts = new Map(competitors.map((c) => [c.name, 0]));

    // Enquanto alguém ainda não fez todas as passadas
    while (Array.from(counts.values()).some((c) => c < numPassadas)) {
      // Escolher dois competidores aleatórios que ainda não completaram
      const available = competitors.filter(
        (c) => counts.get(c.name) < numPassadas
      );
      if (available.length < 2) break;

      let c1, c2;
      do {
        c1 = available[Math.floor(Math.random() * available.length)];
        c2 = available[Math.floor(Math.random() * available.length)];
      } while (c1.name === c2.name);

      duos.push([c1, c2]);
      counts.set(c1.name, counts.get(c1.name) + 1);
      counts.set(c2.name, counts.get(c2.name) + 1);
    }

    return [duos]; // formato compatível: rounds[0] = lista de duplas
  }

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
