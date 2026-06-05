import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';
import App from './App.tsx';

const RingChaseApp = lazy(() =>
  import('./ring-chase/RingChaseApp').then((m) => ({ default: m.RingChaseApp }))
);

function RouteLoader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center kb-root">
      <p className="text-kb-mute text-sm uppercase tracking-widest animate-pulse">Loading…</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/ring-chase" element={<RingChaseApp />} />
          <Route path="/ring-chase/*" element={<RingChaseApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>
);
