import type { APIRoute } from "astro";
import { OGImageRoute } from "astro-og-canvas";
import { contentfulClient, type BlogPost } from "@/lib/contentful";
import { join } from "node:path";

// ========== CONFIG ==========
const CONTENT_TYPE_ID = "blogPost";
export const prerender = false;

const S_MAXAGE = 60 * 60 * 24; // 1 day
const SWR = 60 * 60 * 24 * 7; // 7 days
const BROWSER_MAXAGE = 60 * 5; // 5 minutes

const pub = (...x: string[]) => join(process.cwd(), "public", ...x);

// ========== TYPES ==========
type PostEntry = {
  sys: { id: string; updatedAt: string };
  fields: { title: string; slug: string; description?: string };
};

// ========== LIGHT CACHE ==========
const pageCache = new Map<
  string,
  { id: string; updatedAt: string; title: string; description: string }
>();

// ========== HELPERS ==========
const stripSlashes = (s: string) => s.replace(/^\/+|\/+$/g, "");

const ensurePngAndStrip = (routeParam: string[] | string) => {
  const parts = Array.isArray(routeParam)
    ? [...routeParam]
    : [String(routeParam)];
  const last = parts.at(-1) ?? "";
  if (!last.endsWith(".png")) return { ok: false as const, slug: "" };
  parts[parts.length - 1] = last.replace(/\.png$/, "");
  return { ok: true as const, slug: stripSlashes(parts.join("/")) };
};

// Fetch 1 entry by slug
async function fetchEntryBySlug(slug: string): Promise<PostEntry | null> {
  const res = await contentfulClient.getEntries<BlogPost>({
    content_type: CONTENT_TYPE_ID,
    "fields.slug": slug,
    select: [
      "sys.updatedAt",
      "fields.title",
      "fields.slug",
      "fields.description",
    ],
    include: 0,
    limit: 1,
  });

  return res.items?.[0] ?? null;
}

function truncate(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function buildPagesFor(entry: PostEntry) {
  const { title, description = "", slug } = entry.fields;
  const parts = slug.includes("/") ? slug.split("/") : [slug];
  const truncatedDescription = truncate(description, 250);

  return Object.fromEntries([
    [
      slug,
      {
        slug: parts,
        data: { title, description: truncatedDescription },
      },
    ],
  ]);
}

function makeOgRoute(
  pages: Record<
    string,
    { slug: string[]; data: { title: string; description: string } }
  >
) {
  return OGImageRoute({
    param: "route",
    pages,
    getImageOptions: (_path, { data }) => ({
      title: data.title,
      description: data.description ?? "",
      fonts: [
        pub("fonts/Inter/Inter-Regular.ttf"),
        pub("fonts/Cal_Sans/CalSans-Regular.ttf"),
      ],
      font: {
        title: {
          size: 44,
          lineHeight: 1.5,
          families: ["Cal Sans"],
          weight: "Normal",
        },
        description: {
          size: 22,
          lineHeight: 1.6,
          families: ["Inter"],
          weight: "Normal",
        },
      },
      bgImage: { path: pub("images/og/bg.png"), fit: "contain" },
      padding: 100,
      logo: { path: pub("images/og/logo.png"), size: [60, 60] },
      quality: 100,
    }),
  });
}

const makeETag = (id: string, updatedAt: string) =>
  `W/"og-${id}-${new Date(updatedAt).getTime()}"`;

// ========== ON-DEMAND GET ==========
export const GET: APIRoute = async (ctx) => {
  const png = ensurePngAndStrip(ctx.params.route ?? "");
  if (!png.ok) {
    return new Response("Append .png to the URL, e.g. /open-graph/<slug>.png", {
      status: 400,
    });
  }
  const slugPath = png.slug;
  if (!slugPath) return new Response("Missing slug", { status: 400 });

  // cache metadata
  let meta = pageCache.get(slugPath);
  if (!meta) {
    const entry = await fetchEntryBySlug(slugPath);
    if (!entry) return new Response("Not found", { status: 404 });

    meta = {
      id: entry.sys.id,
      updatedAt: entry.sys.updatedAt,
      title: entry.fields.title,
      description: entry.fields.description ?? "",
    };
    pageCache.set(slugPath, meta);
  }

  // 304 short-circuit
  const etag = makeETag(meta.id, meta.updatedAt);
  const ifNoneMatch = ctx.request.headers.get("If-None-Match");
  const ifModifiedSince = ctx.request.headers.get("If-Modified-Since");
  const lastModified = new Date(meta.updatedAt).toUTCString();

  if (
    ifNoneMatch === etag ||
    (ifModifiedSince && new Date(ifModifiedSince) >= new Date(meta.updatedAt))
  ) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Last-Modified": lastModified,
        "Cache-Control": `public, max-age=${BROWSER_MAXAGE}, s-maxage=${S_MAXAGE}, stale-while-revalidate=${SWR}, immutable`,
      },
    });
  }

  // render per-entry
  const route = makeOgRoute(
    buildPagesFor({
      sys: { id: meta.id, updatedAt: meta.updatedAt },
      fields: {
        title: meta.title,
        slug: slugPath,
        description: meta.description,
      },
    })
  );

  const res = await route.GET(ctx);

  res.headers.set("Content-Type", "image/png");
  res.headers.set(
    "Cache-Control",
    `public, max-age=${BROWSER_MAXAGE}, s-maxage=${S_MAXAGE}, stale-while-revalidate=${SWR}, immutable`
  );
  res.headers.set("ETag", etag);
  res.headers.set("Last-Modified", lastModified);

  return res;
};
