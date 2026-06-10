<<<<<<< HEAD
# Scrapy
=======

Scrapy is a visual web scraper. You load any page in a live preview, click elements to capture CSS selectors, then run a scrape job that extracts structured data into a table you can export as CSV or JSON.
>>>>>>> ff13189123be1b48c7e3b373b3d3d3bc7751c241

Before I started this project, I needed a web scraper to finish another one — a furniture-based platform where I was doing market research. [Scrapling](https://github.com/D4Vinci/Scrapling) had just come out about a week earlier, so I cooked this up quickly on top of that ecosystem to get the job done. This repo is the visual UI that grew out of that work.

Hope you enjoy it. Some things might still be buggy — if you run into issues or want a feature, leave a comment and I'll get to it. I might add things based on what people ask for.

---

A visual web scraper. Load any page in a live preview, click elements to capture CSS selectors, then run a scrape job that extracts structured data into a table you can export as CSV or JSON.

## Overview

Scrapy has three parts:

| Layer | Tech | Role |
|-------|------|------|
| **Frontend** | React + Vite (port 5173) | Workspace UI, element picker, results table |
| **Backend** | Express (`server.js`, port 3001) | Page proxy, link scanning, scrape orchestration |
| **Scraper** | Python (`scraper.py`) + [scrapling](https://github.com/D4Vinci/Scrapling) | Fetches pages and extracts data via CSS selectors |

```
React UI (5173)  →  proxy  →  Express API (3001)  →  spawn  →  scraper.py
```

## Getting started

### Prerequisites

- **Node.js** 18+
- **Python 3** on your PATH (`python` on Windows, `python3` on macOS/Linux)
- **scrapling** Python package

### Install

```bash
cd scraper-ui
npm install
pip install -r requirements.txt
scrapling install
```

### Run

Start both the API server and the Vite dev server:

```bash
npm start
```

- UI: http://localhost:5173
- API: http://localhost:3001

Or run them separately:

```bash
npm run server   # API on port 3001
npm run dev      # UI on port 5173
```

> **Important:** `npm run dev` alone is not enough. Page preview and scraping require the backend on port 3001.

### Build

```bash
npm run build
```

Output goes to `dist/`. Serve the API with `npm run server` and point a static file server at `dist/` for production use.

## How to use

1. Enter a URL on the home screen and click **Load**.
2. In the sidebar, click **Start Selecting** and click elements in the preview to capture fields.
3. Optionally use **Scan for product links** to detect URL patterns for multi-page scraping.
4. Click **Scrape Now** — a loading animation shows progress while the scraper runs.
5. Export results as CSV or JSON from the results table.

Use the **Docs** tab in the app for full in-app documentation. Adjust defaults (item count, poll interval) via the gear icon in the navbar.

## Page preview

When you enter a URL, the app loads it through `GET /proxy?url=…` instead of fetching it directly in the browser:

- **CORS / iframe blocking** — many sites set `X-Frame-Options` or CSP headers. The proxy strips those so the page can embed in an iframe.
- **Element picker** — the server injects a script that listens for clicks and sends CSS selectors back to the UI via `postMessage`.

Same-domain links in the preview are rewritten to stay on the proxy, so you can navigate category pages without losing the picker.

## Element selection

1. Click **Start Selecting** in the sidebar.
2. Hover and click elements in the preview — each click captures a CSS selector and sample text.
3. Double-click a field label to rename it. Pin a field to hide rows where that field is empty.
4. Use **Test Selectors** to verify how many matches each selector finds on the current page.

Selectors prefer stable IDs and short class-based paths over auto-generated class hashes.

## Scraping modes

### Single page

Extracts data from the currently loaded URL. If a selector matches multiple elements (e.g. a product grid), Scrapy creates one row per match, up to the **Items to Scrape** limit.

### Category / multi-page

After scanning for product links and selecting a URL pattern (e.g. `/products/*`):

1. A sample product page loads so you can pick selectors on a real detail page.
2. Scrapy visits the listing URL and collects all links matching the pattern.
3. Each product page is fetched and the selected fields are extracted.
4. Progress streams back to the UI (e.g. "Scraping item 3 of 10…").

## Link scanning

**Scan for product links** fetches the raw HTML and analyzes all `href` attributes:

- **Product patterns** — URL prefixes with many unique single-occurrence links (typical of product grids). Requires at least 5 matching links.
- **Category pages** — links that repeat across the page (nav, footer). Click one to navigate the preview.

## Python scraper

`scraper.py` is spawned as a child process for each scrape job. The server sends JSON on stdin:

```json
{
  "url": "https://example.com/products",
  "selectors": ["h1.title", "span.price"],
  "mode": "single",
  "count": 10,
  "pattern": "/products"
}
```

Fetching uses scrapling's fetchers:

- **StealthyFetcher** — used when available, for JS-heavy or protected pages.
- **Fetcher** — standard HTTP fallback.

Output is newline-delimited JSON. Progress lines include `progress`, `total`, and `row`. A final line has `done: true` and the full `results` array.

## API reference

All routes are proxied from Vite to Express on port 3001 during development.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/proxy?url=` | Fetch and rewrite a page for iframe preview |
| POST | `/scrape` | Start a scrape job; returns `{ jobId }` |
| GET | `/scrape-status/:id` | Poll job progress and results |
| POST | `/scan-links` | Detect product URL patterns on a page |
| POST | `/test-selectors` | Count CSS selector matches on a URL |
| GET | `/health` | Server health check |

## Project structure

```
scraper-ui/
├── server.js           # Express API
├── scraper.py          # Python scraper (scrapling)
├── requirements.txt    # Python dependencies
├── index.html
├── vite.config.js
└── src/
    ├── App.jsx
    ├── App.css
    ├── main.jsx
    ├── lib/
    │   └── settings.js
    └── components/
        ├── HeroScreen.jsx
        ├── Workspace.jsx
        ├── Sidebar.jsx
        ├── ScrapeOverlay.jsx
        ├── ScrapyRobot.jsx
        ├── ResultsTable.jsx
        ├── DocsPage.jsx
        ├── SettingsPanel.jsx
        └── Navbar.jsx
```

## Troubleshooting

### Proxy error / ECONNREFUSED

The backend is not running. Use `npm start` or run `npm run server` in a separate terminal.

### Python / scrapling not found

```bash
pip install scrapling
scrapling install
```

Make sure `python` is on your PATH (Windows) or `python3` on macOS/Linux.

### Page won't load in preview

Some sites block automated requests or require login. Try a direct product page URL instead of the homepage.

### No product links detected

The link scanner needs repeated URL patterns. Try a category or listing page, or scrape a single page manually.

### Selectors match 0 elements

Dynamic content may differ between the proxy preview and the Python fetcher. Use **Test Selectors** to verify, and try pages that work well with StealthyFetcher.
<<<<<<< HEAD
=======

>>>>>>> ff13189123be1b48c7e3b373b3d3d3bc7751c241
