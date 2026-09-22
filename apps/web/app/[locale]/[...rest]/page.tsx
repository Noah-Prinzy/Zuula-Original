import { notFound } from "next/navigation"

// Unknown URLs are rewritten into [locale] by proxy.ts; send them to [locale]/not-found.tsx
// (branded, translated) instead of Next's bare default 404.
export default function CatchAll() {
  notFound()
}
