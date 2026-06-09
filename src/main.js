import QRCode from 'qrcode'

// ── DOM refs ──────────────────────────────────────────────────────────────────
const form = document.getElementById('shorten-form')
const urlInput = document.getElementById('url-input')
const submitBtn = document.getElementById('submit-btn')
const toggleCustomBtn = document.getElementById('toggle-custom')
const toggleChevron = document.getElementById('toggle-chevron')
const customAliasPanel = document.getElementById('custom-alias-panel')
const customSlugInput = document.getElementById('custom-slug')
const originPrefix = document.getElementById('origin-prefix')
const errorMsg = document.getElementById('error-msg')
const errorText = document.getElementById('error-text')
const resultPanel = document.getElementById('result-panel')
const shortUrlLink = document.getElementById('short-url-link')
const copyBtn = document.getElementById('copy-btn')
const copyIcon = document.getElementById('copy-icon')
const originalUrlDisplay = document.getElementById('original-url-display')
const qrCanvas = document.getElementById('qr-canvas')
const downloadQrBtn = document.getElementById('download-qr-btn')
const historySection = document.getElementById('history-section')
const historyList = document.getElementById('history-list')
const clearHistoryBtn = document.getElementById('clear-history-btn')
const themeToggle = document.getElementById('theme-toggle')
const iconSun = document.getElementById('icon-sun')
const iconMoon = document.getElementById('icon-moon')

// ── Theme ─────────────────────────────────────────────────────────────────────
function isDark() {
  return document.documentElement.classList.contains('dark')
}

function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.classList.toggle('light', !dark)
  iconSun.classList.toggle('hidden', !dark)
  iconMoon.classList.toggle('hidden', dark)
}

// Sync toggle icon with current state on load
applyTheme(isDark())

themeToggle.addEventListener('click', () => {
  const next = !isDark()
  applyTheme(next)
  localStorage.setItem('lf-theme', next ? 'dark' : 'light')
})

// ── Origin prefix ─────────────────────────────────────────────────────────────
originPrefix.textContent = `${window.location.origin}/`

// ── Custom alias toggle ───────────────────────────────────────────────────────
let customOpen = false

toggleCustomBtn.addEventListener('click', () => {
  customOpen = !customOpen
  customAliasPanel.classList.toggle('hidden', !customOpen)
  toggleChevron.style.transform = customOpen ? 'rotate(90deg)' : ''
  if (customOpen) customSlugInput.focus()
})

// ── History ───────────────────────────────────────────────────────────────────
const HISTORY_KEY = 'lf_history'
let sessionHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(sessionHistory))
}

function addToHistory(url, slug, shortUrl) {
  sessionHistory.unshift({ url, slug, shortUrl, at: Date.now() })
  if (sessionHistory.length > 20) sessionHistory = sessionHistory.slice(0, 20)
  saveHistory()
  renderHistory()
}

const COPY_PATH = `<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"/>`
const CHECK_PATH = `<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>`

function renderHistory() {
  if (sessionHistory.length === 0) {
    historySection.classList.add('hidden')
    return
  }
  historySection.classList.remove('hidden')
  historyList.innerHTML = sessionHistory.map((item) => `
    <div class="group flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 transition-colors">
      <div class="flex-1 min-w-0">
        <a href="${esc(item.shortUrl)}" target="_blank" rel="noopener"
           class="font-mono text-sm text-lime-400 hover:text-lime-300 transition-colors">${esc(item.shortUrl)}</a>
        <p class="text-zinc-500 text-xs mt-0.5 truncate">${esc(item.url)}</p>
      </div>
      <button
        data-copy="${esc(item.shortUrl)}"
        title="Copy"
        class="shrink-0 p-1.5 rounded-lg text-zinc-600 group-hover:text-zinc-400 hover:!text-lime-400 hover:bg-lime-400/10 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          ${COPY_PATH}
        </svg>
      </button>
    </div>
  `).join('')
}

// Event delegation for history copy buttons
historyList.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]')
  if (!btn) return
  const text = btn.dataset.copy
  await navigator.clipboard.writeText(text)
  const svg = btn.querySelector('svg')
  svg.innerHTML = CHECK_PATH
  btn.classList.add('!text-lime-400')
  setTimeout(() => {
    svg.innerHTML = COPY_PATH
    btn.classList.remove('!text-lime-400')
  }, 1500)
})

clearHistoryBtn.addEventListener('click', () => {
  sessionHistory = []
  saveHistory()
  renderHistory()
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function showError(msg) {
  errorText.textContent = msg
  errorMsg.classList.remove('hidden')
}

function hideError() {
  errorMsg.classList.add('hidden')
}

function hideResult() {
  resultPanel.classList.add('hidden')
}

// ── Form submit ───────────────────────────────────────────────────────────────
let currentShortUrl = ''

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  hideError()
  hideResult()

  const url = urlInput.value.trim()
  const slug = customSlugInput.value.trim() || undefined

  if (!url) {
    urlInput.focus()
    return
  }

  submitBtn.disabled = true
  submitBtn.textContent = 'Shortening…'

  try {
    const res = await fetch('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, slug }),
    })

    const data = await res.json()

    if (!res.ok) {
      showError(data.error || 'Something went wrong. Please try again.')
      return
    }

    const shortUrl = `${window.location.origin}/${data.slug}`
    currentShortUrl = shortUrl
    await displayResult(shortUrl, url)
    addToHistory(url, data.slug, shortUrl)
  } catch {
    showError('Network error. Check your connection and try again.')
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = 'Shorten'
  }
})

// ── Result ────────────────────────────────────────────────────────────────────
async function displayResult(shortUrl, originalUrl) {
  shortUrlLink.textContent = shortUrl
  shortUrlLink.href = shortUrl
  originalUrlDisplay.textContent = originalUrl
  resultPanel.classList.remove('hidden')

  // Render QR code
  await QRCode.toCanvas(qrCanvas, shortUrl, {
    width: 96,
    margin: 1,
    color: { dark: '#09090b', light: '#ffffff' },
  })

  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

// ── Copy main result ──────────────────────────────────────────────────────────
copyBtn.addEventListener('click', async () => {
  if (!currentShortUrl) return
  await navigator.clipboard.writeText(currentShortUrl)
  copyIcon.innerHTML = CHECK_PATH
  copyBtn.classList.add('text-lime-400')
  setTimeout(() => {
    copyIcon.innerHTML = COPY_PATH
    copyBtn.classList.remove('text-lime-400')
  }, 2000)
})

// ── Download QR ───────────────────────────────────────────────────────────────
downloadQrBtn.addEventListener('click', () => {
  if (!currentShortUrl) return
  const slug = currentShortUrl.split('/').pop()
  const a = document.createElement('a')
  a.href = qrCanvas.toDataURL('image/png')
  a.download = `qr-${slug}.png`
  a.click()
})

// ── Init ──────────────────────────────────────────────────────────────────────
renderHistory()
