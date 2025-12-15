
import JSZip from 'jszip';
import { UploadedImage, ExportConfig } from '../types';

export const generateZip = async (
  images: UploadedImage[],
  config: ExportConfig,
  onProgress?: (percent: number) => void
): Promise<void> => {
  const zip = new JSZip();
  const folder = zip.folder("EZtify-Images");
  
  // Default scale to 1 if not provided (72 DPI base)
  const scale = config.scale || 1;

  for (let i = 0; i < images.length; i++) {
    // Yield
    await new Promise(resolve => setTimeout(resolve, 0));
    if (onProgress) onProgress(Math.round((i / images.length) * 50)); // First 50% is preparation

    const imgData = images[i];
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    const loadedImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.src = imgData.previewUrl;
      image.onload = () => resolve(image);
      image.onerror = reject;
    });

    // Handle Rotation logic
    const isRotatedSideways = imgData.rotation === 90 || imgData.rotation === 270;
    const srcWidth = loadedImg.width;
    const srcHeight = loadedImg.height;

    // Set canvas dimensions based on rotation AND scale
    canvas.width = (isRotatedSideways ? srcHeight : srcWidth) * scale;
    canvas.height = (isRotatedSideways ? srcWidth : srcHeight) * scale;
    
    // Fill white for JPG to avoid black backgrounds
    if (config.format === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply scale and rotation transformation
    // Translate to center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // Rotate
    ctx.rotate((imgData.rotation * Math.PI) / 180);
    // Scale (applied after rotation conceptually, but canvas transforms are matrix based)
    // We scale the drawImage call or the context. 
    // Since we increased canvas size by scale, we need to draw the image larger.
    ctx.scale(scale, scale);
    
    // Draw centered
    ctx.drawImage(loadedImg, -srcWidth / 2, -srcHeight / 2);
    
    const mimeType = config.format === 'png' ? 'image/png' : 'image/jpeg';
    const extension = config.format === 'png' ? 'png' : 'jpg';
    
    const blob = await new Promise<Blob | null>(resolve => 
      canvas.toBlob(resolve, mimeType, config.quality)
    );

    if (blob && folder) {
      // Try to preserve original name if possible, else page-i
      const originalName = imgData.file.name;
      const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || `page-${i + 1}`;
      const safeName = baseName.replace(/[^a-zA-Z0-9\-_]/g, '_');
      
      folder.file(`${safeName}_EZtify.${extension}`, blob);
    }
  }

  // Generate Zip
  if (onProgress) onProgress(75);
  
  const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
    if (onProgress && metadata.percent) {
      // Map 0-100 of zip gen to 50-100 of total
       onProgress(50 + (metadata.percent / 2));
    }
  });
  
  // Download
  // Derive filename from first image
  const firstImage = images[0];
  const originalName = firstImage.file.name;
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9\-_]/g, '_');
  const zipFileName = `${safeName}_EZtify.zip`;

  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  if (onProgress) onProgress(100);
};
