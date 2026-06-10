import { useState } from 'react'

const SEL_COLORS = ['#4ade80', '#60a5fa', '#fb923c', '#c084fc', '#f87171', '#facc15']

function PinIcon({ active }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  )
}

function CrosshairIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="7" />
      <line x1="12" y1="5" x2="12" y2="1" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="5" y1="12" x2="1" y2="12" />
      <line x1="19" y1="12" x2="23" y2="12" />
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="6" opacity="0.5" />
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
    </svg>
  )
}

export default function Sidebar({
  iframeLoaded,
  selecting, onToggleSelecting,
  selections, fieldNames, pinnedFields,
  onRemoveSelection, onClearAll,
  onRenameField, onTogglePin,
  productCount, setProductCount,
  scanResults, scanning, onScanLinks,
  selectedPattern, onSelectPattern,
  testResults, testing, onTestSelectors,
  scraping, scrapeStatus,
  onScrape,
  error,
}) {
  const [editingIdx, setEditingIdx] = useState(null)
  const [editName, setEditName] = useState('')

  function startEdit(idx) {
    setEditingIdx(idx)
    setEditName(fieldNames[idx] || `Field ${idx + 1}`)
  }

  function commitEdit(idx) {
    const name = editName.trim()
    onRenameField(idx, name || `Field ${idx + 1}`)
    setEditingIdx(null)
  }

  function cancelEdit() {
    setEditingIdx(null)
    setEditName('')
  }

  const getName = (i) => (fieldNames && fieldNames[i]) || `Field ${i + 1}`
  const fieldCount = selections.length
  const hasSelections = fieldCount > 0

  return (
    <aside className="sidebar">

      {/* Scan links */}
      {iframeLoaded && (
        <section className="section">
          <button className="btn-scan" onClick={onScanLinks} disabled={scanning}>
            {scanning ? <><span className="btn-spinner" /> Scanning...</> : <><ScanIcon /> Scan for product links</>}
          </button>
          {scanResults && scanResults.length > 0 && (() => {
            const patterns = scanResults.filter(r => r.type === 'pattern')
            const categories = scanResults.filter(r => r.type === 'category')
            return (
              <>
                {patterns.length > 0 && (
                  <>
                    <div className="scan-hint">Product patterns — select one to scrape:</div>
                    <div className="scan-results">
                      {patterns.map((r, i) => {
                        const active = selectedPattern === r.pattern
                        return (
                          <div key={i} className={`scan-pattern ${active ? 'selected' : ''}`}
                            onClick={() => onSelectPattern(active ? null : r.pattern, r.sampleUrl, 'pattern')}>
                            <span className="scan-path">{r.pattern}/*</span>
                            <span className="scan-count">{r.count} links{active ? ' ✓' : ''}</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
                {categories.length > 0 && (
                  <>
                    <div className="scan-hint" style={{ marginTop: patterns.length ? 10 : 0 }}>Pages — click to navigate:</div>
                    <div className="scan-results">
                      {categories.map((r, i) => (
                        <div key={i} className="scan-pattern scan-category"
                          onClick={() => onSelectPattern(r.pattern, r.sampleUrl, 'category')}>
                          <span className="scan-path">{r.label}</span>
                          <span className="scan-count scan-nav-arrow">→</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {selectedPattern && (
                  <div className="scan-selected-note">
                    A sample product page has loaded in the preview.
                    Select the elements you want, then click <strong>Scrape Now</strong> —
                    it will visit all <strong>{selectedPattern}/*</strong> links and extract them.
                  </div>
                )}
              </>
            )
          })()}
          {scanResults && scanResults.length === 0 && (
            <div className="scan-none">No repeated link patterns detected</div>
          )}
        </section>
      )}

      {/* Selection controls */}
      {iframeLoaded && (
        <section className="section">
          <div className="selection-controls-header">
            <div className="section-label">Element Selection</div>
            {fieldCount > 0 && <span className="count-badge">{fieldCount} selected</span>}
          </div>
          <div className="select-controls">
            <button className={`btn-select ${selecting ? 'active' : ''}`} onClick={onToggleSelecting}>
              {selecting
                ? <><span className="selecting-pulse-dot" /> Stop Selecting</>
                : <><CrosshairIcon /> Start Selecting</>
              }
            </button>
            {fieldCount > 0 && (
              <button className="btn-clear-all" onClick={onClearAll}>Clear All</button>
            )}
          </div>
        </section>
      )}

      {/* Selected fields list */}
      {iframeLoaded && (
        <section className="section selections-section">
          <div className="section-label">Selected Fields</div>
          {fieldCount === 0 ? (
            <div className="empty-state">Click elements on the page to select them</div>
          ) : (
            <div className="selections-list">
              {selections.map((sel, idx) => {
                const color = sel.color || SEL_COLORS[idx % SEL_COLORS.length]
                return (
                  <div
                    key={idx}
                    className={`selection-card ${pinnedFields.has(idx) ? 'pinned' : ''}`}
                    style={{ borderLeftColor: color }}
                  >
                    <div className="selection-header">
                      <div className="selection-label-row">
                        <span className="color-dot" style={{ background: color }} />
                        {editingIdx === idx ? (
                          <input
                            className="field-name-input"
                            value={editName}
                            maxLength={30}
                            autoFocus
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitEdit(idx)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            onBlur={() => commitEdit(idx)}
                          />
                        ) : (
                          <span
                            className="selection-field-name"
                            onDoubleClick={() => startEdit(idx)}
                            title="Double-click to rename"
                          >
                            {getName(idx)}
                          </span>
                        )}
                        {testResults && (
                          <span className={`test-badge ${testResults[sel.selector] > 0 ? 'ok' : 'fail'}`}>
                            {testResults[sel.selector] > 0 ? `✓ ${testResults[sel.selector]}` : '✗ 0'}
                          </span>
                        )}
                      </div>
                      <div className="card-actions">
                        <button
                          className={`btn-pin ${pinnedFields.has(idx) ? 'active' : ''}`}
                          onClick={() => onTogglePin(idx)}
                          title={pinnedFields.has(idx) ? 'Unpin field' : 'Pin: hide rows missing this field'}
                        >
                          <PinIcon active={pinnedFields.has(idx)} />
                        </button>
                        <button className="btn-remove" onClick={() => onRemoveSelection(idx)}>✕</button>
                      </div>
                    </div>
                    <div className="selection-text">
                      {(sel.text || '(no text)').slice(0, 60)}{sel.text?.length > 60 ? '…' : ''}
                    </div>
                    <div className="selection-selector">{sel.selector}</div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Test selectors */}
      {hasSelections && (
        <section className="section">
          <button className="btn-test" onClick={onTestSelectors} disabled={testing}>
            {testing ? <><span className="btn-spinner" /> Testing...</> : '⌕ Test Selectors'}
          </button>
        </section>
      )}

      {/* Items to scrape */}
      {hasSelections && (
        <section className="section">
          <div className="section-label">Items to Scrape</div>
          <input
            className="count-input"
            type="number"
            min={1}
            max={500}
            value={productCount}
            onChange={e => setProductCount(Math.max(1, Math.min(500, Number(e.target.value))))}
          />
        </section>
      )}

      {/* Scrape Now */}
      {hasSelections && (
        <section className="section">
          <button className="btn-scrape" onClick={onScrape} disabled={scraping}>
            {scraping ? <><span className="btn-spinner" /> Scraping...</> : 'Scrape Now'}
          </button>
        </section>
      )}

      {/* Progress */}
      {scraping && scrapeStatus && scrapeStatus.total > 0 && (
        <section className="section">
          <div className="progress-label">
            Scraping product {scrapeStatus.progress} of {scrapeStatus.total}…
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(scrapeStatus.progress / scrapeStatus.total) * 100}%` }} />
          </div>
        </section>
      )}

      {/* Error */}
      {error && (
        <section className="section">
          <div className="error-card">
            <div className="error-title">Error</div>
            <pre className="error-body">{error}</pre>
          </div>
        </section>
      )}
    </aside>
  )
}
