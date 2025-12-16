
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
    accentColor: string; // Specific HEX color for this tool
}

export interface ToolCategory {
    category: string;
    tools: Tool[];
}

// Nothing OS Inspired Palette
const ND_RED = '#D71921';
const ND_ORANGE = '#F57C00';
const ND_YELLOW = '#FBC02D';
const ND_GREEN = '#388E3C';
const ND_BLUE = '#1976D2';
const ND_PURPLE = '#7B1FA2';
const ND_MONO = '#737373'; // Neutral Grey for specific utilities

// Single source of truth for all implemented tools
export const toolCategories: ToolCategory[] = [
  {
    category: 'Power Tools',
    tools: [
      { id: 'pdf-multi-tool', title: 'PDF Multi-Tool', desc: 'Merge, split, rotate, and organize PDF pages in one unified interface.', icon: <Wrench />, path: '/pdf-multi-tool', accentColor: ND_RED },
    ]
  },
  {
    category: 'Convert to PDF',
    tools: [
      { id: 'image-to-pdf', title: 'Images to PDF', desc: 'Compile raster graphics into a single document.', icon: <FileStack />, path: '/images-to-pdf', accentColor: ND_YELLOW },
      { id: 'word-to-pdf', title: 'Word to PDF', desc: 'Render DOCX buffers to portable document format.', icon: <FileText />, path: '/word-to-pdf', accentColor: ND_BLUE },
      { id: 'pptx-to-pdf', title: 'PPTX to PDF', desc: 'Serialize slides to static PDF pages.', icon: <Presentation />, path: '/pptx-to-pdf', accentColor: ND_ORANGE },
    ]
  },
  {
    category: 'Convert from PDF',
    tools: [
      { id: 'pdf-to-image', title: 'PDF to Images', desc: 'Rasterize pages to high-res JPG/PNG.', icon: <Image />, path: '/pdf-to-images', accentColor: ND_YELLOW },
      { id: 'pdf-to-word', title: 'PDF to Word', desc: 'Extract text streams to DOCX format.', icon: <FileType2 />, path: '/pdf-to-word', accentColor: ND_BLUE },
      { id: 'pdf-to-pptx', title: 'PDF to PPTX', desc: 'Convert document pages to presentation slides.', icon: <Presentation />, path: '/pdf-to-pptx', accentColor: ND_ORANGE },
    ]
  },
  {
    category: 'Organize Pages',
    tools: [
      { id: 'merge-pdf', title: 'Merge PDF', desc: 'Combine multiple documents into one file.', icon: <GitMerge />, path: '/merge-pdf', accentColor: ND_RED },
      { id: 'split-pdf', title: 'Split PDF', desc: 'Extract specific pages into a new file.', icon: <GitFork />, path: '/split-pdf', accentColor: ND_RED },
      { id: 'reorder-pdf', title: 'Reorder Pages', desc: 'Arrange pages by dragging and dropping.', icon: <ListOrdered />, path: '/reorder-pdf', accentColor: ND_RED },
      { id: 'rotate-pdf', title: 'Rotate PDF', desc: 'Change page orientation permanently.', icon: <RotateCw />, path: '/rotate-pdf', accentColor: ND_RED },
      { id: 'delete-pdf-pages', title: 'Delete Pages', desc: 'Select and remove unwanted pages.', icon: <FileMinus />, path: '/delete-pdf-pages', accentColor: ND_RED },
    ]
  },
  {
    category: 'Optimize & Edit',
    tools: [
      { id: 'compress-pdf', title: 'Compress PDF', desc: 'Optimize stream size and downsample images.', icon: <Minimize2 />, path: '/compress-pdf', accentColor: ND_GREEN },
      { id: 'grayscale-pdf', title: 'Grayscale PDF', desc: 'Remove color channels (1-bit/8-bit conversion).', icon: <ScanLine />, path: '/grayscale-pdf', accentColor: ND_MONO },
      { id: 'add-page-numbers', title: 'Page Numbers', desc: 'Inject sequential numbering markers.', icon: <Hash />, path: '/add-page-numbers', accentColor: ND_PURPLE },
      { id: 'crop-pdf', title: 'Crop PDF', desc: 'Visually select an area and crop PDF pages.', icon: <Crop />, path: '/crop-pdf', accentColor: ND_GREEN },
    ]
  },
  {
    category: 'Security',
    tools: [
      { id: 'redact-pdf', title: 'Redact PDF', desc: 'Permanently mask sensitive data blocks.', icon: <EyeOff />, path: '/redact-pdf', accentColor: ND_MONO },
      { id: 'unlock-pdf', title: 'Unlock PDF', desc: 'Decrypt secured documents.', icon: <UnlockKeyhole />, path: '/unlock-pdf', accentColor: ND_GREEN },
    ]
  },
  {
    category: 'Developer Tools',
    tools: [
      { id: 'code-editor', title: 'Code Editor', desc: 'IDE-lite for syntax editing.', icon: <Terminal />, path: '/code-editor', accentColor: ND_MONO },
    ]
  },
  {
    category: 'File Utilities',
    tools: [
      { id: 'zip-files', title: 'Zip Files', desc: 'Archive and compress multiple file streams.', icon: <Package />, path: '/zip-it', accentColor: ND_YELLOW },
    ]
  },
];

// Flattened list for easier searching
export const allTools = toolCategories.flatMap(category => category.tools);
