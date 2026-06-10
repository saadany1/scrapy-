import { useEffect, useState } from 'react'
import { loadSettings, saveSettings, resetSettings, DEFAULTS } from '../lib/settings'

export default function SettingsPanel({ open, onClose, onSettingsChange }) {
  const [settings, setSettings] = useState(loadSettings)
  const [serverStatus, setServerStatus] = useState('checking')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    setSettings(loadSettings())
    setSaved(false)
    checkServer()
  }, [open])

  async function checkServer() {
    setServerStatus('checking')
    try {
      const resp = await fetch('/health')
      setServerStatus(resp.ok ? 'online' : 'offline')
    } catch {
      setServerStatus('offline')
    }
  }

  function update(key, value) {
    const next = saveSettings({ [key]: value })
    setSettings(next)
    onSettingsChange?.(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    const next = resetSettings()
    setSettings(next)
    onSettingsChange?.(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!open) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <header className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="settings-body">
          <section className="settings-group">
            <div className="settings-label">Default items to scrape</div>
            <p className="settings-hint">Applied when opening a new workspace.</p>
            <input
              className="settings-input"
              type="number"
              min={1}
              max={500}
              value={settings.defaultProductCount}
              onChange={e => update('defaultProductCount', Math.max(1, Math.min(500, Number(e.target.value) || DEFAULTS.defaultProductCount)))}
            />
          </section>

          <section className="settings-group">
            <div className="settings-label">Status poll interval</div>
            <p className="settings-hint">How often the UI checks scrape job progress (ms).</p>
            <select
              className="settings-input"
              value={settings.statusPollMs}
              onChange={e => update('statusPollMs', Number(e.target.value))}
            >
              <option value={1000}>1 second</option>
              <option value={1500}>1.5 seconds</option>
              <option value={2000}>2 seconds</option>
              <option value={3000}>3 seconds</option>
            </select>
          </section>

          <section className="settings-group">
            <div className="settings-label">Backend server</div>
            <div className="settings-status-row">
              <span className={`settings-status-dot ${serverStatus}`} />
              <span className="settings-status-text">
                {serverStatus === 'checking' && 'Checking…'}
                {serverStatus === 'online' && 'Connected — localhost:3001'}
                {serverStatus === 'offline' && 'Not reachable — run npm run server'}
              </span>
              <button className="settings-link-btn" onClick={checkServer}>Recheck</button>
            </div>
          </section>
        </div>

        <footer className="settings-footer">
          {saved && <span className="settings-saved">Saved</span>}
          <button className="settings-reset-btn" onClick={handleReset}>Reset to defaults</button>
        </footer>
      </div>
    </div>
  )
}
