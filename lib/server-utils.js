/**
 * Server-only utilities: timeouts and connection-error handling.
 * للاستخدام في الخادم فقط (middleware, API, server components).
 */

/** Default timeout for DB/auth calls (ms). */
export const DB_TIMEOUT_MS = 10_000
export const AUTH_TIMEOUT_MS = 5_000

/**
 * Run a promise with a timeout. Rejects with a short message on timeout.
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} [label]
 * @returns {Promise<T>}
 */
export function withTimeout(promise, ms, label = 'Operation') {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout])
}

/**
 * Returns true if the error is a connection/unreachable error (network or DB).
 * Use to log a short message instead of full stack.
 */
export function isConnectionError(err) {
  if (!err) return false
  const msg = (err.message || '').toLowerCase()
  const cause = err.cause && (err.cause.message || String(err.cause)).toLowerCase()
  const code = err.code || (err.cause && err.cause.code)
  if (code === 'UND_ERR_CONNECT_TIMEOUT' || msg.includes('timed out') || cause?.includes('timeout')) return true
  if (code === 'ENOTFOUND' || cause?.includes('enotfound')) return true
  if (msg.includes("can't reach database") || err.name === 'PrismaClientInitializationError') return true
  if (msg.includes('fetch failed') && (cause?.includes('enotfound') || cause?.includes('timeout'))) return true
  return false
}

/** Log connection errors in dev with one short line instead of full stack. */
export function logConnectionError(err, context = '') {
  if (process.env.NODE_ENV !== 'development') return
  const prefix = context ? `[${context}] ` : ''
  if (isConnectionError(err)) {
    console.warn(prefix + 'Connection unavailable:', err.message || err.cause?.message || 'Unknown')
  } else {
    console.error(prefix + (err?.message || err))
  }
}
