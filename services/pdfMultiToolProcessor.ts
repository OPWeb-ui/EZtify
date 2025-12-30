
import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import { WorkspacePage, WorkspaceNumberingConfig, ColorMode, WatermarkConfig } from '../types';
import JSZip from 'jszip';
import { loadPdfJs } from './pdfProvider';

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

// Helper to convert hex to rgb
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return rgb(0, 0, 0);
    return rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    );
};

const applyWatermark = async (
    page: any,
    doc: PDFDocument,
    config: WatermarkConfig
) => {
    const { width, height } = page.getSize();
    const { type, text, image, opacity, rotation, scale, position, color, fontSize } = config;

    const drawItem = async (x: number, y: number) => {
        if (type === 'text' && text) {
            const helveticaFont = await doc.embedFont(StandardFonts.HelveticaBold);
            const size = (fontSize || 48) * scale;
            const textWidth = helveticaFont.widthOfTextAtSize(text, size);
            const textHeight = helveticaFont.heightAtSize(size);
            
            // Adjust coordinates to center the text at x, y
            page.drawText(text, {
                x: x - textWidth / 2,
                y: y - textHeight / 2,
                size: size,
                font: helveticaFont,
                color: color ? hexToRgb(color) : rgb(0.5, 0.5, 0.5),
                opacity: opacity,
                rotate: degrees(rotation),
            });
        } else if (type === 'image' && image) {
            try {
                let embeddedImage;
                if (image.startsWith('data:image/png')) {
                    embeddedImage = await doc.embedPng(image);
                } else {
                    embeddedImage = await doc.embedJpg(image);
                }
                const imgDims = embeddedImage.scale(scale);
                
                page.drawImage(embeddedImage, {
                    x: x - imgDims.width / 2,
                    y: y - imgDims.height / 2,
                    width: imgDims.width,
                    height: imgDims.height,
                    opacity: opacity,
                    rotate: degrees(rotation),
                });
            } catch (e) {
                console.error("Failed to embed watermark image", e);
            }
        }
    };

    if (position === 'tiled') {
        const rows = 3;
        const cols = 3;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = (width / cols) * i + (width / cols) / 2;
                const y = (height / rows) * j + (height / rows) / 2;
                await drawItem(x, y);
            }
        }
    } else {
        let x = width / 2;
        let y = height / 2;
        const margin = 50;

        switch (position) {
            case 'top-left': x = margin; y = height - margin; break;
            case 'top-right': x = width - margin; y = height - margin; break;
            case 'bottom-left': x = margin; y = margin; break;
            case 'bottom-right': x = width - margin; y = margin; break;
            case 'center': default: break;
        }
        await drawItem(x, y);
    }
};

const applyPageNumber = async (
    doc: PDFDocument,
    pageIndexInSequence: number,
    totalSequenceCount: number,
    config: WorkspaceNumberingConfig,
    isPageInTarget: boolean
) => {
    if (!config.enabled || !isPageInTarget) return;

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const page = pages[pages.length - 1]; // Current page just added
    const { width, height } = page.getSize();
    
    // Calculate what number to show
    const pageNumText = (config.startFrom + pageIndexInSequence).toString();
    const fontSize = config.fontSize;
    const textWidth = font.widthOfTextAtSize(pageNumText, fontSize);
    
    // Automatic margin enforcement
    const margin = 20;
    const availWidth = width - (margin * 2) - textWidth;
    const availHeight = height - (margin * 2) - fontSize;

    // Calculate absolute PDF coordinates (0,0 is bottom-left)
    const x = margin + (config.hPos / 100) * availWidth;
    
    // vPos: 0 is Top, 100 is Bottom. 
    // PDF Y: height - margin - fontSize is Top. margin is Bottom.
    const y = (height - margin - fontSize) - (config.vPos / 100) * availHeight;

    page.drawText(pageNumText, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
    });
};

/**
 * Helper to render a page to a filtered JPEG
 */
const renderFilteredPage = async (
    file: File,
    pageIndex: number,
    mode: ColorMode
): Promise<{ data: string; width: number; height: number }> => {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Canvas context failed");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Map internal ColorMode to CSS filters
    const filterMap: Record<ColorMode, string> = {
        original: 'none',
        grayscale: 'grayscale(100%)',
        bw: 'grayscale(100%) contrast(1000%)',
        invert: 'invert(100%)',
        sepia: 'sepia(100%)',
        contrast: 'contrast(150%) brightness(110%)',
        eco: 'grayscale(100%) brightness(120%) contrast(110%)',
        warm: 'sepia(35%) brightness(105%)',
        cool: 'hue-rotate(180deg) saturate(70%) brightness(105%)'
    };

    ctx.filter = filterMap[mode] || 'none';
    await page.render({ canvasContext: ctx, viewport }).promise;

    return {
        data: canvas.toDataURL('image/jpeg', 0.85),
        width: viewport.width,
        height: viewport.height
    };
};

// Main function to generate the final PDF from the editor state
export const generateWorkspacePdf = async (
    pages: WorkspacePage[],
    sourceFiles: Map<string, File>,
    numberingConfig: WorkspaceNumberingConfig,
    onProgress?: (percent: number) => void,
    onStatusUpdate?: (status: string) => void
): Promise<Blob> => {
    const newPdf = await PDFDocument.create();
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
        const pageData = pages[i];
        if (onProgress) onProgress(Math.round((i / totalPages) * 100));
        onStatusUpdate?.(`Processing page ${i + 1}/${totalPages}...`);

        let currentPageInPdf;

        if (pageData.type === 'blank') {
            currentPageInPdf = newPdf.addPage([595.28, 841.89]);
        } else {
            const sourceFile = sourceFiles.get(pageData.sourceFileId);
            if (sourceFile) {
                // Determine effective rotation (accumulated)
                // If crop is present, we reset rotation logic because crop is defined on unrotated page
                const isCropped = !!pageData.crop;
                
                const needsFilter = pageData.colorMode && pageData.colorMode !== 'original';
                
                if (needsFilter) {
                    const { data, width, height } = await renderFilteredPage(sourceFile, pageData.sourcePageIndex, pageData.colorMode!);
                    const image = await newPdf.embedJpg(data);
                    
                    // If cropped, we draw only a subset of the image
                    if (isCropped && pageData.crop) {
                        const crop = pageData.crop;
                        // Calculate crop in pixels (relative to full image)
                        const cx = (crop.x / 100) * width;
                        const cy = (crop.y / 100) * height;
                        const cw = (crop.width / 100) * width;
                        const ch = (crop.height / 100) * height;
                        
                        // Add page with crop dimensions
                        // Scale down to points (0.75 roughly, 72/96)
                        const ptsScale = 0.72; // Standard approx
                        const page = newPdf.addPage([cw * ptsScale, ch * ptsScale]);
                        
                        // Draw image shifted so the crop area is at 0,0 of page
                        page.drawImage(image, { 
                            x: -cx * ptsScale, 
                            y: -(height - cy - ch) * ptsScale, // PDF y is bottom-up
                            width: width * ptsScale, 
                            height: height * ptsScale 
                        });
                        
                        // Apply rotation on top of crop
                        if (pageData.rotation !== 0) {
                            page.setRotation(degrees(pageData.rotation));
                        }
                        currentPageInPdf = page;
                    } else {
                        const page = newPdf.addPage([width * 0.72, height * 0.72]); 
                        page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
                        currentPageInPdf = page;
                    }
                } else {
                    // Standard PDF Page Copying (Vectors preserved)
                    const sourcePdf = await loadAndCachePdf(pageData.sourceFileId, sourceFile);
                    const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageData.sourcePageIndex]);
                    
                    if (isCropped && pageData.crop) {
                        const { x, y, width, height } = copiedPage.getMediaBox();
                        const crop = pageData.crop;
                        
                        // Calculate new CropBox
                        // PDF Coords: Origin Bottom-Left.
                        // CropData: Origin Top-Left (percentages).
                        const cropX = x + (crop.x / 100) * width;
                        const cropW = (crop.width / 100) * width;
                        const cropH = (crop.height / 100) * height;
                        const cropY = (y + height) - ((crop.y / 100) * height) - cropH;
                        
                        copiedPage.setCropBox(cropX, cropY, cropW, cropH);
                        
                        // If user rotated visually, we apply rotation to the cropped page
                        // Since we forced "Reset Rotation" during crop UI, the crop box is relative to 0-deg page.
                        // So we can just set rotation now.
                        if (pageData.rotation !== 0) {
                             const currentRot = copiedPage.getRotation().angle;
                             copiedPage.setRotation(degrees(currentRot + pageData.rotation));
                        }
                    } else {
                        const existingRotation = copiedPage.getRotation().angle;
                        const finalRotation = (existingRotation + pageData.rotation) % 360;
                        copiedPage.setRotation(degrees(finalRotation));
                    }
                    
                    currentPageInPdf = newPdf.addPage(copiedPage);
                }
            }
        }

        // Apply Watermark
        if (currentPageInPdf && pageData.watermark) {
            await applyWatermark(currentPageInPdf, newPdf, pageData.watermark);
        }

        // Apply numbering
        const isTarget = numberingConfig.enabled && (numberingConfig.applyTo === 'all' || (numberingConfig.applyTo === 'selected' && pageData.selected));
        if (isTarget) {
            await applyPageNumber(newPdf, i, totalPages, numberingConfig, true);
        }
    }
    
    onStatusUpdate?.('Finalizing PDF...');
    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
};

// Function to download pages as separate files
export const generateSplitPdfZip = async (
    pages: WorkspacePage[],
    sourceFiles: Map<string, File>,
    numberingConfig: WorkspaceNumberingConfig,
    onProgress?: (percent: number) => void,
    onStatusUpdate?: (status: string) => void
): Promise<Blob> => {
    const zip = new JSZip();
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
        const pageData = pages[i];
        onStatusUpdate?.(`Exporting page ${i + 1}/${totalPages}...`);
        if (onProgress) onProgress(Math.round((i / totalPages) * 100));
        
        const newPdf = await PDFDocument.create();
        let currentPageInPdf;
        
        if (pageData.type === 'blank') {
            currentPageInPdf = newPdf.addPage();
        } else {
            const sourceFile = sourceFiles.get(pageData.sourceFileId);
            if (sourceFile) {
                // Reuse logic from generateWorkspacePdf
                // Simplified for brevity - assumes direct copy or image embed
                const sourcePdf = await loadAndCachePdf(pageData.sourceFileId, sourceFile);
                const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageData.sourcePageIndex]);
                
                if (pageData.crop) {
                    const { x, y, width, height } = copiedPage.getMediaBox();
                    const crop = pageData.crop;
                    const cropX = x + (crop.x / 100) * width;
                    const cropW = (crop.width / 100) * width;
                    const cropH = (crop.height / 100) * height;
                    const cropY = (y + height) - ((crop.y / 100) * height) - cropH;
                    copiedPage.setCropBox(cropX, cropY, cropW, cropH);
                }
                
                if (pageData.rotation !== 0) {
                     const currentRot = copiedPage.getRotation().angle;
                     copiedPage.setRotation(degrees(currentRot + pageData.rotation));
                }
                
                currentPageInPdf = newPdf.addPage(copiedPage);
            }
        }

        // Apply Watermark
        if (currentPageInPdf && pageData.watermark) {
            await applyWatermark(currentPageInPdf, newPdf, pageData.watermark);
        }

        const isTarget = numberingConfig.enabled && (numberingConfig.applyTo === 'all' || (numberingConfig.applyTo === 'selected' && pageData.selected));
        if (isTarget) {
            await applyPageNumber(newPdf, i, totalPages, numberingConfig, true);
        }
        
        const pdfBytes = await newPdf.save();
        zip.file(`page_${String(i + 1).padStart(3, '0')}.pdf`, pdfBytes);
    }
    
    onStatusUpdate?.('Creating ZIP archive...');
    return await zip.generateAsync({ type: "blob" });
};

export const clearPdfCache = () => {
    pdfCache.clear();
};