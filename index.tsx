import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';
import { LazyMotion, domAnimation } from 'framer-motion';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ThemeProvider>
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>
  </ThemeProvider>
);