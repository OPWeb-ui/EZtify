
import { loadPdfJs } from './pdfProvider';

export interface SearchResult {
  id: string;
  pageIndex: number;
  x: number; // Percentage
  y: number; // Percentage
  width: number; // Percentage
  height: number; // Percentage
  text: string;
}

export const searchPdfText = async (
  file: File, 
  query: string,
  onProgress?: (val: number) => void
): Promise<SearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const results: SearchResult[] = [];
  const q = query.toLowerCase();

  for (let i = 1; i <= pdf.numPages; i++) {
    try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });
        
        const vw = viewport.width;
        const vh = viewport.height;

        // Iterate through text items
        // Note: This is a basic implementation. Complex logical word reconstruction across chunks is omitted for client-side performance.
        textContent.items.forEach((item: any, idx: number) => {
            if (item.str.toLowerCase().includes(q)) {
                // PDF coordinates: (0,0) is bottom-left
                // transform[4] = x, transform[5] = y (baseline)
                const tx = item.transform;
                const x = tx[4];
                const y = tx[5]; 
                
                // Estimate dimensions
                // width is explicitly provided by PDF.js usually
                const w = item.width > 0 ? item.width : (item.str.length * 5); 
                
                // Height is trickier, approximate from font scale (transform[0] or [3])
                const fontSize = Math.sqrt(tx[0]*tx[0] + tx[1]*tx[1]);
                const h = fontSize;

                // Convert to Top-Left % coordinate system
                // PDF Y is bottom-up. Canvas/HTML is top-down.
                // y_top = page_height - y_bottom - height
                const yFromTop = vh - y - (h * 0.2); // Adjust for baseline offset roughly

                // Pad the box slightly for better coverage
                const padding = 2;

                results.push({
                    id: `search-${i}-${idx}`,
                    pageIndex: i - 1, // 0-based
                    x: Math.max(0, ((x - padding) / vw) * 100),
                    y: Math.max(0, ((yFromTop - h) / vh) * 100),
                    width: Math.min(100, ((w + padding * 2) / vw) * 100),
                    height: Math.min(100, ((h * 1.5) / vh) * 100), // 1.5x line height for safety
                    text: item.str
                });
            }
        });
    } catch (e) {
        console.warn(`Error searching page ${i}`, e);
    }
    
    if (onProgress) onProgress((i / pdf.numPages) * 100);
  }
  
  return results;
};
