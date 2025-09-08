export const prerender = false;

import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { type ChainModifiers, type LocaleCode } from "contentful";
import {
  contentfulClient,
  toPostListItem,
  type BlogPostSkeleton,
} from "@/lib/contentful";

type CFOrder<S, M, L> = string;
import type { PostListItem } from "@/types";

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  skip: z.coerce.number().int().min(0).default(0),
  mode: z
    .enum(["delivery", "onlyPublished", "onlyDrafts", "none"])
    .default("delivery"),
});

const ORDER_FIELDS = ["date"] as const;

type Modifiers = ChainModifiers;
type Locale = LocaleCode;
type AllowedOrder = CFOrder<BlogPostSkeleton, Modifiers, Locale>;
const ORDER_WHITELIST: ReadonlySet<string> = new Set<string>([
  "sys.id",
  "-sys.id",
  "sys.contentType.sys.id",
  "-sys.contentType.sys.id",
  // fields.* yang diizinkan
  ...ORDER_FIELDS.map((k) => `fields.${k}`),
  ...ORDER_FIELDS.map((k) => `-fields.${k}`),
]);

function isAllowedOrderToken(s: string): s is AllowedOrder {
  return ORDER_WHITELIST.has(s);
}

function getRawOrderParams(url: URL): string[] {
  const multi = url.searchParams.getAll("order");
  const csv = multi.length
    ? multi.join(",")
    : (url.searchParams.get("order") ?? "");
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseOrder(url: URL): AllowedOrder[] {
  const raw = getRawOrderParams(url);
  const effective = raw.length ? raw : ["-fields.date", "sys.id"];
  return effective.filter(isAllowedOrderToken);
}

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

  const { limit, skip, mode } = parsed.data;
  const order = parseOrder(url);

  try {
    const query = {
      content_type: "blogPost",
      limit,
      skip,
      include: 1,
      order: (order.length > 0 ? order : ["-fields.date", "sys.id"]).filter(
        (o): o is string => typeof o === "string"
      ),
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
