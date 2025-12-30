
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, Presentation, Package, 
  Image as ImageIcon, Minimize2, Archive, Pencil, Plus, Monitor, Layout, Ratio, LayoutTemplate
} from 'lucide-react';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { toolCategories } from '../utils/tool-list';
import { physicalSpring, heavySpring, bouncySpring } from '../utils/animations';

// --- VISUAL COMPONENTS ---

const ShowcaseCanvas = ({ forcedToolId }: { forcedToolId?: string }) => {
  const tools = [
    { id: 'pdf-workspace', label: 'PDF Workspace' },
    { id: 'image-to-pdf', label: 'Image to PDF' },
    { id: 'pdf-to-image', label: 'PDF to Image' },
    { id: 'compress', label: 'Compress PDF' },
    { id: 'zip', label: 'PDF to ZIP' },
    { id: 'pptx', label: 'PDF to PPTX' },
    { id: 'rename', label: 'Batch Rename' },
    { id: 'metadata', label: 'Metadata Editor' }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (forcedToolId) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tools.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [tools.length, forcedToolId]);

  const activeToolId = forcedToolId || tools[currentIndex].id;

  const renderToolGraphic = () => {
    switch (activeToolId) {
      case 'pdf-workspace':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <motion.div layoutId="doc-1" transition={heavySpring} className="absolute w-40 h-56 bg-white rounded-2xl border-2 border-[#111111] shadow-sm rotate-[-6deg] translate-x-[-15px]" />
            <motion.div layoutId="doc-2" transition={heavySpring} className="absolute w-40 h-56 bg-stone-50 rounded-2xl border-2 border-[#111111] shadow-sm rotate-[3deg] translate-x-[15px] flex flex-col p-4 gap-2">
              <div className="flex gap-1.5 mb-4">
                 <div className="w-4 h-4 rounded-md bg-accent-lime border border-[#111111]" />
                 <div className="w-4 h-4 rounded-md bg-stone-200 border border-[#111111]" />
                 <div className="w-4 h-4 rounded-md bg-stone-200 border border-[#111111]" />
              </div>
              <div className="w-1/2 h-1.5 bg-stone-200 rounded-full" />
              <div className="w-full h-1.5 bg-stone-100 rounded-full" />
              <div className="w-3/4 h-1.5 bg-stone-100 rounded-full" />
              <div className="mt-auto self-end w-10 h-10 rounded-xl bg-accent-lime border-2 border-[#111111] flex items-center justify-center shadow-sm">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}><RefreshCw size={18} /></motion.div>
              </div>
            </motion.div>
          </div>
        );
      case 'image-to-pdf':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-2 gap-3 translate-y-[-20px]">
              <motion.div layoutId="img-1" transition={heavySpring} className="w-16 h-16 bg-white rounded-xl border-2 border-[#111111] shadow-sm flex items-center justify-center rotate-[-10deg]"><ImageIcon size={20}/></motion.div>
              <motion.div layoutId="img-2" transition={heavySpring} className="w-16 h-16 bg-white rounded-xl border-2 border-[#111111] shadow-sm flex items-center justify-center rotate-[12deg]"><ImageIcon size={20}/></motion.div>
            </div>
            <motion.div layoutId="doc-1" transition={heavySpring} className="absolute w-44 h-60 bg-white/90 rounded-2xl border-2 border-[#111111] shadow-lg translate-y-[20px] flex items-center justify-center">
               <div className="w-32 h-40 border-2 border-dashed border-stone-200 rounded-xl flex items-center justify-center text-stone-300">
                  <Plus size={24} />
               </div>
            </motion.div>
          </div>
        );
      case 'pdf-to-image':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <motion.div layoutId="doc-1" transition={heavySpring} className="absolute w-48 h-64 bg-white rounded-2xl border-2 border-[#111111] shadow-sm opacity-20" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <motion.div 
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1, ...bouncySpring }}
                  className="w-20 h-28 bg-white rounded-xl border-2 border-[#111111] shadow-md flex items-center justify-center overflow-hidden"
                >
                  <div className="w-full h-full p-2 flex flex-col gap-1">
                    <div className="w-full h-full bg-stone-50 rounded flex items-center justify-center text-accent-pink"><ImageIcon size={16}/></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 'compress':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <motion.div 
              layoutId="doc-1" 
              transition={heavySpring}
              animate={{ scale: [1, 0.7, 1] }}
              className="w-56 h-72 bg-white rounded-3xl border-2 border-[#111111] shadow-xl flex flex-col items-center justify-center gap-4"
            >
              <Minimize2 size={48} strokeWidth={2.5} />
              <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
                <motion.div 
                   animate={{ width: ['20%', '100%', '20%'] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="h-full bg-[#111111]" 
                />
              </div>
            </motion.div>
          </div>
        );
      case 'zip':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
             <motion.div layoutId="doc-1" transition={heavySpring} className="absolute w-32 h-44 bg-white rounded-xl border-2 border-[#111111] rotate-[-5deg] translate-x-[-15px] opacity-40" />
             <motion.div layoutId="doc-2" transition={heavySpring} className="absolute w-32 h-44 bg-white rounded-xl border-2 border-[#111111] rotate-[5deg] translate-x-[15px] opacity-40" />
             <motion.div 
               initial={{ scale: 0.5, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               transition={bouncySpring}
               className="w-40 h-40 bg-white rounded-3xl border-2 border-[#111111] shadow-2xl flex flex-col items-center justify-center gap-2 z-10"
             >
                <Archive size={40} strokeWidth={2.5} />
                <span className="text-[10px] font-black uppercase tracking-widest">EZ_ARCHIVE</span>
             </motion.div>
          </div>
        );
      case 'pptx':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
             <motion.div 
               layoutId="doc-1" 
               transition={heavySpring}
               className="w-64 h-48 bg-white rounded-2xl border-2 border-[#111111] shadow-xl flex flex-col overflow-hidden"
             >
                <div className="h-10 bg-accent-pink/20 border-b-2 border-[#111111] flex items-center px-4">
                   <div className="w-2 h-2 rounded-full bg-accent-pink" />
                </div>
                <div className="flex-1 p-6 flex flex-col gap-3">
                   <div className="w-2/3 h-3 bg-stone-100 rounded-full" />
                   <div className="w-full h-3 bg-stone-50 rounded-full" />
                   <div className="mt-auto flex gap-2">
                      <div className="w-12 h-12 bg-stone-100 rounded-lg border-2 border-[#111111]" />
                      <div className="w-12 h-12 bg-stone-100 rounded-lg border-2 border-[#111111]" />
                   </div>
                </div>
             </motion.div>
          </div>
        );
      case 'rename':
        return (
          <div className="relative w-full h-full flex items-center justify-center p-8">
             <motion.div 
               initial={{ x: -20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={physicalSpring}
               className="w-full bg-white rounded-2xl border-2 border-[#111111] shadow-lg p-6 flex flex-col gap-4"
             >
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                   <div className="flex items-center gap-2">
                      <Pencil size={14} className="text-stone-400" />
                      <span className="text-[10px] font-bold text-stone-400 font-mono">FILE_01.PDF</span>
                   </div>
                   <ArrowRight size={14} className="text-accent-lime" />
                   <span className="text-[10px] font-bold text-[#111111] font-mono">INVOICE_v2.PDF</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Pencil size={14} className="text-stone-400" />
                      <span className="text-[10px] font-bold text-stone-400 font-mono">SCAN_99.PDF</span>
                   </div>
                   <ArrowRight size={14} className="text-accent-lime" />
                   <span className="text-[10px] font-bold text-[#111111] font-mono">REPORT_v2.PDF</span>
                </div>
             </motion.div>
          </div>
        );
      case 'metadata':
        return (
          <div className="relative w-full h-full flex items-center justify-center p-8">
             <div className="grid grid-cols-2 gap-4 w-full">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={physicalSpring} className="bg-white rounded-2xl border-2 border-[#111111] p-4 flex flex-col gap-2">
                   <span className="text-[8px] font-black text-stone-400 uppercase">Existing</span>
                   <div className="w-full h-1 bg-stone-100 rounded-full" />
                   <div className="w-2/3 h-1 bg-stone-100 rounded-full" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...physicalSpring }} className="bg-[#111111] rounded-2xl border-2 border-[#111111] p-4 flex flex-col gap-2">
                   <span className="text-[8px] font-black text-stone-500 uppercase">Update</span>
                   <div className="w-full h-1 bg-accent-lime rounded-full" />
                   <div className="w-full h-1 bg-stone-700 rounded-full" />
                </motion.div>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full aspect-[4/3] md:aspect-square bg-accent-lime rounded-4xl border-2 border-[#111111] overflow-hidden flex flex-col shadow-soft group/showcase"
    >
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeToolId}
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
            transition={heavySpring}
            className="w-full h-full"
          >
            {renderToolGraphic()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="h-14 bg-[#111111] flex items-center justify-between px-6 shrink-0 z-20">
         <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
            <AnimatePresence mode="wait">
              <motion.span 
                key={activeToolId}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="text-[10px] font-black text-white uppercase tracking-[0.2em] font-mono"
              >
                MODULE_{activeToolId.toUpperCase().replace('-', '_')}
              </motion.span>
            </AnimatePresence>
         </div>
         <div className="flex gap-1.5">
            {tools.map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-accent-lime w-4' : 'bg-stone-700'}`} />
            ))}
         </div>
      </div>
    </motion.div>
  );
};

const ToolCard = ({ to, title, desc, icon, badge }: any) => (
  <Link 
    to={to} 
    className="group flex flex-col p-6 bg-white rounded-3xl border border-stone-200 hover:border-[#111111] transition-all duration-500 relative overflow-hidden h-full"
  >
    <motion.div
      whileHover={{ y: -4 }}
      transition={physicalSpring}
      className="flex-1 flex flex-col"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 group-hover:bg-[#111111] group-hover:text-white transition-all duration-300">
          {React.cloneElement(icon as React.ReactElement, { size: 20, strokeWidth: 2.5 })}
        </div>
        {badge && (
          <span className="px-2 py-1 bg-accent-lime/20 text-stone-800 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-accent-lime/20">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-[#111111] mb-2">{title}</h3>
      <p className="text-sm text-stone-500 leading-relaxed font-medium">{desc}</p>
      
      <div className="mt-auto pt-6 flex items-center gap-2 text-xs font-black text-stone-300 group-hover:text-[#111111] transition-colors">
         <span>OPEN TOOL</span>
         <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </div>
    </motion.div>
  </Link>
);

const SectionHeading = ({ title }: { title: string }) => (
  <h2 className="text-sm font-bold text-stone-400 uppercase tracking-[0.2em] mb-8 pl-1">
    {title}
  </h2>
);

const RefreshCw = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

// --- MAIN PAGE ---

const MotionLink = motion(Link);

export const Home: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCTAByHovered, setIsCTAByHovered] = useState(false);
  
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 500], [0, -40]);
  const opacityFade = useTransform(scrollY, [0, 300], [1, 0.8]);
  const smoothY = useSpring(yParallax, physicalSpring);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-anim', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power4.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="w-full pb-20 pt-12 md:pt-20 px-6 md:px-12 bg-[#FAF9F6] selection:bg-accent-lime selection:text-white">
      <PageReadyTracker />
      
      <div className="max-w-7xl mx-auto">
        
        {/* 1. HERO SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-16">
          
          {/* Left: Copy */}
          <motion.div style={{ y: smoothY, opacity: opacityFade }} className="flex flex-col items-start gap-6 hero-anim">
            <h1 className="text-5xl md:text-[5.5rem] font-bold tracking-tighter text-[#111111] leading-[0.95]">
              The PDF <br/>
              <span className="text-stone-300">Workspace.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-stone-600 font-medium leading-relaxed max-w-md">
              A private environment focused purely on page operations. Merge, split, reorder, crop, and watermark with native speed. No heavy text editing, just essential control.
            </p>
            
            <MotionLink
              to="/pdf-workspace"
              onMouseEnter={() => setIsCTAByHovered(true)}
              onMouseLeave={() => setIsCTAByHovered(false)}
              whileHover={{ scale: 1.03, x: 5 }}
              whileTap={{ scale: 0.97 }}
              transition={physicalSpring}
              className="mt-2 px-10 py-5 bg-[#111111] text-white font-bold rounded-full text-base flex items-center gap-4 shadow-[0_15px_35px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.25)] transition-all"
            >
              Launch PDF Workspace <ArrowRight size={20} />
            </MotionLink>
          </motion.div>

          {/* Right: Graphic */}
          <motion.div 
            className="w-full relative hidden md:block"
            whileHover={{ scale: 1.01, rotate: 0.5 }}
            transition={heavySpring}
          >
             {/* Subtle ambient shadow behind the showcase */}
             <div className="absolute inset-10 bg-[#111111]/5 blur-[100px] rounded-full pointer-events-none" />
             <ShowcaseCanvas forcedToolId={isCTAByHovered ? 'pdf-workspace' : undefined} />
          </motion.div>
        </div>

        {/* 2. DYNAMIC TOOL CATEGORIES */}
        <div className="space-y-24">
          {toolCategories.map((category) => (
            <motion.div 
              key={category.category}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              <SectionHeading title={category.category} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.tools.map((tool) => (
                  <motion.div 
                    key={tool.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: physicalSpring }
                    }}
                  >
                    <ToolCard 
                      to={tool.path}
                      title={tool.title}
                      desc={tool.desc}
                      icon={tool.icon}
                      badge={tool.id === 'pdf-workspace' ? 'PRIMARY' : undefined}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
