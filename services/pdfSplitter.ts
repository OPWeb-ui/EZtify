
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { PdfPage } from '../types';
import { nanoid } from 'nanoid';
import { loadPdfJs } from './pdfProvider';

/**
 * Loads a PDF and renders its pages as thumbnail images
 */
export const loadPdfPages = async (
  file: File,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void,
): Promise<PdfPage[]> => {
  onStatusUpdate?.('Preparing PDF...');
  const arrayBuffer = await file.arrayBuffer();
  
  // Load PDF.js dynamically
  const pdfjsLib = await loadPdfJs();
  
  let pdf;
  try {
    onStatusUpdate?.('Parsing PDF document...');
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/'
    });
    pdf = await loadingTask.promise;
  } catch (error) {
    console.error("Failed to load PDF for splitting:", error);
    throw new Error("Could not load PDF pages.");
  }

  const numPages = pdf.numPages;
  
  const pages: PdfPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    onStatusUpdate?.(`Loading preview for page ${i} of ${numPages}...`);
    if (onProgress) {
      onProgress(Math.round(((i - 1) / numPages) * 100));
    }
    
    // Yield to UI
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      const page = await pdf.getPage(i);
      // Render at low scale for thumbnail performance
      const viewport = page.getViewport({ scale: 0.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
        
        if (blob) {
          pages.push({
            id: nanoid(),
            pageIndex: i - 1, // Store 0-based index for pdf-lib
            previewUrl: URL.createObjectURL(blob),
            selected: false // Default to unselected
          });
        }
      }
    } catch (pageError) {
      console.warn(`Skipping page ${i} due to render error`, pageError);
    }
  }

  if (onProgress) onProgress(100);
  return pages;
};

/**
 * Extract specific pages into a SINGLE new PDF
 */
export const extractPagesToPdf = async (
  originalFile: File,
  pageIndices: number[],
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void,
): Promise<Blob> => {
  onStatusUpdate?.('Reading original PDF...');
  const fileBytes = await originalFile.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBytes);
  const newPdf = await PDFDocument.create();

  if (onProgress) onProgress(30);

  onStatusUpdate?.('Extracting selected pages...');
  const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
  
  for (let i = 0; i < copiedPages.length; i++) {
    newPdf.addPage(copiedPages[i]);
  }

  if (onProgress) onProgress(80);

  onStatusUpdate?.('Finalizing new PDF...');
  const pdfBytes = await newPdf.save();
  
  if (onProgress) onProgress(100);
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

/**
 * Split specific pages into INDIVIDUAL PDFs (Zipped)
 */
export const splitPagesToZip = async (
  originalFile: File,
  pageIndices: number[],
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void,
): Promise<Blob> => {
  onStatusUpdate?.('Reading original PDF...');
  const fileBytes = await originalFile.arrayBuffer();
  const srcPdf = await PDFDocument.load(fileBytes);
  const zip = new JSZip();
  const folder = zip.folder("Split-PDFs");

  const total = pageIndices.length;

  for (let i = 0; i < total; i++) {
    const pageIndex = pageIndices[i];
    onStatusUpdate?.(`Creating PDF for page ${pageIndex + 1}...`);
    // Create new doc for just this page
    const singleDoc = await PDFDocument.create();
    const [copiedPage] = await singleDoc.copyPages(srcPdf, [pageIndex]);
    singleDoc.addPage(copiedPage);
    
    const pdfBytes = await singleDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    if (folder) {
      folder.file(`Page-${pageIndex + 1}-EZtify.pdf`, blob);
    }

    if (onProgress) {
       // Map loop progress to 0-80% of total task
       onProgress(Math.round(((i + 1) / total) * 80));
    }
    
    // Yield
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  onStatusUpdate?.('Creating ZIP archive...');
  // Generate Zip
  const zipContent = await zip.generateAsync({ type: "blob" });
  
  if (onProgress) onProgress(100);
  return zipContent;
};