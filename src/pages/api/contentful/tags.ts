import { getAllTagItems } from "@/lib/contentful";
import type { APIRoute } from "astro";

const CACHE_KEY = "tags:v1";
const JSON_CT = "application/json; charset=utf-8";
const CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

// Properly typed, safe access to Cache API if available
async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  const cacheStorage: CacheStorage | undefined =
    typeof caches !== "undefined" ? caches : undefined;
  if (!cacheStorage) {
    // No cache available; just run the fetcher
    const data = await fetcher();
    return { data, fromCache: false };
  }

  const cache = await cacheStorage.open("tags");
  const cached = await cache.match(key);
  if (cached) {
    const data = (await cached.json()) as T;
    return { data, fromCache: true };
  }

  const data = await fetcher();
  // Best-effort cache put; ignore failures
  try {
    await cache.put(
      key,
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": JSON_CT },
      })
    );
  } catch {
    // noop
  }

  return { data, fromCache: false };
}

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": JSON_CT,
      "Cache-Control": CACHE_CONTROL,
      ...init?.headers,
    },
    ...init,
  });
}

function jsonError(status: number, error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unexpected error";

  return new Response(JSON.stringify({ error: { message, status } }), {
    status,
    headers: {
      "Content-Type": JSON_CT,
      "Cache-Control": "no-store",
    },
  });
}

export const GET: APIRoute = async () => {
  try {
    const { data: tags } = await withCache(CACHE_KEY, () => getAllTagItems());
    return json({ tags });
  } catch (err) {
    return jsonError(500, err);
  }
};
