import { useState } from 'react'
import ScrapyRobot from './ScrapyRobot'

export default function HeroScreen({ onWorkspaceReady }) {
  const [urlInput, setUrlInput] = useState('')
  const [robotPhase, setRobotPhase] = useState('idle') // idle | loading | success
  const [loadingUrl, setLoadingUrl] = useState('')

  function handleLoad() {
    const raw = urlInput.trim()
    if (!raw || robotPhase !== 'idle') return
    const url = raw.startsWith('http') ? raw : `https://${raw}`
    setLoadingUrl(url)
    setRobotPhase('loading')
  }

  function handleIframeLoad() {
    if (robotPhase !== 'loading') return
    setRobotPhase('success')
    setTimeout(() => onWorkspaceReady(loadingUrl), 800)
  }

  const isLoading = robotPhase === 'loading'
  const isSuccess = robotPhase === 'success'
  const urlFading = isLoading || isSuccess

  return (
    <div className="hero-screen">
      {loadingUrl && (
        <iframe
          src={`/proxy?url=${encodeURIComponent(loadingUrl)}`}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none', border: 'none' }}
          onLoad={handleIframeLoad}
          title="bg-load"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )}

      <div className="hero-center">
        <ScrapyRobot isLoading={isLoading} isSuccess={isSuccess} />

        <div className="hero-title">Hi, I&apos;m Scrapy.</div>
        <div className="hero-subtitle">Give me a URL and I&apos;ll extract anything from it.</div>

        <div className={`hero-url-area${urlFading ? ' hero-fading' : ''}`}>
          <div className="hero-url-row">
            <input
              className="hero-url-input"
              type="text"
              placeholder="https://example.com/products"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoad()}
              disabled={urlFading}
            />
            <button className="hero-load-btn" onClick={handleLoad} disabled={urlFading}>
              Load →
            </button>
          </div>
          <div
            className="hero-hint"
            onClick={() => !urlFading && setUrlInput('homzmart.com/en/c/sofas')}
          >
            Try: homzmart.com/en/c/sofas
          </div>
        </div>
      </div>
    </div>
  )
}
