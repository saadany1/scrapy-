import { useState, useEffect } from 'react'
import ScrapyRobot from './ScrapyRobot'

const WAITING_TEXTS = ['Starting scrape…', 'Warming up…', 'Connecting to scraper…']

export default function ScrapeOverlay({ scrapeStatus }) {
  const [textIdx, setTextIdx] = useState(0)
  const total = scrapeStatus?.total ?? 0
  const current = scrapeStatus?.progress ?? 0
  const hasProgress = total > 0

  useEffect(() => {
    if (hasProgress) return
    const id = setInterval(() => setTextIdx(i => (i + 1) % WAITING_TEXTS.length), 1800)
    return () => clearInterval(id)
  }, [hasProgress])

  const statusText = hasProgress
    ? `Scraping item ${current} of ${total}…`
    : WAITING_TEXTS[textIdx]

  return (
    <div className="scraping-overlay">
      <ScrapyRobot
        isLoading
        statusText={statusText}
        progress={hasProgress ? { current, total } : null}
      />
    </div>
  )
}
