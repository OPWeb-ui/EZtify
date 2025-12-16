
import { PDFDocument } from 'pdf-lib';
import { ExtendedPdfPage } from '../types';

export const combinePdfPages = async (
  pages: ExtendedPdfPage[],
  sourceFiles: Map<string, File>,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void,
): Promise<Blob> => {
  if (pages.length === 0) throw new Error("No pages to combine");

  onStatusUpdate?.('Initializing PDF engine...');
  const newPdf = await PDFDocument.create();

  // Set standardized metadata
  newPdf.setTitle('files_EZtify');
  newPdf.setAuthor('EZtify');
  newPdf.setProducer('EZtify');
  newPdf.setSubject('Combined Document');
  newPdf.setCreator('EZtify – Combine PDF');
  newPdf.setCreationDate(new Date());
  newPdf.setModificationDate(new Date());

  // Cache loaded source documents to avoid re-parsing the same file multiple times
  const loadedDocs = new Map<string, PDFDocument>();

  const total = pages.length;

  for (let i = 0; i < total; i++) {
    const pageData = pages[i];
    const fileId = pageData.sourceFileId;
    
    if (onProgress) onProgress(Math.round((i / total) * 90));
    onStatusUpdate?.(`Processing page ${i + 1} of ${total}...`);

    // Yield to main thread to keep UI responsive
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      let srcPdf = loadedDocs.get(fileId);

      // Load source PDF if not already in cache
      if (!srcPdf) {
        const sourceFile = sourceFiles.get(fileId);
        if (!sourceFile) {
            console.warn(`Source file not found for page ${i}`);
            continue;
        }
        const fileBytes = await sourceFile.arrayBuffer();
        srcPdf = await PDFDocument.load(fileBytes);
        loadedDocs.set(fileId, srcPdf);
      }

      // Copy the specific page
      const [copiedPage] = await newPdf.copyPages(srcPdf, [pageData.pageIndex]);
      newPdf.addPage(copiedPage);

    } catch (e) {
      console.error(`Failed to process page ${i}`, e);
    }
  }

  onStatusUpdate?.('Finalizing document...');
  if (onProgress) onProgress(95);

  const pdfBytes = await newPdf.save();
  
  if (onProgress) onProgress(100);

  return new Blob([pdfBytes], { type: 'application/pdf' });
};
