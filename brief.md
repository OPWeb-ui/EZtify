# Client‑side tools — Google AI Studio

**Purpose:** A focused checklist + sidebar plan for Google AI Studio web builder projects. Ensure the site only contains features that can be implemented fully in the browser (no server code, no secrets). This is a copy‑paste friendly brief to give to AI Studio or to developers working inside the Studio.

---

## Sidebar categories (recommended order)

1. Utilities — QR generator, Unit converter, Password generator, File tools (zip/unzip, hash)
2. File & Media — PDF viewer, Image editor, Video cutter (wasm), Audio recorder
3. Productivity — Notes, Markdown editor, To‑do list (local only)
4. Developer tools — JSON formatter, Code playground, Regex tester
5. Design & Creativity — Color picker, Icon explorer, Thumbnail generator
6. AI & ML (client) — On‑device ML (WASM), embeddings via browser storage (optional)
7. Settings & Help — Theme, Export/Import, About

Keep heavy or cloud‑dependent features out of the main sidebar. Put them in a separate "Integrations / Cloud" area and gate them behind an explicit opt‑in.

---

## Technical guidelines for AI Studio prompts

* **Strict requirement:** All features must run client‑side in the browser. No server routes, serverless functions, or environment variables.
* **Preferred libs & APIs:** PDF.js, JSZip, qrcode, SubtleCrypto (Web Crypto API), IndexedDB, File System Access API, WebAssembly modules (ffmpeg.wasm, image codecs), service workers for PWA/offline.
* **Avoid:** Node built‑ins, server SDKs, or libraries that require server proxies.
* **Build target:** Produce a static production build (Vite/React recommended). Output must include a `dist` folder suitable for static deploy to Cloudflare Pages / GitHub Pages.
* **UX:** For CPU/RAM heavy tasks use WASM and show progress. Provide fallbacks for low‑end devices.

---

## Example short JSON prompt for AI Studio (paste into Studio)

```json
{
  "task": "Revise the site's sidebar so it contains ONLY apps that can be fully implemented client-side. Remove any server-dependent apps. Reorder categories to prioritize usability and performance. Where a currently listed app is server-dependent, remove it or replace with a client-side alternative. If a missing app can reasonably be implemented client-side, add it to the sidebar and provide brief implementation notes.

For each sidebar category and app, return a JSON structure listing: category name, ordered apps (with fields: id, name, keep(true/false), reason, implementation_notes, recommended_libs_or_wasm). Also return a short "developer instructions" section describing build constraints and an example static build `package.json` + `vite` config snippet. Finally provide one-line AI Studio task prompts for each app to paste into AI Studio.",

  "constraints": [
    "NO server code, serverless functions, or environment variables",
    "Only use browser-friendly libraries or WASM modules",
    "Persist local data only via IndexedDB, LocalStorage, or File System Access API",
    "Show progress UI for heavy tasks (zip, PDF render, wasm transforms)",
    "Output must be a static client-only build (Vite/React recommended) with a `dist` folder ready for static deploy"
  ],

  "output_format": "JSON",
  "example_output_schema": {
    "sidebar": [
      {
        "category": "Utilities",
        "apps": [
          {"id":"qr","name":"QR Generator","keep":true,"reason":"Fully client-side","implementation_notes":"qrcode lib; export PNG/SVG; history in IndexedDB","recommended_libs_or_wasm":[

---

## Quick paste snippets you can give to AI Studio per category
- **QR Generator (one-liner):** "Create a client-only QR generator using `qrcode` that exports PNG/SVG and stores history in IndexedDB. No server calls."
- **PDF Viewer:** "Use `pdf.js` to implement a PDF viewer with 2x2 thumbnail preview, page jump, and download. Keep everything in-browser."
- **Image Editor:** "Implement a client-side image crop/resize/rotate tool using canvas + optional wasm codecs. Allow PNG/JPEG export. No server."
