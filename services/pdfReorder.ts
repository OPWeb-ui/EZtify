import { PDFDocument } from 'pdf-lib';

/**
 * Reorder pages of a PDF based on a list of original indices.
 * Pages can be reordered, duplicated, or omitted (deleted).
 */
export const reorderPdf = async (
  originalFile: File,
  pageIndices: number[], // Array of 0-based indices in the desired order
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void,
): Promise<Blob> => {
  onStatusUpdate?.('Reading original PDF...');
  const fileBytes = await originalFile.arrayBuffer();
  
  if (onProgress) onProgress(20);

  const srcPdf = await PDFDocument.load(fileBytes);
  const newPdf = await PDFDocument.create();

  // Set standardized metadata
  newPdf.setTitle('files_EZtify');
  newPdf.setAuthor('EZtify');
  newPdf.setProducer('EZtify');
  newPdf.setSubject('Generated with EZtify');
  newPdf.setCreator('EZtify – Reorder PDF');
  newPdf.setCreationDate(new Date());
  newPdf.setModificationDate(new Date());

  onStatusUpdate?.('Rearranging pages...');
  
  // Copy pages in the specified order
  // Note: copyPages can take duplicate indices if we ever wanted to support duplication
  const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
  
  for (let i = 0; i < copiedPages.length; i++) {
    newPdf.addPage(copiedPages[i]);
    // Map progress roughly from 20% to 80%
    if (onProgress) {
        onProgress(20 + Math.round(((i + 1) / copiedPages.length) * 60));
    }
  }

  onStatusUpdate?.('Finalizing new PDF...');
  const pdfBytes = await newPdf.save();
  
  if (onProgress) onProgress(100);
  
  return new Blob([pdfBytes], { type: 'application/pdf' });
};