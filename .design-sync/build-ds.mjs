// Préparation du paquet local MyStay pour /design-sync (cfg.buildCmd).
// 1. Types : tsc émet les .d.ts du barrel et de ses dépendances dans pkg/types,
//    puis les alias `@/…` (tsconfig paths) sont réécrits en chemins relatifs
//    pour que l'extracteur de props (ts-morph, sans paths) les résolve.
// 2. CSS : Tailwind compile les utilitaires de toute l'app (src/**) + les
//    aperçus, précédés des polices Google et des variables de police que
//    next/font injecte dans l'app.
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const root = process.cwd()
const pkgDir = join(root, '.design-sync/pkg')
const typesDir = join(pkgDir, 'types')
const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: root })

rmSync(typesDir, { recursive: true, force: true })
run('npx tsc -p .design-sync/tsconfig.ds.json')

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name)
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.d.ts') ? [p] : []
})
const srcTypes = join(typesDir, 'src')
let rewritten = 0
for (const file of walk(typesDir)) {
  const text = readFileSync(file, 'utf8')
  const next = text.replace(/(from\s+|import\()(['"])@\/([^'"]+)\2/g, (_, lead, quote, target) => {
    let rel = relative(dirname(file), join(srcTypes, target)).split('\\').join('/')
    if (!rel.startsWith('.')) rel = `./${rel}`
    rewritten++
    return `${lead}${quote}${rel}${quote}`
  })
  if (next !== text) writeFileSync(file, next)
}
console.error(`[build-ds] ${walk(typesDir).length} .d.ts, ${rewritten} alias imports rewritten`)

const cssDir = join(pkgDir, 'css')
mkdirSync(cssDir, { recursive: true })
const tailwindOut = join(cssDir, 'tailwind.css')
run(`npx tailwindcss -c tailwind.config.ts -i src/app/globals.css -o ${JSON.stringify(tailwindOut)} --content "./src/**/*.tsx,./src/**/*.ts,./.design-sync/previews/*.tsx" --minify`)
const fonts = readFileSync(join(root, '.design-sync/fonts.css'), 'utf8')
writeFileSync(join(cssDir, 'mystay.css'), `${fonts}\n${readFileSync(tailwindOut, 'utf8')}`)
console.error('[build-ds] css → .design-sync/pkg/css/mystay.css')
