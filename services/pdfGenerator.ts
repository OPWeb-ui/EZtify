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
  onProgress?: (percent: number) => void
): Promise<void> => {
  if (images.length === 0) return;

  // Initialize jsPDF
  // We create it with default settings, but we will add specific pages for each image.
  // Note: jsPDF creates an initial page by default. We will delete it at the end.
  const doc = new jsPDF({
    orientation: config.orientation,
    unit: 'mm',
    compress: true
  });

  const mmPerPx = 0.264583;

  for (let i = 0; i < images.length; i++) {
    // Report progress
    if (onProgress) {
      const percent = Math.round((i / images.length) * 100);
      onProgress(percent);
    }

    // Yield to main thread to allow UI to render progress updates
    await new Promise(resolve => setTimeout(resolve, 0));

    const imgData = images[i];
    
    try {
      const imgElement = await loadImage(imgData.previewUrl);
      
      // Create an offscreen canvas to handle rotation and quality
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not create canvas context');

      // Handle Rotation
      // Swap dimensions if rotated 90 or 270
      const isRotatedSideways = imgData.rotation === 90 || imgData.rotation === 270;
      const srcWidth = imgElement.width;
      const srcHeight = imgElement.height;

      canvas.width = isRotatedSideways ? srcHeight : srcWidth;
      canvas.height = isRotatedSideways ? srcWidth : srcHeight;

      // Fill background with white to handle transparent PNGs
      // (JPEGs would otherwise turn transparent pixels black)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Translate and rotate context
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((imgData.rotation * Math.PI) / 180);
      ctx.drawImage(imgElement, -srcWidth / 2, -srcHeight / 2);

      // Get Data URL (JPEG for compression)
      const finalDataUrl = canvas.toDataURL('image/jpeg', config.quality);

      // Determine Page Dimensions
      let pdfPageWidth, pdfPageHeight;
      
      if (config.pageSize === 'auto') {
        // If auto, page size equals image size (converted to mm)
        pdfPageWidth = canvas.width * mmPerPx;
        pdfPageHeight = canvas.height * mmPerPx;
      } else {
        // Standard sizes map (width, height in mm for Portrait)
        const sizes: Record<string, [number, number]> = {
          a4: [210, 297],
          letter: [215.9, 279.4]
        };
        const std = sizes[config.pageSize] || sizes['a4'];
        
        if (config.orientation === 'landscape') {
          pdfPageWidth = std[1];
          pdfPageHeight = std[0];
        } else {
          pdfPageWidth = std[0];
          pdfPageHeight = std[1];
        }
      }

      // Add a new page for this image
      // format: [width, height]
      // orientation: 'p' or 'l'
      const orientation = pdfPageWidth > pdfPageHeight ? 'l' : 'p';
      doc.addPage([pdfPageWidth, pdfPageHeight], orientation);

      // Calculate placement
      const dims = calculateDimensions(
        canvas.width, 
        canvas.height, 
        pdfPageWidth, 
        pdfPageHeight, 
        config.pageSize === 'auto' ? 'fill' : config.fitMode, 
        config.margin
      );

      doc.addImage(finalDataUrl, 'JPEG', dims.x, dims.y, dims.width, dims.height);

    } catch (error) {
      console.error(`Error processing image ${i}:`, error);
      // We continue processing other images even if one fails
    }
  }

  // Update progress to 100% before saving
  if (onProgress) onProgress(100);
  await new Promise(resolve => setTimeout(resolve, 10));

  // Remove the initial blank page (page 1)
  // Check if we have added pages (total pages > 1)
  const totalPages = doc.getNumberOfPages();
  if (totalPages > 1) {
    doc.deletePage(1);
  }

  // Generate filename with timestamp
  const date = new Date().toISOString().slice(0, 10);
  doc.save(`EZtify-${date}-EZtify.pdf`);
};