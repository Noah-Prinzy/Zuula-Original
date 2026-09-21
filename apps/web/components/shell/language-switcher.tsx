"use client"

import { RiTranslate2 } from "@remixicon/react"
import { useTranslations } from "next-intl"

import { useSession } from "@/components/providers/session-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LOCALES, type LocaleCode } from "@/lib/locales"
import { cn } from "@/lib/utils"

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher")
  const { locale, setLocale, switchingLocale } = useSession()
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${t("label")}: ${current.native}`}
          aria-busy={switchingLocale}
          className={cn(switchingLocale && "animate-pulse")}
        >
          <RiTranslate2 aria-hidden />
          <span className="hidden uppercase lg:inline">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(v) => setLocale(v as LocaleCode)}
        >
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code} lang={l.code}>
              {l.native}
              {l.native !== l.label && (
                <span className="ml-auto text-muted-foreground">{l.label}</span>
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
