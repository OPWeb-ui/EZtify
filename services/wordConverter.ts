import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';

export const convertWordToPdf = async (
  file: File,
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
  
  // Style the container to match A4 proportions (approx 794px width at 96 DPI)
  // IMPORTANT: Do NOT use 'left: -9999px' as html2canvas often fails to render off-screen elements.
  // Instead, place it fixed at 0,0 but deeply behind everything (z-index -10000).
  container.style.width = '794px'; 
  container.style.minHeight = '1123px'; // A4 height approx
  container.style.padding = '48px'; // Approx 0.5 inch margins
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
  // A4 size in points: 595.28 x 841.89
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
    orientation: 'portrait'
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
  // 595.28 / 794 ≈ 0.75
  const scale = 595.28 / 794;

  return new Promise<Blob>((resolve, reject) => {
    doc.html(container, {
      callback: (doc) => {
         try {
           if (onProgress) onProgress(90);
           onStatusUpdate?.('Finalizing...');
           
           const blob = doc.output('blob');
           
           if (onProgress) onProgress(100);
           
           // Cleanup
           document.body.removeChild(container);
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
      width: 595.28,
      windowWidth: 794, 
      margin: [0, 0, 0, 0], // Margins are handled by container padding
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