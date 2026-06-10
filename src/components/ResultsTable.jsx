import { useCallback, useMemo } from 'react'


export default function ResultsTable({ results, selections, fieldNames, pinnedFields, loadedUrl, onScrapeAgain }) {
  const fieldCount = selections.length
  const getName = useCallback((i) => (fieldNames && fieldNames[i]) || `Field ${i + 1}`, [fieldNames])

  const filteredResults = useMemo(() => {
    if (!pinnedFields || pinnedFields.size === 0) return results
    return results.filter(row =>
      [...pinnedFields].every(fi => !!row[`field_${fi + 1}`])
    )
  }, [results, pinnedFields])

  const emptyCells = useMemo(() =>
    filteredResults.reduce((acc, row) => {
      for (let i = 1; i <= fieldCount; i++) { if (!row[`field_${i}`]) acc++ }
      return acc
    }, 0),
    [filteredResults, fieldCount]
  )

  const domain = (() => { try { return new URL(loadedUrl).hostname } catch { return 'results' } })()
  const timestamp = new Date().toISOString().slice(0, 10)
  const pinnedCount = pinnedFields ? pinnedFields.size : 0
  const hasUrls = filteredResults.some(r => r._url)

  const downloadCsv = useCallback(() => {
    const headers = [...(hasUrls ? ['URL'] : []), ...selections.map((_, i) => getName(i))]
    const rows = filteredResults.map(row => [
      ...(hasUrls ? [`"${(row._url || '').replace(/"/g, '""')}"`] : []),
      ...selections.map((_, i) => `"${(row[`field_${i + 1}`] || '').replace(/"/g, '""')}"`)
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${domain}_${timestamp}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [filteredResults, selections, getName, domain, timestamp, hasUrls])

  const copyJson = useCallback(() => {
    const renamed = filteredResults.map(row => {
      const obj = {}
      if (hasUrls) obj['url'] = row._url || ''
      selections.forEach((_, i) => { obj[getName(i)] = row[`field_${i + 1}`] || '' })
      return obj
    })
    navigator.clipboard.writeText(JSON.stringify(renamed, null, 2))
  }, [filteredResults, selections, getName, hasUrls])

  if (!results || results.length === 0) {
    return (
      <section className="section">
        <div className="empty-state">No items found. Try different selectors.</div>
      </section>
    )
  }

  return (
    <section className="section results-section">
      <div className="results-header-row">
        <div className="section-label">Results</div>
        <div className="results-actions">
          <button className="btn-csv" onClick={downloadCsv}>↓ CSV</button>
          <button className="btn-json" onClick={copyJson}>[ ] JSON</button>
          <button className="btn-again" onClick={onScrapeAgain}>↻</button>
        </div>
      </div>

      <div className="results-summary">
        {pinnedCount > 0 ? (
          <span>Showing {filteredResults.length} of {results.length} rows</span>
        ) : (
          <span>{results.length} rows</span>
        )}
        <span className="dot">·</span>
        <span>{fieldCount} fields</span>
        {pinnedCount > 0 && (
          <>
            <span className="dot">·</span>
            <span className="pin-note">{pinnedCount} required</span>
          </>
        )}
        {emptyCells > 0 && (
          <>
            <span className="dot">·</span>
            <span className="empty-warn">{emptyCells} empty</span>
          </>
        )}
      </div>

      <div className="results-table-wrap">
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              {hasUrls && <th>URL</th>}
              {selections.map((_, i) => <th key={i}>{getName(i)}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((row, ri) => (
              <tr key={ri} style={{ animationDelay: `${ri * 0.03}s` }}>
                <td className="row-num">{ri + 1}</td>
                {hasUrls && (
                  <td className="url-cell">
                    <a href={row._url} target="_blank" rel="noreferrer" title={row._url}>
                      {row._url ? new URL(row._url).pathname : '—'}
                    </a>
                  </td>
                )}
                {selections.map((_, fi) => {
                  const val = row[`field_${fi + 1}`]
                  return (
                    <td key={fi} className={!val ? 'cell-empty' : ''}>
                      {val || '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  )
}
