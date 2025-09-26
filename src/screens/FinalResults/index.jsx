import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getDuoKey } from '../Qualifiers';

export default function FinalResults() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const results = state?.results || [];
  const finalResults = state?.finalResults || [];
  const [selectedCompetitor, setSelectedCompetitor] = useState('');

  // 🔹 Montar ranking geral
  const ranking = useMemo(() => {
    const map = {};

    results.forEach((r) => {
      const key = getDuoKey(r.duo);
      if (!map[key]) {
        map[key] = { duo: r.duo, qualif: [], final: [] };
      }
      map[key].qualif.push(r);
    });

    finalResults.forEach((r) => {
      const key = getDuoKey(r.duo);
      if (!map[key]) {
        map[key] = { duo: r.duo, qualif: [], final: [] };
      }
      map[key].final.push(r);
    });

    return Object.values(map)
      .map((entry) => {
        const totalQualifBois = entry.qualif.reduce((s, r) => s + r.cattle, 0);
        const bestQualifTime = entry.qualif.length
          ? Math.min(...entry.qualif.map((r) => r.time))
          : 0;

        const finalBois = entry.final.reduce((s, r) => s + r.cattle, 0);
        const finalTime = entry.final.length
          ? entry.final.reduce((s, r) => s + r.time, 0) / entry.final.length
          : 0;

        const avgBois =
          entry.qualif.length || entry.final.length
            ? (totalQualifBois + finalBois) /
              (entry.qualif.length + entry.final.length)
            : 0;

        const avgTime =
          entry.qualif.length && entry.final.length
            ? (bestQualifTime + finalTime) / 2
            : bestQualifTime || finalTime;

        return {
          duo: entry.duo,
          qualifBois: totalQualifBois,
          bestQualifTime,
          finalBois,
          finalTime,
          avgBois,
          avgTime,
        };
      })
      .sort((a, b) => {
        if (b.avgBois !== a.avgBois) return b.avgBois - a.avgBois;
        return a.avgTime - b.avgTime;
      });
  }, [results, finalResults]);

  // 🔹 Exportar PDF geral
  const exportPDFAll = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Resultado Final Geral', 14, 20);

    const body = ranking.map((r, i) => [
      i + 1,
      `${r.duo[0].name} & ${r.duo[1].name}`,
      r.qualifBois,
      r.bestQualifTime ? r.bestQualifTime.toFixed(3) : '-',
      r.finalBois,
      r.finalTime ? r.finalTime.toFixed(3) : '-',
      r.avgBois.toFixed(2),
      r.avgTime.toFixed(3),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [
        [
          '#',
          'Dupla',
          'Bois Qualif',
          'Melhor Tempo',
          'Bois Final',
          'Tempo Final',
          'Média Bois',
          'Média Tempo',
        ],
      ],
      body,
    });

    doc.save('resultado_final.pdf');
  };

  // 🔹 Exportar Excel geral
  const exportExcelAll = () => {
    const data = ranking.map((r, i) => ({
      ORD: i + 1,
      Dupla: `${r.duo[0].name} & ${r.duo[1].name}`,
      'Bois Qualif': r.qualifBois,
      'Melhor Tempo': r.bestQualifTime,
      'Bois Final': r.finalBois,
      'Tempo Final': r.finalTime,
      'Média Bois': r.avgBois,
      'Média Tempo': r.avgTime,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultado Final');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'resultado_final.xlsx');
  };

  // 🔹 Exportar PDF por competidor (já existia)
  const generatePDFByCompetitor = (competitorName) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Histórico de ${competitorName}`, 14, 20);

    const qualifPassadas = results.filter((r) =>
      r.duo.some((p) => p.name === competitorName)
    );
    const qualifData = qualifPassadas.map((r, idx) => [
      idx + 1,
      `${r.duo[0].name} & ${r.duo[1].name}`,
      r.cattle,
      r.time.toFixed(3),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['#', 'Dupla', 'Bois', 'Tempo (s)']],
      body: qualifData.length ? qualifData : [['-', '-', '-', '-']],
    });

    const finalPassadas = finalResults.filter((r) =>
      r.duo.some((p) => p.name === competitorName)
    );
    if (finalPassadas.length) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text(`Final - ${competitorName}`, 14, 20);
      const finalData = finalPassadas.map((r, idx) => [
        idx + 1,
        `${r.duo[0].name} & ${r.duo[1].name}`,
        r.cattle,
        r.time.toFixed(3),
      ]);
      autoTable(doc, {
        startY: 30,
        head: [['#', 'Dupla', 'Bois', 'Tempo (s)']],
        body: finalData,
      });
    }

    doc.save(`historico_${competitorName}.pdf`);
  };

  // 🔹 Lista de competidores únicos
  const competitorsList = [
    ...new Set([
      ...results.flatMap((r) => r.duo.map((p) => p.name)),
      ...finalResults.flatMap((r) => r.duo.map((p) => p.name)),
    ]),
  ];

  return (
    <div className="container">
      <h2>🏆 Resultado Final</h2>

      {/* 🔹 Tabela geral */}
      <div className="card">
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Dupla</th>
              <th>Bois Qualif</th>
              <th>Melhor Tempo</th>
              <th>Bois Final</th>
              <th>Tempo Final</th>
              <th>Média Bois</th>
              <th>Média Tempo</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  {r.duo[0].name} & {r.duo[1].name}
                </td>
                <td>{r.qualifBois}</td>
                <td>{r.bestQualifTime ? r.bestQualifTime.toFixed(3) : '-'}</td>
                <td>{r.finalBois}</td>
                <td>{r.finalTime ? r.finalTime.toFixed(3) : '-'}</td>
                <td>{r.avgBois.toFixed(2)}</td>
                <td>{r.avgTime.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Exportações */}
      <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
        <button onClick={exportPDFAll}>Exportar PDF Geral</button>
        <button onClick={exportExcelAll}>Exportar Excel Geral</button>
      </div>

      {/* 🔹 Exportar por competidor */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Exportar Histórico por Competidor</h3>
        <select
          value={selectedCompetitor}
          onChange={(e) => setSelectedCompetitor(e.target.value)}
        >
          <option value="">Selecione um competidor</option>
          {competitorsList.map((c, idx) => (
            <option key={idx} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          disabled={!selectedCompetitor}
          onClick={() => generatePDFByCompetitor(selectedCompetitor)}
          style={{ marginLeft: 10 }}
        >
          Exportar PDF
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => navigate('/')}>Voltar para Home</button>
      </div>
    </div>
  );
}
