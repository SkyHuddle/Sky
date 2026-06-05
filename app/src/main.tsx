import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';
import App from './App.tsx';
import { RingChaseApp } from './ring-chase/RingChaseApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/ring-chase" element={<RingChaseApp />} />
        <Route path="/ring-chase/*" element={<RingChaseApp />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
