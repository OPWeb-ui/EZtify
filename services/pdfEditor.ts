
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { PdfPage, PageNumberConfig } from '../types';

/**
 * Saves the PDF with all applied modifications:
 * - Reordering
 * - Deletion
 * - Rotation
 * - Blank Page Insertion
 * - Annotations
 * - Page Numbering
 */
export const savePdfWithEditorChanges = async (
  originalFile: File,
  pages: PdfPage[],
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
  newPdf.setCreator('EZtify – Split PDF Editor');
  newPdf.setCreationDate(new Date());
  newPdf.setModificationDate(new Date());

  if (onProgress) onProgress(20);

  onStatusUpdate?.('Constructing document...');

  // --- 1. Reconstruct Document (Copy, Rotate, Insert Blank) ---
  for (let i = 0; i < pages.length; i++) {
    const pageData = pages[i];
    
    // Default to 'original' if type is undefined (for compatibility with simple splitter)
    const pageType = pageData.type || 'original';

    if (pageType === 'original' && pageData.pageIndex >= 0) {
      // Copy original page
      const [copiedPage] = await newPdf.copyPages(srcPdf, [pageData.pageIndex]);
      
      // Apply Rotation
      const currentRotation = copiedPage.getRotation().angle;
      const additionalRotation = pageData.rotation || 0;
      copiedPage.setRotation(degrees(currentRotation + additionalRotation));
      
      newPdf.addPage(copiedPage);
    } else {
      // Insert Blank Page (Default A4 Portrait)
      // A4 in points: 595.28 x 841.89
      newPdf.addPage([595.28, 841.89]); 
    }
    
    // Update progress roughly
    if (onProgress) onProgress(20 + Math.round((i / pages.length) * 40));
  }

  // --- 2. Apply Annotations ---
  onStatusUpdate?.('Applying annotations...');
  const font = await newPdf.embedFont(StandardFonts.Helvetica);
  
  const pdfPages = newPdf.getPages();
  
  for (let i = 0; i < pages.length; i++) {
    const pageData = pages[i];
    // Ensure we don't go out of bounds if something went wrong with page reconstruction
    if (i >= pdfPages.length) break;
    
    const pdfPage = pdfPages[i];
    const { width, height } = pdfPage.getSize();

    if (pageData.annotations && pageData.annotations.length > 0) {
      for (const ann of pageData.annotations) {
        // Convert percentages to PDF points
        const x = (ann.x / 100) * width;
        const yRaw = (ann.y / 100) * height; 
        
        // Handle Text
        if (ann.type === 'text' && ann.text) {
           const size = ann.fontSize || 12;
           // PDF Y is from bottom. Text draws baseline.
           // A rough approximation for top-left visual anchor:
           const y = height - yRaw - size + 2; 
           
           const color = hexToRgb(ann.color || '#000000');
           
           pdfPage.drawText(ann.text, {
             x,
             y,
             size,
             font,
             color,
           });
        }
        
        // Handle Highlight / Rectangle / Redact
        if (['highlight', 'rectangle', 'redact'].includes(ann.type)) {
           const w = (ann.width! / 100) * width;
           const h = (ann.height! / 100) * height;
           const y = height - yRaw - h;
           
           let color = hexToRgb(ann.color || '#FACC15'); // Default yellow for highlight
           let opacity = 0.4;
           
           if (ann.type === 'rectangle') {
             color = hexToRgb(ann.color || '#000000');
             opacity = 0; // Transparent fill
             pdfPage.drawRectangle({
               x, y, width: w, height: h,
               borderColor: color,
               borderWidth: 2,
               opacity: 0 // No fill
             });
             continue; // Skip standard draw
           }
           
           if (ann.type === 'redact') {
             color = rgb(0, 0, 0);
             opacity = 1;
           }
           
           pdfPage.drawRectangle({
             x, y, width: w, height: h,
             color,
             opacity
           });
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
             // Maintain aspect ratio if height not set, but our modal sets both
             const h = (ann.height! / 100) * height;
             const y = height - yRaw - h;
             
             pdfPage.drawImage(embeddedImage, {
               x, y, width: w, height: h
             });
           } catch (e) {
             console.error("Failed to embed image annotation", e);
           }
        }
        
        // Handle Checkbox / X
        if (ann.type === 'checkbox') {
           const size = ann.fontSize || 16;
           const y = height - yRaw - size;
           const color = hexToRgb(ann.color || '#000000');
           
           // Draw simple X
           pdfPage.drawText(ann.text || 'X', {
             x, y, size, font, color
           });
        }
      }
    }
  }
  
  if (onProgress) onProgress(80);

  // --- 3. Apply Page Numbers ---
  if (numbering) {
    onStatusUpdate?.('Adding page numbers...');
    const fontSizeMap = { small: 10, medium: 12, large: 14 };
    const size = fontSizeMap[numbering.fontSize];
    const margin = 20;

    for (let i = 0; i < pdfPages.length; i++) {
      const page = pdfPages[i];
      const { width, height } = page.getSize();
      const num = numbering.startFrom + i;
      const text = `${num}`;
      const textWidth = font.widthOfTextAtSize(text, size);
      
      let x = margin;
      let y = margin; // Default bottom

      if (numbering.position === 'top') {
        y = height - margin - size;
      } else {
        y = margin;
      }

      if (numbering.alignment === 'center') {
        x = (width / 2) - (textWidth / 2);
      } else if (numbering.alignment === 'right') {
        x = width - margin - textWidth;
      } else {
        x = margin;
      }

      page.drawText(text, {
        x, y, size, font, color: rgb(0, 0, 0),
      });
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
