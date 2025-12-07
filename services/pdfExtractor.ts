
import { UploadedImage } from '../types';
import { nanoid } from 'nanoid';
import { loadPdfJs } from './pdfProvider';

export const extractImagesFromPdf = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadedImage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load PDF Library dynamically
  const pdfjsLib = await loadPdfJs();
  
  let pdf;
  try {
    // Provide CMap parameters to ensure fonts load correctly
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/'
    });
    pdf = await loadingTask.promise;
  } catch (error) {
    console.error("Failed to load PDF document:", error);
    throw new Error("Could not parse PDF. The file might be corrupted or encrypted.");
  }
  
  const numPages = pdf.numPages;
  const extractedImages: UploadedImage[] = [];

  for (let i = 1; i <= numPages; i++) {
    // Report progress
    if (onProgress) {
      onProgress(Math.round(((i - 1) / numPages) * 100));
    }
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      const page = await pdf.getPage(i);
      
      // Render at a decent resolution for preview/storage (e.g. scale 1.5 ~ 108dpi)
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert to blob/url
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      
      if (blob) {
        const file = new File([blob], `page-${i}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        
        extractedImages.push({
          id: nanoid(),
          file,
          previewUrl,
          width: canvas.width,
          height: canvas.height,
          rotation: 0
        });
      }
    } catch (pageError) {
      console.error(`Error rendering page ${i}:`, pageError);
      // Continue with next page if one fails
    }
  }
  
  if (onProgress) onProgress(100);
  
  return extractedImages;
};
