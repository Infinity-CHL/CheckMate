import * as React from "react"

import { cn } from "@/lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-10 w-full rounded-xl border border-input/80 bg-background/70 px-3 text-base shadow-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:opacity-60 md:text-xs",
        className
      )}
      {...props}
    />
  )
}

export { Select }
