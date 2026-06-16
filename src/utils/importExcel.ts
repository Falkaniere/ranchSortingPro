import * as XLSX from 'xlsx';
import { Duo } from 'core/models/Duo';
import { Competitor, RiderCategory, normalizeCategory } from 'core/index';

export interface ImportedCompetitorRow {
  name: string;
  category: RiderCategory;
}

function parseCategoryValue(raw: string): RiderCategory {
  const v = (raw ?? '').toLowerCase().trim().replace(/\s+/g, '');
  if (
    v === 'amador' || v === 'amateurlight' || v === 'amadorlight' ||
    v === 'beginner' || v === '2d' || v === 'amador/light'
  ) {
    return 'AmateurLight';
  }
  return normalizeCategory(raw) ?? 'Open';
}

export function importCompetitorsFromExcel(file: File): Promise<ImportedCompetitorRow[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      const parsed: ImportedCompetitorRow[] = [];
      for (const row of rows) {
        // Accept column names in pt-BR or English, case-insensitive
        const keys = Object.keys(row).reduce<Record<string, string>>((acc, k) => {
          acc[k.toLowerCase().trim()] = k;
          return acc;
        }, {});

        const nameKey = keys['nome'] ?? keys['name'] ?? keys['competidor'] ?? keys['atleta'];
        const catKey = keys['categoria'] ?? keys['category'] ?? keys['cat'];

        const name = nameKey ? String(row[nameKey] ?? '').trim() : '';
        const catRaw = catKey ? String(row[catKey] ?? '') : '';

        if (!name) continue;
        parsed.push({ name, category: parseCategoryValue(catRaw) });
      }

      resolve(parsed);
    } catch (err) {
      reject(err);
    }
  });
}

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
        const raw = String(row.Dupla || '');
        // Aceita tanto " & " (novo) quanto " 🤝 " / "🤝" (legado)
        const duoNames = raw.includes(' & ')
          ? raw.split(' & ').map((s) => s.trim())
          : raw.split('🤝').map((s) => s.trim());
        const riderOneName = duoNames[0];
        const riderTwoName = duoNames[1];
        const group = String(row.Categoria || '1D') as Duo['group'];

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
          label: `${riderOneName} & ${riderTwoName}`,
          group,
        };
      });

      if (newCompetitors.length > 0) {
        setCompetitors((prev) => [...prev, ...newCompetitors]);
      }

      resolve(importedDuos);
    } catch (error) {
      reject(error);
    }
  });
}
