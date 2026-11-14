import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Each variant has a pressed (active) state, so taps give feedback
        // on touch screens where there is no hover
        default:
          "bg-primary-solid text-primary-solid-foreground hover:bg-primary-solid/90 active:bg-primary-solid/80",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground active:bg-active-bg dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:active:bg-active-bg",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-active-bg",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:bg-active-bg dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // One height per size, so pages don't set their own:
      // sm 32px, default 36px, md 40px (panels), lg 44px (touch targets),
      // xl 48px (a page's main action)
      size: {
        // Sizes under 44px get a larger invisible hit area on touch screens
        default: "relative touch-target h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "relative touch-target h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        md: "h-10 px-4 has-[>svg]:px-3",
        lg: "h-11 px-5 has-[>svg]:px-4",
        xl: "h-12 px-6 text-base has-[>svg]:px-5",
        icon: "relative touch-target size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
