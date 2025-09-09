export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "astro/zod";
import {
  contentfulClient,
  toPostListItem,
  getSortOrder,
  type BlogPostSkeleton,
  getTagIdFromSlug,
} from "@/lib/contentful";

import type { PostListItem } from "@/types";

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

  const tagId = await getTagIdFromSlug(currentTag);

  try {
    const query = {
      content_type: "blogPost",
      links_to_entry: tagId,
      query: searchQuery,
      limit,
      skip,
      include: 1,
      order: getSortOrder(order),
    } as const;

    if (mode === "onlyPublished") {
      (query as Record<string, unknown>)["sys.publishedAt[exists]"] = true;
    } else if (mode === "onlyDrafts") {
      (query as Record<string, unknown>)["sys.publishedAt[exists]"] = false;
    }

    const page = await contentfulClient.getEntries<
      BlogPostSkeleton,
      "blogPost"
    >(query);

    const items: PostListItem[] = await Promise.all(
      page.items.map(toPostListItem)
    );

    const hasMore = page.skip + page.items.length < page.total;
    const headers: Record<string, string> = {
      ...baseHeaders,
      "X-Total": String(page.total),
      "X-Limit": String(page.limit ?? limit),
      "X-Skip": String(page.skip ?? skip),
      "X-Has-More": String(hasMore),
    };

    if (hasMore) headers["X-Next-Skip"] = String(page.skip + page.items.length);

    return new Response(JSON.stringify(items), { headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: baseHeaders,
    });
  }
};
