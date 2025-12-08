
// Centralized provider for loading PDF.js dynamically
// This prevents load-time crashes and ensures version consistency

export const loadPdfJs = async () => {
  try {
    // Dynamic import to prevent initial load crash
    // We rely on the import map in index.html to resolve 'pdfjs-dist'
    // We use a variable and @vite-ignore to prevent Vite from bundling it (which fails due to Top-Level Await target issues)
    const libName = 'pdfjs-dist';
    const pdfjsModule = await import(/* @vite-ignore */ libName);
    
    // Handle potential default export mismatch (common with CDN/ESM)
    const pdfjsLib = (pdfjsModule as any).default || pdfjsModule;
    
    // Configure worker source if not already set
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
    }
    
    return pdfjsLib;
  } catch (error) {
    console.error("Failed to load PDF.js library:", error);
    throw new Error("Could not load PDF engine. Please check your connection or disable ad-blockers that might block CDNs.");
  }
};
