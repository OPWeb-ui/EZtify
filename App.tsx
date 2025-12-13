
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { SEO } from './components/SEO';
import { ScrollToTop } from './components/ScrollToTop';

// Lazy Load Pages (Code Splitting)
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const About = React.lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const ImageToPdfPage = React.lazy(() => import('./pages/ImageToPdf').then(module => ({ default: module.ImageToPdfPage })));
const PdfToImagePage = React.lazy(() => import('./pages/PdfToImage').then(module => ({ default: module.PdfToImagePage })));
const CompressPdfPage = React.lazy(() => import('./pages/CompressPdf').then(module => ({ default: module.CompressPdfPage })));
const MergePdfPage = React.lazy(() => import('./pages/MergePdf').then(module => ({ default: module.MergePdfPage })));
const SplitPdfPage = React.lazy(() => import('./pages/SplitPdf').then(module => ({ default: module.SplitPdfPage })));
const ZipFilesPage = React.lazy(() => import('./pages/ZipFiles').then(module => ({ default: module.ZipFilesPage })));
const WordToPdfPage = React.lazy(() => import('./pages/WordToPdf').then(module => ({ default: module.WordToPdfPage })));
const PdfToWordPage = React.lazy(() => import('./pages/PdfToWord').then(module => ({ default: module.PdfToWordPage })));
const PdfToPptxPage = React.lazy(() => import('./pages/PdfToPptx').then(module => ({ default: module.PdfToPptxPage })));
const PptxToPdfPage = React.lazy(() => import('./pages/PptxToPdf').then(module => ({ default: module.PptxToPdfPage })));
const ReorderPdfPage = React.lazy(() => import('./pages/ReorderPdf').then(module => ({ default: module.ReorderPdfPage })));
const RotatePdfPage = React.lazy(() => import('./pages/RotatePdf').then(module => ({ default: module.RotatePdfPage })));
const DeletePdfPagesPage = React.lazy(() => import('./pages/DeletePdfPages').then(module => ({ default: module.DeletePdfPagesPage })));
const UnlockPdfPage = React.lazy(() => import('./pages/UnlockPdf').then(module => ({ default: module.UnlockPdfPage })));
const AddPageNumbersPage = React.lazy(() => import('./pages/AddPageNumbers').then(module => ({ default: module.AddPageNumbersPage })));
const RedactPdfPage = React.lazy(() => import('./pages/RedactPdf').then(module => ({ default: module.RedactPdfPage })));
const GrayscalePdfPage = React.lazy(() => import('./pages/GrayscalePdf').then(module => ({ default: module.GrayscalePdfPage })));
const CodeEditorPage = React.lazy(() => import('./pages/CodeEditor').then(module => ({ default: module.CodeEditorPage })));

const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Landing Page (Main Entry Point) */}
            <Route 
              index 
              element={
                <>
                  <SEO 
                    title="EZtify — Free Online File Utilities (Private & Secure)"
                    description="A comprehensive suite of client-side tools: PDF converters, code editors, file compression, and more. Fast, secure, and 100% private."
                    canonical="https://eztify.pages.dev/"
                  />
                  <Home />
                </>
              } 
            />

            {/* About Page */}
            <Route 
              path="about" 
              element={
                <>
                  <SEO 
                    title="About EZtify — Privacy-First Web Tools"
                    description="Learn about EZtify's mission to provide fast, secure, and client-side utilities that respect your privacy."
                    canonical="https://eztify.com/#/about"
                  />
                  <About />
                </>
              } 
            />
            
            {/* Tool: Image to PDF */}
            <Route 
              path="images-to-pdf" 
              element={
                <>
                  <SEO 
                    title="Images to PDF Converter — Free, Fast & Private"
                    description="Convert JPG, PNG, WebP images to PDF instantly in your browser. No uploads, no file limits, secure and free."
                    canonical="https://eztify.com/#/images-to-pdf"
                  />
                  <ImageToPdfPage />
                </>
              } 
            />

            {/* Tool: PDF to Image */}
            <Route 
              path="pdf-to-images" 
              element={
                <>
                    <SEO 
                    title="PDF to JPG/PNG Converter — Extract Images from PDF"
                    description="Convert PDF pages to high-quality images (JPG or PNG) for free. Extract images from PDF securely in your browser."
                    canonical="https://eztify.com/#/pdf-to-images"
                  />
                  <PdfToImagePage />
                </>
              } 
            />

            {/* Tool: Word to PDF */}
            <Route 
              path="word-to-pdf" 
              element={
                <>
                  <SEO 
                    title="Word to PDF Online — EZtify"
                    description="Convert Word (DOCX) to PDF in your browser. Fast, private, and 100% client-side."
                    canonical="https://eztify.com/#/word-to-pdf"
                  />
                  <WordToPdfPage />
                </>
              } 
            />

            {/* Tool: PDF to Word */}
            <Route 
              path="pdf-to-word" 
              element={
                <>
                  <SEO 
                    title="PDF to Word Online — EZtify"
                    description="Convert PDF to an editable Word (DOCX) document in your browser. Fast, private, and 100% client-side."
                    canonical="https://eztify.com/#/pdf-to-word"
                  />
                  <PdfToWordPage />
                </>
              } 
            />
            
            {/* Tool: PDF to PowerPoint */}
            <Route 
              path="pdf-to-pptx" 
              element={
                <>
                  <SEO 
                    title="PDF to PowerPoint Online — EZtify"
                    description="Convert each PDF page into a slide in a PowerPoint (PPTX) presentation. Fast, private, and client-side."
                    canonical="https://eztify.com/#/pdf-to-pptx"
                  />
                  <PdfToPptxPage />
                </>
              } 
            />

            {/* Tool: PowerPoint to PDF */}
            <Route 
              path="pptx-to-pdf" 
              element={
                <>
                  <SEO 
                    title="PowerPoint to PDF Online — EZtify"
                    description="Convert PowerPoint (PPTX) slides to PDF documents. Fast, private, and client-side."
                    canonical="https://eztify.com/#/pptx-to-pdf"
                  />
                  <PptxToPdfPage />
                </>
              } 
            />

            {/* Tool: Compress PDF */}
            <Route 
              path="compress-pdf" 
              element={
                <>
                  <SEO 
                    title="Compress PDF Online — Reduce PDF File Size Free"
                    description="Optimize and reduce PDF file size without losing quality. Fast, client-side PDF compression tool."
                    canonical="https://eztify.com/#/compress-pdf"
                  />
                  <CompressPdfPage />
                </>
              } 
            />

            {/* Tool: Merge PDF */}
            <Route 
              path="merge-pdf" 
              element={
                <>
                  <SEO 
                    title="Merge PDF — Combine PDF Files Online Free"
                    description="Combine multiple PDF files into one document instantly. Drag and drop to reorder, merge and download."
                    canonical="https://eztify.com/#/merge-pdf"
                  />
                  <MergePdfPage />
                </>
              } 
            />

            {/* Tool: Split PDF */}
            <Route 
              path="split-pdf" 
              element={
                <>
                  <SEO 
                    title="Split PDF — Extract Pages from PDF Online"
                    description="Split PDF files or extract specific pages to a new document. Free, secure, and easy to use."
                    canonical="https://eztify.com/#/split-pdf"
                  />
                  <SplitPdfPage />
                </>
              } 
            />
            
            {/* Tool: Reorder PDF */}
            <Route 
              path="reorder-pdf" 
              element={
                <>
                  <SEO 
                    title="Reorder PDF Pages — Organize PDF Online"
                    description="Drag and drop PDF pages to change their order. Delete unwanted pages and download the new file."
                    canonical="https://eztify.com/#/reorder-pdf"
                  />
                  <ReorderPdfPage />
                </>
              } 
            />
            
            {/* Tool: Rotate PDF */}
            <Route 
              path="rotate-pdf" 
              element={
                <>
                  <SEO 
                    title="Rotate PDF Pages — Online PDF Rotator"
                    description="Rotate PDF pages permanently online for free. Rotate all pages or specific pages."
                    canonical="https://eztify.com/#/rotate-pdf"
                  />
                  <RotatePdfPage />
                </>
              } 
            />

            {/* Tool: Delete PDF Pages */}
            <Route 
              path="delete-pdf-pages" 
              element={
                <>
                  <SEO 
                    title="Delete PDF Pages — Remove Pages from PDF"
                    description="Easily delete pages from your PDF file online. Select and remove unwanted pages securely in your browser."
                    canonical="https://eztify.com/#/delete-pdf-pages"
                  />
                  <DeletePdfPagesPage />
                </>
              } 
            />

             {/* Tool: Unlock PDF */}
            <Route 
              path="unlock-pdf" 
              element={
                <>
                  <SEO 
                    title="Unlock PDF — Remove PDF Password Online"
                    description="Remove passwords from encrypted PDF files. Securely unlock your PDF in the browser."
                    canonical="https://eztify.com/#/unlock-pdf"
                  />
                  <UnlockPdfPage />
                </>
              } 
            />

            {/* Tool: Add Page Numbers */}
            <Route 
              path="add-page-numbers" 
              element={
                <>
                  <SEO 
                    title="Add Page Numbers to PDF — Online & Free"
                    description="Insert page numbers into PDF documents. Customize position, style, and range."
                    canonical="https://eztify.com/#/add-page-numbers"
                  />
                  <AddPageNumbersPage />
                </>
              } 
            />

            {/* Tool: Redact PDF */}
            <Route 
              path="redact-pdf" 
              element={
                <>
                  <SEO 
                    title="Redact PDF Online — Securely Hide Text & Images"
                    description="Permanently black out sensitive information from your PDF files. 100% private, client-side redaction."
                    canonical="https://eztify.com/#/redact-pdf"
                  />
                  <RedactPdfPage />
                </>
              } 
            />

            {/* Tool: Grayscale PDF */}
            <Route 
              path="grayscale-pdf" 
              element={
                <>
                  <SEO 
                    title="Grayscale PDF — Convert to Black & White Online"
                    description="Convert your color PDF to grayscale (black and white) instantly. Free, private, and purely client-side."
                    canonical="https://eztify.com/#/grayscale-pdf"
                  />
                  <GrayscalePdfPage />
                </>
              } 
            />

            {/* Tool: Code Editor */}
            <Route 
              path="code-editor" 
              element={
                <>
                  <SEO 
                    title="Online Code Editor — Text Editor with Syntax Highlighting"
                    description="Free, private online code editor. Edit HTML, CSS, JS, JSON, and text files. No uploads required."
                    canonical="https://eztify.com/#/code-editor"
                  />
                  <CodeEditorPage />
                </>
              } 
            />

            {/* Tool: Zip Files */}
            <Route 
              path="zip-it" 
              element={
                <>
                  <SEO 
                    title="Zip It! — Create ZIP Files Online (Private & Fast)"
                    description="Create ZIP archives locally in your browser. Combine multiple files instantly with no server uploads."
                    canonical="https://eztify.com/#/zip-it"
                  />
                  <ZipFilesPage />
                </>
              } 
            />

            {/* Fallback - Force Redirect to Home for any unknown route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </GlobalErrorBoundary>
  );
};

export default App;
