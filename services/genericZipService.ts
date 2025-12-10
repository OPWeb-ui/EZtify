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

  files.forEach((item) => {
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

    zip.file(newName, item.file);
  });

  onStatusUpdate?.('Zipping files...');
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: compression,
      compressionOptions: {
        level: compression === 'STORE' ? 1 : 6
      }
    },
    (metadata) => {
      if (onProgress) {
        onProgress(metadata.percent);
      }
    }
  );

  return zipBlob;
};