import { Redis } from "@upstash/redis"
import { sql } from "@vercel/postgres"
import { drizzle } from "drizzle-orm/vercel-postgres"
import * as schema from "./schema"

// Use this object to send drizzle queries to your DB
export const db = drizzle(sql, { schema, logger: false })

export const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
})
