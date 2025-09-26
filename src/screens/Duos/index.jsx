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

  const generateRounds = (list, totalRounds) => {
    const roundsArray = [];
    const n = list.length;
    const copy = [...list];
    if (n % 2 !== 0) copy.push({ name: 'ghost', category: '' });

    for (let r = 0; r < totalRounds; r++) {
      const duos = [];
      const used = new Set();
      for (let i = 0; i < copy.length; i++) {
        if (used.has(copy[i]) || copy[i].name === 'ghost') continue;
        for (let j = i + 1; j < copy.length; j++) {
          if (!used.has(copy[j]) && copy[j].name !== 'ghost') {
            duos.push([copy[i], copy[j]]);
            used.add(copy[i]);
            used.add(copy[j]);
            break;
          }
        }
      }
      roundsArray.push(duos);
      const first = copy.shift();
      copy.push(first);
    }
    return roundsArray;
  };

  useEffect(() => {
    if (rounds.length === 0) {
      setRounds(generateRounds(competitors, numRounds));
    }
  }, [competitors, numRounds, rounds, setRounds]);

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

        {/* 🔹 Botão para exportar sorteio */}
        <button
          onClick={() => exportJSON({ competitors, rounds }, 'sorteio.json')}
        >
          Exportar Sorteio
        </button>

        {/* 🔹 Input para importar sorteio */}
        <label className="secondary" style={{ cursor: 'pointer' }}>
          Importar Sorteio
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) =>
              importJSON(e, (data) => {
                if (data.competitors) setCompetitors(data.competitors);
                if (data.rounds) setRounds(data.rounds);
              })
            }
          />
        </label>
      </div>
    </div>
  );
}
