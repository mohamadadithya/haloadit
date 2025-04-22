import {
  contentfulClient,
  type AssetUnresolvedLink,
  type CodeBlockEntry,
  type TagUnresolvedLink,
} from "@contentful";
import { BLOCKS, type Document } from "@contentful/rich-text-types";
import { highlightCode } from "./shiki";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { JSDOM } from "jsdom";
import slugify from "slugify";
import type { TOCItem } from "@/types";
import { normalizeImageUrl } from "@/helpers";

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
    } else if (node.nodeType === BLOCKS.EMBEDDED_ASSET) {
      const target = node.data.target as AssetUnresolvedLink;
      const imageObject = await getImageObject(target);

      if (!imageObject) {
        console.warn("No image object found for embedded asset");
        continue;
      }

      const { src, description, width, height } = imageObject;
      const imageTemplate = `<a href=${src} class="glightbox">
              <img
                src=${src}
                alt=${description}
                width=${width}
                height=${height}
                loading="lazy"
                class="w-full h-auto rounded-md"
              />
            </a>`;

      htmlParts.push(imageTemplate);
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
          <div class="code-block-wrapper relative">
            <button
              type="button"
              class="btn btn-sm btn-soft absolute btn-square top-2 right-2 code-block-wrapper__copy-button"
              data-clipboard-code="${plainText}" aria-label="Copy code">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></g></svg>
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

/**
 * Retrieves an array of tag objects from an array of Contentful TagEntryLink objects.
 *
 * This function asynchronously fetches the tag entries using the Contentful client
 * and constructs an array of objects with `name` and `slug` properties for each tag.
 *
 * @param entryLinks - An array of `TagEntryLink` objects representing links to Contentful tag entries.
 * @returns A promise that resolves to an array of objects, each containing a `name` and `slug` property of a tag.
 */

function getPostTags(entryLinks: TagUnresolvedLink[]) {
  return Array.isArray(entryLinks)
    ? entryLinks.map(async (tagEntryLink) => {
        const tag = await contentfulClient.getEntry(tagEntryLink.sys.id);

        return {
          name: tag.fields.name as string,
          slug: tag.fields.slug as string,
        };
      })
    : [];
}

/**
 * Retrieves an image object from a Contentful AssetUnresolvedLink object.
 *
 * If the input `image` is null or undefined, the function returns null.
 * Otherwise, it fetches the associated Contentful asset and constructs an
 * object with `src`, `description`, `width`, and `height` properties.
 *
 * @param image - The input Contentful AssetUnresolvedLink object, or null/undefined if no image is associated.
 * @returns An object with image properties, or null if the input is null/undefined.
 */
async function getImageObject(image: AssetUnresolvedLink | null) {
  let imageObject: null | {
    src: string;
    description: string;
    width: number;
    height: number;
  } = null;

  if (image) {
    const imageId = image.sys.id;
    const asset = await contentfulClient.getAsset(imageId);
    const file = asset.fields.file;

    imageObject = {
      src: file?.url ? normalizeImageUrl(file.url) : "",
      description: asset.fields.description || "",
      width: file?.details.image?.width || 1500,
      height: file?.details.image?.height || 1000,
    };
  }

  return imageObject;
}

export { renderWithShiki, renderPostContent, getPostTags, getImageObject };
