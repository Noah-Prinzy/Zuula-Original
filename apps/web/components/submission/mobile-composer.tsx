"use client"

import { useState } from "react"
import { RiClipboardLine, RiSearchEyeLine } from "@remixicon/react"

import { QuickComposer } from "@/components/submission/quick-composer"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

// Home's composer on phones: a single tappable field, like a search bar, that opens the
// composer in a full-height sheet. Typing a long message into a box halfway down a busy page,
// with the keyboard covering the Verify button, is the worst part of the page on a phone; in
// the sheet the box has the screen to itself and Verify sits just above the keyboard.
// "Paste" opens it with the clipboard already in the box: most claims arrive as a forwarded
// WhatsApp message, so that is usually the whole job.
export function MobileComposer({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [initialText, setInitialText] = useState<string>()

  async function show(withPaste: boolean) {
    let clip: string | undefined
    // Read while the tap still counts as a user gesture, which browsers require. Refused or
    // unsupported, the sheet just opens empty with the keyboard up.
    if (withPaste) clip = (await navigator.clipboard?.readText().catch(() => undefined))?.trim() || undefined
    setInitialText(clip)
    setOpen(true)
  }

  return (
    <>
      <div className={cn("flex border bg-card text-left text-foreground", className)}>
        <button
          type="button"
          onClick={() => void show(false)}
          aria-haspopup="dialog"
          className="press-tint flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 text-base text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <RiSearchEyeLine className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="truncate">Paste a message, claim or link…</span>
        </button>
        <button
          type="button"
          onClick={() => void show(true)}
          aria-haspopup="dialog"
          className="press-tint flex min-h-14 shrink-0 items-center gap-1.5 border-l px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <RiClipboardLine className="size-5" aria-hidden />
          Paste
        </button>
      </div>

      {/* vaul resizes the sheet to the visual viewport while the keyboard is up (repositionInputs,
          on by default), so Verify at its bottom stays above the keyboard. */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent
          className="h-[calc(100dvh-1.5rem)] data-[vaul-drawer-direction=bottom]:max-h-none md:hidden"
        >
          <div className="px-4 pt-3 pb-1">
            <DrawerTitle className="text-base font-semibold">Check a claim</DrawerTitle>
            <DrawerDescription className="text-sm">
              Paste a message or link, or add a photo, video or voice note.
            </DrawerDescription>
          </div>
          {open && <QuickComposer sheet initialText={initialText} className="min-h-0" />}
        </DrawerContent>
      </Drawer>
    </>
  )
}

