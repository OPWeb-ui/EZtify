
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { PdfPage } from '../types';

/**
 * Saves the PDF with all applied modifications:
 * - Reordering
 * - Deletion
 * - Rotation
 * - Blank Page Insertion
 * - Annotations (including destructive Redactions)
 */
export const savePdfWithEditorChanges = async (
  originalFile: File,
  pages: PdfPage[],
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void,
): Promise<Blob> => {
  onStatusUpdate?.('Reading original PDF...');
  const fileBytes = await originalFile.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBytes);
  const newPdf = await PDFDocument.create();

  // Metadata
  newPdf.setTitle('files_EZtify');
  newPdf.setAuthor('EZtify');
  newPdf.setProducer('EZtify');
  newPdf.setSubject('Generated with EZtify');
  newPdf.setCreator('EZtify – Split PDF Editor');
  newPdf.setCreationDate(new Date());
  newPdf.setModificationDate(new Date());

  if (onProgress) onProgress(20);

  onStatusUpdate?.('Constructing document...');

  // --- 1. Reconstruct Document (Copy, Rotate, Insert Blank) ---
  for (let i = 0; i < pages.length; i++) {
    const pageData = pages[i];
    const pageType = pageData.type || 'original';

    if (pageType === 'original' && pageData.pageIndex >= 0) {
      const [copiedPage] = await newPdf.copyPages(srcPdf, [pageData.pageIndex]);
      const currentRotation = copiedPage.getRotation().angle;
      const additionalRotation = pageData.rotation || 0;
      copiedPage.setRotation(degrees(currentRotation + additionalRotation));
      newPdf.addPage(copiedPage);
    } else {
      newPdf.addPage([595.28, 841.89]); 
    }
    
    if (onProgress) onProgress(20 + Math.round((i / pages.length) * 40));
  }

  // --- 2. Apply Annotations ---
  onStatusUpdate?.('Applying annotations...');
  const font = await newPdf.embedFont(StandardFonts.Helvetica);
  const pdfPages = newPdf.getPages();
  
  for (let i = 0; i < pages.length; i++) {
    const pageData = pages[i];
    if (i >= pdfPages.length) break;
    
    const pdfPage = pdfPages[i];
    const { width, height } = pdfPage.getSize();

    if (pageData.annotations && pageData.annotations.length > 0) {
      for (const ann of pageData.annotations) {
        const x = (ann.x / 100) * width;
        const yRaw = (ann.y / 100) * height; 
        
        // Handle Text
        if (ann.type === 'text' && ann.text) {
           const size = ann.fontSize || 12;
           const y = height - yRaw - size + 2; 
           const color = hexToRgb(ann.color || '#000000');
           pdfPage.drawText(ann.text, { x, y, size, font, color });
        }
        
        // Handle Highlight / Rectangle / Redact
        if (['highlight', 'rectangle', 'redact'].includes(ann.type)) {
           const w = (ann.width! / 100) * width;
           const h = (ann.height! / 100) * height;
           const y = height - yRaw - h;
           
           let color = hexToRgb(ann.color || '#FACC15');
           let opacity = 0.4;
           
           if (ann.type === 'rectangle') {
             color = hexToRgb(ann.color || '#000000');
             pdfPage.drawRectangle({
               x, y, width: w, height: h,
               borderColor: color,
               borderWidth: 2,
               opacity: 0 
             });
             continue;
           }
           
           if (ann.type === 'redact') {
             color = hexToRgb(ann.color || '#000000');
             opacity = 1.0; // FULL OPAQUE for redaction
           }
           
           pdfPage.drawRectangle({ x, y, width: w, height: h, color, opacity });
        }
        
        // Handle Image / Signature
        if ((ann.type === 'image' || ann.type === 'signature') && ann.imageData) {
           try {
             let embeddedImage;
             if (ann.imageData.startsWith('data:image/png')) {
               embeddedImage = await newPdf.embedPng(ann.imageData);
             } else {
               embeddedImage = await newPdf.embedJpg(ann.imageData);
             }
             const w = (ann.width! / 100) * width;
             const h = (ann.height! / 100) * height;
             const y = height - yRaw - h;
             pdfPage.drawImage(embeddedImage, { x, y, width: w, height: h });
           } catch (e) {
             console.error("Failed to embed image annotation", e);
           }
        }
        
        if (ann.type === 'checkbox') {
           const size = ann.fontSize || 16;
           const y = height - yRaw - size;
           const color = hexToRgb(ann.color || '#000000');
           pdfPage.drawText(ann.text || 'X', { x, y, size, font, color });
        }
      }
    }
  }
  
  if (onProgress) onProgress(95);

  onStatusUpdate?.('Finalizing PDF...');
  const pdfBytes = await newPdf.save();
  
  if (onProgress) onProgress(100);
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

// Helper to convert Hex to PDF-Lib RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return rgb(0, 0, 0);
  return rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  );
};
