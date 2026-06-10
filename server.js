const express = require('express')
const cors = require('cors')
const axios = require('axios')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const app = express()
app.use(cors())
app.use(express.json())

const SEL_COLORS = ['#00e5a0', '#4a9eff', '#ff9500', '#bf5fff', '#ff5f5f', '#ffd60a']

const INJECTED_SCRIPT = `
<script>
(function() {
  var selecting = false;
  var hovered = null;
  var selectedEls = [];
  var COLORS = ${JSON.stringify(SEL_COLORS)};

  function isJunk(str) {
    return /--\\d{5,}/.test(str) || /[a-f0-9]{8,}/.test(str);
  }

  function getBestSelector(node) {
    var tag = node.tagName.toLowerCase();
    if (node.id && !isJunk(node.id)) return '#' + node.id;
    var classes = Array.from(node.classList)
      .filter(function(c) { return !isJunk(c) && c.length < 40 && !/^\\d/.test(c); })
      .slice(0, 2);
    if (classes.length > 0) return tag + '.' + classes.join('.');
    return tag;
  }

  function getCssPath(el) {
    var parts = [];
    var current = el;
    var depth = 0;
    while (current && current !== document.body && depth < 3) {
      var sel = getBestSelector(current);
      parts.unshift(sel);
      try {
        if (sel.startsWith('#') || document.querySelectorAll(parts.join(' > ')).length === 1) break;
      } catch(e) { break; }
      current = current.parentElement;
      depth++;
    }
    return parts.join(' > ');
  }

  function onMouseOver(e) {
    if (!selecting) return;
    if (hovered && hovered !== e.target) {
      var found = selectedEls.find(function(s) { return s.el === hovered; });
      hovered.style.outline = found ? ('2px solid ' + found.color) : '';
    }
    hovered = e.target;
    hovered.style.outline = '2px solid #ffffff';
  }

  function onMouseOut(e) {
    if (!selecting) return;
    if (e.target && e.target.style) {
      var found = selectedEls.find(function(s) { return s.el === e.target; });
      e.target.style.outline = found ? ('2px solid ' + found.color) : '';
    }
  }

  function onClick(e) {
    if (!selecting) return;
    e.preventDefault();
    e.stopPropagation();
    var color = COLORS[selectedEls.length % COLORS.length];
    e.target.style.outline = '2px solid ' + color;
    e.target.style.outlineOffset = '1px';
    var selector = getCssPath(e.target);
    selectedEls.push({ el: e.target, color: color, selector: selector });
    var text = (e.target.innerText || e.target.textContent || '').trim().slice(0, 120);
    window.parent.postMessage({ type: 'ELEMENT_SELECTED', selector: selector, text: text, color: color }, '*');
  }

  // Navigate through the proxy so the injected script survives page changes.
  // Works for both static href links and JS-driven navigation attempts.
  function onNavClick(e) {
    if (selecting) return;
    var a = e.target;
    while (a && a.tagName !== 'A') a = a.parentElement;
    if (!a) return;
    var rawHref = a.getAttribute('href');
    if (!rawHref || rawHref === '#' || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) return;
    if (rawHref.startsWith('/proxy?url=')) return; // already going through proxy
    try {
      var params = new URLSearchParams(window.location.search);
      var currentTarget = params.get('url');
      if (!currentTarget) return;
      var originalHost = new URL(currentTarget).hostname;
      var absoluteUrl = new URL(rawHref, currentTarget).href;
      if (new URL(absoluteUrl).hostname !== originalHost) return; // external link
      e.preventDefault();
      e.stopPropagation();
      window.location.href = '/proxy?url=' + encodeURIComponent(absoluteUrl);
    } catch {}
  }

  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('click', onNavClick, true);

  window.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === 'START_SELECTING') { selecting = true; }
    if (e.data.type === 'STOP_SELECTING') {
      selecting = false;
      if (hovered) {
        var f = selectedEls.find(function(s) { return s.el === hovered; });
        hovered.style.outline = f ? ('2px solid ' + f.color) : '';
        hovered = null;
      }
    }
    if (e.data.type === 'CLEAR_SELECTIONS') {
      selectedEls.forEach(function(s) { s.el.style.outline = ''; s.el.style.outlineOffset = ''; });
      selectedEls = [];
      selecting = false;
    }
    if (e.data.type === 'REMOVE_SELECTION') {
      var toRemove = e.data.selector;
      var idx = selectedEls.findIndex(function(s) { return s.selector === toRemove; });
      if (idx !== -1) {
        selectedEls[idx].el.style.outline = '';
        selectedEls[idx].el.style.outlineOffset = '';
        selectedEls.splice(idx, 1);
      }
    }
  });
})();
</script>
`

// ── PROXY ────────────────────────────────────────────────────────────────────
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url
  if (!targetUrl) return res.status(400).send('Missing url parameter')

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
    })

    const headers = { ...response.headers }
    delete headers['x-frame-options']
    delete headers['content-security-policy']
    delete headers['content-security-policy-report-only']
    delete headers['x-content-type-options']
    delete headers['transfer-encoding']

    const contentType = (headers['content-type'] || '').toLowerCase()

    if (contentType.includes('text/html')) {
      let html = response.data.toString('utf-8')
      const base = new URL(targetUrl)
      const baseOrigin = base.origin
      const basePath = base.href

      html = html
        .replace(/(<[^>]+(?:href|src|action)=["'])\/\//gi, '$1https://')
        .replace(/(<[^>]+(?:href|src|action)=["'])\//gi, `$1${baseOrigin}/`)
        .replace(/(<[^>]+(?:href|src|action)=["'])(?!https?:\/\/|\/\/|#|mailto:|javascript:)([^"']+)/gi, (match, prefix, p) => {
          try { return prefix + new URL(p, basePath).href } catch { return match }
        })

      // Rewrite <a href> same-domain links to route through the proxy.
      // This keeps navigation proxied so the injected script survives page changes.
      html = html.replace(/(<a\b[^>]*?)href=(["'])(https?:\/\/[^"' >]+)\2/gi, (match, pre, q, href) => {
        try {
          const u = new URL(href)
          if (u.hostname === base.hostname) {
            return `${pre}href=${q}/proxy?url=${encodeURIComponent(href)}${q}`
          }
        } catch {}
        return match
      })

      html = html.replace(/<\/head>/i, INJECTED_SCRIPT + '</head>')
      if (!html.includes('ELEMENT_SELECTED')) html = INJECTED_SCRIPT + html

      res.set('content-type', 'text/html; charset=utf-8')
      Object.entries(headers).forEach(([k, v]) => { if (k !== 'content-type') { try { res.set(k, v) } catch (_) {} } })
      return res.send(html)
    }

    res.set('content-type', contentType)
    Object.entries(headers).forEach(([k, v]) => { if (k !== 'content-type') { try { res.set(k, v) } catch (_) {} } })
    return res.send(response.data)

  } catch (err) {
    const reason = err.response
      ? `Server responded with ${err.response.status}`
      : err.code === 'ECONNABORTED' ? 'Request timed out' : err.message
    res.status(502).send(`<!DOCTYPE html><html><head><style>
      body{background:#0d0d0d;color:#f0f0f0;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
      .box{border:1px solid #333;padding:2rem 3rem;border-radius:8px;text-align:center;max-width:480px}
      h2{color:#ff5f5f;margin:0 0 1rem}p{color:#888;margin:.5rem 0;font-size:.9rem}code{color:#00e5a0;font-size:.8rem;word-break:break-all}
    </style></head><body><div class="box"><h2>Could not load page</h2><p>${reason}</p><p>Some sites block proxying. Try loading a specific product page URL instead.</p><br><code>${targetUrl}</code></div></body></html>`)
  }
})

// ── JOBS ─────────────────────────────────────────────────────────────────────
const jobs = new Map()

function makeJobId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ── SCRAPE ───────────────────────────────────────────────────────────────────
app.post('/scrape', (req, res) => {
  const { url, selectors, mode = 'single', count = 10, pattern = null } = req.body || {}
  if (!url || !selectors || selectors.length === 0) {
    return res.json({ error: 'Missing url or selectors' })
  }

  const jobId = makeJobId()
  jobs.set(jobId, { progress: 0, total: 0, rows: [], done: false, error: null })

  const config = { url, selectors, mode, count: Number(count), pattern }
  const scriptPath = path.join(__dirname, 'scraper.py')
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
  const proc = spawn(pythonCmd, [scriptPath])

  proc.stdin.write(JSON.stringify(config))
  proc.stdin.end()

  let stderr = ''
  proc.stderr.on('data', d => { stderr += d.toString() })

  let buffer = ''
  proc.stdout.on('data', d => {
    buffer += d.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const obj = JSON.parse(line)
        const job = jobs.get(jobId)
        if (!job) continue
        if (obj.progress !== undefined) {
          job.progress = obj.progress
          job.total = obj.total
          if (obj.row) job.rows.push(obj.row)
        }
        if (obj.done) {
          job.done = true
          if (obj.results) job.rows = obj.results
          if (obj.no_links) job.no_links = true
        }
      } catch (e) {}
    }
  })

  proc.on('close', () => {
    const job = jobs.get(jobId)
    if (!job) return
    if (!job.done) {
      if (stderr.includes('ModuleNotFoundError') || stderr.includes("No module named 'scrapling'")) {
        job.error = 'Python scrapling package not found. Run: pip install scrapling && scrapling install'
      } else if (stderr.includes('No module named')) {
        job.error = 'Python module not found.\n' + stderr.slice(0, 300)
      } else if (stderr.includes('TimeoutError') || stderr.includes('timeout')) {
        job.error = 'Scraping timed out after 30 seconds. The site may be slow or blocking requests.'
      } else {
        job.error = (stderr || 'Scraper exited without output').slice(0, 500)
      }
      job.done = true
    }
    if (job.no_links) {
      job.error = 'No product links found on this page. Try a category or listing page URL.'
    }
    setTimeout(() => jobs.delete(jobId), 5 * 60 * 1000)
  })

  proc.on('error', err => {
    const job = jobs.get(jobId)
    if (job) {
      job.error = `Python 3 is required. Make sure it's installed and in your PATH. (${err.message})`
      job.done = true
    }
  })

  res.json({ jobId })
})

// ── SCRAPE STATUS ─────────────────────────────────────────────────────────────
app.get('/scrape-status/:id', (req, res) => {
  const job = jobs.get(req.params.id)
  if (!job) return res.json({ error: 'Job not found or expired' })
  res.json(job)
})

// ── SCAN LINKS ────────────────────────────────────────────────────────────────
app.post('/scan-links', async (req, res) => {
  const { url } = req.body || {}
  if (!url) return res.json({ error: 'Missing url' })

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
    })

    const html = response.data.toString('utf-8')
    const base = new URL(url)

    const NOISE = new Set(['cdn', 'assets', 'static', 'media', 'images', 'img', 'fonts',
      'policies', 'policy', 'account', 'cart', 'search', 'sitemap', 'blogs', 'blog',
      'robots', 'favicon', 'files', 'uploads', 'dist', 'build', 'en', 'ar'])
    const ASSET_EXT = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|webp|pdf)$/i

    function normalise(href) {
      try {
        return new URL(href, url).href.split('?')[0].split('#')[0]
      } catch { return null }
    }

    function pathParts(pageUrl) {
      try {
        return new URL(pageUrl).pathname.replace(/\/$/, '').split('/').filter(Boolean)
      } catch { return [] }
    }

    // First pass: count RAW occurrences of every URL (before dedup).
    // Nav/category links appear in header + footer + mobile menu = high count.
    // Product links appear once (in a grid) = low count.
    const rawCount = {}
    const hrefRegex = /href=["']([^"']+)["']/gi
    let match
    while ((match = hrefRegex.exec(html)) !== null) {
      const full = normalise(match[1])
      if (!full) continue
      try {
        const parsed = new URL(full)
        if (parsed.hostname !== base.hostname) continue
        const parts = pathParts(full)
        if (parts.length < 1) continue
        if (ASSET_EXT.test(parts[parts.length - 1])) continue
        rawCount[full] = (rawCount[full] || 0) + 1
      } catch {}
    }

    // Split into nav pages (repeat >= 2) and single-occurrence links (likely product grids)
    const navPages = []      // these become individual "navigate to" entries
    const singleLinks = {}   // group these by prefix → product patterns

    for (const [pageUrl, cnt] of Object.entries(rawCount)) {
      const parts = pathParts(pageUrl)
      if (parts.length < 2) continue
      // skip if any meaningful segment is pure noise
      const meaningful = parts.filter(p => !['en', 'ar', 'www'].includes(p.toLowerCase()))
      if (meaningful.length === 0) continue
      if (NOISE.has(meaningful[0].toLowerCase())) continue

      const slug = parts[parts.length - 1]
      if (slug.length < 2 || /^\d+$/.test(slug)) continue

      if (cnt >= 2) {
        // Repeated link → navigation / category page
        const label = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        navPages.push({ pattern: new URL(pageUrl).pathname, count: 0, sampleUrl: pageUrl, type: 'category', label })
      } else {
        // Appears once → potential product listing; group by prefix
        const prefix = '/' + parts.slice(0, parts.length - 1).join('/')
        if (!singleLinks[prefix]) singleLinks[prefix] = []
        singleLinks[prefix].push(pageUrl)
      }
    }

    // Product patterns: prefixes with >= 5 unique single-occurrence URLs
    const productPatterns = Object.entries(singleLinks)
      .filter(([prefix, urls]) => {
        const prefParts = prefix.split('/').filter(Boolean)
        if (prefParts.some(p => NOISE.has(p.toLowerCase()))) return false
        return urls.length >= 5
      })
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .map(([prefix, urls]) => ({ pattern: prefix, count: urls.length, sampleUrl: urls[0], type: 'pattern' }))

    // Deduplicate nav pages by pathname
    const seenPaths = new Set()
    const categoryPages = navPages
      .filter(p => { if (seenPaths.has(p.pattern)) return false; seenPaths.add(p.pattern); return true })
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, 30)

    const patterns = [...productPatterns, ...categoryPages]

    res.json({ patterns })
  } catch (err) {
    const msg = err.code === 'ECONNABORTED' ? 'Scraping timed out after 30 seconds. The site may be slow or blocking requests.'
      : err.response ? `Server responded with ${err.response.status}` : err.message
    res.json({ error: msg })
  }
})

// ── TEST SELECTORS ────────────────────────────────────────────────────────────
app.post('/test-selectors', (req, res) => {
  const { url, selectors } = req.body || {}
  if (!url || !selectors || selectors.length === 0) {
    return res.json({ error: 'Missing url or selectors' })
  }

  const script = `
import sys, json
from scrapling import Fetcher

url = ${JSON.stringify(url)}
selectors = ${JSON.stringify(selectors)}

fetcher = Fetcher()
try:
    page = fetcher.get(url, timeout=30)
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(0)

results = {}
for sel in selectors:
    try:
        matches = page.css(sel)
        results[sel] = len(matches)
    except Exception:
        results[sel] = 0

print(json.dumps(results))
`

  const scriptPath = path.join(os.tmpdir(), 'ms_test_selectors.py')
  try { fs.writeFileSync(scriptPath, script, 'utf8') } catch (e) {
    return res.json({ error: 'Could not write temp script: ' + e.message })
  }

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
  const proc = spawn(pythonCmd, [scriptPath])

  let stdout = ''
  let stderr = ''
  proc.stdout.on('data', d => { stdout += d.toString() })
  proc.stderr.on('data', d => { stderr += d.toString() })

  proc.on('close', () => {
    const out = stdout.trim()
    if (!out) return res.json({ error: stderr || 'No output from test script' })
    try {
      res.json(JSON.parse(out))
    } catch {
      res.json({ error: 'Could not parse output:\n' + out.slice(0, 200) })
    }
  })

  proc.on('error', err => res.json({ error: `Python 3 is required. (${err.message})` }))
})

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.listen(3001, () => console.log('MarketScout server running on http://localhost:3001'))
