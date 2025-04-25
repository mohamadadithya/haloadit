import {
  contentfulClient,
  type AssetUnresolvedLink,
  type BlogPostUnresolvedLink,
  type TagUnresolvedLink,
} from "@contentful";
import { BLOCKS, INLINES, type Document } from "@contentful/rich-text-types";
import { highlightCode } from "./shiki";
import {
  documentToHtmlString,
  type Options,
} from "@contentful/rich-text-html-renderer";
import { JSDOM } from "jsdom";
import slugify from "slugify";
import type { TOCItem } from "@/types";
import { normalizeImageUrl } from "@/helpers";

// Track async replacements
const asyncBlocks: Record<string, Promise<string>> = {};

let counter = 0;

/**
 * Creates a placeholder for an asynchronous replacement.
 * @param promise The promise to replace the placeholder with.
 * @returns A unique string that can be used as a placeholder.
 */
function createAsyncPlaceholder(promise: Promise<string>) {
  const id = `__ASYNC_BLOCK_${counter++}__`;
  asyncBlocks[id] = promise;
  return id;
}

/**
 * Replaces placeholders in the HTML string with the results of asynchronous operations.
 *
 * This function takes an HTML string containing placeholders and replaces each
 * placeholder with the result of its corresponding asynchronous operation.
 * The operations are stored in the `asyncBlocks` object, and the function
 * resolves all promises before performing the replacements.
 *
 * @param html - The HTML string containing placeholders for asynchronous content.
 * @returns A promise that resolves to the HTML string with all placeholders replaced by their resolved content.
 */

async function replaceAsync(html: string): Promise<string> {
  const entries = Object.entries(asyncBlocks);
  const results = await Promise.all(entries.map(([_, promise]) => promise));

  for (let i = 0; i < entries.length; i++) {
    html = html.replace(entries[i][0], results[i]);
  }

  return html;
}

/**
 * Render a Contentful blog post, using the `renderContent` function to render
 * the rich text document and `getTOCAndHTML` to generate a table of contents.
 *
 * @param doc The document to render.
 * @returns An HTML string representing the rendered document.
 */
async function renderContent(doc: Document): Promise<string> {
  if (!doc || !Array.isArray(doc.content)) {
    console.warn("Invalid rich text Document passed");
    return "";
  }

  const renderNode: Options["renderNode"] = {
    [BLOCKS.EMBEDDED_ENTRY]: (node) => {
      const nodeId = node.data?.target?.sys?.contentType?.sys?.id;

      if (nodeId === "codeBlock") {
        const code = node.data.target.fields.code;
        const lang = node.data.target.fields.language || "text";
        return createAsyncPlaceholder(highlightCode(code, lang));
      }

      if (nodeId === "mermaidBlock") {
        const code = node.data.target.fields.code;
        return `<div class="mermaid" data-mermaid>${code}</div>`;
      }

      return "embedded-entry-block-not-defined";
    },

    [INLINES.ENTRY_HYPERLINK]: (node) => {
      const nodeId = node.data?.target?.sys?.contentType?.sys?.id;

      if (nodeId === "blogPost") {
        const { title, slug }: { title: string; slug: string } =
          node.data.target.fields;

        return `<a href="/${slug}" class="link link-hover">${title}</a>`;
      }

      return "entry-hyperlink-not-defined";
    },

    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const asset = node.data.target;
      return createAsyncPlaceholder(
        (async () => {
          const imageObject = await getImageObject(asset);
          if (!imageObject) return "";

          const { src, description, width, height } = imageObject;
          return `<a href="${src}" class="glightbox">
            <img
              src="${src}"
              alt="${description}"
              width="${width}"
              height="${height}"
              loading="lazy"
              class="w-full h-auto rounded-md"
            />
          </a>`;
        })()
      );
    },
  };

  let html = documentToHtmlString(doc, { renderNode });

  html = await replaceAsync(html);
  return html;
}

/**
 * Render a Contentful blog post, using the `renderContent` function to render
 * the rich text document and `getTOCAndHTML` to generate a table of contents.
 *
 * @param doc The document to render.
 * @returns An object with `html` and `toc` properties.
 */
async function renderPostContent(doc: Document) {
  const { html, toc } = getTOCAndHTML(await renderContent(doc));
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
 * Parse HTML and extract all headings (h2, h3, h4) and return an object with
 * the HTML content and an array of TOC items. The TOC items have the following
 * properties:
 * - id: the slugified heading text
 * - text: the heading text
 * - level: the heading level (h2, h3, h4)
 *
 * The function also sets the id attribute of each heading element in the
 * parsed HTML to the slugified heading text.
 *
 * @param html - The HTML string to parse.
 * @returns An object with `html` and `toc` properties.
 */
function getTOCAndHTML(html: string): {
  html: string;
  toc: TOCItem[];
} {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const headings = doc.querySelectorAll("h2, h3, h4");

  const toc = Array.from(headings).map((h) => {
    const slug = slugify(h.textContent ?? "", {
      lower: true,
      strict: true,
    });

    (h as HTMLElement).id = slug;

    return {
      id: slug,
      text: h.textContent ?? "",
      level: (h as HTMLElement).tagName.toLowerCase() as "h2" | "h3" | "h4",
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
 * Retrieves an array of objects, each containing `title` and `slug` properties,
 * from an array of Contentful BlogPostUnresolvedLink objects.
 *
 * This function asynchronously fetches the related blog posts using the
 * Contentful client and constructs an array of objects with `title` and
 * `slug` properties for each post.
 *
 * @param entryLinks - An array of `BlogPostUnresolvedLink` objects representing links to Contentful blog post entries.
 * @returns A promise that resolves to an array of objects, each containing a `title` and `slug` property of a related blog post.
 */
function getRelatedPosts(entryLinks: BlogPostUnresolvedLink[]) {
  return Array.isArray(entryLinks)
    ? entryLinks.map(async (postEntryLink) => {
        const post = await contentfulClient.getEntry(postEntryLink.sys.id);

        return {
          title: post.fields.title as string,
          description: post.fields.description as string,
          slug: post.fields.slug as string,
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

export {
  renderContent,
  renderPostContent,
  getPostTags,
  getImageObject,
  getRelatedPosts,
};
