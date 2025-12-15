
import { PDFDocument } from 'pdf-lib';
import { PdfPage } from '../types';

export const cropPdf = async (
  originalFile: File,
  pagesWithCrop: PdfPage[],
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void,
): Promise<Blob> => {
  onStatusUpdate?.('Reading original PDF...');
  const fileBytes = await originalFile.arrayBuffer();
  
  if (onProgress) onProgress(10);

  const pdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = pdfDoc.getPageCount();

  onStatusUpdate?.('Applying crop regions...');

  for (let i = 0; i < totalPages; i++) {
    const pageData = pagesWithCrop.find(p => p.pageIndex === i);
    
    // Use the 'appliedCrop' if it exists, otherwise fall back to the interactive 'crop'.
    // This ensures the committed crop is what gets saved.
    const cropToApply = pageData?.appliedCrop || pageData?.crop;
    if (!pageData || !cropToApply) continue;

    const page = pdfDoc.getPage(i);
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const { x, y, width, height } = cropToApply;

    // Convert percentage-based crop data (top-left origin) to PDF points (bottom-left origin)
    const cropX = pageWidth * (x / 100);
    const cropWidth = pageWidth * (width / 100);
    const cropHeight = pageHeight * (height / 100);
    const cropY = pageHeight * (1 - y / 100 - height / 100);
    
    // Set the crop box for the page
    page.setCropBox(cropX, cropY, cropWidth, cropHeight);
    
    // Also set the media box to the crop box to make the crop "permanent" for most viewers
    page.setMediaBox(cropX, cropY, cropWidth, cropHeight);
    
    if (onProgress) onProgress(10 + Math.round(((i + 1) / totalPages) * 80));
  }

  onStatusUpdate?.('Finalizing new PDF...');
  const pdfBytes = await pdfDoc.save();
  
  if (onProgress) onProgress(100);
  
  return new Blob([pdfBytes], { type: 'application/pdf' });
};
