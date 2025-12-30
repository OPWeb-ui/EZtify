// Centralized provider for loading PDF.js dynamically
// This prevents load-time crashes and ensures version consistency

let pdfjsInstance: any = null;

export const loadPdfJs = async () => {
  if (pdfjsInstance) return pdfjsInstance;

  try {
    const libName = 'pdfjs-dist';
    const pdfjsModule = await import(/* @vite-ignore */ libName);
    const pdfjsLib = (pdfjsModule as any).default || pdfjsModule;
    
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use the exact same version as the main library to avoid internal mismatches
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
    }
    
    pdfjsInstance = pdfjsLib;
    return pdfjsLib;
  } catch (error) {
    console.error("Failed to load PDF.js library:", error);
    throw new Error("Could not load PDF engine. Check your connection or ad-blocker.");
  }
};