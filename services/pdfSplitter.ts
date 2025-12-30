
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { PdfPage, PageNumberConfig, CropData } from '../types';
import { nanoid } from 'nanoid';
import { loadPdfJs } from './pdfProvider';

/**
 * Loads a PDF and renders its pages as thumbnail images
 */
export const loadPdfPages = async (
  file: File,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void,
  options?: { scale?: number }
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
  const scale = options?.scale ?? 0.5;
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
      const viewport = page.getViewport({ scale });
      
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
            selected: false, // Default to unselected
            width: canvas.width,
            height: canvas.height,
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
 * Renders a single page from a PDF file at a high resolution.
 * Used for detailed previews in editors.
 * Now supports direct cropping on canvas to prevent CSS clip-path artifacts.
 */
export const renderSinglePage = async (
  file: File,
  pageIndex: number, // 0-based index
  scale: number = 2.0,
  crop?: CropData
): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await loadPdfJs();
  
  const loadingTask = pdfjsLib.getDocument({ 
    data: arrayBuffer,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true, 
  });
  
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageIndex + 1); // PDF.js uses 1-based indexing
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) throw new Error("Canvas context failed");
  
  if (crop) {
    // Calculate pixel dimensions of the crop
    const x = (crop.x / 100) * viewport.width;
    const y = (crop.y / 100) * viewport.height;
    const w = (crop.width / 100) * viewport.width;
    const h = (crop.height / 100) * viewport.height;

    // Resize canvas to exactly fit the crop
    canvas.width = w;
    canvas.height = h;

    // Reset transform to identity then shift viewport
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.translate(-x, -y);
  } else {
    canvas.height = viewport.height;
    canvas.width = viewport.width;
  }
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
        if (blob) resolve(URL.createObjectURL(blob));
        else reject(new Error("Canvas rendering failed"));
    }, 'image/jpeg', 0.9);
  });
};

/**
 * Applies reordering, deletion, and optional page numbering
 */
export const savePdfWithModifications = async (
  originalFile: File,
  pages: PdfPage[], // The current state of pages (ordered, filtered)
  numberingConfig?: PageNumberConfig,
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
  newPdf.setCreator('EZtify – Split PDF');
  newPdf.setCreationDate(new Date());
  newPdf.setModificationDate(new Date());

  if (onProgress) onProgress(20);

  onStatusUpdate?.('Restructuring document...');
  
  // 1. Copy pages in the new order
  const pageIndices = pages.map(p => p.pageIndex);
  const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
  
  for (let i = 0; i < copiedPages.length; i++) {
    newPdf.addPage(copiedPages[i]);
  }

  // 2. Apply Page Numbers if config exists
  if (numberingConfig) {
    onStatusUpdate?.('Applying page numbers...');
    const font = await newPdf.embedFont(StandardFonts.Helvetica);
    const pdfPages = newPdf.getPages();
    
    for (let i = 0; i < pdfPages.length; i++) {
      const pdfPage = pdfPages[i];
      const { width, height } = pdfPage.getSize();
      const pageNumText = (numberingConfig.startFrom + i).toString();
      
      const fontSize = numberingConfig.fontSize;
      const textWidth = font.widthOfTextAtSize(pageNumText, fontSize);
      
      let x = 0;
      let y = 0;
      
      // Position Y (Top-left origin in config vs Bottom-left origin in pdf-lib)
      if (numberingConfig.position === 'top') {
        y = height - fontSize - 20 + numberingConfig.offsetY;
      } else {
        y = 20 + numberingConfig.offsetY;
      }
      
      // Position X
      if (numberingConfig.alignment === 'left') {
        x = 20 + numberingConfig.offsetX;
      } else if (numberingConfig.alignment === 'right') {
        x = width - textWidth - 20 + numberingConfig.offsetX;
      } else {
        x = (width - textWidth) / 2 + numberingConfig.offsetX;
      }
      
      pdfPage.drawText(pageNumText, {
        x,
        y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
  }

  if (onProgress) onProgress(90);

  onStatusUpdate?.('Finalizing PDF...');
  const pdfBytes = await newPdf.save();
  
  if (onProgress) onProgress(100);
  return new Blob([pdfBytes], { type: 'application/pdf' });
};
