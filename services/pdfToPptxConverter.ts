
import { loadPdfJs } from './pdfProvider';
import PptxGenJS from 'pptxgenjs';

export interface PptxConfig {
  layout: '16x9' | '16x10' | '4x3' | 'wide';
  backgroundColor?: string;
}

export const convertPdfToPptx = async (
  file: File,
  pageIndices: number[] | 'all', // 0-based indices
  config: PptxConfig,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<Blob> => {

    onStatusUpdate?.('Initializing PDF engine...');
    if (onProgress) onProgress(5);

    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
      cMapPacked: true, 
    });
    const pdf = await loadingTask.promise;
    
    if (onProgress) onProgress(10);
    
    const pptx = new PptxGenJS();
    
    // Map layout string to PptxGenJS layout
    const layoutMap: Record<string, string> = {
      '16x9': 'LAYOUT_16x9',
      '16x10': 'LAYOUT_16x10',
      '4x3': 'LAYOUT_4x3',
      'wide': 'LAYOUT_WIDE'
    };
    pptx.layout = layoutMap[config.layout] || 'LAYOUT_16x9';

    // Determine pages to process
    let pagesToProcess: number[] = [];
    if (pageIndices === 'all') {
      pagesToProcess = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
    } else {
      // PDF.js uses 1-based indexing
      pagesToProcess = pageIndices.map(i => i + 1);
    }

    const total = pagesToProcess.length;

    for (let i = 0; i < total; i++) {
        const pageNum = pagesToProcess[i];
        onStatusUpdate?.(`Rendering slide ${i + 1} of ${total}...`);
        
        try {
          const page = await pdf.getPage(pageNum);
          // 2.0 scale is roughly 144dpi, good for 1080p screens
          const viewport = page.getViewport({ scale: 2.0 }); 

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Fill background if specified
          if (config.backgroundColor) {
             context.fillStyle = config.backgroundColor;
             context.fillRect(0, 0, canvas.width, canvas.height);
          }

          const renderContext = {
              canvasContext: context,
              viewport: viewport,
          };
          await page.render(renderContext).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // JPEG is faster and smaller for photos/slides

          const slide = pptx.addSlide();
          
          if (config.backgroundColor) {
             slide.background = { color: config.backgroundColor.replace('#', '') };
          }

          // Add the rendered page as a full-slide image
          slide.addImage({
              data: dataUrl,
              x: 0,
              y: 0,
              w: '100%',
              h: '100%',
          });
        } catch (e) {
          console.warn(`Skipping page ${pageNum} due to error`, e);
        }
        
        if (onProgress) onProgress(10 + Math.round(((i + 1) / total) * 80));
    }

    onStatusUpdate?.('Packing presentation...');
    const blob = await pptx.write('blob');

    if (onProgress) onProgress(100);

    return blob as Blob;
};
