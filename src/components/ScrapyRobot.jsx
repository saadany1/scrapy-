import { useState, useEffect } from 'react'

const DEFAULT_TEXTS = ['Fetching page...', 'Scanning structure...', 'Almost ready...']

export default function ScrapyRobot({ isLoading, isSuccess, texts, statusText, progress }) {
  const loadingTexts = texts ?? DEFAULT_TEXTS
  const [textIdx, setTextIdx] = useState(0)

  useEffect(() => {
    if (!isLoading || statusText) { setTextIdx(0); return }
    const id = setInterval(() => setTextIdx(i => (i + 1) % loadingTexts.length), 1500)
    return () => clearInterval(id)
  }, [isLoading, statusText, loadingTexts.length])

  const cls = isSuccess ? 'robot--success' : isLoading ? 'robot--loading' : ''
  const displayText = statusText ?? loadingTexts[textIdx]
  const hasRealProgress = progress && progress.total > 0
  const progressPct = hasRealProgress
    ? Math.min(100, (progress.current / progress.total) * 100)
    : null

  return (
    <div className={`robot-container ${cls}`}>
      <svg width="180" height="220" viewBox="0 0 180 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="eye-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="led-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g className="robot-all">

          {/* ── TRACKS ── */}
          <rect x="14" y="187" width="58" height="25" rx="12" fill="#111520" />
          {[23, 33, 43, 53, 63].map((cx, i) => (
            <circle key={i} cx={cx} cy="199" r="5" fill="#1e2d3d" stroke="#4ade80" strokeWidth="0.8" opacity="0.65" />
          ))}
          <rect x="108" y="187" width="58" height="25" rx="12" fill="#111520" />
          {[117, 127, 137, 147, 157].map((cx, i) => (
            <circle key={i} cx={cx} cy="199" r="5" fill="#1e2d3d" stroke="#4ade80" strokeWidth="0.8" opacity="0.65" />
          ))}

          {/* ── BODY ── */}
          <rect x="30" y="96" width="120" height="91" rx="7" fill="#1e2d3d" />
          <rect x="30" y="96" width="120" height="6" rx="4" fill="#243447" />

          {/* Chest panel */}
          <rect x="52" y="112" width="76" height="46" rx="4" fill="#243447" />
          <line x1="62" y1="123" x2="118" y2="123" stroke="#4ade80" strokeWidth="1.5" opacity="0.6" />
          <line x1="62" y1="131" x2="108" y2="131" stroke="#4ade80" strokeWidth="1.5" opacity="0.38" />
          <line x1="62" y1="139" x2="114" y2="139" stroke="#4ade80" strokeWidth="1.5" opacity="0.22" />

          {/* Body rivets */}
          <circle cx="38" cy="103" r="2.5" fill="#0a0d14" />
          <circle cx="142" cy="103" r="2.5" fill="#0a0d14" />
          <circle cx="38" cy="180" r="2.5" fill="#0a0d14" />
          <circle cx="142" cy="180" r="2.5" fill="#0a0d14" />
          <circle cx="90" cy="175" r="2.5" fill="#0a0d14" />

          {/* Accent strip */}
          <line x1="30" y1="156" x2="150" y2="156" stroke="#4ade80" strokeWidth="0.8" opacity="0.18" />

          {/* Solar panel texture (left shoulder) */}
          <rect x="32" y="163" width="14" height="17" rx="2" fill="#243447" opacity="0.85" />
          <line x1="32" y1="167" x2="40" y2="163" stroke="#4ade80" strokeWidth="0.7" opacity="0.3" />
          <line x1="32" y1="172" x2="46" y2="164" stroke="#4ade80" strokeWidth="0.7" opacity="0.3" />
          <line x1="32" y1="177" x2="46" y2="170" stroke="#4ade80" strokeWidth="0.7" opacity="0.3" />
          <line x1="35" y1="180" x2="46" y2="175" stroke="#4ade80" strokeWidth="0.7" opacity="0.3" />

          {/* Amber wear marks */}
          <line x1="55" y1="184" x2="70" y2="184" stroke="rgba(251,191,36,0.22)" strokeWidth="1" />
          <line x1="76" y1="182" x2="84" y2="182" stroke="rgba(251,191,36,0.16)" strokeWidth="1" />

          {/* ── LEFT ARM ── rotates around shoulder at (30, 110) */}
          <g className="robot-arm-left">
            <rect x="2" y="103" width="29" height="13" rx="4" fill="#1e2d3d" />
            <rect x="2" y="103" width="29" height="4" rx="2" fill="#243447" />
            <rect x="1" y="117" width="22" height="11" rx="3" fill="#243447" />
            {/* Claw */}
            <rect x="0"  y="129" width="6"  height="9" rx="2" fill="#1e2d3d" />
            <rect x="7"  y="127" width="6"  height="8" rx="2" fill="#1e2d3d" />
            <rect x="14" y="129" width="5"  height="9" rx="2" fill="#1e2d3d" />
            <line x1="2" y1="110" x2="30" y2="110" stroke="#4ade80" strokeWidth="0.8" opacity="0.4" />
          </g>

          {/* ── RIGHT ARM ── rotates around shoulder at (150, 110) */}
          <g className="robot-arm-right">
            <rect x="149" y="103" width="29" height="13" rx="4" fill="#1e2d3d" />
            <rect x="149" y="103" width="29" height="4" rx="2" fill="#243447" />
            <rect x="157" y="117" width="22" height="11" rx="3" fill="#243447" />
            {/* Claw */}
            <rect x="160" y="129" width="6"  height="9" rx="2" fill="#1e2d3d" />
            <rect x="167" y="127" width="6"  height="8" rx="2" fill="#1e2d3d" />
            <rect x="174" y="129" width="5"  height="9" rx="2" fill="#1e2d3d" />
            <line x1="150" y1="110" x2="177" y2="110" stroke="#4ade80" strokeWidth="0.8" opacity="0.4" />
          </g>

          {/* ── HEAD ── */}
          <rect x="46" y="38" width="88" height="58" rx="5" fill="#1e2d3d" />
          <rect x="46" y="38" width="88" height="6" rx="4" fill="#243447" />
          <circle cx="52" cy="44" r="2" fill="#0a0d14" />
          <circle cx="128" cy="44" r="2" fill="#0a0d14" />
          <circle cx="52" cy="90" r="2" fill="#0a0d14" />
          <circle cx="128" cy="90" r="2" fill="#0a0d14" />

          {/* ── EYES ── */}
          {/* Left eye */}
          <rect x="55" y="50" width="30" height="22" rx="3" fill="#0a0d14" />
          <g className="robot-eye-look robot-eye-look-left">
            <g className="robot-eye-blink">
              <circle cx="70" cy="61" r="7.5" fill="#4ade80" filter="url(#eye-glow)" />
              <circle cx="70" cy="61" r="3"   fill="#0a0d14" />
            </g>
          </g>

          {/* Right eye */}
          <rect x="95" y="50" width="30" height="22" rx="3" fill="#0a0d14" />
          <g className="robot-eye-look robot-eye-look-right">
            <g className="robot-eye-blink">
              <circle cx="110" cy="61" r="7.5" fill="#4ade80" filter="url(#eye-glow)" />
              <circle cx="110" cy="61"  r="3"   fill="#0a0d14" />
            </g>
          </g>

          {/* Nose sensor */}
          <rect x="84" y="57" width="12" height="8" rx="3" fill="#243447" />
          <circle cx="90" cy="61" r="2" fill="#4ade80" opacity="0.5" />

          {/* ── ANTENNA ── */}
          <rect x="88" y="18" width="4" height="22" rx="2" fill="#243447" />
          <rect x="80" y="17" width="20" height="5" rx="2.5" fill="#1e2d3d" />
          {/* LED — inner dot offset so spin is visible */}
          <g className="robot-led-group">
            <circle cx="90" cy="11" r="5.5" fill="#4ade80" filter="url(#led-glow)" />
            <circle cx="90" cy="8.5" r="2.2" fill="#fff" opacity="0.9" />
          </g>

          {/* ── SPEED LINES ── (left) */}
          <line className="speed-line sl-1" x1="7"  y1="108" x2="25" y2="108" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
          <line className="speed-line sl-2" x1="4"  y1="118" x2="23" y2="118" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" />
          <line className="speed-line sl-3" x1="8"  y1="128" x2="24" y2="128" stroke="#4ade80" strokeWidth="1"   strokeLinecap="round" />
          {/* (right) */}
          <line className="speed-line sl-4" x1="155" y1="108" x2="173" y2="108" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
          <line className="speed-line sl-5" x1="157" y1="118" x2="176" y2="118" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" />
          <line className="speed-line sl-6" x1="156" y1="128" x2="172" y2="128" stroke="#4ade80" strokeWidth="1"   strokeLinecap="round" />

        </g>
      </svg>

      {isLoading && (
        <>
          <p className="robot-loading-text" key={displayText}>{displayText}</p>
          <div className="robot-progress">
            <div
              className={`robot-progress-fill${hasRealProgress ? ' robot-progress-fill--real' : ''}`}
              style={hasRealProgress ? { width: `${progressPct}%` } : undefined}
            />
          </div>
        </>
      )}
    </div>
  )
}
