
import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export interface WordPdfConfig {
  pageSize: 'a4' | 'letter' | 'auto';
  orientation: 'portrait' | 'landscape';
  width?: number; // Custom width in pt
  height?: number; // Custom height in pt
}

export const getDocxPreview = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
};

// Returns dimensions in points (pt). 1 inch = 72 pt. 1 twip = 1/20 pt.
// Word XML uses Twips.
export const detectDocxMetadata = async (file: File): Promise<{ orientation: 'portrait' | 'landscape', width?: number, height?: number }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXml = await zip.file("word/document.xml")?.async("string");
    
    if (docXml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(docXml, "application/xml");
      // Look for page size in the last section properties (usually defines the doc)
      const sectPrs = doc.getElementsByTagName("w:sectPr");
      if (sectPrs.length > 0) {
        const pgSz = sectPrs[sectPrs.length - 1].getElementsByTagName("w:pgSz")[0];
        if (pgSz) {
          // Dimensions in twips
          const wTwips = parseInt(pgSz.getAttribute("w:w") || "0");
          const hTwips = parseInt(pgSz.getAttribute("w:h") || "0");
          const orient = pgSz.getAttribute("w:orient");
          
          const widthPt = wTwips / 20;
          const heightPt = hTwips / 20;

          let finalOrient: 'portrait' | 'landscape' = 'portrait';
          if (orient === 'landscape') finalOrient = 'landscape';
          else if (widthPt > heightPt) finalOrient = 'landscape';

          return { 
            orientation: finalOrient,
            width: widthPt,
            height: heightPt
          };
        }
      }
    }
  } catch (e) {
    console.warn("Failed to detect DOCX metadata", e);
  }
  return { orientation: 'portrait' }; // Fallback
};

export const detectDocxOrientation = async (file: File): Promise<'portrait' | 'landscape'> => {
    const meta = await detectDocxMetadata(file);
    return meta.orientation;
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
  // We use style mapping to try and preserve some basic structural elements if needed
  const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
  const html = result.value; 
  
  // 2. Create a temporary container
  const container = document.createElement('div');
  container.innerHTML = html;
  
  // Determine dimensions
  let targetWidthPt = 595.28; // A4 Default
  let targetHeightPt = 841.89;

  if (config.pageSize === 'auto' && config.width && config.height) {
      targetWidthPt = config.width;
      targetHeightPt = config.height;
  } else if (config.pageSize === 'letter') {
      targetWidthPt = 612;
      targetHeightPt = 792;
  } else {
      // A4
      targetWidthPt = 595.28;
      targetHeightPt = 841.89;
  }
  
  // Swap for landscape if needed
  if (config.orientation === 'landscape') {
      // Ensure width is the larger dimension
      if (targetHeightPt > targetWidthPt) {
          const temp = targetWidthPt;
          targetWidthPt = targetHeightPt;
          targetHeightPt = temp;
      }
  } else {
      // Ensure height is the larger dimension (portrait)
      if (targetWidthPt > targetHeightPt) {
          const temp = targetWidthPt;
          targetWidthPt = targetHeightPt;
          targetHeightPt = temp;
      }
  }

  // HTML Rendering Config
  const htmlRenderWidth = 800; // Fixed PX width for consistent text flow calculation
  
  container.style.width = `${htmlRenderWidth}px`;
  container.style.padding = '40px'; 
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.position = 'fixed';
  container.style.left = '-9999px'; // Move off-screen
  container.style.fontFamily = 'Arial, sans-serif'; 
  container.style.fontSize = '12pt';
  container.style.lineHeight = '1.5';
  
  document.body.appendChild(container);
  
  // Load images
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
  
  // 3. Create PDF
  const doc = new jsPDF({
    unit: 'pt',
    format: [targetWidthPt, targetHeightPt],
    orientation: config.orientation
  });

  doc.setProperties({
    title: file.name.replace('.docx', ''),
    creator: 'EZtify'
  });

  const scale = targetWidthPt / htmlRenderWidth;

  return new Promise<Blob>((resolve, reject) => {
    doc.html(container, {
      callback: (doc) => {
         try {
           if (onProgress) onProgress(100);
           const blob = doc.output('blob');
           if (document.body.contains(container)) document.body.removeChild(container);
           resolve(blob);
         } catch (err) {
           if (document.body.contains(container)) document.body.removeChild(container);
           reject(err);
         }
      },
      x: 0,
      y: 0,
      width: targetWidthPt, 
      windowWidth: htmlRenderWidth,
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
