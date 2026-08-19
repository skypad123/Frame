# Frame

Frame is a single-page web app for capturing ideas as colorful "frames" (notes). It is built with Vite + React + TypeScript and persists data locally via `localStorage` (no backend/services required).

## Project layout

- `src/App.tsx` — main UI: composer + board of frames.
- `src/storage.ts` — `localStorage` load/save helpers.
- `src/types.ts` — shared types.
- `src/App.test.tsx` — Vitest + Testing Library tests.

## Common commands

Standard scripts are defined in `package.json`:

- `npm run dev` — start the Vite dev server.
- `npm run build` — type-check (`tsc -b`) and produce a production build.
- `npm run lint` — run ESLint.
- `npm test` — run the Vitest suite once.

## Cursor Cloud specific instructions

- This is a purely client-side app — there is no backend, database, or other service to start. Running `npm run dev` is all that's needed to exercise the product end to end.
- The dev server is configured with `host: true` on port `5173` (see `vite.config.ts`), so it is reachable in the VM. Use `http://localhost:5173/`.
- App state lives in `localStorage` under the key `frame.notes.v1`. To reset to the empty state during manual testing, clear site data / that key rather than expecting a server reset.
