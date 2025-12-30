
import { loadPdfJs } from './pdfProvider';
import PptxGenJS from 'pptxgenjs';

export interface PptxConfig {
  layout: 'auto' | '16x9' | '16x10' | '4x3' | 'wide'; // 'auto' is smart detect
  backgroundColor?: string;
}

// PPTX Layout Dimensions in Inches
const LAYOUT_DIMS: Record<string, { w: number, h: number }> = {
  '16x9': { w: 10.0, h: 5.625 },
  '16x10': { w: 10.0, h: 6.25 },
  '4x3': { w: 10.0, h: 7.5 },
  'wide': { w: 13.333, h: 7.5 },
};

export const convertPdfToPptx = async (
  file: File,
  pageIndices: number[] | 'all', // 0-based indices
  config: PptxConfig,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<{ blob: Blob; slideCount: number }> => {

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
    
    // --- SMART LAYOUT DETECTION ---
    let slideWidth = 0;
    let slideHeight = 0;

    if (config.layout === 'auto') {
        onStatusUpdate?.('Detecting page layout...');
        // Read page 1 dimensions to set the presentation master layout
        const page1 = await pdf.getPage(1);
        const { width, height } = page1.getViewport({ scale: 1.0 });
        
        // Define Custom Layout based on PDF point dimensions (72 dpi) -> Inches
        const widthIn = width / 72;
        const heightIn = height / 72;
        
        slideWidth = widthIn;
        slideHeight = heightIn;

        pptx.defineLayout({ name: 'CUSTOM_PDF_MATCH', width: widthIn, height: heightIn });
        pptx.layout = 'CUSTOM_PDF_MATCH';
    } else {
        // Use standard preset dimensions
        const dims = LAYOUT_DIMS[config.layout] || LAYOUT_DIMS['16x9'];
        slideWidth = dims.w;
        slideHeight = dims.h;

        const layoutMap: Record<string, string> = {
          '16x9': 'LAYOUT_16x9',
          '16x10': 'LAYOUT_16x10',
          '4x3': 'LAYOUT_4x3',
          'wide': 'LAYOUT_WIDE'
        };
        pptx.layout = layoutMap[config.layout] || 'LAYOUT_16x9';
    }

    // Determine pages to process
    let pagesToProcess: number[] = [];
    if (pageIndices === 'all') {
      pagesToProcess = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
    } else {
      pagesToProcess = pageIndices.map(i => i + 1);
    }

    const total = pagesToProcess.length;

    for (let i = 0; i < total; i++) {
        const pageNum = pagesToProcess[i];
        onStatusUpdate?.(`Rendering slide ${i + 1} of ${total}...`);
        
        try {
          const page = await pdf.getPage(pageNum);
          // 2.0 scale is roughly 144dpi, good balance for slide quality
          const viewport = page.getViewport({ scale: 2.0 }); 

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Fill background if specified (or white default for PDF content)
          context.fillStyle = config.backgroundColor || '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);

          const renderContext = {
              canvasContext: context,
              viewport: viewport,
          };
          await page.render(renderContext).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          const slide = pptx.addSlide();
          
          if (config.backgroundColor) {
             slide.background = { color: config.backgroundColor.replace('#', '') };
          }

          // --- ASPECT RATIO CALCULATION ---
          // Calculate dimensions to FIT content (contain) without stretching
          const imgRatio = viewport.width / viewport.height;
          const slideRatio = slideWidth / slideHeight;

          let w, h, x, y;

          if (imgRatio > slideRatio) {
              // Image is wider than slide (relative to aspect) -> Constrain Width
              w = slideWidth;
              h = slideWidth / imgRatio;
              x = 0;
              // Center Vertically
              y = (slideHeight - h) / 2;
          } else {
              // Image is taller or equal -> Constrain Height
              h = slideHeight;
              w = slideHeight * imgRatio;
              y = 0;
              // Center Horizontally
              x = (slideWidth - w) / 2;
          }

          slide.addImage({
              data: dataUrl,
              x: x,
              y: y,
              w: w,
              h: h,
          });
        } catch (e) {
          console.warn(`Skipping page ${pageNum} due to error`, e);
        }
        
        if (onProgress) onProgress(10 + Math.round(((i + 1) / total) * 80));
    }

    onStatusUpdate?.('Packing presentation...');
    
    // Explicitly cast to unknown then Blob to satisfy TS if definitions mismatch
    const pptxBlob = await pptx.write('blob') as unknown as Blob;

    const finalBlob = new Blob([pptxBlob], { 
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
    });

    if (onProgress) onProgress(100);

    return { blob: finalBlob, slideCount: total };
};
