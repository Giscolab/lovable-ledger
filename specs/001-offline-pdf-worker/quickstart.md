# Quickstart: Offline PDF Worker

1) Checkout branch `001-offline-pdf-worker`.
2) Install deps: `npm install` (or `bun install` if preferred).
3) Dev test offline:
   - Run `npm run dev`.
   - Disable network (airplane mode).
   - Import `public/sample-releve.pdf`.
   - Expect transactions parsed; ensure no external requests for the worker.
   - Check Network tab: worker should load from local dev URL (no unpkg/CDN).
   - Result: [pending manual run - fill after verification]
   - External requests check: [pending manual run — confirm zero requests to unpkg/CDN, worker from local dev URL]
4) Build test offline:
   - Run `npm run build` and `npm run preview`.
   - Disable network.
   - Import the sample PDF; verify success and no external requests.
   - Check `dist/` for worker asset (e.g., `assets/pdf.worker...`), ensure no CDN references.
   - Result: [pending manual build inspection – fill worker asset name/path and CDN check]
   - Worker load path observed: [pending manual build/preview run]
5) Failure handling:
   - If worker missing/corrupt, expect a clear error instead of silent failure or partial imports.
6) Consolidated verification (dev + preview):
   - Run dev offline test (steps above), record outcomes.
   - Run preview offline test (steps above), record outcomes.
   - Final notes: [pending manual runs]
