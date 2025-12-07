import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ImageToPdfPage } from './pages/ImageToPdf';
import { PdfToImagePage } from './pages/PdfToImage';
import { CompressPdfPage } from './pages/CompressPdf';
import { MergePdfPage } from './pages/MergePdf';
import { SplitPdfPage } from './pages/SplitPdf';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/image-to-pdf" replace />} />
          <Route path="image-to-pdf" element={<ImageToPdfPage />} />
          <Route path="pdf-to-image" element={<PdfToImagePage />} />
          <Route path="compress-pdf" element={<CompressPdfPage />} />
          <Route path="merge-pdf" element={<MergePdfPage />} />
          <Route path="split-pdf" element={<SplitPdfPage />} />
          <Route path="*" element={<Navigate to="/image-to-pdf" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;