import * as React from "react"
import { cn } from "@/lib/utils"

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty" className={cn("flex flex-col items-center justify-center gap-5 rounded-lg border border-dashed border-border bg-background/50 px-6 py-14 text-center", className)} {...props} />
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-header" className={cn("flex max-w-sm flex-col items-center gap-2", className)} {...props} />
}

function EmptyMedia({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-media" className={cn("flex size-12 items-center justify-center rounded-lg border border-border bg-card text-secondary", className)} {...props} />
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="empty-title" className={cn("text-lg font-semibold text-foreground", className)} {...props} />
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="empty-description" className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="empty-content" className={cn("flex items-center justify-center", className)} {...props} />
}

export { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent }
