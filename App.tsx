
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { SEO } from './components/SEO';
import { ScrollToTop } from './components/ScrollToTop';

// Lazy Load Pages
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const About = React.lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const FAQ = React.lazy(() => import('./pages/FAQ').then(module => ({ default: module.FAQ })));
const PdfWorkspacePage = React.lazy(() => import('./pages/PdfMultiTool').then(module => ({ default: module.PdfWorkspacePage })));
const ImageToPdfPage = React.lazy(() => import('./pages/ImageToPdf').then(module => ({ default: module.ImageToPdfPage })));
const PdfToImagePage = React.lazy(() => import('./pages/PdfToImage').then(module => ({ default: module.PdfToImagePage })));
const CompressPdfPage = React.lazy(() => import('./pages/CompressPdf').then(module => ({ default: module.CompressPdfPage })));
const PdfToZipPage = React.lazy(() => import('./pages/PdfToZip').then(module => ({ default: module.PdfToZipPage })));
const PdfToPptxPage = React.lazy(() => import('./pages/PdfToPptx').then(module => ({ default: module.PdfToPptxPage })));
const BatchRenamePdfPage = React.lazy(() => import('./pages/BatchRenamePdf').then(module => ({ default: module.BatchRenamePdfPage })));
const EditPdfMetadataPage = React.lazy(() => import('./pages/EditPdfMetadata').then(module => ({ default: module.EditPdfMetadataPage })));

const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route element={<PublicLayout />}>
              <Route index element={<><SEO title="EZtify — PDF Workspace & Utilities" description="Merge, split, organize PDFs and create secure ZIP archives entirely in your browser." canonical="https://eztify.pages.dev/" /><Home /></>} />
              <Route path="about" element={<><SEO title="About EZtify — Privacy-First Web Tools" description="Learn about EZtify's mission to provide fast, secure, and client-side utilities that respect your privacy." canonical="https://eztify.com/#/about" /><About /></>} />
              <Route path="faq" element={<><SEO title="EZtify Support — FAQ & Troubleshooting" description="Answers to common questions about file formats, privacy, and browser support." canonical="https://eztify.com/#/faq" /><FAQ /></>} />
            </Route>
            
            <Route path="pdf-workspace" element={<><SEO title="PDF Workspace — Merge, Split, Rotate & Organize PDF" description="A powerful all-in-one PDF editor to merge, split, rotate, delete, and organize pages securely in your browser." canonical="https://eztify.com/#/pdf-workspace" /><PdfWorkspacePage /></>} />
            <Route path="image-to-pdf" element={<><SEO title="Image to PDF — Convert Photos to PDF" description="Convert JPG, PNG, and WEBP images to PDF instantly in your browser." canonical="https://eztify.com/#/image-to-pdf" /><ImageToPdfPage /></>} />
            <Route path="pdf-to-image" element={<><SEO title="PDF to Image — Extract Pages as Images" description="Extract high-quality images from PDF documents securely in your browser." canonical="https://eztify.com/#/pdf-to-image" /><PdfToImagePage /></>} />
            <Route path="pdf-to-zip" element={<><SEO title="PDF to ZIP — Batch Extract & Archive" description="Convert PDF pages to images and download them as a ZIP file." canonical="https://eztify.com/#/pdf-to-zip" /><PdfToZipPage /></>} />
            <Route path="pdf-to-pptx" element={<><SEO title="PDF to PPTX — Convert PDF to PowerPoint" description="Convert PDF documents to editable PowerPoint (PPTX) slides online." canonical="https://eztify.com/#/pdf-to-pptx" /><PdfToPptxPage /></>} />
            <Route path="compress-pdf" element={<><SEO title="Compress PDF — Reduce File Size" description="Compress PDF documents online without losing quality." canonical="https://eztify.com/#/compress-pdf" /><CompressPdfPage /></>} />
            <Route path="batch-rename-pdf" element={<><SEO title="Batch PDF Rename — Rename Multiple Files" description="Rename multiple PDF files in bulk with prefixes, suffixes, and numbering sequences." canonical="https://eztify.com/#/batch-rename-pdf" /><BatchRenamePdfPage /></>} />
            <Route path="edit-pdf-metadata" element={<><SEO title="PDF Metadata Editor — View & Update PDF Properties" description="Read and update PDF document metadata like title, author, and keywords instantly in your browser." canonical="https://eztify.com/#/edit-pdf-metadata" /><EditPdfMetadataPage /></>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </GlobalErrorBoundary>
  );
};

export default App;
