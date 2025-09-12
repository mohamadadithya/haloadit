export const prerender = false;

import type { APIRoute } from "astro";
import { redis } from "@/lib/redis-edge";

const REQUIRED_HEADER = "x-webhook-secret";

/**
 * Deletes all members of a Redis set (idxKey) and the set itself.
 * @param idxKey The Redis set key.
 * @returns A promise that resolves when the deletion is complete.
 */
async function deleteByIndexSet(idxKey: string) {
  const r = redis();
  const members = await r.smembers(idxKey);

  if (members && members.length) await r.del(...members);
  await r.del(idxKey);
}

export const POST: APIRoute = async ({ request, url }) => {
  const provided = request.headers.get(REQUIRED_HEADER);
  const expected = import.meta.env.WEBHOOK_SECRET;

  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const scope = url.searchParams.get("scope");
  const tag = url.searchParams.get("tag");

  try {
    if (scope === "all") {
      await deleteByIndexSet("idx:cf:posts");
    } else if (tag) {
      await deleteByIndexSet(`idx:cf:posts:tag:${tag}`);
    } else {
      await deleteByIndexSet("idx:cf:posts");
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
