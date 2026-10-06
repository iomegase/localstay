import { NextResponse } from 'next/server'

// Spec 064 : les anciennes URL /guide demandées hors séjour n'ont plus de
// contenu public. Le 410 indique à Google de les retirer de l'index.
const GONE_HTML = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Page supprimée — MyStay</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f7f6f4;color:#0b1437;font-family:system-ui,-apple-system,sans-serif;padding:16px;box-sizing:border-box}
main{max-width:420px;text-align:center}
h1{font-size:1.5rem;margin:0 0 12px}
p{line-height:1.5;color:#4a5568;margin:0 0 24px}
a{display:inline-block;background:#0b1437;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:999px}
</style>
</head>
<body>
<main>
<h1>Cette page n’existe plus</h1>
<p>Vous séjournez dans un logement MyStay ? Scannez à nouveau le QR code de votre logement pour ouvrir votre guide.</p>
<a href="/">Retour à l’accueil</a>
</main>
</body>
</html>`

export function legacyGuideGoneResponse(): NextResponse {
  return new NextResponse(GONE_HTML, {
    status: 410,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
    },
  })
}
