
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { loadPdfJs } from '../../services/pdfProvider';
import { Loader2, Search, ChevronUp, ChevronDown, Maximize, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PdfViewerProps {
  file: File;
  scale: number;
  onScaleChange: (newScale: number) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ 
  file, 
  scale,
  onScaleChange
}) => {
  // --- State ---
  const [pages, setPages] = useState<number[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSizes, setPageSizes] = useState<Record<number, { width: number, height: number }>>({});
  
  // View State
  const [rotation, setRotation] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [fitMode, setFitMode] = useState<'width' | 'page'>('page');

  // Refs
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]); 
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // --- Initialization ---
  useEffect(() => {
    const load = async () => {
      setActivePage(1);
      setPageInput('1');
      setRotation(0);
      setSearchResults([]);
      setSearchQuery('');
      setPageSizes({});
      
      try {
        setLoading(true);
        setError(null);
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ 
            data: arrayBuffer,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
            cMapPacked: true, 
        }).promise;
        
        setPdfDoc(pdf);
        
        const pgs = [];
        for (let i = 1; i <= pdf.numPages; i++) {
           pgs.push(i);
        }
        setPages(pgs);

        // Pre-fetch all page dimensions for stable scrolling
        const sizes: Record<number, { width: number, height: number }> = {};
        const sizePromises = [];
        
        const getSize = (pageNum: number) => pdf.getPage(pageNum).then((page: any) => {
            const vp = page.getViewport({ scale: 1 });
            sizes[pageNum] = { width: vp.width, height: vp.height };
        });

        // Fetch Page 1 immediately
        await getSize(1);
        setPageSizes({ ...sizes });

        // Fetch the rest in background
        for (let i = 2; i <= pdf.numPages; i++) {
            sizePromises.push(getSize(i));
        }
        
        Promise.all(sizePromises).then(() => {
            setPageSizes({ ...sizes });
        });
        
      } catch(e) {
        console.error(e);
        setError("Failed to load PDF. The file might be corrupted or password protected.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [file]);

  useEffect(() => {
    if (pages.length > 0 && mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pages]);

  useEffect(() => {
    if (!mainScrollRef.current || pages.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.getAttribute('data-page-num') || '1');
          setActivePage(pageNum);
          if (document.activeElement?.id !== 'page-input') {
             setPageInput(pageNum.toString());
          }
        }
      });
    }, { 
      root: mainScrollRef.current,
      threshold: 0.1,
      rootMargin: "-10% 0px -50% 0px"
    });

    const pageElements = document.querySelectorAll('.pdf-page-container');
    pageElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [pages, pdfDoc]); 

  useEffect(() => {
    if (sidebarScrollRef.current) {
        const activeThumbnail = document.getElementById(`thumbnail-${activePage}`);
        if (activeThumbnail) {
            activeThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
  }, [activePage]);

  // --- Actions ---
  const scrollToPage = useCallback((pageNum: number) => {
    const target = Math.max(1, Math.min(pageNum, pages.length));
    setActivePage(target);
    setPageInput(target.toString());
    
    const element = document.getElementById(`page-${target}`);
    if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [pages.length]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
      const p = parseInt(pageInput);
      if (!isNaN(p)) {
          scrollToPage(p);
      } else {
          setPageInput(activePage.toString());
      }
  };

  const handleFit = () => {
      if (fitMode === 'page') {
          setFitMode('width');
          onScaleChange(1.2); 
      } else {
          setFitMode('page');
          onScaleChange(0.7); 
      }
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handlePrevPage = () => {
      if (activePage > 1) scrollToPage(activePage - 1);
  };
  const handleNextPage = () => {
      if (activePage < pages.length) scrollToPage(activePage + 1);
  };

  const handleZoomIn = () => onScaleChange(Math.min(scale + 0.1, 3.0));
  const handleZoomOut = () => onScaleChange(Math.max(scale - 0.1, 0.3));

  // --- Search Logic ---
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !pdfDoc) {
        setSearchResults([]);
        setIsSearching(false);
        return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setCurrentMatchIndex(0);

    const matches: number[] = [];
    const normalizedQuery = query.toLowerCase();

    try {
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map((item: any) => item.str).join(' ');
            
            if (textItems.toLowerCase().includes(normalizedQuery)) {
                matches.push(i);
            }
            if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }
        setSearchResults(matches);
        if (matches.length > 0) {
            scrollToPage(matches[0]);
        }
    } catch (e) {
        console.error("Search error:", e);
    } finally {
        setIsSearching(false);
    }
  }, [pdfDoc, scrollToPage]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (searchQuery.length > 2) {
        searchTimeoutRef.current = setTimeout(() => {
            performSearch(searchQuery);
        }, 600);
    } else {
        setSearchResults([]);
        setIsSearching(false);
    }

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, performSearch]);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-full text-charcoal-500 bg-slate-50 dark:bg-charcoal-950">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        <Loader2 className="w-8 h-8 mb-2 text-brand-purple" />
      </motion.div>
      <span className="font-medium animate-pulse text-sm">Rendering Document...</span>
    </div>
  );
  
  if (error) return <div className="flex justify-center items-center h-full text-rose-500 font-medium bg-slate-50 dark:bg-charcoal-950">{error}</div>;

  const defaultSize = pageSizes[1] || { width: 595, height: 842 };

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-slate-100 dark:bg-charcoal-950 isolate">
       
       {/* LEFT SIDEBAR (Thumbnails) */}
       <div 
         ref={sidebarScrollRef}
         className="hidden md:flex w-[240px] lg:w-[280px] flex-col border-r border-slate-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 h-full shadow-lg z-20 flex-shrink-0"
       >
          <div className="p-4 border-b border-slate-100 dark:border-charcoal-800 bg-white/50 dark:bg-charcoal-900/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
             <h3 className="text-xs font-bold text-charcoal-500 dark:text-slate-400 uppercase tracking-wider">Pages</h3>
             <span className="text-[10px] font-mono text-charcoal-400 dark:text-slate-500">{pages.length} Total</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
             {pages.map(pageNum => (
                <div key={pageNum} className="flex flex-col gap-1">
                    <button 
                    id={`thumbnail-${pageNum}`}
                    onClick={() => scrollToPage(pageNum)}
                    className={`
                        relative w-full group rounded-lg overflow-hidden transition-all duration-200 
                        bg-slate-50 dark:bg-charcoal-800 border-2
                        ${activePage === pageNum 
                        ? 'border-brand-purple ring-2 ring-brand-purple/20 shadow-md' 
                        : 'border-transparent hover:border-slate-300 dark:hover:border-charcoal-600'
                        }
                    `}
                    >
                    <div className="p-2 pointer-events-none flex justify-center bg-white dark:bg-charcoal-900 min-h-[120px] items-center">
                        <PdfPageRenderer 
                            pdf={pdfDoc} 
                            pageNum={pageNum} 
                            scale={0.2} 
                            isThumbnail 
                            size={pageSizes[pageNum] || defaultSize}
                        />
                    </div>
                    </button>
                    <span className={`text-center text-[10px] font-bold ${activePage === pageNum ? 'text-brand-purple' : 'text-charcoal-400'}`}>
                        {pageNum}
                    </span>
                </div>
             ))}
          </div>
       </div>

       {/* MAIN CONTENT WRAPPER */}
       <div className="flex-1 h-full relative flex flex-col min-w-0 bg-slate-100 dark:bg-black/20">
           
           {/* SCROLLABLE AREA */}
           <div 
             ref={mainScrollRef}
             className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center pt-8 pb-32 px-4 relative z-0 scroll-smooth"
           >
              <div className="flex flex-col items-center gap-8 w-full max-w-full">
                  <AnimatePresence>
                    {pages.map(pageNum => (
                      <motion.div 
                        key={pageNum} 
                        id={`page-${pageNum}`} 
                        className="pdf-page-container transition-all duration-200 ease-out origin-center" 
                        data-page-num={pageNum}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, rotate: rotation }}
                        transition={{ duration: 0.2 }}
                      >
                          <PdfPageRenderer 
                            pdf={pdfDoc} 
                            pageNum={pageNum} 
                            scale={scale} 
                            size={pageSizes[pageNum] || defaultSize}
                          />
                      </motion.div>
                    ))}
                  </AnimatePresence>
              </div>
           </div>

           {/* SEARCH BAR (Persistent) */}
           <div className="absolute top-4 inset-x-0 z-[60] flex justify-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2 p-1.5 pl-3 pr-2 bg-white dark:bg-charcoal-900 shadow-2xl shadow-black/10 border border-slate-200 dark:border-charcoal-700 rounded-xl text-charcoal-700 dark:text-white w-[320px]">
                    <Search size={16} className="opacity-50 flex-shrink-0" />
                    <input 
                        type="text" 
                        placeholder="Search document..." 
                        className="bg-transparent border-none outline-none text-sm w-full text-charcoal-800 dark:text-white placeholder:text-charcoal-400 dark:placeholder:text-slate-500 h-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (searchResults.length > 0) {
                                    const nextIndex = (currentMatchIndex + 1) % searchResults.length;
                                    setCurrentMatchIndex(nextIndex);
                                    scrollToPage(searchResults[nextIndex]);
                                }
                            }
                        }}
                    />
                    <div className="flex items-center gap-1 flex-shrink-0 border-l border-slate-200 dark:border-charcoal-700 pl-2">
                        <span className="text-[10px] font-mono opacity-70 w-12 text-center whitespace-nowrap">
                            {isSearching ? (
                                <Loader2 size={12} className="animate-spin inline" />
                            ) : searchResults.length > 0 ? (
                                `${currentMatchIndex + 1}/${searchResults.length}`
                            ) : (
                                "0/0"
                            )}
                        </span>
                        <button onClick={() => {
                            if (searchResults.length === 0) return;
                            const prevIndex = (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
                            setCurrentMatchIndex(prevIndex);
                            scrollToPage(searchResults[prevIndex]);
                        }} disabled={searchResults.length === 0} className="p-1 hover:bg-slate-100 dark:hover:bg-charcoal-800 rounded transition-colors disabled:opacity-30"><ChevronUp size={14} /></button>
                        <button onClick={() => {
                            if (searchResults.length === 0) return;
                            const nextIndex = (currentMatchIndex + 1) % searchResults.length;
                            setCurrentMatchIndex(nextIndex);
                            scrollToPage(searchResults[nextIndex]);
                        }} disabled={searchResults.length === 0} className="p-1 hover:bg-slate-100 dark:hover:bg-charcoal-800 rounded transition-colors disabled:opacity-30"><ChevronDown size={14} /></button>
                    </div>
                </div>
           </div>

           {/* FLOATING CONTROLS (Bottom Center) */}
           <div className="absolute bottom-8 left-0 right-0 z-[100] flex justify-center pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-charcoal-900/95 dark:bg-white/95 backdrop-blur-xl rounded-full shadow-2xl shadow-black/30 text-white dark:text-charcoal-900 border border-white/10 dark:border-black/10">
                 
                 {/* Page Navigation */}
                 <div className="flex items-center gap-1">
                    <button onClick={handlePrevPage} disabled={activePage <= 1} className="p-1.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors disabled:opacity-30">
                       <ChevronUp className="rotate-[-90deg]" size={18} />
                    </button>
                    
                    <div className="flex items-center">
                        <input 
                            id="page-input"
                            type="text" 
                            className="bg-transparent text-center font-mono text-sm font-bold w-10 outline-none border-b border-transparent focus:border-white/50 dark:focus:border-black/50 text-white dark:text-charcoal-900" 
                            value={pageInput}
                            onChange={handlePageInputChange}
                            onBlur={handlePageInputSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
                        />
                        <span className="text-xs opacity-60 font-mono">/ {pages.length}</span>
                    </div>

                    <button onClick={handleNextPage} disabled={activePage >= pages.length} className="p-1.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors disabled:opacity-30">
                       <ChevronDown className="rotate-[-90deg]" size={18} />
                    </button>
                 </div>

                 <div className="w-px h-5 bg-white/20 dark:bg-black/20 mx-1" />

                 {/* Zoom Controls */}
                 <div className="flex items-center gap-1">
                    <button onClick={handleZoomOut} disabled={scale <= 0.3} className="p-1.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors disabled:opacity-30" title="Zoom Out">
                        <ZoomOut size={16} />
                    </button>
                    <button 
                        onClick={() => onScaleChange(1.0)} 
                        className="font-mono text-xs font-bold w-10 text-center select-none hover:bg-white/10 dark:hover:bg-black/10 rounded py-1 transition-colors"
                        title="Reset Zoom"
                    >
                        {Math.round(scale * 100)}%
                    </button>
                    <button onClick={handleZoomIn} disabled={scale >= 3.0} className="p-1.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors disabled:opacity-30" title="Zoom In">
                        <ZoomIn size={16} />
                    </button>
                 </div>

                 <div className="w-px h-5 bg-white/20 dark:bg-black/20 mx-1" />

                 {/* View Tools */}
                 <div className="flex items-center gap-1">
                    <button onClick={handleFit} className="p-1.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors" title={fitMode === 'page' ? "Fit Width" : "Fit Page"}>
                       <Maximize size={16} />
                    </button>
                    <button onClick={handleRotate} className="p-1.5 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-colors" title="Rotate">
                       <RotateCw size={16} />
                    </button>
                 </div>

              </div>
           </div>

       </div>
    </div>
  );
}

// Reusable Page Renderer Component with Virtualization Support
const PdfPageRenderer: React.FC<{ 
    pdf: any, 
    pageNum: number, 
    scale: number, 
    isThumbnail?: boolean,
    size: { width: number, height: number }
}> = React.memo(({ pdf, pageNum, scale, isThumbnail, size }) => {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const [status, setStatus] = useState<'init' | 'rendering' | 'rendered' | 'error'>('init');
   const [inView, setInView] = useState(false);
   const renderTaskRef = useRef<any>(null);

   useEffect(() => {
      const rootMargin = isThumbnail ? '200px 0px' : '2000px 0px';
      
      const observer = new IntersectionObserver(
         ([entry]) => {
            setInView(entry.isIntersecting);
         },
         { rootMargin }
      );
      
      if (containerRef.current) {
         observer.observe(containerRef.current);
      }
      
      return () => observer.disconnect();
   }, [isThumbnail]);

   useEffect(() => {
      if (!inView) return;
      if (!pdf) return;

      const renderPage = async () => {
         try {
            setStatus('rendering');
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            
            const canvas = canvasRef.current;
            if (canvas) {
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                if (renderTaskRef.current) {
                    renderTaskRef.current.cancel();
                }

                const renderContext = {
                    canvasContext: context,
                    viewport,
                };
                
                const task = page.render(renderContext);
                renderTaskRef.current = task;
                
                await task.promise;
                setStatus('rendered');
            }
         } catch (e: any) {
            if (e.name !== 'RenderingCancelledException') {
                console.error(`Error rendering page ${pageNum}`, e);
                setStatus('error');
            }
         }
      };
      
      const t = setTimeout(renderPage, isThumbnail ? 0 : 50);
      return () => {
          clearTimeout(t);
          if (renderTaskRef.current) {
              renderTaskRef.current.cancel();
          }
      };

   }, [pdf, pageNum, inView, scale, isThumbnail]);

   // Calculate container dimensions immediately using prop
   const width = size.width * scale;
   const height = size.height * scale;

   return (
      <div 
         ref={containerRef} 
         className={`
            relative bg-white dark:bg-charcoal-800 transition-all duration-200 ease-out origin-top mx-auto
            ${isThumbnail ? '' : 'shadow-2xl shadow-charcoal-900/10 rounded-sm'}
         `}
         style={{ 
             width: width,
             height: height,
         }} 
      >
         {inView ? (
             <canvas ref={canvasRef} className={`block w-full h-full ${isThumbnail ? 'rounded-lg' : 'rounded-sm'}`} />
         ) : (
             <div className="w-full h-full" />
         )}
         
         {inView && status !== 'rendered' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 rounded-sm bg-white dark:bg-charcoal-800">
               {isThumbnail ? (
                  <div className="w-full h-full animate-pulse bg-slate-100 dark:bg-charcoal-700 rounded-lg" />
               ) : (
                  <div className="flex flex-col items-center">
                     <Loader2 className="animate-spin w-8 h-8 text-brand-purple/50 mb-2" />
                     <span className="text-xs font-medium text-slate-400">Loading...</span>
                  </div>
               )}
            </div>
         )}
      </div>
   );
});
