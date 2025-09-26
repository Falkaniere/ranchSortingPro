import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function Duos({ competitors, numRounds, rounds, setRounds }) {
  const navigate = useNavigate();

  const generateRounds = (list, totalRounds) => {
    const roundsArray = [];
    const n = list.length;
    const copy = [...list];
    if (n % 2 !== 0) copy.push('ghost');

    for (let r = 0; r < totalRounds; r++) {
      const duos = [];
      const used = new Set();
      for (let i = 0; i < copy.length; i++) {
        if (used.has(copy[i]) || copy[i] === 'ghost') continue;
        for (let j = i + 1; j < copy.length; j++) {
          if (!used.has(copy[j]) && copy[j] !== 'ghost') {
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

  // Flatten para criar lista sequencial de passadas
  const duosWithIds = rounds.flat().map((duo, index) => ({
    id: index + 1,
    duo,
  }));

  // Função para gerar PDF
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('Lista de Duplas - Ordem de Passada', 14, 20);

    const tableData = duosWithIds.map((item) => [
      item.id, // ORD
      `${item.duo[0]}\n${item.duo[1]}`, // Competidores um embaixo do outro
      '', // Tempo vazio
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
        0: { halign: 'center', cellWidth: 20 }, // ORD
        1: { halign: 'left', cellWidth: 100 }, // Competidor
        2: { halign: 'center', cellWidth: 40 }, // Tempo
      },
    });

    doc.save('duplas.pdf');
  };

  const handleExportExcel = () => {
    // Montar os dados para a planilha
    const data = duosWithIds.map((item) => ({
      ORD: item.id,
      Competidores: `${item.duo[0]}\n${item.duo[1]}`, // nomes embaixo um do outro
      Tempo: '', // coluna vazia
    }));

    // Criar worksheet
    const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: false });

    // Ajustar largura das colunas
    worksheet['!cols'] = [
      { wch: 5 }, // ORD
      { wch: 30 }, // Competidores
      { wch: 10 }, // Tempo
    ];

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Duplas');

    // Gerar arquivo
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });

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
                {item.duo[0]} 🤝 {item.duo[1]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
        <button onClick={() => navigate('/record')}>Start Qualifiers</button>
        <button onClick={generatePDF}>Gerar PDF de Duplas</button>
        <button onClick={handleExportExcel} style={{ marginTop: 10 }}>
          Exportar Excel
        </button>
      </div>
    </div>
  );
}
