
import { loadPdfJs } from './pdfProvider';

export const generatePdfThumbnail = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await loadPdfJs();
    
    // Load the PDF
    const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
        cMapPacked: true, 
    });
    const pdf = await loadingTask.promise;
    
    // Get the first page
    const page = await pdf.getPage(1);
    
    // Scale for thumbnail (approx 200px height is usually sufficient for UI)
    const viewport = page.getViewport({ scale: 0.5 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return '';
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Render
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    // Return base64 string
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.warn("Thumbnail generation failed:", error);
    return '';
  }
};
