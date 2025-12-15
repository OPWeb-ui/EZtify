
import React from 'react';
import { 
  FileStack, Image, Minimize2, GitMerge, GitFork, RotateCw, 
  FileMinus, UnlockKeyhole, FileText, Presentation, FileType2, 
  Hash, EyeOff, ScanLine, Terminal, Package, Wrench, ListOrdered, Crop
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
    category: 'Power Tools',
    tools: [
      { id: 'pdf-multi-tool', title: 'PDF Multi-Tool', desc: 'Merge, split, rotate, and organize PDF pages in one unified interface.', icon: <Wrench />, path: '/pdf-multi-tool', color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' },
    ]
  },
  {
    category: 'Convert to PDF',
    tools: [
      { id: 'image-to-pdf', title: 'Images to PDF', desc: 'Compile raster graphics into a single document.', icon: <FileStack />, path: '/images-to-pdf', color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
      { id: 'word-to-pdf', title: 'Word to PDF', desc: 'Render DOCX buffers to portable document format.', icon: <FileText />, path: '/word-to-pdf', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
      { id: 'pptx-to-pdf', title: 'PPTX to PDF', desc: 'Serialize slides to static PDF pages.', icon: <Presentation />, path: '/pptx-to-pdf', color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
    ]
  },
  {
    category: 'Convert from PDF',
    tools: [
      { id: 'pdf-to-image', title: 'PDF to Images', desc: 'Rasterize pages to high-res JPG/PNG.', icon: <Image />, path: '/pdf-to-images', color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
      { id: 'pdf-to-word', title: 'PDF to Word', desc: 'Extract text streams to DOCX format.', icon: <FileType2 />, path: '/pdf-to-word', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
      { id: 'pdf-to-pptx', title: 'PDF to PPTX', desc: 'Convert document pages to presentation slides.', icon: <Presentation />, path: '/pdf-to-pptx', color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
    ]
  },
  {
    category: 'Organize Pages',
    tools: [
      { id: 'merge-pdf', title: 'Merge PDF', desc: 'Combine multiple documents into one file.', icon: <GitMerge />, path: '/merge-pdf', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
      { id: 'split-pdf', title: 'Split PDF', desc: 'Extract specific pages into a new file.', icon: <GitFork />, path: '/split-pdf', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
      { id: 'reorder-pdf', title: 'Reorder Pages', desc: 'Arrange pages by dragging and dropping.', icon: <ListOrdered />, path: '/reorder-pdf', color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' },
      { id: 'rotate-pdf', title: 'Rotate PDF', desc: 'Change page orientation permanently.', icon: <RotateCw />, path: '/rotate-pdf', color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
      { id: 'delete-pdf-pages', title: 'Delete Pages', desc: 'Select and remove unwanted pages.', icon: <FileMinus />, path: '/delete-pdf-pages', color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30' },
    ]
  },
  {
    category: 'Optimize & Edit',
    tools: [
      { id: 'compress-pdf', title: 'Compress PDF', desc: 'Optimize stream size and downsample images.', icon: <Minimize2 />, path: '/compress-pdf', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
      { id: 'grayscale-pdf', title: 'Grayscale PDF', desc: 'Remove color channels (1-bit/8-bit conversion).', icon: <ScanLine />, path: '/grayscale-pdf', color: 'text-slate-600 bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200' },
      { id: 'add-page-numbers', title: 'Page Numbers', desc: 'Inject sequential numbering markers.', icon: <Hash />, path: '/add-page-numbers', color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' },
      { id: 'crop-pdf', title: 'Crop PDF', desc: 'Visually select an area and crop PDF pages.', icon: <Crop />, path: '/crop-pdf', color: 'text-lime-500 bg-lime-100 dark:bg-lime-900/30' },
    ]
  },
  {
    category: 'Security',
    tools: [
      { id: 'redact-pdf', title: 'Redact PDF', desc: 'Permanently mask sensitive data blocks.', icon: <EyeOff />, path: '/redact-pdf', color: 'text-slate-600 bg-slate-200 dark:bg-slate-700/50 dark:text-slate-200' },
      { id: 'unlock-pdf', title: 'Unlock PDF', desc: 'Decrypt secured documents.', icon: <UnlockKeyhole />, path: '/unlock-pdf', color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30' },
    ]
  },
  {
    category: 'Developer Tools',
    tools: [
      { id: 'code-editor', title: 'Code Editor', desc: 'IDE-lite for syntax editing.', icon: <Terminal />, path: '/code-editor', color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30' },
    ]
  },
  {
    category: 'File Utilities',
    tools: [
      { id: 'zip-files', title: 'Zip Files', desc: 'Archive and compress multiple file streams.', icon: <Package />, path: '/zip-it', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
    ]
  },
];

// Flattened list for easier searching
export const allTools = toolCategories.flatMap(category => category.tools);
