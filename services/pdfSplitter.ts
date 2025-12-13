
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { PdfPage, PageNumberConfig } from '../types';
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
 * Applies reordering, deletion (implicit by absence), and page numbering
 */
export const savePdfWithModifications = async (
  originalFile: File,
  pages: PdfPage[], // The current state of pages (ordered, filtered)
  numbering?: PageNumberConfig,
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

  if (onProgress) onProgress(60);

  // 2. Apply Page Numbers if configured
  if (numbering) {
    onStatusUpdate?.('Adding page numbers...');
    
    const fontMap = {
      'Helvetica': StandardFonts.Helvetica,
      'Helvetica-Bold': StandardFonts.HelveticaBold,
      'Helvetica-Oblique': StandardFonts.HelveticaOblique,
      'Helvetica-BoldOblique': StandardFonts.HelveticaBoldOblique,
      'Times-Roman': StandardFonts.TimesRoman,
      'Times-Roman-Bold': StandardFonts.TimesRomanBold,
      'Times-Roman-Italic': StandardFonts.TimesRomanItalic,
      'Courier': StandardFonts.Courier,
      'Courier-Bold': StandardFonts.CourierBold,
      'Courier-Oblique': StandardFonts.CourierOblique,
    };
    const fontToEmbed = fontMap[numbering.fontFamily as keyof typeof fontMap] || StandardFonts.Helvetica;
    const font = await newPdf.embedFont(fontToEmbed);
    
    const size = numbering.fontSize;
    const margin = 20; // Base margin from edge in points
    const xOffset = numbering.offsetX || 0;
    const yOffset = numbering.offsetY || 0;

    const pdfPages = newPdf.getPages();
    for (let i = 0; i < pdfPages.length; i++) {
      const page = pdfPages[i];
      const { width, height } = page.getSize();
      const num = numbering.startFrom + i;
      const text = `${num}`;
      const textWidth = font.widthOfTextAtSize(text, size);
      
      let x = margin;
      let y = margin; // Default bottom-left

      // Y Position (base)
      if (numbering.position === 'top') {
        y = height - margin - size;
      }

      // X Position (base)
      if (numbering.alignment === 'center') {
        x = (width / 2) - (textWidth / 2);
      } else if (numbering.alignment === 'right') {
        x = width - margin - textWidth;
      }

      // Apply offsets
      x += xOffset;
      // For user, positive Y is "inward" from edge
      y += (numbering.position === 'top' ? -yOffset : yOffset);

      page.drawText(text, {
        x,
        y,
        size,
        font,
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