
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { PdfConfig } from '../types';

// Helper to convert blob to base64 Data URL
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface PptxMetadata {
    widthPt: number;
    heightPt: number;
    orientation: 'portrait' | 'landscape';
}

export const detectPptxMetadata = async (file: File): Promise<PptxMetadata> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const presXml = await zip.file("ppt/presentation.xml")?.async("string");
        
        if (presXml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(presXml, "application/xml");
            const sldSz = doc.getElementsByTagName("p:sldSz")[0];
            if (sldSz) {
                // Dimensions in EMUs (English Metric Units). 1 inch = 914400 EMU.
                // jsPDF uses points (1/72 inch).
                const cx = parseInt(sldSz.getAttribute("cx") || "0");
                const cy = parseInt(sldSz.getAttribute("cy") || "0");
                
                if (cx > 0 && cy > 0) {
                    const widthPt = (cx / 914400) * 72;
                    const heightPt = (cy / 914400) * 72;
                    return {
                        widthPt,
                        heightPt,
                        orientation: widthPt >= heightPt ? 'landscape' : 'portrait'
                    };
                }
            }
        }
    } catch (e) {
        console.warn("Failed to detect PPTX size", e);
    }
    // Default to Widescreen (16:9) 13.333 x 7.5 inches if detection fails
    return { widthPt: 960, heightPt: 540, orientation: 'landscape' };
};

export const detectPptxOrientation = async (file: File): Promise<'portrait' | 'landscape'> => {
    const meta = await detectPptxMetadata(file);
    return meta.orientation;
};

export const convertPptxToPdf = async (
  file: File,
  config: PdfConfig, // config.pageSize is mostly ignored for 'auto' behavior
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<Blob> => {
  onStatusUpdate?.('Analyzing presentation structure...');
  if (onProgress) onProgress(5);
  
  // 1. Detect Size
  const meta = await detectPptxMetadata(file);
  const { widthPt, heightPt, orientation } = meta;

  const zip = await JSZip.loadAsync(file);
  
  // 2. Identify slides
  const slideFiles = Object.keys(zip.files).filter(path => 
    path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
  );
  
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
    const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
    return numA - numB;
  });

  // 3. Create PDF with detected size
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'pt', // Use points to match our calculation
    format: [widthPt, heightPt]
  });

  doc.setProperties({
    title: file.name.replace('.pptx', ''),
    creator: 'EZtify – PPTX to PDF'
  });
  
  const parser = new DOMParser();

  for (let i = 0; i < slideFiles.length; i++) {
    // Add page for slides > 1
    if (i > 0) {
      doc.addPage([widthPt, heightPt], orientation);
    }

    const slidePath = slideFiles[i];
    const slideNum = i + 1;
    
    onStatusUpdate?.(`Processing Slide ${slideNum}/${slideFiles.length}...`);
    if (onProgress) onProgress(10 + Math.round((i / slideFiles.length) * 80));
    
    // Read slide XML
    const slideXmlStr = await zip.file(slidePath)?.async('string');
    if (!slideXmlStr) continue;
    
    const slideDoc = parser.parseFromString(slideXmlStr, 'application/xml');
    
    // --- Extract Text (Basic) ---
    // Note: PPTX text extraction without position logic (offT, offL, ext) is very crude.
    // Ideally we'd parse <a:off> and <a:ext> for position, but for a client-side tool, 
    // simply listing text or placing it nicely is a compromise.
    // For "Smart Defaults", we will place text top-down to avoid overlap if possible, 
    // or just render it plainly. A full layout engine is out of scope for a single file update.
    // We will stick to the existing logic but respect the canvas size.
    
    const textNodes = slideDoc.getElementsByTagName('a:t');
    const margin = 30;
    let yPos = margin; 
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    for (let j = 0; j < textNodes.length; j++) {
      const text = textNodes[j].textContent || '';
      if (text.trim()) {
        // Rudimentary layout: just list text. 
        // Real preservation requires complex parsing of xfrm offsets.
        const lines = doc.splitTextToSize(text, widthPt - (margin * 2));
        doc.text(lines, margin, yPos);
        yPos += lines.length * 14; 
        if (yPos > heightPt - margin) break; // clipped
      }
    }
    
    // --- Extract Images ---
    const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const relsFile = zip.file(relsPath);
    
    if (relsFile) {
       try {
         const relsXmlStr = await relsFile.async('string');
         const relsDoc = parser.parseFromString(relsXmlStr, 'application/xml');
         const relationships = relsDoc.getElementsByTagName('Relationship');
         
         // To avoid text overlap, reset Y for images or place them carefully.
         // Since we don't parse positions, we'll append images after text or at fixed positions?
         // Let's just append for now to ensure content is visible.
         
         for (let k = 0; k < relationships.length; k++) {
            const rel = relationships[k];
            const type = rel.getAttribute('Type');
            const target = rel.getAttribute('Target');
            
            if (type && type.endsWith('/image') && target) {
               let imagePath = target.startsWith('../') ? 'ppt/' + target.replace('../', '') : 'ppt/slides/' + target;
               const imgFile = zip.file(imagePath);
               if (imgFile) {
                  const imgBlob = await imgFile.async('blob');
                  const imgDataUrl = await blobToDataUrl(imgBlob);
                  
                  try {
                    const imgProps = await new Promise<{w: number, h: number}>((resolve) => {
                       const img = new Image();
                       img.onload = () => resolve({ w: img.width, h: img.height });
                       img.onerror = () => resolve({ w: 100, h: 100 });
                       img.src = imgDataUrl;
                    });
                    
                    // Basic fit logic: center image
                    const availH = heightPt - yPos - margin;
                    if (availH > 50) {
                        let renderW = Math.min(widthPt - margin*2, imgProps.w); // Don't exceed page width
                        let renderH = (imgProps.h / imgProps.w) * renderW;
                        
                        if (renderH > availH) {
                            renderH = availH;
                            renderW = (imgProps.w / imgProps.h) * renderH;
                        }
                        
                        const xPos = (widthPt - renderW) / 2;
                        
                        const ext = imagePath.split('.').pop()?.toUpperCase() || 'JPEG';
                        const format = ext === 'PNG' ? 'PNG' : 'JPEG';
                        
                        doc.addImage(imgDataUrl, format, xPos, yPos, renderW, renderH);
                        yPos += renderH + 20;
                    }
                  } catch (e) {
                     // skip
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
