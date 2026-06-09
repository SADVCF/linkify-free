import { getStore } from '@netlify/blobs'

export default async (req, context) => {
  const { slug } = context.params

  if (!slug || !/^[a-z0-9-]{3,20}$/.test(slug)) {
    return new Response(notFoundPage(slug), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const store = getStore({ name: 'links', consistency: 'strong' })
  let data

  try {
    data = await store.get(slug, { type: 'json' })
  } catch {
    return new Response(notFoundPage(slug), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  if (!data?.url) {
    return new Response(notFoundPage(slug), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return Response.redirect(data.url, 301)
}

function notFoundPage(slug) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Link not found — Linkify Free</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#09090b;color:#fafafa;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem}
    .card{text-align:center;max-width:360px}
    .icon{font-size:3rem;margin-bottom:1rem}
    h1{font-size:1.25rem;font-weight:700;margin-bottom:.5rem}
    p{color:#71717a;font-size:.875rem;margin-bottom:1.5rem}
    a{display:inline-block;background:#a3e635;color:#09090b;font-weight:600;font-size:.875rem;padding:.625rem 1.25rem;border-radius:.75rem;text-decoration:none}
    a:hover{background:#bef264}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔗</div>
    <h1>Link not found</h1>
    <p>The short link <code style="color:#a3e635">/${slug ?? ''}</code> doesn't exist or has been removed.</p>
    <a href="/">Create a new link</a>
  </div>
</body>
</html>`
}

export const config = {
  path: '/:slug',
}
