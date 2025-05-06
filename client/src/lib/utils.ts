import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Indian Rupees (INR)
 * Uses the Indian numbering system (lakh, crore)
 * Example: 123456.78 becomes "₹1,23,456.78"
 */
export function formatINR(amount: number): string {
  // Convert to Indian numbering format (1,23,456.78 instead of 123,456.78)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
}
