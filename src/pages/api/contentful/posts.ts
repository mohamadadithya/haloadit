export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { getPosts } from "@/lib/contentful";
import { getOrSetJSONIndexed, hashParams } from "@/lib/cache-edge";

const QuerySchema = z.object({
  tag: z.string().trim().optional(),
  query: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  skip: z.coerce.number().int().min(0).default(0),
  order: z.enum(["ascending", "descending"]).default("descending"),
  mode: z
    .enum(["delivery", "onlyPublished", "onlyDrafts", "none"])
    .default("delivery"),
  _bypass: z.coerce.boolean().optional(), // debug only
});

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };

  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: baseHeaders,
    });
  }

  const {
    limit,
    skip,
    mode,
    query: searchQueryRaw,
    tag: currentTagRaw,
    order,
    _bypass,
  } = parsed.data;

  const searchQuery =
    searchQueryRaw && searchQueryRaw.length ? searchQueryRaw : null;
  const currentTag =
    currentTagRaw && currentTagRaw.length ? currentTagRaw : null;

  // Version bump via ENV
  const version = process.env.POSTS_CACHE_VERSION ?? "v1";
  const ttlEnv = Number(process.env.POSTS_CACHE_TTL);
  const ttl = Number.isFinite(ttlEnv) && ttlEnv > 0 ? ttlEnv : 300;

  const cacheParams = {
    limit,
    skip,
    mode,
    order,
    searchQuery,
    tag: currentTag,
  };

  const key = `cf:${version}:posts:${hashParams(cacheParams)}`;

  // Index sets for webhook invalidation
  const indexKeys = [
    "idx:cf:posts",
    ...(currentTag ? [`idx:cf:posts:tag:${currentTag}`] : []),
  ];

  try {
    const bypass = _bypass || mode === "onlyDrafts" || mode === "none";

    const fetchPosts = async () => {
      const page = await getPosts({
        sort: order,
        search: searchQuery ?? undefined,
        tag: currentTag ?? undefined,
        pageSize: limit,
        skip,
        mode,
      });
      // Ensure JSON-serializable
      return {
        ...page,
        items: page.items.map((item) => ({
          ...item,
          tags: item.tags?.map((t) => ({ ...t })) ?? [],
        })),
      };
    };

    let page: Awaited<ReturnType<typeof fetchPosts>>;
    let cacheStatus: "HIT" | "MISS" | "REPAIR" | "BYPASS" = "MISS";

    if (bypass) {
      page = await fetchPosts();
      cacheStatus = "BYPASS";
    } else {
      const { value, cache } = await getOrSetJSONIndexed(
        key,
        ttl,
        indexKeys,
        fetchPosts
      );
      page = value;
      cacheStatus = cache; // expects "HIT" | "MISS" | "REPAIR"
    }

    const hasMore = (page.skip ?? skip) + page.items.length < page.total;

    const headers: Record<string, string> = {
      ...baseHeaders,
      "X-Total": String(page.total),
      "X-Limit": String(page.limit ?? limit),
      "X-Skip": String(page.skip ?? skip),
      "X-Has-More": String(hasMore),
      "X-Next-Skip": hasMore
        ? String((page.skip ?? skip) + page.items.length)
        : "",
      "X-Cache": cacheStatus,
      "X-Cache-TTL": String(ttl),
      "X-Cache-Key": key,
      "X-Cache-Version": version,
    };
    if (!hasMore) delete headers["X-Next-Skip"];

    return new Response(JSON.stringify(page.items), { headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: baseHeaders,
    });
  }
};
