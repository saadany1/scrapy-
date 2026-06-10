const TABS = ['Scrape', 'Docs']

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export default function Navbar({ activeTab, setActiveTab, loadedDomain, onOpenSettings }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo">
          <span className="navbar-logo-symbol">◈</span>
          <span className="navbar-logo-name">Scrapy</span>
          <span className="logo-pulse" />
        </div>

        <nav className="navbar-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`navbar-pill${activeTab === tab.toLowerCase() ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="navbar-right">
          {loadedDomain && (
            <span className="navbar-domain">
              <span className="navbar-domain-dot" />
              {loadedDomain}
            </span>
          )}
          <button className="navbar-gear" title="Settings" onClick={onOpenSettings}>
            <GearIcon />
          </button>
        </div>
      </div>
    </header>
  )
}
