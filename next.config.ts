import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // avoid @hello-pangea/dnd double-render in dev
};

export default nextConfig;
