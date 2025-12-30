
import React from 'react';
import { 
  Layers, Package, FileImage, Image as ImageIcon, Minimize2, FileArchive, Presentation, Pencil, Info
} from 'lucide-react';

export interface Tool {
    id: string;
    title: string;
    desc: string;
    icon: React.ReactElement;
    path: string;
    accentColor: string; 
}

export interface ToolCategory {
    category: string;
    tools: Tool[];
}

const BRAND_BLACK = '#111111'; 
const BRAND_LIME = '#84CC16';

export const toolCategories: ToolCategory[] = [
  {
    category: 'Workspace',
    tools: [
      { id: 'pdf-workspace', title: 'PDF Workspace', desc: 'Merge, split, rotate, delete, and organize pages in one unified interface.', icon: <Layers />, path: '/pdf-workspace', accentColor: BRAND_BLACK },
    ]
  },
  {
    category: 'Converters',
    tools: [
      { id: 'image-to-pdf', title: 'Image to PDF', desc: 'Convert and combine images into a professional PDF document.', icon: <FileImage />, path: '/image-to-pdf', accentColor: BRAND_LIME }, 
      { id: 'pdf-to-image', title: 'PDF to Image', desc: 'Extract pages from PDF documents as high-quality images.', icon: <ImageIcon />, path: '/pdf-to-image', accentColor: BRAND_BLACK },
      { id: 'pdf-to-zip', title: 'PDF to ZIP', desc: 'Batch convert PDF pages to images and download as a structured ZIP archive.', icon: <FileArchive />, path: '/pdf-to-zip', accentColor: BRAND_BLACK },
      { id: 'pdf-to-pptx', title: 'PDF to PPTX', desc: 'Convert PDF documents into PowerPoint presentation slides.', icon: <Presentation />, path: '/pdf-to-pptx', accentColor: BRAND_BLACK },
    ]
  },
  {
    category: 'Utilities',
    tools: [
      { id: 'compress-pdf', title: 'Compress PDF', desc: 'Reduce PDF file size efficiently while maintaining readability.', icon: <Minimize2 />, path: '/compress-pdf', accentColor: BRAND_BLACK },
      { id: 'batch-rename-pdf', title: 'Batch Rename', desc: 'Rename multiple PDF files at once with custom rules and sequencing.', icon: <Pencil />, path: '/batch-rename-pdf', accentColor: BRAND_BLACK },
      { id: 'edit-pdf-metadata', title: 'Metadata Editor', desc: 'Read and update PDF properties like title, author, and keywords.', icon: <Info />, path: '/edit-pdf-metadata', accentColor: BRAND_BLACK },
    ]
  },
];

export const allTools = toolCategories.flatMap(category => category.tools);
