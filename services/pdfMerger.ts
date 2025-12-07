import { PDFDocument } from 'pdf-lib';
import { PdfFile } from '../types';

export const mergePdfs = async (
  files: PdfFile[],
  onProgress?: (percent: number) => void
): Promise<Blob> => {
  if (files.length === 0) throw new Error("No files to merge");

  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    if (onProgress) {
      onProgress(Math.round((i / files.length) * 100));
    }
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      const fileBytes = await files[i].file.arrayBuffer();
      const pdf = await PDFDocument.load(fileBytes);
      
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    } catch (e) {
      console.error(`Failed to merge file ${files[i].file.name}`, e);
      // Continue merging other files or throw? 
      // For now, we continue, maybe the file was corrupt
    }
  }

  if (onProgress) onProgress(95);

  const mergedPdfBytes = await mergedPdf.save();
  
  if (onProgress) onProgress(100);

  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
};