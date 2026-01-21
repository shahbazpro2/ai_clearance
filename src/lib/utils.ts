import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a date string or Date object to a locale string
 * Returns "N/A" if the date is null, undefined, or invalid
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "N/A";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "N/A";
    }
    
    return dateObj.toLocaleString("en-US", options);
  } catch (error) {
    return "N/A";
  }
}

/**
 * Safely formats a date string or Date object to a locale date string
 * Returns "N/A" if the date is null, undefined, or invalid
 */
export function formatDateOnly(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "N/A";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "N/A";
    }
    
    return dateObj.toLocaleDateString("en-US", options);
  } catch (error) {
    return "N/A";
  }
}
