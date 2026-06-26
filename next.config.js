/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      "ppu-paddle-ocr",
      "ppu-ocv",
      "onnxruntime-node",
      "@napi-rs/canvas",
    ],
  },
};

module.exports = nextConfig;
