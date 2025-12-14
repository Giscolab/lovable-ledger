# Architecture & Build Diagnostic

## Stack snapshot
- **Bundler**: Vite `^5.4.19` with `@vitejs/plugin-react-swc` `^4.2.2` (React 18.3).【F:package.json†L73-L91】
- **UI toolkit set**: shadcn/Radix component packages around the 1.1–2.2 minor lines, `sonner` `^1.7.4`, `class-variance-authority` `^0.7.1`, `clsx` `^2.1.1`, `tailwind-merge` `^2.5.2`, `next-themes` `^0.3.0`.【F:package.json†L14-L71】
- **Vite config**: global `assetsInclude: ["**/*.mjs"]` alongside the standard React SWC plugin and path aliasing.【F:vite.config.ts†L1-L19】

## Observations
- Production build currently fails at the dependency graph stage because Rollup believes `tailwind-merge/dist/bundle-mjs.mjs` does not export `twMerge`, even though the package does export it. The failure surfaces before other UI packages are processed.【407e12†L1-L21】
- Vite 5 + Rollup 4 perform strict export analysis on ES modules. By declaring **all** `.mjs` files as static assets, the config forces Vite to treat ESM entry points from dependencies (e.g., `tailwind-merge`, `clsx`, Radix) as assets instead of modules, so Rollup cannot see their exports and reports missing named exports.
- The `assetsInclude` override appears to have been introduced to accommodate the pdfjs worker (`pdf.worker.mjs`) but inadvertently applies to every `.mjs` file in `node_modules`, affecting unrelated UI dependencies.

## Conclusion
**Update required:** No. The dependency stack is already on versions that are compatible with Vite 5; the build break stems from the Vite asset classification rather than library incompatibility.

## Recommended fix (minimal and ordered)
1. **Scope `assetsInclude` narrowly** (e.g., to `"**/pdf.worker.mjs"` or a dedicated worker path) so that normal `.mjs` dependencies continue to be treated as modules. This removes the false ESM export errors without touching the offline PDF worker behavior.
2. **Re-run `npm run build`** to confirm the dependency graph resolves once `.mjs` modules are parsed normally.
