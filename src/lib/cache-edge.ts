import { createHash } from "crypto";
import { redis } from "./redis-edge";

export type JSONAble =
  | string
  | number
  | boolean
  | null
  | JSONAble[]
  | { [k: string]: JSONAble };

/**
 * Returns a stable MD5 hash of a given object's JSON string
 * representation. The object's keys are sorted to ensure the
 * hash is stable even if the object's property order changes.
 *
 * @param obj the object to hash
 * @returns a stable MD5 hash of the object as a lowercase hex string
 */
export function hashParams(obj: Record<string, unknown>) {
  const stable = JSON.stringify(obj, Object.keys(obj).sort());
  return createHash("md5").update(stable).digest("hex");
}

/**
 * Safely parses a JSON string into a value of type `T`.
 *
 * Returns `null` if the string is not valid JSON.
 *
 * @param raw the JSON string to parse
 * @returns the parsed value or `null` if the string is invalid JSON
 */
function safeParse<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Gets a JSON-serializable value from Redis cache or produces a fresh one,
 * stores it in Redis with a TTL, and returns the value along with a cache
 * hit/miss/repair indicator.
 *
 * If the cached value is corrupted, it will be repaired (REPAIR) and the
 * fresh value will be stored and indexed.
 *
 * @param key the Redis key to get/set
 * @param ttlSeconds the TTL in seconds for the Redis key
 * @param indexKeys the Redis set keys to add the `key` to (if not empty)
 * @param producer the function that produces the fresh value
 * @returns an object containing the value and a cache hit/miss/repair indicator
 */
export async function getOrSetJSONIndexed<T extends JSONAble>(
  key: string,
  ttlSeconds: number,
  indexKeys: string[],
  producer: () => Promise<T>
): Promise<{ value: T; cache: "HIT" | "MISS" | "REPAIR" }> {
  const r = redis();

  const hit = await r.get<string>(key);
  if (hit != null) {
    const parsed = safeParse<T>(hit);
    if (parsed !== null) {
      return { value: parsed, cache: "HIT" };
    }
    const fresh = await producer();
    await r.set(key, JSON.stringify(fresh), { ex: ttlSeconds });
    if (indexKeys.length)
      await Promise.all(indexKeys.map((idx) => r.sadd(idx, key)));
    return { value: fresh, cache: "REPAIR" };
  }

  const fresh = await producer();
  await r.set(key, JSON.stringify(fresh), { ex: ttlSeconds });
  if (indexKeys.length)
    await Promise.all(indexKeys.map((idx) => r.sadd(idx, key)));
  return { value: fresh, cache: "MISS" };
}
