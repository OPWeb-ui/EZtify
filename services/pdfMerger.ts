import { PDFDocument } from 'pdf-lib';
import { PdfFile } from '../types';

export const mergePdfs = async (
  files: PdfFile[],
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void,
): Promise<Blob> => {
  if (files.length === 0) throw new Error("No files to merge");

  onStatusUpdate?.('Preparing to merge...');
  const mergedPdf = await PDFDocument.create();

  // Set standardized metadata
  mergedPdf.setTitle('files_EZtify');
  mergedPdf.setAuthor('EZtify');
  mergedPdf.setProducer('EZtify');
  mergedPdf.setSubject('Generated with EZtify');
  mergedPdf.setCreator('EZtify – Merge PDF');
  mergedPdf.setCreationDate(new Date());
  mergedPdf.setModificationDate(new Date());

  for (let i = 0; i < files.length; i++) {
    onStatusUpdate?.(`Merging file ${i + 1} of ${files.length}...`);
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

  onStatusUpdate?.('Finalizing merged PDF...');
  if (onProgress) onProgress(95);

  const mergedPdfBytes = await mergedPdf.save();
  
  if (onProgress) onProgress(100);

  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
};