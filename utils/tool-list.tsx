
import React from 'react';
import { 
  Layers, ImageIcon, Minimize2, FileOutput, Scissors, FolderArchive, FileText, 
  Presentation, ListOrdered, RotateCw, Trash2, FileKey, ArrowLeftRight, Hash, Eraser, Palette, Code, FileCode
} from 'lucide-react';

export interface Tool {
    id: string;
    title: string;
    desc: string;
    icon: React.ReactElement;
    path: string;
    color: string;
}

export interface ToolCategory {
    category: string;
    tools: Tool[];
}

// Single source of truth for all implemented tools
export const toolCategories: ToolCategory[] = [
  {
    category: 'Convert to PDF',
    tools: [
      { id: 'image-to-pdf', title: 'Images to PDF', desc: 'Convert JPG, PNG, and WebP images to PDF.', icon: <Layers />, path: '/images-to-pdf', color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
      { id: 'word-to-pdf', title: 'Word to PDF', desc: 'Convert Word documents to PDF files.', icon: <FileText />, path: '/word-to-pdf', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
    ]
  },
  {
    category: 'Convert from PDF',
    tools: [
      { id: 'pdf-to-image', title: 'PDF to Images', desc: 'Extract pages as high-quality images.', icon: <ImageIcon />, path: '/pdf-to-images', color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
      { id: 'pdf-to-word', title: 'PDF to Word', desc: 'Convert PDFs to editable Word documents.', icon: <ArrowLeftRight />, path: '/pdf-to-word', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
      { id: 'pdf-to-pptx', title: 'PDF to PowerPoint', desc: 'Convert PDF slides to PowerPoint presentations.', icon: <Presentation />, path: '/pdf-to-pptx', color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
    ]
  },
  {
    category: 'Organize PDF',
    tools: [
      { id: 'merge-pdf', title: 'Merge PDF', desc: 'Combine multiple PDFs into one document.', icon: <FileOutput />, path: '/merge-pdf', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
      { id: 'split-pdf', title: 'Split PDF', desc: 'Extract specific pages from a PDF file.', icon: <Scissors />, path: '/split-pdf', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
      { id: 'reorder-pdf', title: 'Reorder Pages', desc: 'Change the order of pages in your PDF.', icon: <ListOrdered />, path: '/reorder-pdf', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
      { id: 'rotate-pdf', title: 'Rotate PDF', desc: 'Rotate PDF pages permanently.', icon: <RotateCw />, path: '/rotate-pdf', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
      { id: 'delete-pdf-pages', title: 'Delete Pages', desc: 'Remove unwanted pages from your PDF.', icon: <Trash2 />, path: '/delete-pdf-pages', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
    ]
  },
  {
    category: 'Optimize & Edit',
    tools: [
      { id: 'compress-pdf', title: 'Compress PDF', desc: 'Reduce file size while maintaining quality.', icon: <Minimize2 />, path: '/compress-pdf', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
      { id: 'grayscale-pdf', title: 'Grayscale PDF', desc: 'Convert PDF pages to black and white.', icon: <Palette />, path: '/grayscale-pdf', color: 'text-slate-600 bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200' },
      { id: 'add-page-numbers', title: 'Page Numbers', desc: 'Add page numbers to your document.', icon: <Hash />, path: '/add-page-numbers', color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' },
    ]
  },
  {
    category: 'Security',
    tools: [
      { id: 'redact-pdf', title: 'Redact PDF', desc: 'Permanently hide sensitive information.', icon: <Eraser />, path: '/redact-pdf', color: 'text-slate-600 bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200' },
      { id: 'unlock-pdf', title: 'Unlock PDF', desc: 'Remove passwords from protected PDFs.', icon: <FileKey />, path: '/unlock-pdf', color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30' },
    ]
  },
  {
    category: 'Developer Tools',
    tools: [
      { id: 'code-editor', title: 'Code Editor', desc: 'Edit code, JSON, and text with syntax highlighting.', icon: <Code />, path: '/code-editor', color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30' },
    ]
  },
  {
    category: 'File Utilities',
    tools: [
      { id: 'zip-files', title: 'Zip Files', desc: 'Create encrypted ZIP archives locally.', icon: <FolderArchive />, path: '/zip-it', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
    ]
  },
];

// Flattened list for easier searching
export const allTools = toolCategories.flatMap(category => category.tools);
