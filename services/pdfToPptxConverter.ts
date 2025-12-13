
import { loadPdfJs } from './pdfProvider';
import PptxGenJS from 'pptxgenjs';

export const convertPdfToPptx = async (
  file: File,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<Blob> => {

    onStatusUpdate?.('Reading PDF...');
    if (onProgress) onProgress(5);

    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    if (onProgress) onProgress(15);
    
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9'; // Standard presentation layout

    for (let i = 1; i <= pdf.numPages; i++) {
        onStatusUpdate?.(`Processing page ${i}/${pdf.numPages}...`);
        
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Render at high quality

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

        // Convert canvas to dataURL. PNG is better for text quality.
        const dataUrl = canvas.toDataURL('image/png');

        const slide = pptx.addSlide();
        
        // Add the rendered page as a full-slide image
        slide.addImage({
            data: dataUrl,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
        });
        
        if (onProgress) onProgress(15 + Math.round((i / pdf.numPages) * 75));
    }

    onStatusUpdate?.('Generating PPTX file...');
    
    const blob = await pptx.write('blob');

    if (onProgress) onProgress(100);

    return blob as Blob;
};
