import type { CodeBlockEntry } from "@contentful";
import { BLOCKS, type Document } from "@contentful/rich-text-types";
import { highlightCode } from "./shiki";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { JSDOM } from "jsdom";
import slugify from "slugify";
import type { TOCItem } from "@/types";

/**
 * Render a Contentful rich text document, replacing code blocks with
 * syntax-highlighted HTML.
 *
 * @param doc The document to render.
 * @returns A string of rendered HTML.
 */
async function renderWithShiki(doc: Document): Promise<string> {
  if (!doc || !Array.isArray(doc.content)) {
    console.warn("Invalid rich text Document passed");
    return "";
  }

  const htmlParts: string[] = [];

  for (const node of doc.content) {
    if (
      node.nodeType === BLOCKS.EMBEDDED_ENTRY &&
      node.data?.target?.sys?.contentType?.sys?.id === "codeBlock"
    ) {
      const target = node.data.target as CodeBlockEntry;
      const code = target.fields.code;
      const lang = target.fields.language || "text";
      const highlighted = await highlightCode(code as string, lang as string);

      htmlParts.push(highlighted);
    } else {
      const rendered = documentToHtmlString({ ...doc, content: [node] });
      htmlParts.push(rendered);
    }
  }

  return htmlParts.join("");
}

/**
 * Render a Contentful blog post, using the `renderWithShiki` function to render
 * the rich text document and `getTOCAndHTML` to generate a table of contents.
 *
 * @param doc The document to render.
 * @returns An object with `html` and `toc` properties.
 */
async function renderPostContent(doc: Document) {
  const { html, toc } = getTOCAndHTML(await renderWithShiki(doc));
  const htmlContent = createShikiCodeBlock(html);

  return {
    html: htmlContent,
    toc,
  };
}

/**
 * Transforms HTML containing Shiki-highlighted code blocks by wrapping each
 * code block in a custom container with a copy button.
 *
 * This function identifies `<pre>` elements with the class `shiki` and
 * wraps them in a `div` with additional styling and functionality. It also
 * extracts the plain text content of the code block to use as the data for
 * the copy button, allowing users to easily copy the code.
 *
 * @param html - The HTML string containing Shiki-highlighted code blocks.
 * @returns A new HTML string where each Shiki code block is wrapped in a
 *          custom container with a copy button.
 */

export function createShikiCodeBlock(html: string): string {
  return html.replace(
    /<pre class="shiki(.*?)">([\s\S]*?)<\/pre>/g,
    (_, classes, content) => {
      const plainText = content
        .replace(/<[^>]*>/g, "") // remove tags
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/"/g, "&quot;") // escape double quotes
        .trim();

      return `
          <div class="code-block-wrapper relative group">
            <button
              type="button"
              class="btn btn-sm btn-soft absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition code-block-wrapper__copy-button"
              data-clipboard-code="${plainText}"
              >
              Salin
            </button>
            <pre class="shiki${classes}">${content}</pre>
          </div>
        `;
    }
  );
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

export { renderWithShiki, renderPostContent };
