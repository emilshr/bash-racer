import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env.local" });
config({ path: ".env" });

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    KV_REST_API_URL: z.string().url().optional(),
    KV_REST_API_TOKEN: z.string().min(1).optional(),
    REDIS_URL: z.string().url().optional(),
    SKIP_ENV_VALIDATION: z.string().optional(),
  })
  .refine(
    (d) =>
      (!d.KV_REST_API_URL && !d.KV_REST_API_TOKEN) ||
      (Boolean(d.KV_REST_API_URL) && Boolean(d.KV_REST_API_TOKEN)),
    {
      message: "KV_REST_API_URL and KV_REST_API_TOKEN must be set together",
    },
  );

function parseEnv() {
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return {
      NODE_ENV: (process.env.NODE_ENV ?? "development") as "development" | "production" | "test",
      PORT: Number(process.env.PORT ?? 3000),
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      KV_REST_API_URL: process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
      REDIS_URL: process.env.REDIS_URL,
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
