import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency?: string): string {
  const selectedCurrency = currency || localStorage.getItem("currency") || "UZS"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: selectedCurrency,
  }).format(amount)
}

