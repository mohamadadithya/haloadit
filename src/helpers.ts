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
 * Format a date string into a human-readable string using the Indonesian
 * locale.
 *
 * @param date - A date string in ISO format.
 * @returns A human-readable string in the format "DD MMM YYYY, HH:mm z".
 *
 * @example
 * formatDate("2022-01-01T12:00:00.000Z") // returns "1 Jan 2022, 19:00 WIB"
 */
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "Asia/Jakarta",
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

/**
 * Deeply merges two objects, recursively combining properties of nested objects.
 *
 * - If a property in both objects is an object itself, `deepMerge` will merge those
 *   sub-objects.
 * - If a property exists only in the second object or is not an object in the first
 *   object, it is directly assigned from the second object.
 * - Arrays are not merged; they are replaced by the second object's value.
 *
 * @param obj1 - The target object to merge properties into.
 * @param obj2 - The source object whose properties are merged into the target.
 * @returns The merged object with combined properties from both inputs.
 */

function deepMerge<T extends Record<string, any>>(obj1: T, obj2: T): T {
  for (const key in obj2) {
    if (
      obj2[key] &&
      typeof obj2[key] === "object" &&
      !Array.isArray(obj2[key])
    ) {
      if (
        !obj1[key] ||
        typeof obj1[key] !== "object" ||
        Array.isArray(obj1[key])
      ) {
        obj1[key as Extract<keyof T, string>] = {} as T[Extract<
          keyof T,
          string
        >];
      }
      obj1[key] = deepMerge(obj1[key] as T, obj2[key] as T) as T[Extract<
        keyof T,
        string
      >];
    } else {
      obj1[key] = obj2[key];
    }
  }

  return obj1;
}

export { cn, formatDate, normalizeImageUrl, deepMerge };
