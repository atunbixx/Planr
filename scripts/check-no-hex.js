#!/usr/bin/env node
/*
  Simple guard to prevent hard-coded hex colors from being committed.
  Scans `src/` and fails if a hex color is found outside allowed files.
*/
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'src')
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g
const ALLOW_DIRS = new Set([
  path.join('src', 'assets'),
  path.join('src', 'nextjs-admin-dashboard-main'),
])

function isAllowed(file) {
  return Array.from(ALLOW_DIRS).some((d) => file.startsWith(d))
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(p)
    } else if (entry.isFile()) {
      yield p
    }
  }
}

const offenders = []
for (const file of walk(ROOT)) {
  const rel = path.relative(process.cwd(), file)
  if (isAllowed(rel)) continue
  const text = fs.readFileSync(file, 'utf8')
  const matches = text.match(HEX_RE)
  if (matches) offenders.push({ file: rel, matches: Array.from(new Set(matches)) })
}

if (offenders.length) {
  console.error('\nHard-coded hex colors detected:')
  for (const o of offenders) {
    console.error(`- ${o.file}: ${o.matches.join(', ')}`)
  }
  console.error('\nPlease replace hex colors with Tailwind tokens or CSS variables (e.g., hsl(var(--primary))).')
  process.exit(1)
} else {
  console.log('No hard-coded hex colors found. ✅')
}

