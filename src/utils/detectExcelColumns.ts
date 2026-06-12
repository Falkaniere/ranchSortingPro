import * as XLSX from 'xlsx';
import { RiderCategory } from '../core/models/Competidor';

// ─── Header hint lists ────────────────────────────────────────────────────────

const NAME_HINTS = [
  'nome', 'name', 'competidor', 'cavaleiro', 'rider',
  'piloto', 'atleta', 'jinete', 'participante',
];

const CATEGORY_HINTS = [
  'categoria', 'category', 'classe', 'class',
  'divisao', 'divisão', 'division', 'grupo',
  'modalidade', 'nivel', 'nível',
];

// ─── Category value normalisation ────────────────────────────────────────────

const CATEGORY_VALUE_MAP: Record<string, RiderCategory> = {
  // Open / Aberta
  open: 'Open', aberta: 'Open', abertura: 'Open', 'ab': 'Open',

  // Amateur19 / Amador
  amateur19: 'Amateur19', 'amateur 19': 'Amateur19',
  amador: 'Amateur19', amador19: 'Amateur19', 'amador 19': 'Amateur19',
  am19: 'Amateur19', am: 'Amateur19',

  // AmateurLight / Amador Light
  amateurlight: 'AmateurLight', 'amateur light': 'AmateurLight',
  amadorlight: 'AmateurLight', 'amador light': 'AmateurLight',
  'am light': 'AmateurLight', light: 'AmateurLight', al: 'AmateurLight',

  // Beginner / Principiante
  beginner: 'Beginner', principiante: 'Beginner',
  iniciante: 'Beginner', princip: 'Beginner', princ: 'Beginner',
};

export function normalizeCategory(raw: string): RiderCategory | null {
  return CATEGORY_VALUE_MAP[raw.trim().toLowerCase()] ?? null;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedRow {
  name: string;
  rawCategory: string;
  category: RiderCategory;
  categoryRecognized: boolean;
}

export interface ExcelDetectionResult {
  /** Best-guess column for competitor names */
  nameCol: string | null;
  /** Best-guess column for categories */
  categoryCol: string | null;
  /** How confident we are in the auto-detection */
  confidence: 'high' | 'medium' | 'low';
  /** All column headers in the sheet */
  headers: string[];
  /** Raw rows (string values) for preview */
  previewRows: Record<string, string>[];
  /** Total row count (excluding header) */
  totalRows: number;
}

// ─── Core detection ──────────────────────────────────────────────────────────

export async function detectExcelColumns(file: File): Promise<ExcelDetectionResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    return { nameCol: null, categoryCol: null, confidence: 'low', headers: [], previewRows: [], totalRows: 0 };
  }

  const headers = Object.keys(rows[0]);
  const stringRows: Record<string, string>[] = rows.map((r) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v).trim()]))
  );
  const sample = stringRows.slice(0, 10);

  let nameCol: string | null = null;
  let categoryCol: string | null = null;

  // 1) Header-based detection (strong signal)
  for (const h of headers) {
    const norm = h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!nameCol && NAME_HINTS.some((hint) => norm.includes(hint))) nameCol = h;
    if (!categoryCol && CATEGORY_HINTS.some((hint) => norm.includes(hint))) categoryCol = h;
  }

  const headerBothFound = !!(nameCol && categoryCol);

  // 2) Value-based fallback for whichever wasn't found by header
  for (const h of headers) {
    if (h === nameCol || h === categoryCol) continue;
    const values = sample.map((r) => r[h] ?? '').filter(Boolean);
    if (!values.length) continue;

    // Recognise as category column if ≥ 50 % of values map to a known category
    const recognised = values.filter((v) => normalizeCategory(v) !== null);
    if (!categoryCol && recognised.length / values.length >= 0.5) {
      categoryCol = h;
    }
  }

  // 3) Last resort: if nameCol still missing, pick first column that isn't categoryCol
  if (!nameCol && headers.length > 0) {
    nameCol = headers.find((h) => h !== categoryCol) ?? null;
  }

  const confidence =
    headerBothFound ? 'high'
    : nameCol && categoryCol ? 'medium'
    : 'low';

  return {
    nameCol,
    categoryCol,
    confidence,
    headers,
    previewRows: stringRows.slice(0, 5),
    totalRows: rows.length,
  };
}

// ─── Parse helpers ────────────────────────────────────────────────────────────

export function parseRows(
  file: File,
  nameCol: string,
  categoryCol: string | null
): Promise<ParsedRow[]> {
  return file.arrayBuffer().then((data) => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    return rows
      .map((r) => {
        const name = String(r[nameCol] ?? '').trim();
        const rawCategory = categoryCol ? String(r[categoryCol] ?? '').trim() : '';
        const category = normalizeCategory(rawCategory) ?? 'Open';
        return {
          name,
          rawCategory,
          category,
          categoryRecognized: normalizeCategory(rawCategory) !== null,
        };
      })
      .filter((r) => r.name.length > 0);
  });
}
