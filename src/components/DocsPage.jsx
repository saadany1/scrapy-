import { useState } from 'react'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'getting-started', label: 'Getting started' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'preview', label: 'Page preview' },
  { id: 'selecting', label: 'Element selection' },
  { id: 'scraping', label: 'Scraping modes' },
  { id: 'link-scan', label: 'Link scanning' },
  { id: 'python', label: 'Python scraper' },
  { id: 'api', label: 'API reference' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
]

function Code({ children }) {
  return <code className="docs-code">{children}</code>
}

function Pre({ children }) {
  return <pre className="docs-pre">{children}</pre>
}

export default function DocsPage() {
  const [active, setActive] = useState('overview')

  function scrollTo(id) {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="docs-page">
      <aside className="docs-nav">
        <div className="docs-nav-title">Documentation</div>
        <nav className="docs-nav-list">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`docs-nav-item${active === s.id ? ' active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      <article className="docs-content">
        <section id="overview" className="docs-section">
          <h1>Scrapy documentation</h1>
          <p>
            Scrapy is a visual web scraper. You load any page in a live preview, click elements to
            capture CSS selectors, then run a scrape job that extracts structured data into a table
            you can export as CSV or JSON.
          </p>
          <p>
            The app has three parts: a React frontend, a Node.js API server, and a Python scraper
            powered by <a href="https://github.com/D4Vinci/Scrapling" target="_blank" rel="noreferrer">scrapling</a>.
          </p>
        </section>

        <section id="getting-started" className="docs-section">
          <h2>Getting started</h2>

          <h3>Prerequisites</h3>
          <ul>
            <li>Node.js 18+</li>
            <li>Python 3 with <Code>pip install scrapling</Code> and <Code>scrapling install</Code></li>
          </ul>

          <h3>Install</h3>
          <Pre>{`cd scraper-ui
npm install`}</Pre>

          <h3>Run</h3>
          <p>Start both the API server and the Vite dev server together:</p>
          <Pre>{`npm start`}</Pre>
          <p>
            This runs Express on <Code>http://localhost:3001</Code> and the UI on{' '}
            <Code>http://localhost:5173</Code>. Open the UI URL in your browser.
          </p>
          <p>Or run them in separate terminals:</p>
          <Pre>{`npm run server   # API on port 3001
npm run dev      # UI on port 5173`}</Pre>
          <p>
            <strong>Important:</strong> the frontend alone (<Code>npm run dev</Code>) is not enough.
            Page preview and scraping require the backend on port 3001.
          </p>
        </section>

        <section id="architecture" className="docs-section">
          <h2>Architecture</h2>
          <div className="docs-diagram">
            <div className="docs-diagram-row">
              <div className="docs-diagram-box">React UI<br /><span>port 5173</span></div>
              <div className="docs-diagram-arrow">→ proxy →</div>
              <div className="docs-diagram-box">Express API<br /><span>port 3001</span></div>
              <div className="docs-diagram-arrow">→ spawn →</div>
              <div className="docs-diagram-box">scraper.py<br /><span>Python + scrapling</span></div>
            </div>
          </div>
          <ul>
            <li>
              <strong>Frontend</strong> — Vite + React. Handles the workspace UI, element picker
              messaging, and polls scrape job status.
            </li>
            <li>
              <strong>server.js</strong> — Express API. Proxies pages for preview, scans HTML for
              link patterns, spawns the Python scraper, and streams progress back.
            </li>
            <li>
              <strong>scraper.py</strong> — Reads JSON config from stdin, fetches pages with
              scrapling, extracts text via CSS selectors, prints JSON lines to stdout.
            </li>
          </ul>
        </section>

        <section id="preview" className="docs-section">
          <h2>Page preview</h2>
          <p>
            When you enter a URL, the app loads it through <Code>GET /proxy?url=…</Code> instead of
            fetching it directly in the browser. This solves two problems:
          </p>
          <ul>
            <li><strong>CORS / iframe blocking</strong> — many sites set X-Frame-Options or CSP headers that prevent embedding. The proxy strips those headers.</li>
            <li><strong>Element picker injection</strong> — the server injects a script into the HTML that listens for clicks and posts selected CSS selectors back to the UI via <Code>postMessage</Code>.</li>
          </ul>
          <p>
            Same-domain links inside the preview are rewritten to stay on the proxy, so you can
            navigate category pages without losing the picker script.
          </p>
        </section>

        <section id="selecting" className="docs-section">
          <h2>Element selection</h2>
          <ol>
            <li>Click <strong>Start Selecting</strong> in the sidebar.</li>
            <li>Hover and click elements in the preview — each click captures a CSS selector and sample text.</li>
            <li>Rename fields by double-clicking their label. Pin a field to hide rows where that field is empty in results.</li>
            <li>Use <strong>Test Selectors</strong> to verify how many matches each selector finds on the current page.</li>
          </ol>
          <p>
            Selectors are built from element IDs, classes, and tag names. The injected script prefers
            stable IDs and short class-based paths rather than long auto-generated class hashes.
          </p>
        </section>

        <section id="scraping" className="docs-section">
          <h2>Scraping modes</h2>

          <h3>Single page</h3>
          <p>
            Extracts data from the currently loaded URL. If a selector matches multiple elements on
            the page (e.g. a product grid), Scrapy creates one row per match, up to the{' '}
            <strong>Items to Scrape</strong> limit.
          </p>

          <h3>Category / multi-page</h3>
          <p>
            After scanning for product links and selecting a URL pattern (e.g. <Code>/products/*</Code>),
            Scrapy:
          </p>
          <ol>
            <li>Loads a sample product page so you can pick selectors on a real detail page.</li>
            <li>Visits the listing URL, collects all links matching the pattern.</li>
            <li>Fetches each product page and extracts the selected fields.</li>
            <li>Streams progress (product 3 of 10…) back to the UI.</li>
          </ol>
          <p>
            Set the item limit in the sidebar before clicking <strong>Scrape Now</strong>. The default
            can be changed in Settings (gear icon).
          </p>
        </section>

        <section id="link-scan" className="docs-section">
          <h2>Link scanning</h2>
          <p>
            <strong>Scan for product links</strong> fetches the raw HTML of the current page (not
            through the proxy iframe) and analyzes all <Code>href</Code> attributes.
          </p>
          <ul>
            <li>
              <strong>Product patterns</strong> — URL prefixes where many unique single-occurrence
              links appear (typical of product grids). Requires at least 5 matching links.
            </li>
            <li>
              <strong>Category pages</strong> — links that repeat across the page (nav, footer).
              Click one to navigate the preview to that page.
            </li>
          </ul>
        </section>

        <section id="python" className="docs-section">
          <h2>Python scraper</h2>
          <p>
            <Code>scraper.py</Code> is spawned as a child process for each scrape job. The server
            sends JSON on stdin:
          </p>
          <Pre>{`{
  "url": "https://example.com/products",
  "selectors": ["h1.title", "span.price"],
  "mode": "single" | "category",
  "count": 10,
  "pattern": "/products"
}`}</Pre>
          <p>Fetching uses scrapling's fetchers:</p>
          <ul>
            <li><strong>StealthyFetcher</strong> — used when available, handles JS-heavy or protected pages.</li>
            <li><strong>Fetcher</strong> — standard HTTP fallback.</li>
          </ul>
          <p>
            Output is newline-delimited JSON. Progress lines include <Code>progress</Code>,{' '}
            <Code>total</Code>, and <Code>row</Code>. A final line has <Code>done: true</Code> and
            the full <Code>results</Code> array.
          </p>
        </section>

        <section id="api" className="docs-section">
          <h2>API reference</h2>
          <p>All routes are proxied from Vite (<Code>/…</Code>) to Express on port 3001.</p>
          <table className="docs-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>GET</td>
                <td><Code>/proxy?url=</Code></td>
                <td>Fetch and rewrite a page for iframe preview</td>
              </tr>
              <tr>
                <td>POST</td>
                <td><Code>/scrape</Code></td>
                <td>Start a scrape job; returns <Code>{'{ jobId }'}</Code></td>
              </tr>
              <tr>
                <td>GET</td>
                <td><Code>/scrape-status/:id</Code></td>
                <td>Poll job progress and results</td>
              </tr>
              <tr>
                <td>POST</td>
                <td><Code>/scan-links</Code></td>
                <td>Detect product URL patterns on a page</td>
              </tr>
              <tr>
                <td>POST</td>
                <td><Code>/test-selectors</Code></td>
                <td>Count CSS selector matches on a URL</td>
              </tr>
              <tr>
                <td>GET</td>
                <td><Code>/health</Code></td>
                <td>Server health check</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="troubleshooting" className="docs-section">
          <h2>Troubleshooting</h2>

          <h3>Proxy error / ECONNREFUSED</h3>
          <p>The backend is not running. Use <Code>npm start</Code> or run <Code>npm run server</Code> in a separate terminal.</p>

          <h3>Python / scrapling not found</h3>
          <Pre>{`pip install scrapling
scrapling install`}</Pre>
          <p>Make sure <Code>python</Code> is on your PATH (Windows) or use <Code>python3</Code> on macOS/Linux.</p>

          <h3>Page won't load in preview</h3>
          <p>Some sites block automated requests or require login. Try a direct product page URL instead of the homepage.</p>

          <h3>No product links detected</h3>
          <p>The link scanner needs repeated URL patterns. Try a category or listing page, or scrape a single page manually.</p>

          <h3>Selectors match 0 elements</h3>
          <p>Dynamic content may differ between the proxy preview and the Python fetcher. Use Test Selectors to verify, and try StealthyFetcher-friendly pages.</p>
        </section>
      </article>
    </div>
  )
}
