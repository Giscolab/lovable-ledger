# Tasks: Offline PDF Worker

**Input**: Design documents from `/specs/001-offline-pdf-worker/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure local environment and assets are ready for offline PDF verification.

- [ ] T001 Validate dependencies are installed and locked for Vite/React/pdfjs-dist in `package.json`
- [ ] T002 [P] Confirm sample PDF exists for testing at `public/sample-releve.pdf`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pre-flight checks before story work.

- [ ] T003 Review current Vite base/output assumptions in `vite.config.ts` to confirm no CDN/base overrides that would force remote worker loading

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Import PDFs Offline (Priority: P1) MVP

**Goal**: PDF import works with network disabled; worker loads locally in dev.

**Independent Test**: With network disabled in dev (`npm run dev`), import `public/sample-releve.pdf` and see parsed transactions with zero external requests.

### Implementation for User Story 1

- [ ] T004 [US1] Point pdfjs worker to bundled asset via URL import in `src/utils/parsePDF.ts`
- [ ] T005 [P] [US1] Add TS module declaration for worker URL import in `src/types/pdfjs-worker.d.ts` (or `src/vite-env.d.ts`)
- [ ] T006 [US1] Add clear worker-load failure handling in `src/utils/parsePDF.ts` to surface errors instead of silent failure
- [ ] T007 [US1] Run dev offline check: `npm run dev`, disable network, import `public/sample-releve.pdf`, verify success and no external requests (document in `specs/001-offline-pdf-worker/quickstart.md`)
- [ ] T008 [P] [US1] Verify no external requests for worker in dev via Network tab; capture finding in `specs/001-offline-pdf-worker/quickstart.md`

**Checkpoint**: User Story 1 independently functional offline in dev.

---

## Phase 4: User Story 2 - Build Ships the Worker (Priority: P2)

**Goal**: Production build emits and serves worker locally; offline import succeeds on built app.

**Independent Test**: Build (`npm run build`), preview offline (`npm run preview` with network disabled), import sample PDF, worker loads from local path and parsing succeeds.

### Implementation for User Story 2

- [ ] T009 [US2] Ensure Vite build emits worker asset and uses relative local path (adjust `vite.config.ts` if needed, e.g., `assetsInclude` for `.mjs`)
- [ ] T010 [P] [US2] Inspect `dist/` to confirm worker asset is present (e.g., `pdf.worker...`) and referenced without CDN; note path in `specs/001-offline-pdf-worker/quickstart.md`
- [ ] T011 [US2] Run `npm run preview` offline, import `public/sample-releve.pdf`, verify worker loads locally and import succeeds
- [ ] T012 [P] [US2] Record build/preview offline verification steps and outcomes in `specs/001-offline-pdf-worker/quickstart.md`

**Checkpoint**: User Story 2 independently functional offline in build/preview.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final confirmations and documentation.

- [ ] T013 [P] Re-verify both dev and preview offline flows back-to-back and update `specs/001-offline-pdf-worker/quickstart.md` with final notes

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → User Story 1 (P1) → User Story 2 (P2) → Polish.
- User Story 2 depends on User Story 1 completion (worker bundling in dev informs build).
- Parallel opportunities:
  - T002 can run parallel with T001.
  - T005 and T008 can run parallel with T004/T006 once Vite assumptions checked (T003).
  - T010 and T012 can run parallel after T009 completes.

## Implementation Strategy

- MVP: Complete User Story 1 to achieve offline PDF import in dev; validate independently.
- Incremental: After US1, complete US2 to ensure build/preview parity; finish with polish verification.***
