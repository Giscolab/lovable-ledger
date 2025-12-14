# Implementation Plan: Offline PDF Worker

**Branch**: `001-offline-pdf-worker` | **Date**: 2025-12-14 | **Spec**: specs/001-offline-pdf-worker/spec.md  
**Input**: Feature specification from `/specs/001-offline-pdf-worker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Bundle and load the pdfjs worker from local assets so PDF imports work fully offline with no external network requests in dev or production builds. Scope stays limited to the PDF import pipeline (no UI or data model changes).

## Technical Context

**Language/Version**: TypeScript (Vite + React)  
**Primary Dependencies**: Vite, React, pdfjs-dist  
**Storage**: Browser localStorage (unchanged)  
**Testing**: Existing npm/vite test tooling (unchanged)  
**Target Platform**: Web (desktop/mobile browsers), offline-capable  
**Project Type**: Single web app (Vite)  
**Performance Goals**: Offline PDF import completes within ~15 seconds for sample statements  
**Constraints**: Offline-first; no external/CDN worker loading; PDF import only; avoid unrelated refactors  
**Scale/Scope**: Single feature change; no new data models or APIs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file is placeholder with no concrete principles; no gates defined and none violated. No complexity justifications required.

## Project Structure

### Documentation (this feature)

```text
specs/001-offline-pdf-worker/
├─ spec.md
├─ plan.md
├─ research.md
├─ data-model.md
├─ quickstart.md
└─ contracts/
```

### Source Code (repository root)

```text
src/
├─ utils/
│  └─ parsePDF.ts         # pdfjs usage (workerSrc target)
├─ integrations/
│  └─ supabase/           # unused for this feature
├─ components/pages/...   # unchanged

public/
└─ sample-releve.pdf      # sample PDF already present
```

**Structure Decision**: Single web app (Vite React). Changes localized to `src/utils/parsePDF.ts`, potential `vite.config.ts` adjustments, and feature docs under `specs/001-offline-pdf-worker/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| — | — | — |
