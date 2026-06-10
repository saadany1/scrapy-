import { useState, useRef, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import HeroScreen from './components/HeroScreen'
import Workspace from './components/Workspace'
import DocsPage from './components/DocsPage'
import SettingsPanel from './components/SettingsPanel'
import { loadSettings } from './lib/settings'

export default function App() {
  // ── all state first ──
  const [activeTab, setActiveTab] = useState('scrape')
  const [scrapeView, setScrapeView] = useState('hero')
  const [workspaceUrl, setWorkspaceUrl] = useState('')
  const [iframeUrl, setIframeUrl] = useState('')
  const [iframeLoading, setIframeLoading] = useState(false)
  const [loadedUrl, setLoadedUrl] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [selections, setSelections] = useState([])
  const [fieldNames, setFieldNames] = useState([])
  const [pinnedFields, setPinnedFields] = useState(new Set())
  const [settings, setSettings] = useState(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [productCount, setProductCount] = useState(() => loadSettings().defaultProductCount)
  const [scanResults, setScanResults] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState(null)
  const [listingUrl, setListingUrl] = useState('')
  const [testResults, setTestResults] = useState(null)
  const [testing, setTesting] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [scrapeStatus, setScrapeStatus] = useState(null)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  // ── derived values (after all state) ──
  const mode = selectedPattern ? 'category' : 'single'
  const scraping = !!jobId
  const loadedDomain = workspaceUrl ? (() => { try { return new URL(workspaceUrl).hostname } catch { return '' } })() : ''

  const iframeRef = useRef(null)

  // ── callbacks ──
  const handleWorkspaceReady = useCallback((url) => {
    setWorkspaceUrl(url)
    setLoadedUrl(url)
    setIframeUrl(`/proxy?url=${encodeURIComponent(url)}`)
    setIframeLoading(true)
    setScrapeView('workspace')
  }, [])

  const handleClose = useCallback(() => {
    setScrapeView('hero')
    setWorkspaceUrl('')
    setIframeUrl('')
    setIframeLoading(false)
    setLoadedUrl('')
    setSelecting(false)
    setSelections([])
    setFieldNames([])
    setPinnedFields(new Set())
    setResults(null)
    setError(null)
    setScanResults(null)
    setSelectedPattern(null)
    setListingUrl('')
    setTestResults(null)
    setProductCount(settings.defaultProductCount)
  }, [settings.defaultProductCount])

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false)
    // Detect in-iframe navigation: the iframe may have followed a proxied link.
    // Read its current location (same-origin via the proxy) and sync React state.
    try {
      const loc = iframeRef.current?.contentWindow?.location?.href
      if (loc) {
        const u = new URL(loc)
        const newTarget = u.searchParams.get('url')
        if (newTarget && newTarget !== loadedUrl) {
          setLoadedUrl(newTarget)
          setWorkspaceUrl(newTarget)
          setScanResults(null)
          setSelectedPattern(null)
          setTestResults(null)
          setError(null)
        }
      }
    } catch {}
  }, [loadedUrl])

  const toggleSelecting = useCallback(() => {
    if (!iframeRef.current) return
    const next = !selecting
    setSelecting(next)
    iframeRef.current.contentWindow?.postMessage({ type: next ? 'START_SELECTING' : 'STOP_SELECTING' }, '*')
  }, [selecting])

  const clearAll = useCallback(() => {
    setSelections([])
    setFieldNames([])
    setPinnedFields(new Set())
    setSelecting(false)
    setResults(null)
    setError(null)
    setTestResults(null)
    iframeRef.current?.contentWindow?.postMessage({ type: 'CLEAR_SELECTIONS' }, '*')
  }, [])

  const removeSelection = useCallback((idx) => {
    setSelections(prev => {
      const sel = prev[idx]?.selector
      if (sel) iframeRef.current?.contentWindow?.postMessage({ type: 'REMOVE_SELECTION', selector: sel }, '*')
      return prev.filter((_, i) => i !== idx)
    })
    setFieldNames(prev => prev.filter((_, i) => i !== idx))
    setPinnedFields(prev => {
      const next = new Set()
      prev.forEach(i => {
        if (i < idx) next.add(i)
        else if (i > idx) next.add(i - 1)
      })
      return next
    })
  }, [])

  const renameField = useCallback((idx, name) => {
    setFieldNames(prev => {
      const next = [...prev]
      next[idx] = name || `Field ${idx + 1}`
      return next
    })
  }, [])

  const togglePin = useCallback((idx) => {
    setPinnedFields(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type !== 'ELEMENT_SELECTED') return
      const { selector, text, color } = e.data
      setSelections(prev => [...prev, { selector, text, color }])
      setFieldNames(prev => [...prev, `Field ${prev.length + 1}`])
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleSelectPattern = useCallback((pattern, sampleUrl, type) => {
    if (pattern === null) {
      setSelectedPattern(null)
      if (listingUrl) {
        setIframeLoading(true)
        setIframeUrl(`/proxy?url=${encodeURIComponent(listingUrl)}`)
        setLoadedUrl(listingUrl)
        setListingUrl('')
        setSelections([])
        setFieldNames([])
        setPinnedFields(new Set())
        setTestResults(null)
      }
      return
    }
    // Category page: navigate to it, clear scan so user can scan that page next
    if (type === 'category') {
      setIframeLoading(true)
      setIframeUrl(`/proxy?url=${encodeURIComponent(sampleUrl)}`)
      setLoadedUrl(sampleUrl)
      setListingUrl('')
      setScanResults(null)
      setSelectedPattern(null)
      setSelections([])
      setFieldNames([])
      setPinnedFields(new Set())
      setTestResults(null)
      setError(null)
      return
    }
    if (!listingUrl) setListingUrl(loadedUrl)
    setSelectedPattern(pattern)
    if (sampleUrl) {
      setIframeLoading(true)
      setIframeUrl(`/proxy?url=${encodeURIComponent(sampleUrl)}`)
      setLoadedUrl(sampleUrl)
      setSelections([])
      setFieldNames([])
      setPinnedFields(new Set())
      setTestResults(null)
      setError(null)
    } else {
      setError('No sample URL available. Click "Scan for product links" again to refresh.')
    }
  }, [listingUrl, loadedUrl])

  const handleScanLinks = useCallback(async () => {
    setScanning(true)
    setScanResults(null)
    setError(null)
    try {
      const resp = await fetch('/scan-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: loadedUrl }),
      })
      const data = await resp.json()
      if (data.error) setError(data.error)
      else { setScanResults(data.patterns || []); setSelectedPattern(null) }
    } catch (err) {
      setError('Could not scan links: ' + err.message)
    } finally {
      setScanning(false)
    }
  }, [loadedUrl])

  const handleTestSelectors = useCallback(async () => {
    if (!selections.length || !loadedUrl) return
    setTesting(true)
    setTestResults(null)
    setError(null)
    try {
      const resp = await fetch('/test-selectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: loadedUrl, selectors: selections.map(s => s.selector) }),
      })
      const data = await resp.json()
      if (data.error) setError(data.error)
      else setTestResults(data)
    } catch (err) {
      setError('Could not test selectors: ' + err.message)
    } finally {
      setTesting(false)
    }
  }, [selections, loadedUrl])

  const handleScrape = useCallback(async () => {
    if (!loadedUrl || !selections.length) return
    setError(null)
    setResults(null)
    setScrapeStatus(null)
    try {
      const resp = await fetch('/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: mode === 'category' && listingUrl ? listingUrl : loadedUrl,
          selectors: selections.map(s => s.selector),
          mode,
          count: productCount,
          pattern: selectedPattern || null,
        }),
      })
      const data = await resp.json()
      if (data.error) setError(data.error)
      else setJobId(data.jobId)
    } catch (err) {
      setError('Could not start scrape: ' + err.message)
    }
  }, [loadedUrl, selections, mode, productCount, listingUrl, selectedPattern])

  useEffect(() => {
    if (!jobId) return
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`/scrape-status/${jobId}`)
        const status = await resp.json()
        setScrapeStatus(status)
        if (status.done) {
          clearInterval(interval)
          setJobId(null)
          if (status.error) setError(status.error)
          else setResults(status.rows || [])
        }
      } catch (_) {}
    }, settings.statusPollMs)
    return () => clearInterval(interval)
  }, [jobId, settings.statusPollMs])

  const handleSettingsChange = useCallback((next) => {
    setSettings(next)
    setProductCount(next.defaultProductCount)
  }, [])

  return (
    <div className={`app-shell${activeTab === 'docs' ? ' app-shell--docs' : ''}${activeTab === 'scrape' && scrapeView === 'workspace' ? ' app-shell--workspace' : ''}`}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        loadedDomain={loadedDomain}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={handleSettingsChange}
      />

      {activeTab === 'scrape' && scrapeView === 'hero' && (
        <HeroScreen onWorkspaceReady={handleWorkspaceReady} />
      )}

      {activeTab === 'scrape' && scrapeView === 'workspace' && (
        <Workspace
          iframeRef={iframeRef}
          url={workspaceUrl}
          onClose={handleClose}
          iframeUrl={iframeUrl}
          iframeLoading={iframeLoading}
          onIframeLoad={handleIframeLoad}
          results={results}
          loadedUrl={loadedUrl}
          fieldNames={fieldNames}
          pinnedFields={pinnedFields}
          selections={selections}
          onScrape={handleScrape}
          selecting={selecting}
          scraping={scraping}
          onToggleSelecting={toggleSelecting}
          onRemoveSelection={removeSelection}
          onClearAll={clearAll}
          onRenameField={renameField}
          onTogglePin={togglePin}
          productCount={productCount}
          setProductCount={setProductCount}
          scanResults={scanResults}
          scanning={scanning}
          onScanLinks={handleScanLinks}
          selectedPattern={selectedPattern}
          onSelectPattern={handleSelectPattern}
          testResults={testResults}
          testing={testing}
          onTestSelectors={handleTestSelectors}
          scrapeStatus={scrapeStatus}
          error={error}
        />
      )}

      {activeTab === 'docs' && <DocsPage />}
    </div>
  )
}
