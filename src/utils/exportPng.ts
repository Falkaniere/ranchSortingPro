interface PngRow {
  passNumber: number | string;
  label: string;
  group: string;
}

interface PngOptions {
  title: string;
  subtitle?: string;
  rows: PngRow[];
  fileName: string;
}

const PADDING = 24;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 80;
const FOOTER_HEIGHT = 32;
const COL_NUM_W = 48;
const COL_GROUP_W = 52;
const MIN_WIDTH = 480;

function hexColor(name: string): string {
  const palette: Record<string, string> = {
    bg: '#faf8f5',
    headerBg: '#5c3d2e',
    headerText: '#ffffff',
    rowAlt: '#f5f0ea',
    rowHover: '#ffffff',
    border: '#e5ddd5',
    text: '#3d2b1f',
    muted: '#9a7c6e',
    badge1D: '#7c4a2e',
    badge2D: '#2d6a4f',
    badgeText: '#ffffff',
  };
  return palette[name] ?? '#000000';
}

export function exportDuosToPng(options: PngOptions): void {
  const { title, subtitle, rows, fileName } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const labelColW = Math.max(MIN_WIDTH - COL_NUM_W - COL_GROUP_W - PADDING * 2, 240);
  const totalW = COL_NUM_W + labelColW + COL_GROUP_W + PADDING * 2;
  const totalH = HEADER_HEIGHT + rows.length * ROW_HEIGHT + FOOTER_HEIGHT + PADDING;

  canvas.width = totalW;
  canvas.height = totalH;

  // Background
  ctx.fillStyle = hexColor('bg');
  ctx.fillRect(0, 0, totalW, totalH);

  // Header bar
  ctx.fillStyle = hexColor('headerBg');
  ctx.fillRect(0, 0, totalW, HEADER_HEIGHT);

  // Title
  ctx.fillStyle = hexColor('headerText');
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText(title, PADDING, 30);

  // Subtitle
  if (subtitle) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '13px Inter, Arial, sans-serif';
    ctx.fillText(subtitle, PADDING, 52);
  }

  // Column header
  ctx.fillStyle = hexColor('border');
  ctx.fillRect(0, HEADER_HEIGHT, totalW, 1);
  ctx.fillStyle = hexColor('muted');
  ctx.font = 'bold 11px Inter, Arial, sans-serif';
  const colY = HEADER_HEIGHT + 22;
  ctx.fillText('#', PADDING + 8, colY);
  ctx.fillText('DUPLA', PADDING + COL_NUM_W, colY);
  ctx.fillText('GRP', PADDING + COL_NUM_W + labelColW + 8, colY);

  // Rows
  rows.forEach((row, i) => {
    const y = HEADER_HEIGHT + 36 + i * ROW_HEIGHT;

    // Alternating background
    if (i % 2 === 0) {
      ctx.fillStyle = hexColor('rowHover');
    } else {
      ctx.fillStyle = hexColor('rowAlt');
    }
    ctx.fillRect(0, y - ROW_HEIGHT + 6, totalW, ROW_HEIGHT);

    const textY = y;

    // Row number
    ctx.fillStyle = hexColor('muted');
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(row.passNumber), PADDING + COL_NUM_W - 8, textY);

    // Label
    ctx.fillStyle = hexColor('text');
    ctx.font = '13px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    const maxLabelW = labelColW - 16;
    let label = row.label;
    // Truncate if too long
    while (ctx.measureText(label).width > maxLabelW && label.length > 1) {
      label = label.slice(0, -4) + '...';
    }
    ctx.fillText(label, PADDING + COL_NUM_W, textY);

    // Group badge
    const badgeX = PADDING + COL_NUM_W + labelColW + 4;
    const badgeY = y - 14;
    const badgeW = COL_GROUP_W - 8;
    const badgeH = 20;
    const badgeColor = row.group === '1D' ? hexColor('badge1D') : hexColor('badge2D');
    ctx.fillStyle = badgeColor;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 10);
    ctx.fillStyle = hexColor('badgeText');
    ctx.font = 'bold 11px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(row.group, badgeX + badgeW / 2, y - 1);

    // Row divider
    ctx.fillStyle = hexColor('border');
    ctx.fillRect(0, y + 8, totalW, 1);
  });

  // Footer
  const footerY = HEADER_HEIGHT + rows.length * ROW_HEIGHT + PADDING + 12;
  ctx.textAlign = 'center';
  ctx.fillStyle = hexColor('muted');
  ctx.font = '11px Inter, Arial, sans-serif';
  ctx.fillText('Ranch Sorting Pro', totalW / 2, footerY);

  // Download
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
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
