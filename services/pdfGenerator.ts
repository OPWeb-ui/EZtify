
import { jsPDF } from 'jspdf';
import { UploadedImage, PdfConfig } from '../types';

/**
 * Calculates dimensions to fit an image into a target area while maintaining aspect ratio
 */
const calculateDimensions = (
  imgWidth: number,
  imgHeight: number,
  pageWidth: number,
  pageHeight: number,
  fitMode: 'contain' | 'cover' | 'fill',
  margin: number
) => {
  // Available space for the image
  const contentWidth = Math.max(0, pageWidth - (margin * 2));
  const contentHeight = Math.max(0, pageHeight - (margin * 2));
  
  if (fitMode === 'fill') {
    return { width: contentWidth, height: contentHeight, x: margin, y: margin };
  }

  const imgRatio = imgWidth / imgHeight;
  const pageRatio = contentWidth / contentHeight;

  let finalWidth, finalHeight;

  if (fitMode === 'contain') {
    if (imgRatio > pageRatio) {
      finalWidth = contentWidth;
      finalHeight = contentWidth / imgRatio;
    } else {
      finalHeight = contentHeight;
      finalWidth = contentHeight * imgRatio;
    }
  } else { // cover
    if (imgRatio > pageRatio) {
      finalHeight = contentHeight;
      finalWidth = contentHeight * imgRatio;
    } else {
      finalWidth = contentWidth;
      finalHeight = contentWidth / imgRatio;
    }
  }

  // Center the image
  const x = margin + (contentWidth - finalWidth) / 2;
  const y = margin + (contentHeight - finalHeight) / 2;

  return { width: finalWidth, height: finalHeight, x, y };
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Do not set crossOrigin for blob URLs created from local files
    // img.crossOrigin = 'Anonymous'; 
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image'));
  });
};

export const generatePDF = async (
  images: UploadedImage[], 
  config: PdfConfig,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<void> => {
  if (images.length === 0) return;

  onStatusUpdate?.('Initializing PDF...');
  
  // Create doc with initial orientation from global config
  // Note: We'll add pages dynamically so the initial format matters less, 
  // but we initialize with the global default.
  const doc = new jsPDF({
    orientation: config.orientation,
    unit: 'mm',
    compress: true
  });

  // Set standardized metadata
  doc.setProperties({
    title: 'files_EZtify',
    author: 'EZtify',
    producer: 'EZtify',
    subject: 'Generated with EZtify',
    creator: 'EZtify – Images to PDF'
  });

  const mmPerPx = 0.264583;

  for (let i = 0; i < images.length; i++) {
    const percent = Math.round((i / images.length) * 100);
    onProgress?.(percent);
    onStatusUpdate?.(`Processing image ${i + 1}/${images.length}...`);

    await new Promise(resolve => setTimeout(resolve, 0));

    const imgData = images[i];
    
    // Merge global config with per-image overrides
    const effectiveConfig = { ...config, ...(imgData.pdfConfig || {}) };
    
    try {
      const imgElement = await loadImage(imgData.previewUrl);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not create canvas context');

      const isRotatedSideways = imgData.rotation === 90 || imgData.rotation === 270;
      const srcWidth = imgElement.width;
      const srcHeight = imgElement.height;

      canvas.width = isRotatedSideways ? srcHeight : srcWidth;
      canvas.height = isRotatedSideways ? srcWidth : srcHeight;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((imgData.rotation * Math.PI) / 180);
      ctx.drawImage(imgElement, -srcWidth / 2, -srcHeight / 2);

      const finalDataUrl = canvas.toDataURL('image/jpeg', effectiveConfig.quality);

      let pdfPageWidth, pdfPageHeight;
      
      if (effectiveConfig.pageSize === 'auto') {
        pdfPageWidth = canvas.width * mmPerPx;
        pdfPageHeight = canvas.height * mmPerPx;
      } else {
        const sizes: Record<string, [number, number]> = {
          a4: [210, 297],
          letter: [215.9, 279.4]
        };
        const std = sizes[effectiveConfig.pageSize] || sizes['a4'];
        
        if (effectiveConfig.orientation === 'landscape') {
          pdfPageWidth = std[1];
          pdfPageHeight = std[0];
        } else {
          pdfPageWidth = std[0];
          pdfPageHeight = std[1];
        }
      }

      const orientation = pdfPageWidth > pdfPageHeight ? 'l' : 'p';
      
      // If it's the first page, we might need to delete the default one created by constructor
      // IF we want to strictly follow the page size of the first image.
      // However, jsPDF API usually adds a page. 
      // Strategy: Add page for every image. If i===0, delete the initial default page *after* adding the real first page, 
      // or set the page properties of the existing one. 
      // Doc.addPage is cleaner for mixed orientations.
      
      doc.addPage([pdfPageWidth, pdfPageHeight], orientation);

      const dims = calculateDimensions(
        canvas.width, 
        canvas.height, 
        pdfPageWidth, 
        pdfPageHeight, 
        effectiveConfig.pageSize === 'auto' ? 'fill' : effectiveConfig.fitMode, 
        effectiveConfig.margin
      );

      doc.addImage(finalDataUrl, 'JPEG', dims.x, dims.y, dims.width, dims.height);

    } catch (error) {
      console.error(`Error processing image ${i}:`, error);
    }
  }

  // Remove the initial blank page created by jsPDF constructor
  // Since we used addPage for every image (starting index 1, effectively), 
  // the page at index 1 (internal logic) is the first default one usually.
  // jsPDF page indexing is 1-based.
  const totalPages = doc.getNumberOfPages();
  if (totalPages > images.length) {
    // The default page is usually the first one if we just started adding new ones.
    doc.deletePage(1);
  }

  onProgress?.(100);
  onStatusUpdate?.('Saving PDF...');
  
  await new Promise(resolve => setTimeout(resolve, 800));

  // Derive filename from first image
  const firstImage = images[0];
  const originalName = firstImage.file.name;
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  // Sanitize filename
  const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_');
  const finalName = `${safeName}_EZtify.pdf`;

  doc.save(finalName);
};
