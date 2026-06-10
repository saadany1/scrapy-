import { useState } from 'react'
import Sidebar from './Sidebar'
import ResultsTable from './ResultsTable'
import ScrapeOverlay from './ScrapeOverlay'

function ChevronIcon({ collapsed }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`sidebar-toggle-icon${collapsed ? ' collapsed' : ''}`}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export default function Workspace({
  iframeRef,
  url,
  onClose,
  iframeUrl,
  iframeLoading,
  onIframeLoad,
  results,
  loadedUrl,
  fieldNames,
  pinnedFields,
  selections,
  onScrape,
  selecting,
  scraping,
  onToggleSelecting,
  onRemoveSelection,
  onClearAll,
  onRenameField,
  onTogglePin,
  productCount,
  setProductCount,
  scanResults,
  scanning,
  onScanLinks,
  selectedPattern,
  onSelectPattern,
  testResults,
  testing,
  onTestSelectors,
  scrapeStatus,
  error,
}) {
  const [everLoaded, setEverLoaded] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  function handleIframeLoad() {
    setEverLoaded(true)
    onIframeLoad()
  }

  return (
    <div className={`workspace${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="workspace-panel">
        <div className="workspace-panel-inner">
          <div className="workspace-url-bar">
            <div className="workspace-url-text">{url}</div>
            <button className="workspace-close-btn" onClick={onClose} title="Close">✕</button>
          </div>
          <Sidebar
            iframeLoaded={!!iframeUrl}
            selections={selections}
            fieldNames={fieldNames}
            pinnedFields={pinnedFields}
            selecting={selecting}
            onToggleSelecting={onToggleSelecting}
            onRemoveSelection={onRemoveSelection}
            onClearAll={onClearAll}
            onRenameField={onRenameField}
            onTogglePin={onTogglePin}
            productCount={productCount}
            setProductCount={setProductCount}
            scanResults={scanResults}
            scanning={scanning}
            onScanLinks={onScanLinks}
            selectedPattern={selectedPattern}
            onSelectPattern={onSelectPattern}
            testResults={testResults}
            testing={testing}
            onTestSelectors={onTestSelectors}
            scraping={scraping}
            scrapeStatus={scrapeStatus}
            onScrape={onScrape}
            error={error}
          />
        </div>
      </div>

      <div className="workspace-main">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(c => !c)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronIcon collapsed={sidebarCollapsed} />
        </button>

        {iframeLoading && everLoaded && <div className="progress-bar-top" />}

        {selecting && (
          <div className="selection-banner">
            <span className="banner-dot" />
            Selection mode active — click elements to capture them
          </div>
        )}

        {scraping && <ScrapeOverlay scrapeStatus={scrapeStatus} />}

        {iframeUrl && (
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="preview-iframe"
            style={{
              opacity: iframeLoading && !everLoaded ? 0 : 1,
              transition: 'opacity 0.4s ease',
              pointerEvents: iframeLoading && !everLoaded ? 'none' : 'auto',
            }}
            onLoad={handleIframeLoad}
            title="preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}

        {results !== null && (
          <div className="results-panel">
            <ResultsTable
              results={results}
              selections={selections}
              fieldNames={fieldNames}
              pinnedFields={pinnedFields}
              loadedUrl={loadedUrl}
              onScrapeAgain={onScrape}
            />
          </div>
        )}
      </div>
    </div>
  )
}
