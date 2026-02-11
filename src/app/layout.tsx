// src/app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'PyAutomate Studio',
  description: 'Learn Python by building real automation projects',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Pyodide WASM runtime - loaded once, cached by browser */}
        <script src="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js" defer />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <div className="flex flex-col min-h-screen">
          <Nav />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

function Nav() {
  return (
    <nav
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        <span style={{ color: 'var(--accent-blue)' }}>🐍</span>
        <span>PyAutomate Studio</span>
      </Link>
      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <Link href="/" className="hover:underline">Dashboard</Link>
      </div>
    </nav>
  );
}
