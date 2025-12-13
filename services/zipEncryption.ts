
import { ZipFile } from '../types';

let zipLib: any = null;

const loadZipLib = async () => {
  if (zipLib) return zipLib;

  try {
    // The deep import '@zip.js/zip.js/dist/zip-full.esm.min.js' is not a valid
    // module specifier according to the package's "exports" map, causing build tools like Vite to fail.
    // We now use the main entry point which is correctly resolved.
    // @ts-ignore
    zipLib = await import('@zip.js/zip.js');
  } catch (e) {
    console.error("Failed to load @zip.js/zip.js library", e);
    throw new Error("Could not load encryption engine. Please check internet connection.");
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
