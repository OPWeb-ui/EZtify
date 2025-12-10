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
                    title="EZtify — Free Online PDF Tools (Private & Secure)"
                    description="All-in-one PDF tools: Convert Images to PDF, PDF to Images, Compress, Merge, and Split PDFs. 100% free, private, and client-side."
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
                    title="About EZtify — Privacy-First PDF Tools"
                    description="Learn about EZtify's mission to provide fast, secure, and client-side PDF tools that respect your privacy."
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