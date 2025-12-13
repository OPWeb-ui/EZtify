
import { jsPDF } from 'jspdf';
import { loadPdfJs } from './pdfProvider';
import { CompressionResult, PdfFile } from '../types';

export const convertPdfToGrayscale = async (
  pdfFile: PdfFile,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<CompressionResult> => {
  const file = pdfFile.file;
  const originalSize = file.size;

  onStatusUpdate?.('Initializing...');
  if (onProgress) onProgress(5);

  const arrayBuffer = await file.arrayBuffer();
  
  // Load PDF Library dynamically
  const pdfjsLib = await loadPdfJs();
  
  let pdf;
  try {
    onStatusUpdate?.('Parsing PDF...');
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true,
    });
    pdf = await loadingTask.promise;
  } catch (error) {
    console.error("Failed to load PDF document:", error);
    throw new Error("Could not parse PDF.");
  }

  const numPages = pdf.numPages;
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    compress: true
  });

  // Set standardized metadata
  doc.setProperties({
    title: 'files_EZtify',
    author: 'EZtify',
    producer: 'EZtify',
    subject: 'Generated with EZtify',
    creator: 'EZtify – Grayscale PDF'
  });

  const mmPerPx = 0.264583;

  for (let i = 1; i <= numPages; i++) {
    onStatusUpdate?.(`Converting page ${i} of ${numPages}...`);
    // Render at scale 2.0 for good text quality
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render original page to canvas
    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    // Apply Grayscale Filter via composite operation or filter
    // Note: ctx.filter = 'grayscale(100%)' applies to *drawing* operations.
    // Since we already drew the page, we need to draw it again onto itself or process pixels.
    // Easier approach: Draw to temp canvas, then draw back to main canvas with filter.
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if(tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
        
        // Clear main canvas and draw grayscale
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.filter = 'grayscale(100%)';
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.filter = 'none'; // Reset
    }

    // Convert to JPEG
    const imgData = canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality for reasonable size

    // Add to PDF
    const pdfPageWidth = canvas.width * mmPerPx;
    const pdfPageHeight = canvas.height * mmPerPx;
    const orientation = pdfPageWidth > pdfPageHeight ? 'l' : 'p';

    if (i > 1) {
        doc.addPage([pdfPageWidth, pdfPageHeight], orientation);
    } else {
        doc.deletePage(1); // Remove default first page
        doc.addPage([pdfPageWidth, pdfPageHeight], orientation);
    }

    doc.addImage(imgData, 'JPEG', 0, 0, pdfPageWidth, pdfPageHeight);

    if (onProgress) {
        onProgress(10 + Math.round((i / numPages) * 80));
    }
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  onStatusUpdate?.('Finalizing PDF...');
  if (onProgress) onProgress(95);

  const pdfBlob = doc.output('blob');
  const newSize = pdfBlob.size;

  if (onProgress) onProgress(100);

  // Derive filename
  const originalName = file.name;
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_');
  const fileName = `${safeName}_grayscale_EZtify.pdf`;

  return {
    id: pdfFile.id,
    originalFileName: file.name,
    originalSize,
    newSize,
    blob: pdfBlob,
    fileName: fileName,
    status: 'Success'
  };
};
