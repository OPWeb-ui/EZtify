
import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../Skeleton';

interface Slide {
  id: number;
  text: string[];
  imageCount: number;
}

export const PptxViewer: React.FC<{ file: File }> = ({ file }) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPptx = async () => {
      try {
        setLoading(true);
        const zip = await JSZip.loadAsync(file);
        
        // Find slides
        const slideFiles = Object.keys(zip.files).filter(path => 
          path.startsWith('ppt/slides/slide') && path.endsWith('.xml')
        );
        
        // Sort numerically
        slideFiles.sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
          const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
          return numA - numB;
        });

        const parsedSlides: Slide[] = [];
        const parser = new DOMParser();

        for (let i = 0; i < slideFiles.length; i++) {
          const path = slideFiles[i];
          const xmlStr = await zip.file(path)?.async('string');
          if (!xmlStr) continue;

          const doc = parser.parseFromString(xmlStr, 'application/xml');
          
          // Extract text
          const textNodes = doc.getElementsByTagName('a:t');
          const textContent: string[] = [];
          for (let j = 0; j < textNodes.length; j++) {
             const t = textNodes[j].textContent;
             if (t && t.trim()) textContent.push(t);
          }

          // Count images (via relationships usually, but simplified here via blip refs in XML or just placeholder)
          const images = doc.getElementsByTagName('a:blip');

          parsedSlides.push({
            id: i + 1,
            text: textContent,
            imageCount: images.length
          });
        }

        setSlides(parsedSlides);
      } catch (err) {
        console.error("Error loading PPTX:", err);
        setError("Failed to load presentation preview.");
      } finally {
        setLoading(false);
      }
    };
    loadPptx();
  }, [file]);

  if (loading) {
    return (
      <div className="bg-slate-100 dark:bg-charcoal-900 p-6 space-y-6 min-h-[500px]">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-charcoal-800 p-8 shadow-sm rounded-xl border border-slate-200 dark:border-charcoal-700 aspect-video flex flex-col relative overflow-hidden">
            <Skeleton className="absolute top-8 right-8 w-20 h-4 bg-slate-200 dark:bg-charcoal-700" />
            <div className="flex-1 space-y-4 mt-8">
               <Skeleton className="w-1/2 h-8 mb-6 bg-slate-200 dark:bg-charcoal-700" />
               <Skeleton className="w-full h-4 bg-slate-200 dark:bg-charcoal-700" />
               <Skeleton className="w-5/6 h-4 bg-slate-200 dark:bg-charcoal-700" />
               <Skeleton className="w-4/6 h-4 bg-slate-200 dark:bg-charcoal-700" />
            </div>
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-charcoal-700">
               <Skeleton className="w-32 h-3 bg-slate-200 dark:bg-charcoal-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) return <div className="text-center p-8 text-rose-500">{error}</div>;

  return (
    <div className="bg-slate-100 dark:bg-charcoal-900 p-6 space-y-6 min-h-[500px]">
      {slides.length === 0 ? (
        <div className="text-center text-charcoal-500">No content found in slides.</div>
      ) : (
        slides.map((slide) => (
          <div key={slide.id} className="bg-white dark:bg-charcoal-800 p-8 shadow-sm rounded-xl border border-slate-200 dark:border-charcoal-700 aspect-video flex flex-col relative overflow-hidden">
            <span className="absolute top-4 right-4 text-xs font-bold text-slate-300 dark:text-charcoal-600">Slide {slide.id}</span>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
              {slide.text.length > 0 ? (
                slide.text.map((line, idx) => (
                  <p key={idx} className={`text-charcoal-800 dark:text-slate-200 ${idx === 0 && slide.text.length > 1 ? 'text-xl font-bold' : 'text-base'}`}>
                    {line}
                  </p>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 italic">No text content</div>
              )}
            </div>
            {slide.imageCount > 0 && (
               <div className="mt-4 pt-4 border-t border-slate-100 dark:border-charcoal-700 text-xs text-charcoal-400">
                 {slide.imageCount} image(s) on this slide
               </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
