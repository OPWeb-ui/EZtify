
import { loadPdfJs } from './pdfProvider';
import JSZip from 'jszip';

// XML templates for a minimal DOCX file
const contentTypesXML = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const relsXML = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const documentXMLTemplate = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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


export const convertPdfToWord = async (
  file: File,
  onProgress?: (percent: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<Blob> => {

    onStatusUpdate?.('Reading PDF...');
    if (onProgress) onProgress(10);

    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    if (onProgress) onProgress(30);
    onStatusUpdate?.('Extracting text...');
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n'; // Add space between pages
        if (onProgress) onProgress(30 + Math.round((i / pdf.numPages) * 40));
    }

    onStatusUpdate?.('Building DOCX file...');

    const paragraphs = fullText.split('\n').filter(p => p.trim() !== '');
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
    onStatusUpdate?.('Finalizing...');

    const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    if (onProgress) onProgress(100);

    return blob;
};
