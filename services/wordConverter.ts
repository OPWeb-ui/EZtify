
import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';

export interface WordPdfConfig {
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
}

export const getDocxPreview = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
};

export const convertWordToPdf = async (
  file: File,
  config: WordPdfConfig = { pageSize: 'a4', orientation: 'portrait' },
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<Blob> => {
  onStatusUpdate?.('Reading DOCX file...');
  if (onProgress) onProgress(10);
  
  const arrayBuffer = await file.arrayBuffer();

  onStatusUpdate?.('Converting to HTML...');
  if (onProgress) onProgress(30);

  // 1. Convert DOCX to HTML using mammoth
  const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
  const html = result.value; 
  
  // 2. Create a temporary container to render the HTML
  const container = document.createElement('div');
  container.innerHTML = html;
  
  // Determine dimensions based on config
  // 96 DPI pixels roughly mapping to points
  // A4: 595.28pt x 841.89pt
  // Letter: 612pt x 792pt
  
  let targetWidthPt = 595.28;
  // let targetHeightPt = 841.89; // Not strictly needed for HTML flow unless limiting
  
  if (config.pageSize === 'letter') {
    targetWidthPt = 612;
  }
  
  if (config.orientation === 'landscape') {
    // Swap for logic if needed, though jsPDF handles orientation.
    // However, the HTML container width defines the text wrap.
    // If Landscape A4: width is 841.89pt
    targetWidthPt = config.pageSize === 'letter' ? 792 : 841.89;
  }

  // Convert points to pixels for the HTML container (approx 1.33 px per pt, but html2canvas uses window resolution)
  // To get a 1:1 mapping with jsPDF 'pt' unit, we size the container in 'pt' or equivalent 'px'.
  // jsPDF .html() uses a scale factor.
  // Best practice: Set container width to the target PDF width in pixels (e.g. at 96DPI) and scale down.
  // Or match the PDF point width and use appropriate scale.
  
  // Let's set a fixed width for the HTML rendering that mimics a document page width.
  // 800px is a decent "web" rendering width. We will calculate scale later.
  const htmlRenderWidth = 800; 
  
  container.style.width = `${htmlRenderWidth}px`;
  container.style.minHeight = '100px'; 
  container.style.padding = '40px'; // Margins
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.zIndex = '-10000'; // Hidden behind app content
  container.style.fontFamily = 'Arial, sans-serif'; 
  container.style.fontSize = '12pt';
  container.style.lineHeight = '1.5';
  
  // Append to body
  document.body.appendChild(container);
  
  // Ensure any images in the DOCX are loaded before rendering
  const images = container.querySelectorAll('img');
  if (images.length > 0) {
      await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => { 
            img.onload = resolve; 
            img.onerror = resolve; 
          });
      }));
  }
  
  onStatusUpdate?.('Rendering PDF...');
  if (onProgress) onProgress(50);
  
  // 3. Use jsPDF to capture the HTML
  const doc = new jsPDF({
    unit: 'pt',
    format: config.pageSize,
    orientation: config.orientation
  });

  // Set standardized metadata
  doc.setProperties({
    title: 'files_EZtify',
    author: 'EZtify',
    producer: 'EZtify',
    subject: 'Generated with EZtify',
    creator: 'EZtify – Word to PDF'
  });

  // Calculate scale factor: PDF Width (pt) / HTML Width (px)
  const scale = targetWidthPt / htmlRenderWidth;

  return new Promise<Blob>((resolve, reject) => {
    doc.html(container, {
      callback: (doc) => {
         try {
           if (onProgress) onProgress(90);
           onStatusUpdate?.('Finalizing...');
           
           const blob = doc.output('blob');
           
           if (onProgress) onProgress(100);
           
           // Cleanup
           if (document.body.contains(container)) {
             document.body.removeChild(container);
           }
           resolve(blob);
         } catch (err) {
           if (document.body.contains(container)) {
             document.body.removeChild(container);
           }
           reject(err);
         }
      },
      x: 0,
      y: 0,
      width: targetWidthPt, // The width in the PDF
      windowWidth: htmlRenderWidth, // The window width to render the HTML
      margin: [0, 0, 0, 0], // Margins are handled by container padding or CSS
      autoPaging: 'text',
      html2canvas: {
        scale: scale, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      }
    });
  });
};
