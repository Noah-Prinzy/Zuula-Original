import { cn } from "@/lib/utils"

export type ArticleSection = {
  id: string
  title: string
  content: React.ReactNode
}

// Shared layout for long anchor-linked content pages (Privacy, Terms, developer docs): a
// sticky section list beside the text. Anchors are also targeted from elsewhere, e.g. the
// footer's Legal column links to /legal/privacy#dppa.
export function ArticleSections({
  sections,
  className,
}: {
  sections: ArticleSection[]
  /** Content column width etc. Defaults to a comfortable reading measure. */
  className?: string
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <nav aria-label="Sections on this page" className="hidden lg:block">
        <ul className="sticky top-20 flex flex-col gap-0.5 text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="press-tint block border-l-2 border-transparent px-3 py-1.5 text-muted-foreground transition-colors outline-none hover:border-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className={cn("flex min-w-0 max-w-3xl flex-col gap-10", className)}>
        {sections.map((s) => (
          <section key={s.id} id={s.id} data-reveal className="flex scroll-mt-24 flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">{s.title}</h2>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-3 [&_a:hover]:text-primary [&_li]:ml-4 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5">
              {s.content}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
