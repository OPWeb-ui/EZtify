import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

// Helper to convert blob to base64 Data URL
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const convertPptxToPdf = async (
  file: File,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<Blob> => {
  onStatusUpdate?.('Reading PPTX file...');
  if (onProgress) onProgress(10);
  
  const zip = await JSZip.loadAsync(file);
  
  // 1. Identify slides
  // PPTX structure: ppt/slides/slide1.xml, slide2.xml etc.
  const slideFiles = Object.keys(zip.files).filter(path => 
    path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
  );
  
  // Sort slides numerically by filename (slide1, slide2, slide10)
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
    const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
    return numA - numB;
  });

  // 2. Create PDF
  // Standard PPTX is 16:9 usually. We'll default to landscape A4-ish
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4' 
  });

  // Set standardized metadata
  doc.setProperties({
    title: 'files_EZtify',
    author: 'EZtify',
    producer: 'EZtify',
    subject: 'Generated with EZtify',
    creator: 'EZtify – PPTX to PDF'
  });
  
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  
  const parser = new DOMParser();

  for (let i = 0; i < slideFiles.length; i++) {
    // For the first slide (i=0), use the default page. 
    // For subsequent slides, add a new page.
    if (i > 0) {
      doc.addPage('a4', 'landscape');
    }

    const slidePath = slideFiles[i];
    const slideNum = i + 1;
    
    onStatusUpdate?.(`Processing Slide ${slideNum}/${slideFiles.length}...`);
    if (onProgress) onProgress(10 + Math.round((i / slideFiles.length) * 80));
    
    // Read slide XML
    const slideXmlStr = await zip.file(slidePath)?.async('string');
    if (!slideXmlStr) continue;
    
    const slideDoc = parser.parseFromString(slideXmlStr, 'application/xml');
    
    // --- Extract Text ---
    const textNodes = slideDoc.getElementsByTagName('a:t');
    let yPos = 20; 
    const margin = 20;
    const maxWidth = width - (margin * 2);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    
    // Basic extraction
    for (let j = 0; j < textNodes.length; j++) {
      const text = textNodes[j].textContent || '';
      if (text.trim()) {
        const lines = doc.splitTextToSize(text, maxWidth);
        const blockHeight = lines.length * 7;
        
        // Page break if text overflows
        if (yPos + blockHeight > height - margin) {
           doc.addPage('a4', 'landscape');
           yPos = 20;
        }

        doc.text(lines, margin, yPos);
        yPos += blockHeight; 
      }
    }
    
    // --- Extract Images (Simplified) ---
    // Images are referenced in relationships: ppt/slides/_rels/slideX.xml.rels
    const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const relsFile = zip.file(relsPath);
    
    if (relsFile) {
       try {
         const relsXmlStr = await relsFile.async('string');
         const relsDoc = parser.parseFromString(relsXmlStr, 'application/xml');
         const relationships = relsDoc.getElementsByTagName('Relationship');
         
         for (let k = 0; k < relationships.length; k++) {
            const rel = relationships[k];
            const type = rel.getAttribute('Type');
            const target = rel.getAttribute('Target');
            
            if (type && type.endsWith('/image') && target) {
               // Resolve target path
               let imagePath = '';
               if (target.startsWith('../')) {
                  imagePath = 'ppt/' + target.replace('../', '');
               } else {
                  imagePath = 'ppt/slides/' + target;
               }
               
               const imgFile = zip.file(imagePath);
               if (imgFile) {
                  const imgBlob = await imgFile.async('blob');
                  
                  // Convert to Data URL (Base64) to ensure jsPDF embeds it correctly
                  const imgDataUrl = await blobToDataUrl(imgBlob);
                  
                  // Get image dimensions
                  try {
                    const imgProps = await new Promise<{w: number, h: number}>((resolve, reject) => {
                       const img = new Image();
                       const timer = setTimeout(() => {
                          reject(new Error('Image load timeout'));
                       }, 5000); 

                       img.onload = () => {
                          clearTimeout(timer);
                          resolve({ w: img.width, h: img.height });
                       };
                       
                       img.onerror = () => {
                          clearTimeout(timer);
                          reject(new Error('Image load failed'));
                       };
                       
                       img.src = imgDataUrl;
                    });
                    
                    // Simple layout: ensure we have space
                    if (yPos + 50 > height - margin) {
                       doc.addPage('a4', 'landscape');
                       yPos = 20;
                    }
                    
                    // Scale to fit width or remaining height
                    const maxImgHeight = height - yPos - margin;
                    let renderW = 100; // Default width mm
                    let renderH = (imgProps.h / imgProps.w) * renderW;
                    
                    // Constrain height if needed
                    if (renderH > maxImgHeight) {
                       renderH = maxImgHeight;
                       renderW = (imgProps.w / imgProps.h) * renderH;
                    }
                    
                    // Ensure valid numbers
                    if (!isNaN(renderW) && !isNaN(renderH) && renderW > 0 && renderH > 0) {
                        const ext = imagePath.split('.').pop()?.toUpperCase() || 'JPEG';
                        const format = ext === 'PNG' ? 'PNG' : 'JPEG';
                        
                        doc.addImage(imgDataUrl, format, margin, yPos, renderW, renderH);
                        yPos += renderH + 10;
                    }
                    
                  } catch (e) {
                     console.warn("Skipping problematic slide image:", e);
                  }
               }
            }
         }
       } catch (err) {
         console.warn("Error processing slide resources:", err);
       }
    }
  }
  
  onStatusUpdate?.('Finalizing PDF...');
  if (onProgress) onProgress(100);
  
  return doc.output('blob');
};