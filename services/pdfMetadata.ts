
import { PDFDocument } from 'pdf-lib';

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export const getPdfMetadata = async (file: File): Promise<PdfMetadata> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    return {
      title: pdfDoc.getTitle() || '',
      author: pdfDoc.getAuthor() || '',
      subject: pdfDoc.getSubject() || '',
      keywords: pdfDoc.getKeywords() || '',
      creator: pdfDoc.getCreator() || '',
      producer: pdfDoc.getProducer() || '',
    };
  } catch (error) {
    console.error("Error reading metadata:", error);
    return { title: '', author: '', subject: '', keywords: '', creator: '', producer: '' };
  }
};

export const updatePdfMetadata = async (
  file: File,
  metadata: PdfMetadata,
  onProgress?: (percent: number) => void
): Promise<Blob> => {
  onProgress?.(10);
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(30);
  
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  onProgress?.(50);
  pdfDoc.setTitle(metadata.title);
  pdfDoc.setAuthor(metadata.author);
  pdfDoc.setSubject(metadata.subject);
  pdfDoc.setKeywords(metadata.keywords.split(',').map(k => k.trim()).filter(k => k !== ''));
  pdfDoc.setCreator(metadata.creator);
  pdfDoc.setProducer(metadata.producer);
  
  // Update modification date
  pdfDoc.setModificationDate(new Date());

  onProgress?.(80);
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100);
  
  return new Blob([pdfBytes], { type: 'application/pdf' });
};
