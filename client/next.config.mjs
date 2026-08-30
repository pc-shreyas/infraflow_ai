import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Explicitly select the shared workspace as Turbopack's root. Next 16
  // requires an absolute path and exposes this as a top-level option.
  turbopack: {
    root: path.resolve(configDirectory, '..'),
  },
  // Ensure Pages Router is used (not App Router)
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
};

export default nextConfig;
