"use client"

import { RiTranslate2 } from "@remixicon/react"

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

export function LanguageSwitcher() {
  const { locale, setLocale } = useSession()
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Language: ${current.label}`}>
          <RiTranslate2 aria-hidden />
          <span className="hidden uppercase lg:inline">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
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
