// src/screens/FinalResults/index.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function FinalResults({ finalResults = [] }) {
  const navigate = useNavigate();

  // Agrupar resultados por dupla
  const rankingMap = {};
  finalResults.forEach((r) => {
    const key = r.duo.join('🤝');
    if (!rankingMap[key]) {
      rankingMap[key] = {
        duo: r.duo,
        pass: r.pass,
        qualifTime: r.previousTime || 0,
        finalTime: r.time || 0,
        finalCattle: r.cattle || 0,
        qualifBois: r.previousBois || 0,
      };
    }
  });

  // Calcular médias combinadas
  const ranking = Object.values(rankingMap).map((r) => {
    const avgTime =
      r.qualifTime > 0 ? (r.qualifTime + r.finalTime) / 2 : r.finalTime;

    const avgBois =
      r.qualifBois > 0 ? (r.qualifBois + r.finalCattle) / 2 : r.finalCattle;

    return {
      ...r,
      avgTime,
      avgBois,
    };
  });

  // Ordenar: maior bois → menor tempo
  ranking.sort((a, b) => {
    if (b.avgBois !== a.avgBois) return b.avgBois - a.avgBois;
    return a.avgTime - b.avgTime;
  });

  // Função para gerar PDF
  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('Resultado Final Geral');

    const tableData = ranking.map((r, index) => [
      index + 1, // ORD
      `${r.duo[0]}\n${r.duo[1]}`, // Competidores um embaixo do outro
      r.qualifTime.toFixed(3),
      r.finalTime.toFixed(3),
      r.finalCattle,
      r.avgTime.toFixed(3),
      r.avgBois.toFixed(2),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [
        [
          'ORD',
          'Competidor',
          'Qualif (s)',
          'Final (s)',
          'Bois Final',
          'Média (s)',
          'Média Bois',
        ],
      ],
      body: tableData,
      styles: {
        fontSize: 12,
        cellPadding: 4,
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 50 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 25 },
        6: { halign: 'center', cellWidth: 25 },
      },
    });

    doc.save('resultado_final.pdf');
  };

  // Função para exportar Excel
  const handleExportExcel = () => {
    const data = ranking.map((r, index) => ({
      ORD: index + 1,
      Competidores: `${r.duo[0]}\n${r.duo[1]}`,
      'Qualif (s)': r.qualifTime.toFixed(3),
      'Final (s)': r.finalTime.toFixed(3),
      'Bois Final': r.finalCattle,
      'Média (s)': r.avgTime.toFixed(3),
      'Média Bois': r.avgBois.toFixed(2),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: false });
    worksheet['!cols'] = [
      { wch: 5 }, // ORD
      { wch: 30 }, // Competidores
      { wch: 12 }, // Qualif
      { wch: 12 }, // Final
      { wch: 12 }, // Bois Final
      { wch: 12 }, // Média Tempo
      { wch: 12 }, // Média Bois
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultado Final');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'resultado_final.xlsx');
  };

  return (
    <div className="container">
      <h2>🏆 Resultado Final</h2>
      <div className="card">
        <ol style={{ paddingLeft: 20 }}>
          {ranking.map((r, index) => (
            <li
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid #ccc',
                marginBottom: 4,
                borderRadius: 4,
              }}
            >
              <span style={{ fontWeight: 'bold' }}>
                {index + 1}. {r.duo[0]} & {r.duo[1]}
              </span>
              <span style={{ textAlign: 'right', minWidth: 400 }}>
                Qualif: {r.qualifTime.toFixed(3)}s | Final:{' '}
                {r.finalTime.toFixed(3)}s | Bois Final: {r.finalCattle} |{' '}
                <strong>
                  Média: {r.avgTime.toFixed(3)}s • Bois: {r.avgBois.toFixed(2)}
                </strong>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
        <button onClick={generatePDF}>Gerar PDF</button>
        <button onClick={handleExportExcel}>Exportar Excel</button>
        <button onClick={() => navigate('/')} style={{ marginLeft: 'auto' }}>
          Voltar para Home
        </button>
      </div>
    </div>
  );
}
