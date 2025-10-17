import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function exportToExcel(
  data: any[],
  fileName: string,
  sheetName = 'Planilha'
) {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar.');
    return;
  }

  // cria worksheet a partir de um array de objetos
  const ws = XLSX.utils.json_to_sheet(data);

  // cria workbook e adiciona a worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // converte para arquivo e baixa
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${fileName}.xlsx`);
}
