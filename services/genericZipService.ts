
import JSZip from 'jszip';
import { ZipFile, ZipCompressionLevel } from '../types';

export const generateGenericZip = async (
  files: ZipFile[],
  compression: ZipCompressionLevel,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<Blob> => {
  const zip = new JSZip();

  onStatusUpdate?.('Preparing files...');
  await new Promise(resolve => setTimeout(resolve, 0)); 

  const totalFiles = files.length;
  for (let i = 0; i < totalFiles; i++) {
    const item = files[i];
    const originalName = item.file.name;
    const lastDotIndex = originalName.lastIndexOf('.');
    let newName = originalName;
    
    if (lastDotIndex !== -1) {
      const name = originalName.substring(0, lastDotIndex);
      const ext = originalName.substring(lastDotIndex);
      newName = `${name}-EZtify${ext}`;
    } else {
      newName = `${originalName}-EZtify`;
    }

    onStatusUpdate?.(`Adding ${item.file.name}`);
    zip.file(newName, item.file);

    if (onProgress) {
      // First 50% of progress is for adding files to the zip instance
      onProgress(Math.round(((i + 1) / totalFiles) * 50));
    }
    // Yield to UI to allow status update to render
    await new Promise(resolve => setTimeout(resolve, 10)); 
  }

  onStatusUpdate?.('Compressing archive...');
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: compression,
      compressionOptions: {
        level: compression === 'STORE' ? 1 : 6
      }
    },
    (metadata) => {
      if (onProgress && metadata.percent) {
        // Second 50% is for the final compression stage
        onProgress(50 + (metadata.percent / 2));
      }
      if (metadata.currentFile) {
        onStatusUpdate?.(`Compressing ${metadata.currentFile}`);
      }
    }
  );

  return zipBlob;
};
