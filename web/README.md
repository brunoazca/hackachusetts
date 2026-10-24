# Piper web app

Next.js 16, React 19, TypeScript, Tailwind, MapLibre, and Zustand. Reads the populated Supabase project; it does not automatically load committed CSVs.

Use Node.js 24 and pnpm 11.22.0. Run `pnpm install --frozen-lockfile`, copy `.env.example` to `.env.local`, fill in the public database URL and anon key, then run `pnpm dev`. Open http://localhost:3000.

See the [root README](../README.md) for the implemented workflow, configuration, data limitations, pipeline setup, and submission links.

Checks: `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`.
