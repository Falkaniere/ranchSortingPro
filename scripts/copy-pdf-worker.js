// Copia o worker do pdfjs-dist para public/, para ser servido como um asset
// estático comum (mesmo caminho previsível em dev, build e produção), em vez
// de depender de `new URL(..., import.meta.url)` do bundler.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const destDir = path.join(__dirname, '..', 'public', 'pdfjs');
const dest = path.join(destDir, 'pdf.worker.min.mjs');

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log(`[copy-pdf-worker] copiado para ${path.relative(process.cwd(), dest)}`);
