
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  ArrowRight, Image as ImageIcon, Minimize2, Archive, Pencil, Plus, RefreshCw
} from 'lucide-react';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { toolCategories } from '../utils/tool-list';
import { physicalSpring, heavySpring } from '../utils/animations';

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
    }, 4000); // Slightly faster cycle for smaller card
    return () => clearInterval(timer);
  }, [tools.length, forcedToolId]);

  const activeToolId = forcedToolId || tools[currentIndex].id;

  const renderToolGraphic = () => {
    switch (activeToolId) {
      case 'pdf-workspace':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <motion.div layoutId="doc-1" transition={heavySpring} className="absolute w-32 h-44 bg-white rounded-xl border-2 border-[#111111] shadow-sm rotate-[-6deg] translate-x-[-12px]" />
            <motion.div layoutId="doc-2" transition={heavySpring} className="absolute w-32 h-44 bg-stone-50 rounded-xl border-2 border-[#111111] shadow-sm rotate-[3deg] translate-x-[12px] flex flex-col p-3 gap-2">
              <div className="flex gap-1 mb-2">
                 <div className="w-3 h-3 rounded-full bg-accent-lime border border-[#111111]" />
                 <div className="w-3 h-3 rounded-full bg-stone-200 border border-[#111111]" />
              </div>
              <div className="w-1/2 h-1 bg-stone-200 rounded-full" />
              <div className="w-full h-1 bg-stone-100 rounded-full" />
              <div className="w-3/4 h-1 bg-stone-100 rounded-full" />
              <div className="mt-auto self-end w-8 h-8 rounded-lg bg-accent-lime border-2 border-[#111111] flex items-center justify-center shadow-sm">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}><RefreshCw size={14} /></motion.div>
              </div>
            </motion.div>
          </div>
        );
      case 'image-to-pdf':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-2 gap-2 translate-y-[-16px]">
              <motion.div layoutId="img-1" transition={heavySpring} className="w-14 h-14 bg-white rounded-xl border-2 border-[#111111] shadow-sm flex items-center justify-center rotate-[-10deg]"><ImageIcon size={18}/></motion.div>
              <motion.div layoutId="img-2" transition={heavySpring} className="w-14 h-14 bg-white rounded-xl border-2 border-[#111111] shadow-sm flex items-center justify-center rotate-[12deg]"><ImageIcon size={18}/></motion.div>
            </div>
            <motion.div layoutId="doc-1" transition={heavySpring} className="absolute w-36 h-48 bg-white/90 rounded-xl border-2 border-[#111111] shadow-lg translate-y-[16px] flex items-center justify-center">
               <div className="w-24 h-32 border-2 border-dashed border-stone-200 rounded-lg flex items-center justify-center text-stone-300">
                  <Plus size={20} />
               </div>
            </motion.div>
          </div>
        );
      case 'pdf-to-image':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <motion.div layoutId="doc-1" transition={heavySpring} className="absolute w-40 h-52 bg-white rounded-xl border-2 border-[#111111] shadow-sm opacity-20" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <motion.div 
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1, ...heavySpring }}
                  className="w-16 h-20 bg-white rounded-lg border-2 border-[#111111] shadow-md flex items-center justify-center overflow-hidden"
                >
                  <div className="w-full h-full p-1.5 flex flex-col gap-1">
                    <div className="w-full h-full bg-stone-50 rounded flex items-center justify-center text-accent-pink"><ImageIcon size={14}/></div>
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
              animate={{ scale: [1, 0.8, 1] }}
              className="w-44 h-56 bg-white rounded-2xl border-2 border-[#111111] shadow-xl flex flex-col items-center justify-center gap-3"
            >
              <Minimize2 size={32} strokeWidth={2.5} />
              <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
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
             <motion.div layoutId="doc-1" transition={heavySpring} className="absolute w-28 h-36 bg-white rounded-xl border-2 border-[#111111] rotate-[-5deg] translate-x-[-12px] opacity-40" />
             <motion.div layoutId="doc-2" transition={heavySpring} className="absolute w-28 h-36 bg-white rounded-xl border-2 border-[#111111] rotate-[5deg] translate-x-[12px] opacity-40" />
             <motion.div 
               initial={{ scale: 0.5, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               transition={heavySpring}
               className="w-32 h-32 bg-white rounded-2xl border-2 border-[#111111] shadow-2xl flex flex-col items-center justify-center gap-1.5 z-10"
             >
                <Archive size={32} strokeWidth={2.5} />
                <span className="text-[8px] font-black uppercase tracking-widest">ZIP</span>
             </motion.div>
          </div>
        );
      case 'pptx':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
             <motion.div 
               layoutId="doc-1" 
               transition={heavySpring}
               className="w-52 h-40 bg-white rounded-xl border-2 border-[#111111] shadow-xl flex flex-col overflow-hidden"
             >
                <div className="h-8 bg-accent-pink/20 border-b-2 border-[#111111] flex items-center px-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent-pink" />
                </div>
                <div className="flex-1 p-4 flex flex-col gap-2">
                   <div className="w-2/3 h-2 bg-stone-100 rounded-full" />
                   <div className="w-full h-2 bg-stone-50 rounded-full" />
                   <div className="mt-auto flex gap-2">
                      <div className="w-10 h-10 bg-stone-100 rounded-md border-2 border-[#111111]" />
                      <div className="w-10 h-10 bg-stone-100 rounded-md border-2 border-[#111111]" />
                   </div>
                </div>
             </motion.div>
          </div>
        );
      case 'rename':
        return (
          <div className="relative w-full h-full flex items-center justify-center p-6">
             <motion.div 
               initial={{ x: -10, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={physicalSpring}
               className="w-full bg-white rounded-xl border-2 border-[#111111] shadow-lg p-4 flex flex-col gap-3"
             >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                   <div className="flex items-center gap-1.5">
                      <Pencil size={12} className="text-stone-400" />
                      <span className="text-[9px] font-bold text-stone-400 font-mono">FILE_01</span>
                   </div>
                   <ArrowRight size={12} className="text-accent-lime" />
                   <span className="text-[9px] font-bold text-[#111111] font-mono">INV_v2</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-1.5">
                      <Pencil size={12} className="text-stone-400" />
                      <span className="text-[9px] font-bold text-stone-400 font-mono">SCAN_99</span>
                   </div>
                   <ArrowRight size={12} className="text-accent-lime" />
                   <span className="text-[9px] font-bold text-[#111111] font-mono">REP_v2</span>
                </div>
             </motion.div>
          </div>
        );
      case 'metadata':
        return (
          <div className="relative w-full h-full flex items-center justify-center p-6">
             <div className="grid grid-cols-2 gap-3 w-full">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={physicalSpring} className="bg-white rounded-xl border-2 border-[#111111] p-3 flex flex-col gap-1.5">
                   <span className="text-[7px] font-black text-stone-400 uppercase">Old</span>
                   <div className="w-full h-1 bg-stone-100 rounded-full" />
                   <div className="w-2/3 h-1 bg-stone-100 rounded-full" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...physicalSpring }} className="bg-[#111111] rounded-xl border-2 border-[#111111] p-3 flex flex-col gap-1.5">
                   <span className="text-[7px] font-black text-stone-500 uppercase">New</span>
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
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-[340px] aspect-square bg-[#FFFFFF] rounded-[2rem] border-2 border-[#111111] overflow-hidden flex flex-col shadow-[8px_8px_0px_0px_rgba(17,17,17,0.1)] group/showcase ml-auto mr-auto md:mr-0"
    >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#111111_1px,transparent_1px)] [background-size:12px_12px]" />
        
        {/* Floating Tag */}
        <div className="absolute top-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
             <AnimatePresence mode="wait">
                <motion.div 
                    key={activeToolId}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    className="px-3 py-1 bg-[#111111] text-white rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
                    {tools.find(t => t.id === activeToolId)?.label}
                </motion.div>
             </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden p-6">
            <AnimatePresence mode="wait">
            <motion.div
                key={activeToolId}
                initial={{ opacity: 0, scale: 0.8, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.1, rotate: -2 }}
                transition={heavySpring}
                className="w-full h-full flex items-center justify-center"
            >
                {renderToolGraphic()}
            </motion.div>
            </AnimatePresence>
        </div>

        {/* Progress Line */}
        <div className="h-1 bg-stone-100 w-full relative">
             <motion.div 
                key={activeToolId}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "linear" }}
                className="h-full bg-accent-lime"
             />
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
    <div ref={containerRef} className="w-full pb-20 pt-8 md:pt-16 px-6 md:px-12 bg-[#FAF9F6] selection:bg-accent-lime selection:text-white">
      <PageReadyTracker />
      
      <div className="max-w-7xl mx-auto">
        
        {/* 1. HERO SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16 md:mb-24">
          
          {/* Left: Copy */}
          <motion.div style={{ y: smoothY, opacity: opacityFade }} className="flex flex-col items-start gap-6 hero-anim max-w-xl">
            <h1 className="text-5xl md:text-[5.5rem] font-bold tracking-tighter text-[#111111] leading-[0.95]">
              The PDF <br/>
              <span className="text-stone-300">Workspace.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-stone-600 font-medium leading-relaxed">
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
            className="w-full flex justify-center md:justify-end"
          >
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
