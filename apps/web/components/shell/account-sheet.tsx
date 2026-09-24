"use client"

import Link from "next/link"
import {
  RiArrowRightSLine,
  RiCodeSSlashLine,
  RiComputerLine,
  RiDashboardLine,
  RiInformationLine,
  RiLogoutBoxRLine,
  RiMoonLine,
  RiNotification3Line,
  RiNotificationBadgeLine,
  RiPieChartLine,
  RiSunLine,
  RiTimeLine,
  RiUserSettingsLine,
  type RemixiconComponentType,
} from "@remixicon/react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { useNotifications } from "@/components/account/notifications-store"
import { useSession } from "@/components/providers/session-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { LOCALES, type LocaleCode } from "@/lib/locales"
import { ADMINS, REVIEWERS } from "@/lib/navigation"
import { hasAnyRole } from "@/lib/roles"
import { cn, initials } from "@/lib/utils"

// The phone's account tab opens this bottom sheet instead of a page: everything the desktop
// header keeps in its menus (account, workspaces, language, theme, About) in one list within
// thumb reach, so phones need no hamburger menu. Rows are 48px tall.
export function AccountSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user, role, signOut } = useSession()
  const { unread } = useNotifications()
  const t = useTranslations("Nav")
  const tc = useTranslations("Common")
  const tr = useTranslations("Roles")
  const tf = useTranslations("Footer")
  const te = useTranslations("Auth.errors")

  const workspaces = [
    { label: t("items.review"), href: "/review", icon: RiDashboardLine, show: hasAnyRole(role, REVIEWERS) },
    { label: t("items.admin"), href: "/admin", icon: RiPieChartLine, show: hasAnyRole(role, ADMINS) },
  ].filter((w) => w.show)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88svh] text-sm md:hidden">
        <DrawerTitle className="sr-only">{t("accountSheet")}</DrawerTitle>
        <div className="overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
          {user ? (
            <DrawerClose asChild>
              <Link
                href="/account"
                className="press-tint flex items-center gap-3 px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <Avatar size="lg">
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-heading text-base font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {tr(user.role)} · {t("viewProfile")}
                  </span>
                </span>
                <RiArrowRightSLine className="size-5 text-muted-foreground" aria-hidden />
              </Link>
            </DrawerClose>
          ) : (
            <div className="flex flex-col gap-3 px-4 py-4">
              <div>
                <p className="font-heading text-base font-semibold">{t("guestTitle")}</p>
                <DrawerDescription className="text-sm text-muted-foreground">{t("guestBody")}</DrawerDescription>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <DrawerClose asChild>
                  <Button asChild variant="outline" className="h-11">
                    <Link href="/sign-in">{tc("signIn")}</Link>
                  </Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button asChild className="h-11">
                    <Link href="/sign-up">{tc("signUp")}</Link>
                  </Button>
                </DrawerClose>
              </div>
            </div>
          )}

          {workspaces.length > 0 && (
            <Group label={t("workspaces")}>
              {workspaces.map((w) => (
                <Row key={w.href} href={w.href} icon={w.icon} label={w.label} />
              ))}
            </Group>
          )}

          {user && (
            <Group label={t("yourAccount")}>
              <Row href="/account/activity" icon={RiTimeLine} label={t("items.activity")} />
              <Row
                href="/account/notifications"
                icon={RiNotificationBadgeLine}
                label={t("items.notifications")}
                count={unread}
              />
              <Row href="/account/alerts" icon={RiNotification3Line} label={t("items.alerts")} />
              <Row href="/account" icon={RiUserSettingsLine} label={t("items.profile")} />
            </Group>
          )}

          <Group label={t("appearance")}>
            <div className="flex flex-col gap-3 px-2 py-2">
              <LanguagePicker />
              <ThemePicker />
            </div>
          </Group>

          <Group label={t("app")}>
            <Row href="/about" icon={RiInformationLine} label={t("items.about")} />
            <Row href="/developers" icon={RiCodeSSlashLine} label={tf("api")} />
          </Group>

          {user && (
            <div className="border-t px-2 pt-2">
              <DrawerClose asChild>
                <button
                  type="button"
                  onClick={() => signOut().catch(() => toast.error(te("signOutFailed")))}
                  className="press-tint flex h-12 w-full items-center gap-3 px-2 text-left text-destructive outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&_svg]:size-5"
                >
                  <RiLogoutBoxRLine aria-hidden />
                  {tc("signOut")}
                </button>
              </DrawerClose>
            </div>
          )}

          <p className="flex items-center justify-center gap-1 px-4 pt-3 text-xs text-muted-foreground">
            <DrawerClose asChild>
              <Link href="/legal/privacy" className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline">
                {tf("privacy")}
              </Link>
            </DrawerClose>
            <span aria-hidden>·</span>
            <DrawerClose asChild>
              <Link href="/legal/terms" className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline">
                {tf("terms")}
              </Link>
            </DrawerClose>
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t py-2">
      <h2 className="px-4 pt-1 pb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">{label}</h2>
      <ul className="flex flex-col px-2">
        {Array.isArray(children) ? children.map((c, i) => <li key={i}>{c}</li>) : <li>{children}</li>}
      </ul>
    </section>
  )
}

function Row({
  href,
  icon: Icon,
  label,
  count = 0,
}: {
  href: string
  icon: RemixiconComponentType
  label: string
  count?: number
}) {
  return (
    <DrawerClose asChild>
      <Link
        href={href}
        className="press-tint flex h-12 items-center gap-3 px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <Icon className="size-5 text-muted-foreground" aria-hidden />
        <span className="flex-1 truncate">{label}</span>
        {count > 0 && (
          <span className="min-w-5 bg-primary px-1.5 text-center text-xs font-semibold text-primary-foreground tabular-nums">
            {count}
          </span>
        )}
        <RiArrowRightSLine className="size-5 text-muted-foreground" aria-hidden />
      </Link>
    </DrawerClose>
  )
}

// Segmented pickers rather than nested menus: one tap, and the choice is visible at a glance.
function LanguagePicker() {
  const t = useTranslations("LanguageSwitcher")
  const { locale, setLocale, switchingLocale } = useSession()
  return (
    <div role="group" aria-labelledby="sheet-language" className="flex flex-col gap-1.5">
      <span id="sheet-language" className="text-xs text-muted-foreground">
        {t("label")}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={1}
        value={locale}
        onValueChange={(v) => v && setLocale(v as LocaleCode)}
        aria-busy={switchingLocale}
        className={cn("grid w-full grid-cols-3", switchingLocale && "animate-pulse")}
      >
        {LOCALES.map((l) => (
          <ToggleGroupItem
            key={l.code}
            value={l.code}
            lang={l.code}
            className="h-11 w-full truncate data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {l.native}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations("Theme")
  const options = [
    { value: "light", label: t("light"), icon: RiSunLine },
    { value: "dark", label: t("dark"), icon: RiMoonLine },
    { value: "system", label: t("system"), icon: RiComputerLine },
  ]
  return (
    <div role="group" aria-labelledby="sheet-theme" className="flex flex-col gap-1.5">
      <span id="sheet-theme" className="text-xs text-muted-foreground">
        {t("change")}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={theme}
        onValueChange={(v) => v && setTheme(v)}
        className="grid w-full grid-cols-3"
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            className="h-11 w-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <o.icon aria-hidden /> {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
