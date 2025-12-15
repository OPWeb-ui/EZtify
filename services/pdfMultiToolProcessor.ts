
import { PDFDocument, degrees } from 'pdf-lib';
import { MultiToolPage } from '../types';
import JSZip from 'jszip';

// Helper to manage a cache of loaded PDF documents to avoid reloading
const pdfCache = new Map<string, PDFDocument>();

const loadAndCachePdf = async (fileId: string, file: File): Promise<PDFDocument> => {
    if (pdfCache.has(fileId)) {
        return pdfCache.get(fileId)!;
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    pdfCache.set(fileId, pdfDoc);
    return pdfDoc;
};

// Main function to generate the final PDF from the editor state
export const generateMultiToolPdf = async (
    pages: MultiToolPage[],
    sourceFiles: Map<string, File>,
    onProgress?: (percent: number) => void
): Promise<Blob> => {
    const newPdf = await PDFDocument.create();
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
        const pageData = pages[i];
        if (onProgress) onProgress(Math.round((i / totalPages) * 100));

        if (pageData.type === 'blank') {
            // A4 Portrait dimensions: [595.28, 841.89]
            newPdf.addPage([595.28, 841.89]);
        } else {
            const sourceFile = sourceFiles.get(pageData.sourceFileId);
            if (sourceFile) {
                const sourcePdf = await loadAndCachePdf(pageData.sourceFileId, sourceFile);
                const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageData.sourcePageIndex]);
                copiedPage.setRotation(degrees(pageData.rotation));
                newPdf.addPage(copiedPage);
            }
        }
    }

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
};

// Function to download pages as separate files
export const generateSplitPdfZip = async (
    pages: MultiToolPage[],
    sourceFiles: Map<string, File>,
    onProgress?: (percent: number) => void
): Promise<Blob> => {
    const zip = new JSZip();
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
        const pageData = pages[i];
        if (onProgress) onProgress(Math.round((i / totalPages) * 100));
        
        const newPdf = await PDFDocument.create();
        
        if (pageData.type === 'blank') {
            newPdf.addPage();
        } else {
            const sourceFile = sourceFiles.get(pageData.sourceFileId);
            if (sourceFile) {
                const sourcePdf = await loadAndCachePdf(pageData.sourceFileId, sourceFile);
                const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageData.sourcePageIndex]);
                copiedPage.setRotation(degrees(pageData.rotation));
                newPdf.addPage(copiedPage);
            }
        }
        
        const pdfBytes = await newPdf.save();
        zip.file(`page_${String(i + 1).padStart(3, '0')}.pdf`, pdfBytes);
    }
    
    return await zip.generateAsync({ type: "blob" });
};

// Function to clear the in-memory cache when the tool is reset
export const clearPdfCache = () => {
    pdfCache.clear();
};
