import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'
import App from './App.tsx'

// ─── Global fetch patch ──────────────────────────────────────────────────────
// Prepend VITE_API_URL to any relative /api/ or /uploads/ request.
// This means every fetch('/api/...') call in every component works in production
// without each file needing to know the backend URL.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined ?? '').replace(/\/$/, '');

if (API_BASE) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (typeof input === 'string' && (input.startsWith('/api/') || input.startsWith('/uploads/'))) {
      return originalFetch(`${API_BASE}${input}`, init);
    }
    return originalFetch(input, init);
  };
}
// ────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
