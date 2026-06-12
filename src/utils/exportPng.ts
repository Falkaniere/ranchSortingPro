// ─── Shared helpers ──────────────────────────────────────────────────────────

const PADDING = 24;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 84;
const COL_HEADER_H = 32;
const FOOTER_HEIGHT = 36;

const palette: Record<string, string> = {
  bg: '#faf8f5',
  headerBg: '#5c3d2e',
  headerText: '#ffffff',
  headerSub: 'rgba(255,255,255,0.65)',
  colHeaderBg: '#f0ebe4',
  colHeaderText: '#9a7c6e',
  rowEven: '#ffffff',
  rowOdd: '#f7f3ee',
  rowGold: '#fffbeb',
  border: '#e5ddd5',
  text: '#3d2b1f',
  muted: '#9a7c6e',
  badge1D: '#7c4a2e',
  badge2D: '#2d6a4f',
  badgeText: '#ffffff',
  sat: '#fee2e2',
  satText: '#b91c1c',
  accent: '#5c3d2e',
};

function px(name: string): string {
  return palette[name] ?? '#000000';
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) {
    t = t.slice(0, -1);
  }
  return t + '…';
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  totalW: number,
  title: string,
  subtitle?: string
): void {
  ctx.fillStyle = px('headerBg');
  ctx.fillRect(0, 0, totalW, HEADER_HEIGHT);

  ctx.fillStyle = px('headerText');
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(truncateText(ctx, title, totalW - PADDING * 2), PADDING, 32);

  if (subtitle) {
    ctx.fillStyle = px('headerSub');
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(truncateText(ctx, subtitle, totalW - PADDING * 2), PADDING, 54);
  }
}

function drawFooter(ctx: CanvasRenderingContext2D, totalW: number, totalH: number): void {
  ctx.fillStyle = px('colHeaderBg');
  ctx.fillRect(0, totalH - FOOTER_HEIGHT, totalW, FOOTER_HEIGHT);
  ctx.fillStyle = px('muted');
  ctx.font = '11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ranch Sorting Pro', totalW / 2, totalH - FOOTER_HEIGHT + 20);
}

function download(canvas: HTMLCanvasElement, fileName: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// ─── Duo list export (sorteio) ───────────────────────────────────────────────

interface DuoPngRow {
  passNumber: number | string;
  label: string;
  group: string;
}

interface DuoPngOptions {
  title: string;
  subtitle?: string;
  rows: DuoPngRow[];
  fileName: string;
}

export function exportDuosToPng(options: DuoPngOptions): void {
  const { title, subtitle, rows, fileName } = options;

  const COL_NUM_W = 48;
  const COL_GROUP_W = 52;
  const MIN_WIDTH = 520;
  const labelColW = Math.max(MIN_WIDTH - COL_NUM_W - COL_GROUP_W - PADDING * 2, 240);
  const totalW = COL_NUM_W + labelColW + COL_GROUP_W + PADDING * 2;
  const totalH = HEADER_HEIGHT + COL_HEADER_H + rows.length * ROW_HEIGHT + FOOTER_HEIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = px('bg');
  ctx.fillRect(0, 0, totalW, totalH);

  drawHeader(ctx, totalW, title, subtitle);

  // Column headers
  const colY = HEADER_HEIGHT + COL_HEADER_H - 10;
  ctx.fillStyle = px('colHeaderBg');
  ctx.fillRect(0, HEADER_HEIGHT, totalW, COL_HEADER_H);
  ctx.fillStyle = px('colHeaderText');
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('#', PADDING + COL_NUM_W - 8, colY);
  ctx.textAlign = 'left';
  ctx.fillText('DUPLA', PADDING + COL_NUM_W + 4, colY);
  ctx.fillText('GRP', PADDING + COL_NUM_W + labelColW + 6, colY);

  // Rows
  rows.forEach((row, i) => {
    const rowTop = HEADER_HEIGHT + COL_HEADER_H + i * ROW_HEIGHT;
    ctx.fillStyle = i % 2 === 0 ? px('rowEven') : px('rowOdd');
    ctx.fillRect(0, rowTop, totalW, ROW_HEIGHT);

    const textY = rowTop + ROW_HEIGHT / 2 + 5;

    ctx.fillStyle = px('muted');
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(row.passNumber), PADDING + COL_NUM_W - 8, textY);

    ctx.fillStyle = px('text');
    ctx.font = '13px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(truncateText(ctx, row.label, labelColW - 16), PADDING + COL_NUM_W + 4, textY);

    // Badge
    const bx = PADDING + COL_NUM_W + labelColW + 4;
    const bw = COL_GROUP_W - 12;
    const bh = 20;
    const by = rowTop + (ROW_HEIGHT - bh) / 2;
    ctx.fillStyle = row.group === '1D' ? px('badge1D') : px('badge2D');
    roundRect(ctx, bx, by, bw, bh, 10);
    ctx.fillStyle = px('badgeText');
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(row.group, bx + bw / 2, by + 14);

    ctx.fillStyle = px('border');
    ctx.fillRect(0, rowTop + ROW_HEIGHT - 1, totalW, 1);
  });

  drawFooter(ctx, totalW, totalH);
  download(canvas, fileName);
}

// ─── Results table export (qualificatórias / finais) ─────────────────────────

export interface ResultColumn {
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

export interface ResultPngRow {
  cells: string[];
  highlight?: boolean; // gold bg for top positions
  isSAT?: boolean;
  isGroupHeader?: boolean; // renders a section divider row
}

export interface ResultsPngOptions {
  title: string;
  subtitle?: string;
  columns: ResultColumn[];
  rows: ResultPngRow[];
  fileName: string;
}

export function exportResultsToPng(options: ResultsPngOptions): void {
  const { title, subtitle, columns, rows, fileName } = options;

  const totalColW = columns.reduce((s, c) => s + c.width, 0);
  const totalW = totalColW + PADDING * 2;
  const totalH = HEADER_HEIGHT + COL_HEADER_H + rows.length * ROW_HEIGHT + FOOTER_HEIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = px('bg');
  ctx.fillRect(0, 0, totalW, totalH);

  drawHeader(ctx, totalW, title, subtitle);

  // Column headers
  ctx.fillStyle = px('colHeaderBg');
  ctx.fillRect(0, HEADER_HEIGHT, totalW, COL_HEADER_H);
  ctx.fillStyle = px('colHeaderText');
  ctx.font = 'bold 10px Arial, sans-serif';

  let colX = PADDING;
  for (const col of columns) {
    ctx.textAlign = col.align === 'left' ? 'left' : col.align === 'right' ? 'right' : 'center';
    const hx = col.align === 'left' ? colX + 4 : col.align === 'right' ? colX + col.width - 4 : colX + col.width / 2;
    ctx.fillText(col.header, hx, HEADER_HEIGHT + COL_HEADER_H - 10);
    colX += col.width;
  }

  // Rows
  rows.forEach((row, i) => {
    const rowTop = HEADER_HEIGHT + COL_HEADER_H + i * ROW_HEIGHT;

    if (row.isGroupHeader) {
      ctx.fillStyle = px('colHeaderBg');
      ctx.fillRect(0, rowTop, totalW, ROW_HEIGHT);
      ctx.fillStyle = px('accent');
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(row.cells[0] ?? '', PADDING + 8, rowTop + ROW_HEIGHT / 2 + 4);
      ctx.fillStyle = px('border');
      ctx.fillRect(0, rowTop + ROW_HEIGHT - 1, totalW, 1);
      return;
    }

    let rowBg = i % 2 === 0 ? px('rowEven') : px('rowOdd');
    if (row.highlight) rowBg = px('rowGold');
    if (row.isSAT) rowBg = px('sat');
    ctx.fillStyle = rowBg;
    ctx.fillRect(0, rowTop, totalW, ROW_HEIGHT);

    const textY = rowTop + ROW_HEIGHT / 2 + 5;
    let cx = PADDING;

    row.cells.forEach((cell, ci) => {
      const col = columns[ci];
      if (!col) return;
      const align = col.align ?? 'center';
      ctx.textAlign = align;
      const tx = align === 'left' ? cx + 4 : align === 'right' ? cx + col.width - 4 : cx + col.width / 2;

      if (row.isSAT && cell === 'SAT') {
        ctx.fillStyle = px('satText');
        ctx.font = 'bold 11px Arial, sans-serif';
      } else if (ci === 0) {
        ctx.fillStyle = px('muted');
        ctx.font = '11px monospace';
      } else if (ci === 1) {
        ctx.fillStyle = px('text');
        ctx.font = '13px Arial, sans-serif';
        const maxW = col.width - 8;
        cell = truncateText(ctx, cell, maxW);
      } else {
        ctx.fillStyle = px('text');
        ctx.font = '12px Arial, sans-serif';
      }

      ctx.fillText(cell, tx, textY);
      cx += col.width;
    });

    ctx.fillStyle = px('border');
    ctx.fillRect(0, rowTop + ROW_HEIGHT - 1, totalW, 1);
  });

  drawFooter(ctx, totalW, totalH);
  download(canvas, fileName);
}
