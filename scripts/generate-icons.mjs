/**
 * Generates PWA PNG icons from the brand SVG.
 * Run: node scripts/generate-icons.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = path.join(root, 'public', 'favicon.svg')
const iconsDir = path.join(root, 'public', 'icons')

const sizes = [192, 512]

const svg = await readFile(svgPath)
await mkdir(iconsDir, { recursive: true })

for (const size of sizes) {
  const png = await sharp(svg).resize(size, size).png().toBuffer()
  const out = path.join(iconsDir, `icon-${size}.png`)
  await writeFile(out, png)
  console.log(`wrote ${path.relative(root, out)}`)
}

// Apple touch icon (180×180 is the conventional size)
const apple = await sharp(svg).resize(180, 180).png().toBuffer()
const appleOut = path.join(iconsDir, 'apple-touch-icon.png')
await writeFile(appleOut, apple)
console.log(`wrote ${path.relative(root, appleOut)}`)
