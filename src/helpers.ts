import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

/**
 * A utility function that takes multiple class names (or other class value
 * types) and merges them into a single class string.
 *
 * @param inputs - Multiple class names or other class value types.
 * @returns A single class string.
 *
 * @example
 * cn("text-red", "hover:text-blue") // returns "text-red hover:text-blue"
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string into a human-readable format suitable for display.
 *
 * @param date - A date string in ISO 8601 format.
 * @returns A human-readable date string, e.g. "17 Agustus 2022, 14:30 WIB".
 */
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  });
}

/**
 * Normalize an image URL by prepending "https:" if it starts with "//".
 *
 * @param url - An image URL.
 * @returns A normalized image URL.
 *
 * @example
 * normalizeImageUrl("//example.com/image.jpg") // returns "https://example.com/image.jpg"
 * normalizeImageUrl("https://example.com/image.jpg") // returns "https://example.com/image.jpg"
 */
function normalizeImageUrl(url: string) {
  if (url.startsWith("//")) return `https:${url}`;

  return url;
}

export { cn, formatDate, normalizeImageUrl };
