
import { ZipFile } from '../types';

let zipLib: any = null;

const loadZipLib = async () => {
  if (zipLib) return zipLib;

  try {
    // Use a variable and vite-ignore to prevent Vite from bundling this deep import,
    // which fails due to package export restrictions. The browser will resolve it via import map.
    const fullBuildPath = '@zip.js/zip.js/dist/zip-full.esm.min.js';
    // @ts-ignore
    zipLib = await import(/* @vite-ignore */ fullBuildPath);
  } catch (e) {
    console.warn("Failed to load full zip build, falling back to standard import", e);
    try {
      // @ts-ignore
      zipLib = await import('@zip.js/zip.js');
    } catch (e2) {
      throw new Error("Could not load encryption engine. Please check internet connection.");
    }
  }
  return zipLib;
};

export const createEncryptedZip = async (
  files: ZipFile[],
  password: string,
  onProgress?: (percent: number) => void
): Promise<Blob> => {
  const lib = await loadZipLib();
  const { BlobReader, BlobWriter, ZipWriter } = lib;

  if (!ZipWriter) throw new Error("Zip library loaded but missing components.");

  const blobWriter = new BlobWriter("application/zip");
  
  // Configure for AES-256 (encryptionStrength: 3)
  const zipWriter = new ZipWriter(blobWriter, {
    password: password,
    zipCrypto: false, // Use AES
    encryptionStrength: 3,
    level: 5 // Balanced compression
  });

  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const fileItem = files[i];
    
    // Normalize filename
    let name = fileItem.file.name;
    const lastDot = name.lastIndexOf('.');
    if (lastDot === -1) name += "-EZtify";
    
    if (onProgress) {
        // Map progress based on file count
        onProgress(Math.round((i / totalFiles) * 100));
    }

    await zipWriter.add(name, new BlobReader(fileItem.file));
  }

  if (onProgress) onProgress(95);
  
  await zipWriter.close();
  const blob = await blobWriter.getData();
  
  if (onProgress) onProgress(100);
  return blob;
};
