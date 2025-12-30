
export type AppMode = 
  | 'home' 
  | 'pdf-workspace' 
  | 'pdf-to-zip'
  | 'image-to-pdf'
  | 'pdf-to-image'
  | 'pdf-to-pptx'
  | 'pptx-to-pdf'
  | 'unlock-pdf'
  | 'grayscale-pdf'
  | 'add-page-numbers'
  | 'code-editor';

export type PageSize = 'a4' | 'letter' | 'auto';
export type Orientation = 'portrait' | 'landscape';
export type FitMode = 'contain' | 'cover' | 'fill';

export interface PdfConfig {
  pageSize: PageSize;
  orientation: Orientation;
  fitMode: FitMode;
  margin: number;
  quality: number;
}

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  crop?: CropData;
  pdfConfig?: PdfConfig;
}

export interface AppState {
  mode: AppMode;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'undo' | 'success' | 'info';
  duration?: number;
  action?: ToastAction;
}

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

export interface CropData {
  x: number;      // percentage
  y: number;      // percentage
  width: number;  // percentage
  height: number; // percentage
}

export interface PageNumberConfig {
  position: 'top' | 'bottom';
  alignment: 'left' | 'center' | 'right';
  startFrom: number;
  fontSize: number;
  fontFamily: string;
  offsetX: number;
  offsetY: number;
}

// --- NEW FOR PDF WORKSPACE ---
export type ColorMode = 'original' | 'grayscale' | 'bw' | 'invert' | 'sepia' | 'contrast' | 'eco' | 'warm' | 'cool';

export type WatermarkType = 'text' | 'image';
export type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tiled';

export interface WatermarkConfig {
  type: WatermarkType;
  text?: string;
  image?: string; // Data URL
  opacity: number; // 0-1
  rotation: number; // degrees
  scale: number; // 0.1 - 5 (Font Scale or Image Scale)
  position: WatermarkPosition;
  color?: string;
  fontSize?: number;
}

export interface WorkspacePage {
  id: string; // Unique ID for React key/DND
  sourceFileId: string; // ID of the original file, or 'blank'
  sourcePageIndex: number; // Original 0-based index. -1 for blank pages.
  previewUrl: string; // data:url for the thumbnail
  rotation: 0 | 90 | 180 | 270;
  type: 'original' | 'blank';
  width: number;
  height: number;
  selected: boolean;
  colorMode?: ColorMode;
  crop?: CropData;
  watermark?: WatermarkConfig;
}

export interface WorkspaceNumberingConfig {
  enabled: boolean;
  hPos: number; // 0 (Left) to 100 (Right)
  vPos: number; // 0 (Top) to 100 (Bottom)
  startFrom: number;
  fontSize: number;
  applyTo: 'all' | 'selected';
}

export interface PdfPage {
  id: string;
  pageIndex: number;
  previewUrl: string;
  selected: boolean;
  width: number;
  height: number;
  rotation?: number;
  annotations?: Annotation[];
  crop?: CropData;
  type?: 'original' | 'blank';
}

export interface ExtendedPdfPage {
  sourceFileId: string;
  pageIndex: number;
}

export interface ZipFile {
  id: string;
  file: File;
}

export type ZipCompressionLevel = 'STORE' | 'DEFLATE';

export type ImageFormat = 'jpeg' | 'png';

export interface ExportConfig {
  format: ImageFormat;
  scale: number;
  quality: number;
}

export interface PdfFile {
  id: string;
  file: File;
  previewUrl?: string; 
}

export interface CompressionResult {
  id: string;
  originalFileName: string;
  originalSize: number;
  newSize: number;
  blob: Blob;
  fileName: string;
  status?: string;
  savingsPercent: number;
}