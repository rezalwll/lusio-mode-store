import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white shadow-[0_8px_24px_rgba(211,33,58,.18)] hover:bg-brand-dark hover:-translate-y-0.5",
        dark: "bg-ink text-white shadow-sm hover:bg-black hover:-translate-y-0.5",
        outline: "border border-border bg-white text-ink hover:border-ink hover:bg-stone-50",
        ghost: "text-ink hover:bg-stone-100",
        danger: "bg-rose-50 text-rose-700 hover:bg-rose-100",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5",
        lg: "h-13 px-7 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
