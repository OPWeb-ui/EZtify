
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import DOMPurify from 'dompurify';
import { Loader2 } from 'lucide-react';

export const ExcelViewer: React.FC<{ file: File }> = ({ file }) => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSheet = async () => {
      try {
        setLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
            throw new Error("No sheets found");
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to HTML table
        const htmlStr = XLSX.utils.sheet_to_html(worksheet, { id: 'excel-table', editable: false });
        
        // Sanitize
        setHtml(DOMPurify.sanitize(htmlStr));
      } catch (err) {
        console.error("Error loading Excel:", err);
        setError("Failed to load spreadsheet preview.");
      } finally {
        setLoading(false);
      }
    };
    loadSheet();
  }, [file]);

  if (loading) return <div className="flex items-center justify-center p-12 text-charcoal-500"><Loader2 className="animate-spin w-6 h-6 mr-2" /> Processing...</div>;
  if (error) return <div className="text-center p-8 text-rose-500">{error}</div>;

  return (
    <div className="overflow-auto bg-white p-4 shadow-sm min-h-[500px]">
      <style>{`
        table { border-collapse: collapse; width: 100%; font-size: 13px; font-family: sans-serif; }
        td, th { border: 1px solid #e2e8f0; padding: 6px 12px; white-space: nowrap; }
        th { background-color: #f8fafc; font-weight: 600; text-align: left; }
        tr:nth-child(even) { background-color: #fcfcfc; }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};
