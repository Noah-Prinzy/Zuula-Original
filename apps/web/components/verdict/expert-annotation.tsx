import { RiUserStarLine } from "@remixicon/react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ExpertAnnotation as Annotation } from "@/lib/types/fact-check"
import { cn, initials } from "@/lib/utils"
import { formatDate } from "@/lib/verdicts"

// FR-EXPLAIN-08: manual notes added by Expert Reviewers.
export function ExpertAnnotation({
  annotation,
  className,
}: {
  annotation: Annotation
  className?: string
}) {
  return (
    <figure className={cn("flex gap-3 border-l-2 border-primary bg-muted/40 p-3", className)}>
      <Avatar className="size-8">
        <AvatarFallback>{initials(annotation.author)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        <figcaption className="flex flex-wrap items-center gap-x-2 text-xs">
          <span className="font-semibold">{annotation.author}</span>
          <span className="inline-flex items-center gap-0.5 text-muted-foreground">
            <RiUserStarLine className="size-3" aria-hidden />
            {annotation.role}
          </span>
          <time dateTime={annotation.createdAt} className="text-muted-foreground">
            {formatDate(annotation.createdAt)}
          </time>
        </figcaption>
        <blockquote className="text-sm">{annotation.body}</blockquote>
      </div>
    </figure>
  )
}
