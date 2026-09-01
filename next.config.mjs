/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next build` and `next dev` both write to `.next` by default, so kicking off
  // a build while the dev server is running wipes the manifests and chunks it is
  // serving from — every route then returns a bare "Internal Server Error" until
  // the dev server is restarted. Setting NEXT_DIST_DIR sends a one-off build to
  // its own folder instead, so verification builds can never disturb `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  devIndicators: {
    // The dev badge defaults to the bottom-left, right on top of the /models
    // rail's contact link — you can't hover or click it in dev. Production is
    // unaffected either way; this just moves the overlay out of the way.
    position: "bottom-right",
  },
  images: {
    // Serve AVIF/WebP (far smaller than JPEG/PNG) when the browser supports it.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  experimental: {
    // Tree-shake these heavy packages so only the pieces actually used land in
    // the bundle (huge for lucide-react's icon barrel and framer-motion, and
    // trims three / drei). As the app grows this keeps First Load JS in check.
    optimizePackageImports: [
      "framer-motion",
      "gsap",
      "lucide-react",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "split-type",
    ],
  },
};

export default nextConfig;
