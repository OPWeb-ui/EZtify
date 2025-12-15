import { loadPdfJs } from './pdfProvider';
import JSZip from 'jszip';

// XML templates for a minimal DOCX file
const contentTypesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const documentXMLTemplate = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        __CONTENT__
    </w:body>
</w:document>`;

// Function to escape XML special characters
const escapeXml = (text: string) => {
    return text.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

const escapeHtml = (text: string) => {
    return text.replace(/[&<>"']/g, (c) => {
        switch (c) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return c;
        }
    });
};

export const extractHtmlFromPdf = async (
  file: File,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
    onStatusUpdate?.('Reading PDF...');
    if (onProgress) onProgress(10);

    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
        cMapPacked: true, 
    });
    const pdf = await loadingTask.promise;
    
    if (onProgress) onProgress(20);
    onStatusUpdate?.('Extracting text content...');
    
    let htmlOutput = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let pageText = '';
        let lastY = -1;
        
        for (const item of textContent.items as any[]) {
            if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 10) {
                pageText += '\n'; // New line if Y changes significantly
            } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
                pageText += ' ';
            }
            pageText += item.str;
            lastY = item.transform[5];
        }

        const paragraphs = pageText.split('\n')
            .filter(p => p.trim())
            .map(p => `<p style="margin-bottom: 1em;">${escapeHtml(p)}</p>`)
            .join('');
        
        htmlOutput += `<div class="pdf-page" style="margin-bottom: 30px; padding: 40px; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); min-height: 800px; color: black; font-family: serif;">
            ${paragraphs || '<p><i>(No text content detected on this page)</i></p>'}
        </div>`;
        
        if (onProgress) onProgress(20 + Math.round((i / pdf.numPages) * 50));
    }
    
    return htmlOutput;
};

export const generateDocxFromHtml = async (
  htmlContent: string,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<Blob> => {
    onStatusUpdate?.('Generating DOCX structure...');
    if (onProgress) onProgress(80);

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Extract text from paragraphs we generated
    const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.textContent || '');
    
    const contentXML = paragraphs.map(p => 
        `<w:p><w:r><w:t>${escapeXml(p)}</w:t></w:r></w:p>`
    ).join('');
    
    const documentXML = documentXMLTemplate.replace('__CONTENT__', contentXML);

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypesXML.trim());
    const relsFolder = zip.folder('_rels');
    relsFolder?.file('.rels', relsXML.trim());
    const wordFolder = zip.folder('word');
    wordFolder?.file('document.xml', documentXML.trim());

    if (onProgress) onProgress(90);
    onStatusUpdate?.('Compressing file...');

    const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    if (onProgress) onProgress(100);

    return blob;
};

export const convertPdfToWord = async (
  file: File,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<Blob> => {
    const html = await extractHtmlFromPdf(file, (p) => {
        if (onProgress) onProgress(p * 0.7);
    }, onStatusUpdate);
    
    return generateDocxFromHtml(html, (p) => {
        if (onProgress) onProgress(70 + (p - 80) * 1.5);
    }, onStatusUpdate);
};
