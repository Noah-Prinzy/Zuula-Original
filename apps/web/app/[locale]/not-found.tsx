import type { Metadata } from "next"
import Link from "next/link"
import { RiArrowRightLine, RiSearchLine } from "@remixicon/react"
import { getTranslations } from "next-intl/server"

import { ZuulaMarkOutline } from "@/components/brand/zuula-mark"
import { Logo } from "@/components/shell/logo"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { Button } from "@/components/ui/button"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Errors")
  return { title: t("notFoundMetaTitle"), robots: { index: false } }
}

// Root 404: rendered inside the root layout only, so it brings its own minimal header.
export default async function NotFound() {
  const t = await getTranslations("Errors")

  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-hidden">
      <header className="flex h-16 page-container items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <ZuulaMarkOutline className="pointer-events-none absolute -right-24 -bottom-28 -z-10 size-[34rem] text-primary opacity-[0.07]" />
      <main id="main" className="flex page-container flex-1 items-center py-16">
        <div className="flex max-w-2xl flex-col items-start gap-5">
          <p className="font-heading text-7xl font-bold tracking-tight text-primary md:text-8xl">
            404
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {t("notFoundTitle")}
          </h1>
          <p className="text-base text-balance text-muted-foreground md:text-lg">
            {t("notFoundDescription")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/fact-checks">
                <RiSearchLine aria-hidden /> {t("browseLibrary")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                {t("home")} <RiArrowRightLine aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
