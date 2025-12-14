# Research: Offline PDF Worker

## Decisions

- **Decision**: Bundle the pdfjs worker locally via Vite asset URL import (e.g., `import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`) and set `GlobalWorkerOptions.workerSrc` to that URL.  
  **Rationale**: Ensures worker is served from the app both in dev and production without CDN dependencies.  
  **Alternatives considered**: Copying the worker into `public/` manually (more manual upkeep); inline worker via blob (adds bundle size and complexity).

- **Decision**: Keep pdf parsing logic unchanged apart from worker source and add clear error messaging if the worker fails to load.  
  **Rationale**: Limits scope to worker loading; provides user feedback for missing/corrupt worker.  
  **Alternatives considered**: Broader refactor of parsing or UI; deferred to maintain minimal scope.

- **Decision**: Vite config will allow `.mjs` worker asset emission (ensure no CDN base, and `assetsInclude` covers worker if needed).  
  **Rationale**: Guarantees worker file is emitted in build artifacts for offline use.  
  **Alternatives considered**: Relying on defaults only; risk of worker not emitted or resolved.

## Resolved Unknowns

- No additional clarifications required; scope is limited to worker bundling and offline behavior verification.
