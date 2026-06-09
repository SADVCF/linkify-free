import { getStore } from '@netlify/blobs'

const RESERVED = new Set([
  'api', 'assets', 'index', 'favicon', 'admin', 'www', 'app',
  'static', 'public', 'go', 's', 'r', 'create', 'health',
])

function generateSlug(len = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function isValidUrl(url) {
  try {
    const u = new URL(url)
    return ['http:', 'https:'].includes(u.protocol)
  } catch {
    return false
  }
}

export default async (req) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers })
  }

  const { url, slug: customSlug } = body

  if (!url || !isValidUrl(url)) {
    return new Response(
      JSON.stringify({ error: 'Invalid URL. Must start with http:// or https://' }),
      { status: 400, headers }
    )
  }

  const store = getStore({ name: 'links', consistency: 'strong' })
  let slug = customSlug?.trim().toLowerCase()

  if (slug) {
    if (!/^[a-z0-9-]{3,20}$/.test(slug)) {
      return new Response(
        JSON.stringify({ error: 'Alias must be 3–20 characters: letters, numbers and hyphens only.' }),
        { status: 400, headers }
      )
    }
    if (RESERVED.has(slug)) {
      return new Response(
        JSON.stringify({ error: 'That alias is reserved. Please choose another.' }),
        { status: 409, headers }
      )
    }
    const existing = await store.get(slug)
    if (existing) {
      return new Response(
        JSON.stringify({ error: 'That alias is already taken.' }),
        { status: 409, headers }
      )
    }
  } else {
    let attempts = 0
    do {
      slug = generateSlug()
      const existing = await store.get(slug)
      if (!existing) break
      attempts++
    } while (attempts < 10)

    if (attempts >= 10) {
      return new Response(
        JSON.stringify({ error: 'Could not generate a unique slug. Please try again.' }),
        { status: 500, headers }
      )
    }
  }

  await store.set(slug, JSON.stringify({ url, createdAt: new Date().toISOString() }))

  return new Response(JSON.stringify({ slug }), { status: 200, headers })
}

export const config = {
  path: '/api/create',
}
