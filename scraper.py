import json
import sys
import asyncio
from urllib.parse import urlparse, urljoin

_stealthy_ok = False
try:
    from scrapling.fetchers import StealthyFetcher
    _stealthy_ok = True
except Exception:
    pass

from scrapling import Fetcher as _StaticFetcher


def _first(element, selector):
    try:
        r = element.css(selector)
        return r[0] if r else None
    except Exception:
        return None


async def _fetch(url):
    if _stealthy_ok:
        try:
            f = StealthyFetcher()
            return await f.async_fetch(url, timeout=30000)
        except Exception:
            pass
    f = _StaticFetcher()
    return await asyncio.to_thread(lambda: f.get(url, timeout=30))


async def scrape_single(url, selectors, count=None):
    page = await _fetch(url)

    # Collect all matches for each selector
    all_matches = []
    for sel in selectors:
        try:
            els = page.css(sel)
            texts = []
            for el in els:
                t = ""
                try:
                    t = (el.text or "").strip()
                    if not t:
                        t = (el.attrib or {}).get("content", "") or (el.attrib or {}).get("alt", "") or ""
                except Exception:
                    pass
                texts.append(t)
            all_matches.append(texts)
        except Exception:
            all_matches.append([])

    max_len = max((len(m) for m in all_matches), default=1)
    if count:
        max_len = min(max_len, int(count))

    results = []
    for idx in range(max_len):
        row = {"_url": url}
        for i, matches in enumerate(all_matches):
            row[f"field_{i+1}"] = matches[idx] if idx < len(matches) else ""
        results.append(row)

    return results if results else [{"_url": url}]


async def scrape_category(listing_url, selectors, count, pattern=None):
    listing_page = await _fetch(listing_url)
    base = urlparse(listing_url)
    base_url = f"{base.scheme}://{base.netloc}"

    fallback_patterns = [
        "/product", "/products", "/item", "/items",
        "/p/", "/pd/", "/shop/", "/en/p/", "/detail",
    ]

    def matches(path):
        if pattern:
            return path.startswith(pattern)
        return any(p in path for p in fallback_patterns)

    all_links = []
    for a in listing_page.css("a"):
        try:
            href = (a.attrib or {}).get("href", "")
            if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("javascript:"):
                continue
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)
            if parsed.netloc != base.netloc:
                continue
            path = parsed.path
            if matches(path):
                all_links.append(full_url.split("?")[0].split("#")[0])
        except Exception:
            continue

    seen = set()
    unique_links = []
    for link in all_links:
        if link not in seen and link != listing_url:
            seen.add(link)
            unique_links.append(link)

    total = min(len(unique_links), count)

    if total == 0:
        print(json.dumps({"done": True, "results": [], "no_links": True}), flush=True)
        return []

    results = []
    for i, product_url in enumerate(unique_links[:count]):
        try:
            product_page = await _fetch(product_url)
            row = {"_url": product_url}
            for j, sel in enumerate(selectors):
                el = _first(product_page, sel)
                row[f"field_{j+1}"] = (el.text or "").strip() if el else ""
            results.append(row)
            print(json.dumps({"progress": i + 1, "total": total, "row": row}), flush=True)
        except Exception as e:
            err_row = {"_url": product_url, "_error": str(e)}
            for j in range(len(selectors)):
                err_row[f"field_{j+1}"] = ""
            results.append(err_row)
            print(json.dumps({"progress": i + 1, "total": total, "error": str(e)}), flush=True)

    return results


async def main():
    config = json.loads(sys.stdin.read())
    url = config["url"]
    selectors = config["selectors"]
    mode = config.get("mode", "single")
    count = int(config.get("count", 10))

    pattern = config.get("pattern") or None

    if mode == "category":
        results = await scrape_category(url, selectors, count, pattern)
    else:
        results = await scrape_single(url, selectors, count)

    print(json.dumps({"done": True, "results": results}), flush=True)


asyncio.run(main())
