export type AppMode = 'image-to-pdf' | 'pdf-to-image' | 'compress-pdf' | 'merge-pdf' | 'split-pdf';

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

export type PageSize = 'a4' | 'letter' | 'auto';
export type Orientation = 'portrait' | 'landscape';
export type FitMode = 'contain' | 'cover' | 'fill';

export interface PdfConfig {
  pageSize: PageSize;
  orientation: Orientation;
  fitMode: FitMode;
  margin: number; // in mm
  quality: number; // 0.1 to 1.0
}

export type ImageFormat = 'png' | 'jpeg';

export interface ExportConfig {
  format: ImageFormat;
  quality: number; // 0.1 to 1.0 (only for jpeg)
  scale: number; // 1 = 72dpi equivalent, 2 = 144dpi, etc.
}

export interface AppState {
  mode: AppMode;
  images: UploadedImage[];
  activeImageId: string | null;
  config: PdfConfig;
  exportConfig: ExportConfig;
  isGenerating: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'error';
  duration?: number;
}

export type CompressionLevel = 'normal' | 'strong';

export interface CompressionResult {
  originalSize: number;
  newSize: number;
  blob: Blob;
  fileName: string;
}

export interface PdfFile {
  id: string;
  file: File;
}

export type SplitMode = 'extract' | 'separate';

export interface PdfPage {
  id: string;
  pageIndex: number; // 0-based index from original PDF
  previewUrl: string;
  selected: boolean;
}