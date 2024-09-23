/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js")

/** @type {import("next").NextConfig} */

const config = {
	images: {
		remotePatterns: [
			{ hostname: "nxfo5supr1itbgfl.public.blob.vercel-storage.com" },
		],
	},
}

export default config
