import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const repoName = process.env.REPO_NAME || 'pyautomate-studio';

const nextConfig: NextConfig = {
  // Static export — no server needed, perfect for GitHub Pages
  output: 'export',

  // GitHub Pages serves from /<repo-name>/ so we need a basePath in production
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',

  // Disable image optimization (not available in static export)
  images: { unoptimized: true },
};

export default nextConfig;
