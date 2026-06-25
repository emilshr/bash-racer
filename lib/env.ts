import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env.local" });
config({ path: ".env" });

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    UPSTASH_REDIS_URL: z.string().url().optional(),
    SKIP_ENV_VALIDATION: z.string().optional(),
  })
  .refine(
    (d) =>
      (!d.UPSTASH_REDIS_REST_URL && !d.UPSTASH_REDIS_REST_TOKEN) ||
      (Boolean(d.UPSTASH_REDIS_REST_URL) && Boolean(d.UPSTASH_REDIS_REST_TOKEN)),
    {
      message: "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together",
    },
  );

function parseEnv() {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return {
      NODE_ENV: (process.env.NODE_ENV ?? "development") as "development" | "production" | "test",
      PORT: Number(process.env.PORT ?? 3000),
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
      SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
    };
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return result.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
