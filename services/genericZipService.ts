import JSZip from 'jszip';
import { ZipFile, ZipCompressionLevel } from '../types';

export const generateGenericZip = async (
  files: ZipFile[],
  compression: ZipCompressionLevel,
  onProgress?: (percent: number) => void
): Promise<Blob> => {
  const zip = new JSZip();

  // Add files to zip
  // Append -EZtify suffix to filename before extension
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

  // Generate ZIP
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: compression,
      compressionOptions: {
        level: compression === 'STORE' ? 1 : 6 // 1 is fastest for STORE (effectively no comp), 6 is balanced for DEFLATE
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