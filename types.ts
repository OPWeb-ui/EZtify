

export type AppMode = 'home' | 'image-to-pdf' | 'pdf-to-image' | 'compress-pdf' | 'merge-pdf' | 'split-pdf' | 'zip-files' | 'word-to-pdf' | 'pdf-viewer' | 'reorder-pdf';

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

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'undo' | 'success';
  duration?: number;
  action?: ToastAction;
}

export type CompressionLevel = 'normal' | 'strong';

export interface CompressionResult {
  id: string; // For mapping back to the source PdfFile
  originalFileName: string;
  originalSize: number;
  newSize: number;
  blob: Blob;
  fileName: string; // New filename
  status?: 'Success' | 'Failed';
}

export interface PdfFile {
  id: string;
  file: File;
}

export type SplitMode = 'organize' | 'numbers';

export interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'rectangle' | 'redact' | 'checkbox' | 'signature' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  fontSize?: number;
  imageData?: string;
}

export interface PdfPage {
  id: string;
  pageIndex: number; // 0-based index from original file
  previewUrl: string;
  selected: boolean;
  type?: 'original' | 'blank';
  rotation?: number;
  annotations?: Annotation[];
}

export interface ZipFile {
  id: string;
  file: File;
}

export type ZipCompressionLevel = 'STORE' | 'DEFLATE';

export interface PageNumberConfig {
  position: 'top' | 'bottom';
  alignment: 'left' | 'center' | 'right';
  startFrom: number;
  fontSize: number;
  fontFamily: string;
  offsetX: number;
  offsetY: number;
}