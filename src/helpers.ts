import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import { JSDOM } from "jsdom";
import slugify from "slugify";
import type { TOCItem } from "./types";

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
 * Takes an HTML string and returns an object with two properties:
 *
 * - `html`: The input HTML with heading tags modified to have `id` attributes
 *   based on the heading text.
 * - `toc`: An array of objects representing a table of contents, where each
 *   object has `id`, `text`, and `level` properties.
 *
 * The `id` property is a slugified version of the heading text, and the `level`
 * property is either `"h2"` or `"h3"` based on the heading element's tag name.
 *
 * @param html - The input HTML string.
 * @returns An object with `html` and `toc` properties.
 */
function getTOCAndHTML(html: string): {
  html: string;
  toc: TOCItem[];
} {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const headings = doc.querySelectorAll("h2, h3");

  const toc = Array.from(headings).map((h) => {
    const slug = slugify(h.textContent ?? "", {
      lower: true,
      strict: true,
    });

    (h as HTMLElement).id = slug;

    return {
      id: slug,
      text: h.textContent ?? "",
      level: (h as HTMLElement).tagName.toLowerCase() as "h2" | "h3",
    };
  });

  return {
    html: doc.body.innerHTML,
    toc,
  };
}

export { cn, formatDate, getTOCAndHTML };
