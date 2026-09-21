import Link from "next/link"

import { Logo } from "@/components/shell/logo"
import { Separator } from "@/components/ui/separator"

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Verify", href: "/verify" },
      { label: "Library", href: "/fact-checks" },
      { label: "WhatsApp bot", href: "/about#whatsapp" },
      { label: "API", href: "/developers" },
    ],
  },
  {
    title: "Organisation",
    links: [
      { label: "About", href: "/about" },
      { label: "Methodology", href: "/about#methodology" },
      { label: "Editorial independence", href: "/about#independence" },
      { label: "Contact", href: "/about#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Data protection (DPPA 2019)", href: "/legal/privacy#dppa" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="page-container grid gap-8 py-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            AI-powered misinformation detection for Uganda. Developed by the Centre for
            Intelligent Technologies, Victoria University Kampala.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-2">
            <p className="font-heading text-sm font-semibold">{col.title}</p>
            <ul className="flex flex-col gap-1.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Separator />
      <div className="page-container flex flex-col gap-1 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Zuula · Victoria University CIT</p>
        <p>Uganda Fact-Guard</p>
      </div>
    </footer>
  )
}
