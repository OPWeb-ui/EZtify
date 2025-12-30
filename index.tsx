
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';

// Global state for spacebar (panning utility)
(window as any).isSpacePressed = false;
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') (window as any).isSpacePressed = true;
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') (window as any).isSpacePressed = false;
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
