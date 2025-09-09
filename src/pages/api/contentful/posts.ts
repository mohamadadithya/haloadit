export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { getPosts } from "@/lib/contentful";

const QuerySchema = z.object({
  tag: z.string().optional(),
  query: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  skip: z.coerce.number().int().min(0).default(0),
  order: z.enum(["ascending", "descending"]).default("descending"),
  mode: z
    .enum(["delivery", "onlyPublished", "onlyDrafts", "none"])
    .default("delivery"),
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
    query: searchQuery,
    tag: currentTag,
    order,
  } = parsed.data;

  try {
    const page = await getPosts({
      sort: order,
      search: searchQuery,
      tag: currentTag,
      pageSize: limit,
      skip,
      mode,
    });

    const hasMore = page.skip + page.items.length < page.total;
    const headers: Record<string, string> = {
      ...baseHeaders,
      "X-Total": String(page.total),
      "X-Limit": String(page.limit ?? limit),
      "X-Skip": String(page.skip ?? skip),
      "X-Has-More": String(hasMore),
    };

    if (hasMore) headers["X-Next-Skip"] = String(page.skip + page.items.length);

    return new Response(JSON.stringify(page.items), { headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: baseHeaders,
    });
  }
};
