import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

let client: Redis | null = null;

export function getUpstashRedis(): Redis | null {
  if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) {
    return null;
  }

  client ??= new Redis({
    url: env.KV_REST_API_URL,
    token: env.KV_REST_API_TOKEN,
  });

  return client;
}
