/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
  reactStrictMode: true,
  // Importante: NÃO use `output: 'export'` aqui.
};

export default nextConfig;
