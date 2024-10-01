import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		POSTGRES_URL: z.string().url(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		CLERK_SECRET_KEY: z.string(),
		POSTGRES_PRISMA_URL: z.string(),
		POSTGRES_URL_NO_SSL: z.string(),
		POSTGRES_URL_NON_POOLING: z.string(),
		POSTGRES_USER: z.string(),
		POSTGRES_HOST: z.string(),
		POSTGRES_PASSWORD: z.string(),
		POSTGRES_DATABASE: z.string(),
		BLOB_READ_WRITE_TOKEN: z.string(),
		UPSTASH_REDIS_REST_URL: z.string().url(),
		UPSTASH_REDIS_REST_TOKEN: z.string(),
		UPLOADTHING_SECRET: z.string(),
		UPLOADTHING_TOKEN: z.string(),
		SPOTIFY_CLIENT_ID: z.string(),
		SPOTIFY_CLIENT_SECRET: z.string(),
		RESEND_API_KEY: z.string(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// NEXT_PUBLIC_CLIENTVAR: z.string(),
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
		NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: z.string(),
		NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: z.string(),
		NEXT_PUBLIC_VERCEL_URL: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		POSTGRES_URL: process.env.POSTGRES_URL,
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
		CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
		POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
		POSTGRES_URL_NO_SSL: process.env.POSTGRES_URL_NO_SSL,
		POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
		POSTGRES_USER: process.env.POSTGRES_USER,
		POSTGRES_HOST: process.env.POSTGRES_HOST,
		POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
		POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
		BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
		NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL:
			process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL,
		NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL:
			process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL,
		UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
		UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
		UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
		UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
		SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
		SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_CLIENT_URL,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
})
