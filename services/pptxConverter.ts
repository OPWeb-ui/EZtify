
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

export interface PptxInfo extends PptxMetadata {
    slideCount: number;
}

export const getPptxInfo = async (file: File): Promise<PptxInfo> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // Get slide count
        const slideFiles = Object.keys(zip.files).filter(path => 
            path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
        );
        const slideCount = slideFiles.length;

        // Get dimensions
        const presXml = await zip.file("ppt/presentation.xml")?.async("string");
        if (presXml) {
            // Using regex to find sldSz to avoid namespace issues with DOMParser in some environments
            const cxMatch = presXml.match(/cx="(\d+)"/);
            const cyMatch = presXml.match(/cy="(\d+)"/);
            
            if (cxMatch && cyMatch) {
                const cx = parseInt(cxMatch[1]);
                const cy = parseInt(cyMatch[1]);
                
                if (cx > 0 && cy > 0) {
                    const widthPt = (cx / 914400) * 72;
                    const heightPt = (cy / 914400) * 72;
                    return {
                        slideCount,
                        widthPt,
                        heightPt,
                        orientation: widthPt >= heightPt ? 'landscape' : 'portrait'
                    };
                }
            }
        }
    } catch (e) {
        console.warn("Failed to detect PPTX info", e);
    }
    // Default fallback
    return { slideCount: 0, widthPt: 720, heightPt: 540, orientation: 'landscape' };
};


export const detectPptxMetadata = async (file: File): Promise<PptxMetadata> => {
    const info = await getPptxInfo(file);
    return {
        widthPt: info.widthPt,
        heightPt: info.heightPt,
        orientation: info.orientation,
    };
};

export const detectPptxOrientation = async (file: File): Promise<'portrait' | 'landscape'> => {
    const meta = await detectPptxMetadata(file);
    return meta.orientation;
};

export const convertPptxToPdf = async (
  file: File,
  config: PdfConfig, 
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
  
  // Sort naturally (slide1, slide2, slide10...)
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
    // Add page for slides > 1 (jsPDF creates first page automatically)
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
    
    // --- Extract Text (Robust Method) ---
    // Instead of complex DOM traversal with namespaces, we extract all text within <a:t> tags using regex.
    // This loses position data but guarantees content visibility for this lightweight tool.
    
    // Regex matches <a:t>...</a:t> content
    const textMatches = slideXmlStr.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
    
    const margin = 40;
    let yPos = margin;
    
    doc.setFont("helvetica");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    
    if (textMatches) {
        for (const match of textMatches) {
            // Strip tags to get clean text
            const text = match.replace(/<\/?a:t[^>]*>/g, "");
            if (text.trim()) {
                const lines = doc.splitTextToSize(text, widthPt - (margin * 2));
                
                // Simple layout flow
                if (yPos + (lines.length * 16) > heightPt - margin) {
                    // Stop drawing if out of bounds (naive pagination)
                    break;
                }
                
                doc.text(lines, margin, yPos);
                yPos += lines.length * 18 + 10; // Line height + paragraph spacing
            }
        }
    }
    
    // --- Extract Images ---
    // Look for relationships to find images
    const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const relsFile = zip.file(relsPath);
    
    if (relsFile) {
       try {
         const relsXmlStr = await relsFile.async('string');
         // Extract targets with type image
         const relMatches = Array.from(relsXmlStr.matchAll(/Type="http:\/\/schemas.openxmlformats.org\/officeDocument\/2006\/relationships\/image" Target="([^"]+)"/g));
         
         for (const match of relMatches) {
            let target = match[1];
            // Resolve relative path
            let imagePath = target.startsWith('../') ? 'ppt/' + target.replace('../', '') : 'ppt/slides/' + target;
            
            const imgFile = zip.file(imagePath);
            if (imgFile) {
                const imgBlob = await imgFile.async('blob');
                const imgDataUrl = await blobToDataUrl(imgBlob);
                
                // Get dimensions to fit it
                const imgProps = await new Promise<{w: number, h: number}>((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve({ w: img.width, h: img.height });
                    img.onerror = () => resolve({ w: 100, h: 100 });
                    img.src = imgDataUrl;
                });
                
                // Place image after text if space permits, or center if page empty
                let renderW = Math.min(widthPt - margin*2, imgProps.w);
                let renderH = (imgProps.h / imgProps.w) * renderW;
                
                // Limit height
                const maxH = heightPt - yPos - margin;
                
                // If text took up most space, just put image on top of text or skip? 
                // Better: Just center it if there's no text, or append.
                if (maxH > 100) {
                    if (renderH > maxH) {
                        renderH = maxH;
                        renderW = (imgProps.w / imgProps.h) * renderH;
                    }
                    
                    const xPos = (widthPt - renderW) / 2;
                    const format = imagePath.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
                    
                    doc.addImage(imgDataUrl, format, xPos, yPos, renderW, renderH);
                    yPos += renderH + 20;
                } else if (textMatches === null) {
                    // No text, so center image on page
                    renderH = Math.min(heightPt - margin*2, renderH);
                    renderW = (imgProps.w / imgProps.h) * renderH;
                    const xPos = (widthPt - renderW) / 2;
                    const yPosImg = (heightPt - renderH) / 2;
                    const format = imagePath.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
                    doc.addImage(imgDataUrl, format, xPos, yPosImg, renderW, renderH);
                }
            }
         }
       } catch (err) {
         console.warn("Error processing slide images:", err);
       }
    }
  }
  
  onStatusUpdate?.('Finalizing PDF...');
  if (onProgress) onProgress(100);
  
  return doc.output('blob');
};
