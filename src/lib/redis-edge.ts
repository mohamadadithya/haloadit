import { Redis } from "@upstash/redis";

let _r: Redis | null = null;

/**
 * Returns a Redis client instance.
 *
 * The instance is only created once and is cached after that.
 *
 * The instance is created with the following environment variables:
 * - `UPSTASH_REDIS_REST_URL`
 * - `UPSTASH_REDIS_REST_TOKEN`
 *
 * If either of these variables is not set, an error is thrown.
 *
 * @returns {Redis} The Redis client instance
 */
export function redis() {
  if (_r) return _r;
  if (
    !import.meta.env.UPSTASH_REDIS_REST_URL ||
    !import.meta.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN"
    );
  }
  _r = new Redis({
    url: import.meta.env.UPSTASH_REDIS_REST_URL,
    token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return _r;
}
