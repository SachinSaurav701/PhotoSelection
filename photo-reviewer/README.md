# Photo Reviewer (Desktop)

Windows desktop app for photographers to quickly let clients review thousands of photos, select ~400–500 with comments, and return a small text file the photographer can apply to copy full‑quality originals.

## Quick start (dev)
1. Install Node 18+.
2. Install deps:
   ```bash
   npm i
   ```
3. Start dev (Electron + Vite):
   ```bash
   npm run dev
   ```

## Workflows
- Create review package: compresses photos and outputs an offline HTML viewer (`review-<timestamp>` folder).
- Apply selection: reads `selection.txt` and copies originals to an output folder (preserves subfolders).