import Link from "next/link"
import { useTranslations } from "next-intl"

import { Logo } from "@/components/shell/logo"
import { Separator } from "@/components/ui/separator"

const COLUMNS = [
  {
    title: "product",
    links: [
      { label: "verify", href: "/verify" },
      { label: "library", href: "/fact-checks" },
      { label: "whatsappBot", href: "/about#whatsapp" },
      { label: "api", href: "/developers" },
    ],
  },
  {
    title: "organisation",
    links: [
      { label: "about", href: "/about" },
      { label: "methodology", href: "/about#methodology" },
      { label: "independence", href: "/about#independence" },
      { label: "contact", href: "/about#contact" },
    ],
  },
  {
    title: "legal",
    links: [
      { label: "privacy", href: "/legal/privacy" },
      { label: "terms", href: "/legal/terms" },
      { label: "dataProtection", href: "/legal/privacy#dppa" },
    ],
  },
] as const

export function SiteFooter() {
  const t = useTranslations("Footer")
  const tc = useTranslations("Common")
  return (
    <footer className="border-t bg-muted">
      <div className="page-container grid gap-8 py-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">{t("blurb")}</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-2">
            <p className="font-heading text-sm font-semibold">{t(col.title)}</p>
            <ul className="flex flex-col gap-1.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {t(l.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Separator />
      <div className="page-container flex flex-col gap-1 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>{t("copyright", { year: new Date().getFullYear() })}</p>
        <p>{tc("tagline")}</p>
      </div>
    </footer>
  )
}
