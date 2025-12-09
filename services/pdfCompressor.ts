import { jsPDF } from 'jspdf';
import { extractImagesFromPdf } from './pdfExtractor';
import { CompressionLevel, CompressionResult } from '../types';

export const compressPDF = async (
  file: File,
  level: CompressionLevel,
  onProgress?: (percent: number) => void
): Promise<CompressionResult> => {
  const originalSize = file.size;
  
  // 1. Extract images from PDF
  // We use the extractor service but we'll need to process these images
  if (onProgress) onProgress(10);
  
  // Settings based on compression level
  // Normal: Better quality, decent size reduction
  // Strong: Aggressive compression, smaller size, potential visual artifacts
  const scale = level === 'normal' ? 1.5 : 1.0; 
  const quality = level === 'normal' ? 0.7 : 0.4;
  
  // Helper to load image for canvas drawing
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  };

  try {
    // Extract raw images first (this uses pdf.js to render pages)
    // We repurpose the extractor but we might need to be careful about memory
    const extractedImages = await extractImagesFromPdf(file, (p) => {
      // Map extraction progress (0-100) to overall progress (10-40)
      if (onProgress) onProgress(10 + (p * 0.3));
    });

    if (extractedImages.length === 0) {
      throw new Error("No content found to compress");
    }

    // 2. Create new PDF
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      compress: true
    });

    const mmPerPx = 0.264583;

    for (let i = 0; i < extractedImages.length; i++) {
      const imgData = extractedImages[i];
      
      // Update progress (40-90)
      if (onProgress) onProgress(40 + Math.round((i / extractedImages.length) * 50));
      
      // Yield to UI
      await new Promise(resolve => setTimeout(resolve, 0));

      const imgElement = await loadImage(imgData.previewUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) continue;

      // Calculate target dimensions based on "Scale" (Resolution reduction)
      // If Strong compression, we might downscale the image resolution
      const targetWidth = imgElement.width * (level === 'strong' ? 0.8 : 1.0);
      const targetHeight = imgElement.height * (level === 'strong' ? 0.8 : 1.0);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgElement, 0, 0, targetWidth, targetHeight);

      // Compress to JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

      // Add to PDF
      const pdfPageWidth = canvas.width * mmPerPx;
      const pdfPageHeight = canvas.height * mmPerPx;

      const orientation = pdfPageWidth > pdfPageHeight ? 'l' : 'p';
      
      if (i > 0) {
        doc.addPage([pdfPageWidth, pdfPageHeight], orientation);
      } else {
        // First page setup
        // delete initial page if dimensions assume A4 default, or just set page 1
        // easiest to set page 1 size then add image
        doc.deletePage(1);
        doc.addPage([pdfPageWidth, pdfPageHeight], orientation);
      }

      doc.addImage(compressedDataUrl, 'JPEG', 0, 0, pdfPageWidth, pdfPageHeight);
      
      // Clean up memory
      URL.revokeObjectURL(imgData.previewUrl);
    }

    if (onProgress) onProgress(95);

    const pdfBlob = doc.output('blob');
    const newSize = pdfBlob.size;

    if (onProgress) onProgress(100);

    return {
      originalSize,
      newSize,
      blob: pdfBlob,
      fileName: file.name.replace('.pdf', '') + '_compressed-EZtify.pdf'
    };

  } catch (error) {
    console.error("Compression failed", error);
    throw error;
  }
};