
import { jsPDF } from 'jspdf';
import { loadPdfJs } from './pdfProvider';
import { CompressionResult, PdfFile } from '../types';

export type VisualFilterMode = 'original' | 'grayscale' | 'sepia' | 'night';

export const convertPdfVisual = async (
  pdfFile: PdfFile,
  mode: VisualFilterMode,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<CompressionResult> => {
  const file = pdfFile.file;
  const originalSize = file.size;

  onStatusUpdate?.('Initializing engine...');
  if (onProgress) onProgress(5);

  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await loadPdfJs();
  
  let pdf;
  try {
    onStatusUpdate?.('Parsing document...');
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true,
    });
    pdf = await loadingTask.promise;
  } catch (error) {
    console.error("Failed to load PDF:", error);
    throw new Error("Could not parse PDF.");
  }

  const numPages = pdf.numPages;
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    compress: true
  });

  doc.setProperties({
    title: 'files_EZtify',
    creator: `EZtify – ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`
  });

  const mmPerPx = 0.264583;

  for (let i = 1; i <= numPages; i++) {
    onStatusUpdate?.(`Processing page ${i} of ${numPages}...`);
    
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // High res for quality

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    // Apply Filter Pixel-by-Pixel if not original
    if (mode !== 'original') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let j = 0; j < data.length; j += 4) {
            const r = data[j];
            const g = data[j + 1];
            const b = data[j + 2];

            if (mode === 'grayscale') {
                // Luminosity method
                const v = 0.299 * r + 0.587 * g + 0.114 * b;
                data[j] = v;
                data[j + 1] = v;
                data[j + 2] = v;
            } else if (mode === 'sepia') {
                // W3C Sepia Matrix
                const tr = (r * 0.393) + (g * 0.769) + (b * 0.189);
                const tg = (r * 0.349) + (g * 0.686) + (b * 0.168);
                const tb = (r * 0.272) + (g * 0.534) + (b * 0.131);
                data[j] = Math.min(255, tr);
                data[j + 1] = Math.min(255, tg);
                data[j + 2] = Math.min(255, tb);
            } else if (mode === 'night') {
                // Invert
                data[j] = 255 - r;
                data[j + 1] = 255 - g;
                data[j + 2] = 255 - b;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    // Convert to JPEG
    const imgData = canvas.toDataURL('image/jpeg', 0.85);

    // Add to PDF
    const pdfPageWidth = canvas.width * mmPerPx;
    const pdfPageHeight = canvas.height * mmPerPx;
    const orientation = pdfPageWidth > pdfPageHeight ? 'l' : 'p';

    if (i > 1) {
        doc.addPage([pdfPageWidth, pdfPageHeight], orientation);
    } else {
        doc.deletePage(1);
        doc.addPage([pdfPageWidth, pdfPageHeight], orientation);
    }

    doc.addImage(imgData, 'JPEG', 0, 0, pdfPageWidth, pdfPageHeight);

    if (onProgress) {
        onProgress(10 + Math.round((i / numPages) * 80));
    }
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  onStatusUpdate?.('Finalizing file...');
  if (onProgress) onProgress(95);

  const pdfBlob = doc.output('blob');
  const newSize = pdfBlob.size;

  if (onProgress) onProgress(100);

  const originalName = file.name;
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_');
  const fileName = `${safeName}_${mode}_EZtify.pdf`;

  return {
    id: pdfFile.id,
    originalFileName: file.name,
    originalSize,
    newSize,
    blob: pdfBlob,
    fileName,
    status: 'Success'
  };
};
