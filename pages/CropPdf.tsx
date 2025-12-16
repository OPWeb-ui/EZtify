
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLayoutContext } from '../components/Layout';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { PdfPage, CropData, UploadedImage } from '../types';
import { loadPdfPages } from '../services/pdfSplitter';
import { cropPdf } from '../services/pdfCropper';
import { Filmstrip } from '../components/Filmstrip';
import { ToolLandingLayout } from '../components/ToolLandingLayout';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Crop, Lock, Cpu, Settings, Layers, Download, Undo2, Loader2, 
  ZoomIn, ZoomOut, Copy, X, LayoutGrid, Check, Maximize, 
  Minimize, MousePointer2, Move, ArrowRight, RefreshCw, Wand2 
} from 'lucide-react';
import { buttonTap, techEase } from '../utils/animations';
import { FilmstripModal } from '../components/FilmstripModal';
import { Tooltip } from '../components/Tooltip';
import { useDropzone, FileRejection } from 'react-dropzone';
import { DragDropOverlay } from '../components/DragDropOverlay';

// --- CONSTANTS ---
const MIN_CROP_SIZE = 5; // Minimum 5%
const DEFAULT_INSET = 5; // Default 5% margin for "Smart" start
const FULL_PAGE_CROP: CropData = { x: 0, y: 0, width: 100, height: 100 };

const isEqual = (a: CropData, b: CropData) => 
  Math.abs(a.x - b.x) < 0.1 && 
  Math.abs(a.y - b.y) < 0.1 && 
  Math.abs(a.width - b.width) < 0.1 && 
  Math.abs(a.height - b.height) < 0.1;

// --- PREVIEW GENERATOR ---
const generateCroppedPreview = (sourceUrl: string, crop: CropData): Promise<{ url: string, width: number, height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const sx = (crop.x / 100) * img.width;
            const sy = (crop.y / 100) * img.height;
            const sw = (crop.width / 100) * img.width;
            const sh = (crop.height / 100) * img.height;
            
            canvas.width = sw;
            canvas.height = sh;
            const ctx = canvas.getContext('2d');
            if(!ctx) { reject("No context"); return; }
            
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve({ url: URL.createObjectURL(blob), width: sw, height: sh });
                } else {
                    reject("Blob creation failed");
                }
            }, 'image/jpeg', 0.95);
        };
        img.onerror = () => reject("Image load failed");
        img.src = sourceUrl;
    });
};

// --- CROP BOX COMPONENT ---
const CropBox = ({ 
    crop, 
    onCropChange, 
    parentRef 
}: { 
    crop: CropData; 
    onCropChange: (c: CropData) => void; 
    parentRef: React.RefObject<HTMLDivElement>;
}) => {
    const [interaction, setInteraction] = useState<{
        type: string;
        startX: number;
        startY: number;
        startCrop: CropData;
    } | null>(null);

    useEffect(() => {
        if (!interaction) return;

        const onMove = (e: PointerEvent) => {
            if (!parentRef.current) return;
            e.preventDefault(); // Critical: Prevent touch scrolling
            e.stopPropagation();

            const rect = parentRef.current.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            // Calculate exact delta from initial pointer down position
            // This prevents "jumps" caused by live layout recalculations
            const deltaX = ((e.clientX - interaction.startX) / rect.width) * 100;
            const deltaY = ((e.clientY - interaction.startY) / rect.height) * 100;

            let { x, y, width, height } = interaction.startCrop;
            const { type } = interaction;

            if (type === 'move') {
                x = Math.min(Math.max(0, x + deltaX), 100 - width);
                y = Math.min(Math.max(0, y + deltaY), 100 - height);
                
                // Snap center
                if (Math.abs((x + width/2) - 50) < 1) x = 50 - width/2;
                if (Math.abs((y + height/2) - 50) < 1) y = 50 - height/2;
            } else {
                if (type.includes('n')) {
                    const maxD = height - MIN_CROP_SIZE;
                    let d = Math.min(Math.max(deltaY, -interaction.startCrop.y), maxD);
                    y += d; height -= d;
                }
                if (type.includes('s')) {
                    const maxD = 100 - (y + height);
                    let d = Math.max(Math.min(deltaY, maxD), MIN_CROP_SIZE - interaction.startCrop.height);
                    height += d;
                }
                if (type.includes('w')) {
                    const maxD = width - MIN_CROP_SIZE;
                    let d = Math.min(Math.max(deltaX, -interaction.startCrop.x), maxD);
                    x += d; width -= d;
                }
                if (type.includes('e')) {
                    const maxD = 100 - (x + width);
                    let d = Math.max(Math.min(deltaX, maxD), MIN_CROP_SIZE - interaction.startCrop.width);
                    width += d;
                }
            }

            onCropChange({ x, y, width, height });
        };

        const onUp = () => setInteraction(null);
        
        // Robust event binding
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp); // Handle touch cancellations (alt-tab, call, etc)
        
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [interaction, parentRef, onCropChange]);

    const startDrag = (e: React.PointerEvent, type: string) => {
        // Stop default browser behavior (scroll/zoom) immediately
        e.preventDefault();
        e.stopPropagation();
        
        // Lock pointer to the element to track it even if it leaves the window
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        
        setInteraction({
            type,
            startX: e.clientX,
            startY: e.clientY,
            startCrop: { ...crop }
        });
    };

    // Visual Handle (Inner)
    const VISUAL_HANDLE = "w-4 h-4 bg-white border border-charcoal-400 rounded-full shadow-sm hover:scale-125 transition-transform pointer-events-none";
    
    // Hit Area (Outer - Invisible, larger for touch)
    // 48px (w-12) hit target centered on the corner (-top-6)
    const HIT_AREA = "absolute w-12 h-12 flex items-center justify-center z-30 touch-none";

    return (
        <div 
            className="absolute border-2 border-brand-purple z-10 box-content group touch-none"
            style={{
                left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%`,
                boxShadow: interaction ? '0 0 0 9999px rgba(0, 0, 0, 0.5)' : '0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 0 9999px rgba(0, 0, 0, 0.3)',
                cursor: 'move',
                touchAction: 'none' // Strict browser intervention prevention
            }}
            onPointerDown={(e) => startDrag(e, 'move')}
        >
            {/* Thirds Grid */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-0 group-hover:opacity-50 transition-opacity">
                {[...Array(9)].map((_, i) => <div key={i} className="border-r border-b border-white/30 last:border-0 [&:nth-child(3n)]:border-r-0 [&:nth-child(n+7)]:border-b-0" />)}
            </div>

            {/* Corner Handles with Expanded Hit Targets */}
            
            {/* Top Left */}
            <div className={`${HIT_AREA} -top-6 -left-6 cursor-nw-resize`} onPointerDown={(e) => startDrag(e, 'nw')}>
                <div className={VISUAL_HANDLE} />
            </div>

            {/* Top Right */}
            <div className={`${HIT_AREA} -top-6 -right-6 cursor-ne-resize`} onPointerDown={(e) => startDrag(e, 'ne')}>
                <div className={VISUAL_HANDLE} />
            </div>

            {/* Bottom Left */}
            <div className={`${HIT_AREA} -bottom-6 -left-6 cursor-sw-resize`} onPointerDown={(e) => startDrag(e, 'sw')}>
                <div className={VISUAL_HANDLE} />
            </div>

            {/* Bottom Right */}
            <div className={`${HIT_AREA} -bottom-6 -right-6 cursor-se-resize`} onPointerDown={(e) => startDrag(e, 'se')}>
                <div className={VISUAL_HANDLE} />
            </div>

            {/* Dimensions Label */}
            {interaction && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
                    {Math.round(crop.width)}% × {Math.round(crop.height)}%
                </div>
            )}
        </div>
    );
};

// --- MAIN PAGE ---
export const CropPdfPage: React.FC = () => {
    const { addToast, isMobile } = useLayoutContext();
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PdfPage[]>([]);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [zoom, setZoom] = useState(1);
    
    // Desktop layout refs
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

    // Mobile specific state
    const [isFilmstripModalOpen, setIsFilmstripModalOpen] = useState(false);

    // Initial Load
    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            addToast("Error", "Invalid file type.", "error");
            return;
        }
        if (acceptedFiles.length === 0) return;
        
        setIsProcessing(true);
        const f = acceptedFiles[0];
        
        try {
            const loadedPages = await loadPdfPages(f, undefined, undefined, { scale: 1.5 });
            
            // Initialize with "Ready to Crop" inset (90%)
            const initialCrop: CropData = { 
                x: DEFAULT_INSET, y: DEFAULT_INSET, 
                width: 100 - (DEFAULT_INSET*2), 
                height: 100 - (DEFAULT_INSET*2) 
            };

            const preparedPages = loadedPages.map(p => ({
                ...p,
                crop: initialCrop,
                appliedCrop: FULL_PAGE_CROP, // Nothing applied yet
                originalPreviewUrl: p.previewUrl,
                previousPreviewUrl: p.previewUrl, // For undo
                previousAppliedCrop: FULL_PAGE_CROP
            }));

            setFile(f);
            setPages(preparedPages);
            setActivePageId(preparedPages[0].id);
            setSelectedPageIds(new Set([preparedPages[0].id])); // Auto-select first
        } catch (e) {
            addToast("Error", "Failed to process PDF.", "error");
        } finally {
            setIsProcessing(false);
        }
    }, [addToast]);

    // --- MOBILE HINT ---
    useEffect(() => {
        if (isMobile && pages.length > 0) {
            const hasSeenHint = localStorage.getItem('eztify-desktop-hint-toast');
            if (!hasSeenHint) {
                const timer = setTimeout(() => {
                    addToast("Desktop Optimized", "For complex workflows, desktop offers more control.", "info");
                    localStorage.setItem('eztify-desktop-hint-toast', 'true');
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [isMobile, pages.length, addToast]);

    const { getRootProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        noClick: true,
        noKeyboard: true,
        disabled: isProcessing || isGenerating
    });

    // Canvas Resize Observer
    useEffect(() => {
        if (!canvasContainerRef.current) return;
        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setContainerSize({ w: width, h: height });
        });
        observer.observe(canvasContainerRef.current);
        return () => observer.disconnect();
    }, [file]);

    // Derived State
    const activePage = pages.find(p => p.id === activePageId) || null;
    
    // Zoom Logic
    const baseScale = useMemo(() => {
        if (!activePage?.width || !activePage?.height || containerSize.w === 0) return 1;
        const padding = 48;
        const availW = Math.max(0, containerSize.w - padding);
        const availH = Math.max(0, containerSize.h - padding);
        return Math.min(availW / activePage.width, availH / activePage.height);
    }, [activePage, containerSize]);

    const currentScale = baseScale * zoom;

    // Actions
    const handleCropChange = (newCrop: CropData) => {
        setPages(prev => prev.map(p => p.id === activePageId ? { ...p, crop: newCrop } : p));
    };

    const handleSelect = (id: string, event?: React.MouseEvent) => {
        setActivePageId(id);
        const multi = event?.shiftKey || event?.metaKey || event?.ctrlKey;
        setSelectedPageIds(prev => {
            const next = new Set(multi ? prev : []);
            if (multi && next.has(id)) next.delete(id);
            else next.add(id);
            // Always ensure active page is selected if singular click
            if (!multi) return new Set([id]); 
            return next.size === 0 ? new Set([id]) : next;
        });
    };

    const combineCrops = (parent: CropData, child: CropData) => ({
        x: parent.x + (child.x / 100 * parent.width),
        y: parent.y + (child.y / 100 * parent.height),
        width: (child.width / 100) * parent.width,
        height: (child.height / 100) * parent.height
    });

    const applyCropToPages = async (targetIds: Set<string>) => {
        if (!activePage) return;
        setIsProcessing(true);
        try {
            const cropRatio = activePage.crop!; // The visual percentage crop
            
            const newPages = await Promise.all(pages.map(async (p) => {
                if (!targetIds.has(p.id) || !p.originalPreviewUrl) return p;

                // Combine with previously applied crop to maintain history
                const currentGlobal = p.appliedCrop || FULL_PAGE_CROP;
                const newGlobal = combineCrops(currentGlobal, cropRatio);

                // Generate new visual preview
                const { url, width, height } = await generateCroppedPreview(p.originalPreviewUrl, newGlobal);

                return {
                    ...p,
                    previewUrl: url,
                    width, height,
                    previousPreviewUrl: p.previewUrl,
                    previousAppliedCrop: p.appliedCrop,
                    appliedCrop: newGlobal,
                    crop: { ...FULL_PAGE_CROP, x: DEFAULT_INSET, y: DEFAULT_INSET, width: 100-(DEFAULT_INSET*2), height: 100-(DEFAULT_INSET*2) } // Reset visual crop box
                };
            }));

            setPages(newPages);
            addToast("Success", `Cropped ${targetIds.size} page(s)`, "success");
        } catch (e) {
            addToast("Error", "Crop failed", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApply = () => applyCropToPages(new Set([activePageId!]));
    const handleApplySelected = () => applyCropToPages(selectedPageIds);
    const handleApplyAll = () => applyCropToPages(new Set(pages.map(p => p.id)));

    const handleUndo = () => {
        if (!activePage?.previousPreviewUrl) return;
        setPages(prev => prev.map(p => {
            if (selectedPageIds.has(p.id) && p.previousPreviewUrl) {
                return {
                    ...p,
                    previewUrl: p.previousPreviewUrl!,
                    appliedCrop: p.previousAppliedCrop!,
                    crop: { ...FULL_PAGE_CROP, x: DEFAULT_INSET, y: DEFAULT_INSET, width: 100-(DEFAULT_INSET*2), height: 100-(DEFAULT_INSET*2) }
                };
            }
            return p;
        }));
        addToast("Undo", "Reverted selected pages", "success");
    };

    const handleResetView = () => {
        setPages(prev => prev.map(p => selectedPageIds.has(p.id) ? { 
            ...p, 
            crop: { x: DEFAULT_INSET, y: DEFAULT_INSET, width: 100-(DEFAULT_INSET*2), height: 100-(DEFAULT_INSET*2) } 
        } : p));
    };

    const handleGenerate = async () => {
        if (!file) return;
        setIsGenerating(true);
        try {
            const blob = await cropPdf(file, pages);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cropped_${file.name}`;
            a.click();
            URL.revokeObjectURL(url);
            addToast("Success", "PDF Saved", "success");
        } catch (e) {
            addToast("Error", "Save failed", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    // Landing
    if (!file) {
        return (
            <ToolLandingLayout
                title="Crop PDF"
                description="Visually crop PDF pages. Apply cuts individually or batch process entire documents."
                icon={<Crop />}
                onDrop={onDrop}
                accept={{ 'application/pdf': ['.pdf'] }}
                isProcessing={isProcessing}
                accentColor="text-lime-500"
                specs={[
                    { label: "Mode", value: "Visual", icon: <Layers /> },
                    { label: "Privacy", value: "Local", icon: <Lock /> },
                    { label: "Engine", value: "PDF-Lib", icon: <Cpu /> },
                    { label: "Batch", value: "Multi-Page", icon: <Copy /> },
                ]}
                tip="Select multiple pages (Shift+Click) to apply the same crop region instantly."
            />
        );
    }

    // --- MOBILE LAYOUT ---
    if (isMobile) {
        return (
            <div className="flex flex-col flex-1 min-h-0 bg-slate-100 dark:bg-charcoal-950 overflow-hidden relative" {...getRootProps()}>
                <PageReadyTracker />
                <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" variant="green" />
                <div ref={canvasContainerRef} className="flex-1 min-h-0 grid place-items-center relative p-4">
                    {activePage && activePage.width && activePage.height && (
                        <div 
                            className="relative bg-white shadow-xl ring-1 ring-slate-200 dark:ring-charcoal-700" 
                            style={{ width: activePage.width * currentScale, height: activePage.height * currentScale }}
                            ref={imageContainerRef}
                        >
                            <img src={activePage.previewUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none select-none" draggable={false} />
                            <CropBox crop={activePage.crop!} onCropChange={handleCropChange} parentRef={imageContainerRef} />
                        </div>
                    )}
                    {isProcessing && <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-charcoal-950/50 backdrop-blur-sm"><Loader2 className="w-10 h-10 animate-spin text-brand-purple" /></div>}
                </div>
                
                <div className="shrink-0 h-16 bg-white dark:bg-charcoal-850 border-t border-slate-200 dark:border-charcoal-700 px-4 flex items-center justify-between z-40 shadow-inner gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
                    <div className="flex items-center shrink-0">
                        <motion.button whileTap={buttonTap} onClick={() => setIsFilmstripModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-slate-200 font-bold text-xs rounded-lg hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors">
                            <LayoutGrid size={14} /> Pages ({pages.length})
                        </motion.button>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <Tooltip content="Apply" side="top"><motion.button whileTap={buttonTap} onClick={handleApply} disabled={isProcessing} className="p-2.5 bg-brand-purple/10 text-brand-purple font-bold text-xs rounded-lg transition-colors disabled:opacity-50 border border-brand-purple/20"><Check size={16} /></motion.button></Tooltip>
                        <motion.button whileTap={buttonTap} onClick={handleGenerate} disabled={isGenerating || isProcessing} className="flex-1 relative overflow-hidden px-4 py-2.5 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900 font-mono font-bold text-xs uppercase tracking-wide rounded-lg shadow-lg shadow-brand-purple/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-brand-purple dark:hover:bg-slate-200">
                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} <span className="relative z-10">{isGenerating ? '...' : 'PDF'}</span>
                        </motion.button>
                    </div>
                </div>
                {isFilmstripModalOpen && <FilmstripModal isOpen={true} onClose={() => setIsFilmstripModalOpen(false)} title="Select Page"><Filmstrip images={pages.map(p => ({ id: p.id, file: file!, previewUrl: p.previewUrl, width: 0, height: 0, rotation: 0 }))} activeImageId={activePageId} onSelect={(id) => {setActivePageId(id); setIsFilmstripModalOpen(false);}} onReorder={()=>{}} onRemove={()=>{}} onRotate={()=>{}} isMobile={true} direction="vertical" showRemoveButton={false} showRotateButton={false} isReorderable={false} className="h-full" /></FilmstripModal>}
            </div>
        );
    }

    // --- DESKTOP LAYOUT (3-Pane) ---
    return (
        <div className="flex w-full h-full bg-slate-100 dark:bg-charcoal-950 font-sans overflow-hidden relative" {...getRootProps()}>
            <PageReadyTracker />
            <DragDropOverlay isDragActive={isDragActive} message="Drop to Replace PDF" variant="green" />
            
            {/* 1. LEFT: Filmstrip */}
            <div className="w-72 bg-white dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="h-12 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between px-4 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
                    <div className="flex items-center gap-2">
                        <Layers size={16} className="text-charcoal-400" />
                        <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Pages ({pages.length})</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-slate-50/30 dark:bg-charcoal-900">
                    <Filmstrip 
                        images={pages.map(p => ({ id: p.id, file: file!, previewUrl: p.previewUrl, width: 0, height: 0, rotation: 0 }))}
                        activeImageId={activePageId}
                        selectedImageIds={selectedPageIds}
                        onSelect={handleSelect}
                        onReorder={() => {}} onRemove={() => {}} onRotate={() => {}}
                        isMobile={false}
                        direction="vertical"
                        size="md"
                        showRemoveButton={false} showRotateButton={false} isReorderable={false}
                    />
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-charcoal-800 text-[10px] text-center font-mono text-charcoal-400">
                    Shift+Click to Multi-Select
                </div>
            </div>

            {/* 2. CENTER: Canvas */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-slate-100/50 dark:bg-black/20">
                {/* Canvas Toolbar */}
                <div className="h-12 border-b border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
                    <div className="flex items-center gap-4 text-xs font-mono text-charcoal-500 dark:text-charcoal-400">
                        <span className="font-bold text-charcoal-700 dark:text-charcoal-200">{file.name}</span>
                        <div className="w-px h-3 bg-slate-300 dark:bg-charcoal-700" />
                        <span>Zoom: {Math.round(zoom * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-charcoal-800 p-1 rounded-lg border border-slate-200 dark:border-charcoal-700">
                        <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomOut size={14} /></button>
                        <button onClick={() => setZoom(1)} className="px-2 text-xs font-mono font-bold text-charcoal-600 dark:text-charcoal-300 hover:text-brand-purple">1:1</button>
                        <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-charcoal-700 rounded text-charcoal-500 transition-colors"><ZoomIn size={14} /></button>
                    </div>
                </div>

                {/* Main Workspace */}
                <div ref={canvasContainerRef} className="flex-1 overflow-hidden relative grid place-items-center p-8">
                    {/* Grid Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    
                    {activePage && activePage.width && activePage.height && (
                        <motion.div 
                            layoutId="crop-canvas"
                            className="relative bg-white shadow-2xl ring-1 ring-black/5 select-none"
                            style={{ width: activePage.width * currentScale, height: activePage.height * currentScale }}
                            ref={imageContainerRef}
                        >
                            <img src={activePage.previewUrl} className="w-full h-full object-contain pointer-events-none" draggable={false} alt="Active Page" />
                            <CropBox crop={activePage.crop!} onCropChange={handleCropChange} parentRef={imageContainerRef} />
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {isProcessing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-charcoal-700">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
                                    <span className="text-xs font-bold font-mono tracking-widest uppercase">Processing...</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 3. RIGHT: Inspector */}
            <div className="w-80 bg-white dark:bg-charcoal-900 border-l border-slate-200 dark:border-charcoal-800 flex flex-col shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="h-12 border-b border-slate-100 dark:border-charcoal-800 flex items-center px-6 shrink-0 bg-slate-50/50 dark:bg-charcoal-850/50">
                    <Settings size={16} className="text-charcoal-400 mr-2" />
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal-600 dark:text-charcoal-300">Crop Settings</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    
                    {/* Selection Info */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase text-charcoal-400">Targeting</span>
                            <span className="text-xs font-mono font-bold text-brand-purple">{selectedPageIds.size} Page{selectedPageIds.size > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-charcoal-400">Current Crop</span>
                            {activePage?.crop && (
                                <span className="text-[10px] font-mono text-charcoal-600 dark:text-slate-300">
                                    {Math.round(activePage.crop.width)}% × {Math.round(activePage.crop.height)}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-widest font-mono pl-1">Apply Crop</label>
                        
                        <button 
                            onClick={handleApply} 
                            disabled={isProcessing}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:border-brand-purple/50 bg-white dark:bg-charcoal-800 hover:bg-slate-50 dark:hover:bg-charcoal-700 transition-all text-xs font-bold text-charcoal-700 dark:text-slate-200"
                        >
                            <span>Apply to Current</span>
                            <Check size={14} className="text-green-500" />
                        </button>

                        <button 
                            onClick={handleApplySelected} 
                            disabled={isProcessing || selectedPageIds.size < 2}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:border-brand-purple/50 bg-white dark:bg-charcoal-800 hover:bg-slate-50 dark:hover:bg-charcoal-700 transition-all text-xs font-bold text-charcoal-700 dark:text-slate-200 disabled:opacity-50"
                        >
                            <span>Apply to Selected ({selectedPageIds.size})</span>
                            <Copy size={14} className="text-brand-purple" />
                        </button>

                        <button 
                            onClick={handleApplyAll} 
                            disabled={isProcessing}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:border-brand-purple/50 bg-white dark:bg-charcoal-800 hover:bg-slate-50 dark:hover:bg-charcoal-700 transition-all text-xs font-bold text-charcoal-700 dark:text-slate-200"
                        >
                            <span>Apply to All Pages</span>
                            <Layers size={14} className="text-blue-500" />
                        </button>
                    </div>

                    <div className="w-full h-px bg-slate-200 dark:bg-charcoal-800" />

                    {/* Reset / Undo */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleResetView} className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:bg-slate-100 dark:hover:bg-charcoal-700 text-xs font-bold text-charcoal-600 dark:text-slate-300 transition-colors">
                            <RefreshCw size={14} /> Reset View
                        </button>
                        <button onClick={handleUndo} className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 dark:border-charcoal-700 hover:bg-slate-100 dark:hover:bg-charcoal-700 text-xs font-bold text-charcoal-600 dark:text-slate-300 transition-colors">
                            <Undo2 size={14} /> Undo Last
                        </button>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-charcoal-800 bg-slate-50 dark:bg-charcoal-900 shrink-0">
                    <motion.button 
                        onClick={handleGenerate} 
                        disabled={isGenerating} 
                        whileTap={buttonTap} 
                        className="
                            relative overflow-hidden w-full h-12
                            bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-900
                            font-bold font-mono text-sm tracking-wider uppercase
                            rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-purple dark:hover:bg-slate-200
                            transition-all disabled:opacity-50 disabled:shadow-none
                            flex items-center justify-center gap-2 group
                        "
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        <span>{isGenerating ? 'PROCESSING...' : 'DOWNLOAD PDF'}</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
