import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { Duo, DuoGroup } from 'core/models/Duo';
import { Competitor, RiderCategory } from 'core/index';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Uma linha "ORDEM DE ENTRADAS NA COMPETIÇÃO" tem colunas: Insc., Competidor 1,
// Competidor 2, Categoria (D1/D2/D3...), Boi Sort, Tempo, Qt Boi.
// Detectamos os limites das colunas pelo cabeçalho e usamos a posição X de cada
// item de texto para decidir a qual coluna ele pertence.
export interface ParsedPdfPair {
  passNumber: number;
  competitor1Name: string;
  competitor2Name: string;
  rawCategory: string;
  group: DuoGroup | null; // null quando a categoria não é reconhecida (ex.: "D3")
}

interface ColumnBounds {
  competitor1Start: number;
  competitor2Start: number;
  categoriaStart: number;
  categoriaEnd: number;
}

function groupItemsIntoLines(items: TextItem[]): TextItem[][] {
  const meaningful = items.filter((it) => it.str.trim().length > 0);
  const sorted = [...meaningful].sort(
    (a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]
  );

  const Y_EPS = 3;
  const lines: TextItem[][] = [];
  let current: TextItem[] = [];
  let lastY: number | null = null;

  for (const item of sorted) {
    const y = item.transform[5];
    if (lastY === null || Math.abs(y - lastY) <= Y_EPS) {
      current.push(item);
    } else {
      lines.push(current.sort((a, b) => a.transform[4] - b.transform[4]));
      current = [item];
    }
    lastY = y;
  }
  if (current.length > 0) {
    lines.push(current.sort((a, b) => a.transform[4] - b.transform[4]));
  }

  return lines;
}

function findColumnBounds(lines: TextItem[][]): ColumnBounds | null {
  for (const line of lines) {
    const texts = line.map((it) => it.str.trim());
    const comp1Idx = texts.findIndex((t) => /^Competidor\s*1$/i.test(t));
    const comp2Idx = texts.findIndex((t) => /^Competidor\s*2$/i.test(t));
    const catIdx = texts.findIndex((t) => /^Categoria$/i.test(t));
    if (comp1Idx === -1 || comp2Idx === -1 || catIdx === -1) continue;

    // Coluna seguinte à Categoria (Boi Sort) delimita o fim da coluna Categoria;
    // se não existir, usa uma folga fixa.
    const nextIdx = catIdx + 1;
    const categoriaEnd =
      nextIdx < line.length ? line[nextIdx].transform[4] : line[catIdx].transform[4] + 60;

    return {
      competitor1Start: line[comp1Idx].transform[4],
      competitor2Start: line[comp2Idx].transform[4],
      categoriaStart: line[catIdx].transform[4],
      categoriaEnd,
    };
  }
  return null;
}

function joinInRange(line: TextItem[], start: number, end: number): string {
  return line
    .filter((it) => it.transform[4] >= start - 2 && it.transform[4] < end - 2)
    .map((it) => it.str.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

function mapCategoryToGroup(raw: string): DuoGroup | null {
  const normalized = raw.trim().toUpperCase();
  if (normalized === 'D1' || normalized === '1D') return '1D';
  if (normalized === 'D2' || normalized === '2D') return '2D';
  return null;
}

export async function parseDuoPairsFromPdf(file: File): Promise<ParsedPdfPair[]> {
  const data = await file.arrayBuffer();
  const pdf = await getDocument({ data }).promise;
  const pairs: ParsedPdfPair[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items.filter((it): it is TextItem => 'str' in it);
    const lines = groupItemsIntoLines(items);
    const bounds = findColumnBounds(lines);
    if (!bounds) continue;

    for (const line of lines) {
      const first = line[0];
      if (!first) continue;
      const firstText = first.str.trim();
      if (!/^\d+$/.test(firstText)) continue;

      const catItem = line.find((it) => /^D\d+$/i.test(it.str.trim()));
      if (!catItem) continue;

      const competitor1Name = joinInRange(line, bounds.competitor1Start, bounds.competitor2Start);
      const competitor2Name = joinInRange(line, bounds.competitor2Start, bounds.categoriaStart);
      if (!competitor1Name || !competitor2Name) continue;

      const rawCategory = catItem.str.trim().toUpperCase();
      pairs.push({
        passNumber: parseInt(firstText, 10),
        competitor1Name,
        competitor2Name,
        rawCategory,
        group: mapCategoryToGroup(rawCategory),
      });
    }
  }

  pairs.sort((a, b) => a.passNumber - b.passNumber);
  return pairs;
}

/**
 * Converte pares já resolvidos (com grupo definido) em Duo[], criando competidores
 * que ainda não existem — mesma estratégia usada na importação de duplas via Excel.
 */
export function buildDuosFromParsedPairs(
  resolvedPairs: Array<ParsedPdfPair & { group: DuoGroup }>,
  competitors: Competitor[]
): { duos: Duo[]; newCompetitors: Competitor[] } {
  const newCompetitors: Competitor[] = [];

  function findOrCreate(name: string, group: DuoGroup): Competitor {
    const existing =
      competitors.find((c) => c.name.toLowerCase() === name.toLowerCase()) ||
      newCompetitors.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    // Principiante+Principiante e Light+Light são pares válidos, ao contrário de Aberta+Aberta —
    // escolhe um padrão que nunca forma uma combinação inválida quando ambos são criados automaticamente.
    const fallbackCategory: RiderCategory = group === '2D' ? 'Principiante' : 'Light';
    const created: Competitor = {
      id: crypto.randomUUID(),
      name,
      category: fallbackCategory,
      passes: 0,
    };
    newCompetitors.push(created);
    return created;
  }

  const duos: Duo[] = resolvedPairs.map((pair) => {
    const riderOne = findOrCreate(pair.competitor1Name, pair.group);
    const riderTwo = findOrCreate(pair.competitor2Name, pair.group);
    return {
      id: crypto.randomUUID(),
      riderOneId: riderOne.id,
      riderTwoId: riderTwo.id,
      label: `${pair.competitor1Name} & ${pair.competitor2Name}`,
      group: pair.group,
      passNumber: pair.passNumber,
    };
  });

  return { duos, newCompetitors };
}
