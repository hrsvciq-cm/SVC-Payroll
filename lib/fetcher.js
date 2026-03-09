/**
 * Default fetcher for SWR. Returns JSON or throws.
 */
export async function fetcher(url) {
  const res = await fetch(url)
  if (!res.ok) {
    const err = new Error('An error occurred while fetching the data.')
    err.info = await res.json().catch(() => ({}))
    err.status = res.status
    throw err
  }
  return res.json()
}
