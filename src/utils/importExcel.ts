import * as XLSX from 'xlsx';
import { Duo } from 'core/models/Duo';
import { Competitor, RiderCategory, normalizeCategory } from 'core/index';

export interface ImportedCompetitorRow {
  name: string;
  category: RiderCategory;
}

function parseCategoryValue(raw: string): RiderCategory {
  return normalizeCategory(raw);
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

      // Deduplicate by name (case-insensitive), keeping first occurrence
      const seen = new Set<string>();
      const deduped = parsed.filter((r) => {
        const key = r.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      resolve(deduped);
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
      const importedDuos: Duo[] = rows.map((row): Duo | null => {
        const raw = String(row.Dupla || '');
        // Aceita tanto " & " (novo) quanto " 🤝 " / "🤝" (legado)
        const duoNames = raw.includes(' & ')
          ? raw.split(' & ').map((s) => s.trim())
          : raw.split('🤝').map((s) => s.trim());
        const riderOneName = duoNames[0];
        const riderTwoName = duoNames[1];
        // A planilha pode trazer a categoria em qualquer caixa/formato ("2d",
        // "1D", "Aberta"...). Só '2D' é 2ª divisão; qualquer outra coisa é 1D.
        const group: Duo['group'] =
          String(row.Categoria ?? '').trim().toUpperCase() === '2D' ? '2D' : '1D';
        // Principiante+Principiante and Light+Light are both valid pairs, unlike Aberta+Aberta —
        // pick a default that can never form an invalid combo when both riders are auto-created.
        const fallbackCategory: RiderCategory = group === '2D' ? 'Principiante' : 'Light';

        // Ignora linhas malformadas (sem os dois nomes) em vez de derrubar a
        // importação inteira com um erro de referência nula em riderTwo!.id.
        if (!riderOneName || !riderTwoName) return null;

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
            category: fallbackCategory,
            passes: 0,
          };
          newCompetitors.push(riderOne);
        }

        if (!riderTwo && riderTwoName) {
          riderTwo = {
            id: crypto.randomUUID(),
            name: riderTwoName,
            category: fallbackCategory,
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
      }).filter((d): d is Duo => d !== null)
        // Numera as passadas na ordem em que aparecem na planilha, para que a
        // tela de Duplas e as exportações não caiam no fallback por índice.
        .map((d, i) => ({ ...d, passNumber: i + 1 }));

      if (newCompetitors.length > 0) {
        setCompetitors((prev) => [...prev, ...newCompetitors]);
      }

      resolve(importedDuos);
    } catch (error) {
      reject(error);
    }
  });
}
