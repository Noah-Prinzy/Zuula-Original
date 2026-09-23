import { PageTransition } from "@/components/motion/page-transition"

// Pages fill at least the viewport between the header and the phone tab bar, so the footer
// never peeks in on the first screen of a short page.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition className="min-h-[calc(100svh-var(--header-h)-var(--bottom-nav-h))]">{children}</PageTransition>
  )
}
