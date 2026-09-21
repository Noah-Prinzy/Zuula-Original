import { getLocale } from "next-intl/server"

import { createFormat, type Format } from "@/lib/format"

/** Formatter for the current UI language, in async server components and generateMetadata. */
export async function getFormat(): Promise<Format> {
  return createFormat(await getLocale())
}
