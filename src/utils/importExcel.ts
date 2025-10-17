import * as XLSX from 'xlsx';
import { Duo } from 'core/models/Duo';
import { Competitor } from 'core/index';

/**
 * Importa duplas de um arquivo Excel e cria competidores ausentes automaticamente.
 */
export async function importDuosFromExcel(
  file: File,
  competitors: Competitor[],
  setCompetitors: React.Dispatch<React.SetStateAction<Competitor[]>>
): Promise<Duo[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      const newCompetitors: Competitor[] = [];
      const importedDuos: Duo[] = rows.map((row) => {
        const duoNames = String(row.Dupla || '')
          .split('🤝')
          .map((s) => s.trim());
        const riderOneName = duoNames[0];
        const riderTwoName = duoNames[1];
        const group = String(row.Categoria || '1D') as Duo['group'];

        // Verifica se os competidores já existem
        let riderOne =
          competitors.find(
            (c) => c.name.toLowerCase() === riderOneName.toLowerCase()
          ) ||
          newCompetitors.find(
            (c) => c.name.toLowerCase() === riderOneName.toLowerCase()
          );

        let riderTwo =
          competitors.find(
            (c) => c.name.toLowerCase() === riderTwoName.toLowerCase()
          ) ||
          newCompetitors.find(
            (c) => c.name.toLowerCase() === riderTwoName.toLowerCase()
          );

        // Cria novos competidores se necessário
        if (!riderOne && riderOneName) {
          riderOne = {
            id: crypto.randomUUID(),
            name: riderOneName,
            category: 'Open',
            passes: 0,
          };
          newCompetitors.push(riderOne);
        }

        if (!riderTwo && riderTwoName) {
          riderTwo = {
            id: crypto.randomUUID(),
            name: riderTwoName,
            category: 'Open',
            passes: 0,
          };
          newCompetitors.push(riderTwo);
        }

        return {
          id: crypto.randomUUID(),
          riderOneId: riderOne!.id,
          riderTwoId: riderTwo!.id,
          label: `${riderOneName} 🤝 ${riderTwoName}`,
          group,
        };
      });

      // Atualiza competidores globais
      if (newCompetitors.length > 0) {
        setCompetitors((prev) => [...prev, ...newCompetitors]);
      }

      resolve(importedDuos);
    } catch (error) {
      reject(error);
    }
  });
}
