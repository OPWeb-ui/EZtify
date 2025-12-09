import JSZip from 'jszip';
import { UploadedImage, ExportConfig } from '../types';

export const generateZip = async (
  images: UploadedImage[],
  config: ExportConfig,
  onProgress?: (percent: number) => void
): Promise<void> => {
  const zip = new JSZip();
  const folder = zip.folder("EZtify-Images");

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

    // Set canvas dimensions based on rotation
    canvas.width = isRotatedSideways ? srcHeight : srcWidth;
    canvas.height = isRotatedSideways ? srcWidth : srcHeight;
    
    // Fill white for JPG to avoid black backgrounds
    if (config.format === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Apply rotation transformation
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((imgData.rotation * Math.PI) / 180);
    ctx.drawImage(loadedImg, -srcWidth / 2, -srcHeight / 2);
    
    const mimeType = config.format === 'png' ? 'image/png' : 'image/jpeg';
    const extension = config.format === 'png' ? 'png' : 'jpg';
    
    const blob = await new Promise<Blob | null>(resolve => 
      canvas.toBlob(resolve, mimeType, config.quality)
    );

    if (blob && folder) {
      folder.file(`page-${i + 1}-EZtify.${extension}`, blob);
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
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().slice(0, 10);
  link.download = `EZtify-Images-${date}-EZtify.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  if (onProgress) onProgress(100);
};