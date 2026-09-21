import Image from "next/image"
import Link from "next/link"
import { RiCheckLine } from "@remixicon/react"

import { ZuulaMarkOutline } from "@/components/brand/zuula-mark"
import { PHOTO_QUALITY, PhotoCredit } from "@/components/decor/photo-hero"
import { PHOTOS } from "@/components/decor/photos"
import { Logo } from "@/components/shell/logo"
import { RoleSwitcher } from "@/components/shell/role-switcher"
import { ThemeToggle } from "@/components/shell/theme-toggle"

const POINTS = [
  "Check messages, links, photos, voice notes and videos",
  "See the sources behind every verdict",
  "Rate verdicts and help train Zuula",
  "Get alerts about misinformation on topics you follow",
]

// Split screen: form on the left, brand panel on the right (large screens only).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <RoleSwitcher />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="flex flex-col">
          <header className="page-container flex h-16 items-center justify-between">
            <Logo />
            <ThemeToggle />
          </header>
          <main id="main" className="page-container flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-md">{children}</div>
          </main>
          <footer className="page-container flex flex-wrap justify-between gap-2 py-6 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Zuula · Victoria University CIT</span>
            <span className="flex gap-4">
              <Link href="/legal/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/legal/terms" className="hover:text-foreground">
                Terms
              </Link>
            </span>
          </footer>
        </div>

        <aside
          aria-hidden
          className="relative isolate hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
        >
          <Image
            src={PHOTOS.phoneOnCrimson.src}
            alt=""
            fill
            priority
            quality={PHOTO_QUALITY}
            sizes="max(50vw, 150vh)"
            className="-z-20 object-cover object-[30%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-primary via-primary/75 to-primary/10 dark:from-black/90 dark:via-primary/70" />
          <ZuulaMarkOutline className="pointer-events-none absolute -right-24 -bottom-24 size-[36rem] opacity-10" />
          <p className="font-heading text-sm font-semibold tracking-widest uppercase opacity-80">
            Uganda Fact-Guard
          </p>
          <div className="relative flex max-w-lg flex-col gap-8">
            <h2 className="font-heading text-4xl leading-tight font-bold text-balance xl:text-5xl">
              Stop misinformation before it spreads.
            </h2>
            <ul className="flex flex-col gap-3 text-base">
              {POINTS.map((p) => (
                <li key={p} className="flex gap-3">
                  <RiCheckLine className="mt-0.5 size-5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-sm opacity-80">
            Developed by the Centre for Intelligent Technologies, Victoria University Kampala.
          </p>
          <PhotoCredit photo={PHOTOS.phoneOnCrimson} tabIndex={-1} className="absolute top-4 right-4" />
        </aside>
      </div>
    </div>
  )
}
