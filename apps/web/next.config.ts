import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // 90 keeps decorative photography crisp on high-DPI screens (components/decor).
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
  },
}

export default nextConfig
