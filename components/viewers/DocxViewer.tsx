
import React, { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { Loader2 } from 'lucide-react';

export const DocxViewer: React.FC<{ file: File }> = ({ file }) => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDoc = async () => {
      try {
        setLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        // Sanitize the HTML output
        const cleanHtml = DOMPurify.sanitize(result.value);
        setHtml(cleanHtml);
      } catch (err) {
        console.error("Error loading DOCX:", err);
        setError("Failed to load document preview.");
      } finally {
        setLoading(false);
      }
    };
    loadDoc();
  }, [file]);

  if (loading) return <div className="flex items-center justify-center p-12 text-charcoal-500"><Loader2 className="animate-spin w-6 h-6 mr-2" /> Converting...</div>;
  if (error) return <div className="text-center p-8 text-rose-500">{error}</div>;

  return (
    <div 
      className="prose prose-sm md:prose-base max-w-none bg-white p-8 md:p-12 shadow-sm min-h-[500px]"
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
};
