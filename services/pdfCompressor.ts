
import { jsPDF } from 'jspdf';
import { loadPdfJs } from './pdfProvider';

export type CompressionLevel = 'extreme' | 'recommended' | 'less';

interface CompressionConfig {
  scale: number;
  quality: number;
}

const CONFIGS: Record<CompressionLevel, CompressionConfig> = {
  extreme: { scale: 0.6, quality: 0.5 },
  recommended: { scale: 1.0, quality: 0.75 },
  less: { scale: 1.5, quality: 0.9 },
};

export const compressPdf = async (
  file: File,
  level: CompressionLevel,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<{ blob: Blob; savings: number; newSize: number }> => {
  const config = CONFIGS[level];
  const originalSize = file.size;

  onStatusUpdate?.('Initializing engine...');
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
    console.error("PDF Load Error:", error);
    throw new Error("Failed to load PDF.");
  }

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    compress: true
  });

  doc.setProperties({
    title: file.name,
    creator: 'EZtify - Compressed',
    producer: 'EZtify'
  });

  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    onStatusUpdate?.(`Processing page ${i} of ${numPages}...`);
    
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: config.scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // White background for transparency flattening
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    const imgData = canvas.toDataURL('image/jpeg', config.quality);
    
    // Add page to PDF
    const widthPt = viewport.width;
    const heightPt = viewport.height;
    
    // jsPDF adds first page automatically, but sizing might be wrong.
    if (i === 1) {
       doc.deletePage(1); // Remove default
    }
    
    doc.addPage([widthPt, heightPt], widthPt > heightPt ? 'l' : 'p');
    doc.addImage(imgData, 'JPEG', 0, 0, widthPt, heightPt);

    if (onProgress) {
        onProgress(Math.round((i / numPages) * 90));
    }
    
    // Memory cleanup
    canvas.width = 0;
    canvas.height = 0;
    
    // Yield
    await new Promise(r => setTimeout(r, 0));
  }

  onStatusUpdate?.('Finalizing...');
  const compressedBlob = doc.output('blob');
  
  if (onProgress) onProgress(100);

  const newSize = compressedBlob.size;
  const savings = originalSize > 0 ? Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100)) : 0;

  return { blob: compressedBlob, savings, newSize };
};
