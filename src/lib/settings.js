const STORAGE_KEY = 'scrapy-settings'

const DEFAULTS = {
  defaultProductCount: 10,
  statusPollMs: 1500,
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(partial) {
  const next = { ...loadSettings(), ...partial }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function resetSettings() {
  localStorage.removeItem(STORAGE_KEY)
  return { ...DEFAULTS }
}

export { DEFAULTS }
