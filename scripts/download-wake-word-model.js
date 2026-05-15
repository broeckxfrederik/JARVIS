#!/usr/bin/env node
/**
 * Downloads the sherpa-onnx keyword spotting model (GigaSpeech 3.3M, English).
 * Run once before starting the app: node scripts/download-wake-word-model.js
 *
 * Requires: tar + bzip2 on Linux/Mac, or 7-Zip on Windows (7z in PATH).
 */

const https = require('https')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const MODEL_URL =
  'https://github.com/k2-fsa/sherpa-onnx/releases/download/kws-models/' +
  'sherpa-onnx-kws-zipformer-gigaspeech-3.3M-2024-01-01.tar.bz2'

const DEST_DIR  = path.join(__dirname, '..', 'assets', 'wake-words')
const ARCHIVE   = path.join(DEST_DIR, 'model.tar.bz2')
const MODEL_DIR = path.join(DEST_DIR, 'model')

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const request = (u) =>
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close()
          return request(res.headers.location)
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`))
          return
        }
        const total = parseInt(res.headers['content-length'] || '0', 10)
        let downloaded = 0
        res.on('data', (chunk) => {
          downloaded += chunk.length
          if (total) {
            process.stdout.write(`\r  ${((downloaded / total) * 100).toFixed(1)}%`)
          }
        })
        res.pipe(file)
        file.on('finish', () => { file.close(); process.stdout.write('\n'); resolve() })
        file.on('error', reject)
      }).on('error', reject)
    request(url)
  })
}

function extract(archive, destDir) {
  fs.mkdirSync(destDir, { recursive: true })

  if (process.platform === 'win32') {
    // Windows: requires 7-Zip (7z.exe) in PATH
    try {
      execSync(`7z x "${archive}" -o"${destDir}" -y`, { stdio: 'inherit' })
      // 7z first extracts .tar, then we extract the tar
      const tarFile = path.join(destDir, 'model.tar')
      if (fs.existsSync(tarFile)) {
        execSync(`7z x "${tarFile}" -o"${destDir}" -y`, { stdio: 'inherit' })
        fs.unlinkSync(tarFile)
      }
    } catch {
      throw new Error(
        'Extraction failed. Install 7-Zip and ensure 7z.exe is in your PATH.\n' +
        'Download: https://www.7-zip.org/',
      )
    }
  } else {
    execSync(`tar xjf "${archive}" -C "${destDir}" --strip-components=1`, { stdio: 'inherit' })
  }
}

async function main() {
  if (fs.existsSync(path.join(MODEL_DIR, 'tokens.txt'))) {
    console.log('Model already downloaded at', MODEL_DIR)
    return
  }

  fs.mkdirSync(DEST_DIR, { recursive: true })
  fs.mkdirSync(MODEL_DIR, { recursive: true })

  console.log('Downloading sherpa-onnx GigaSpeech KWS model (~13 MB)...')
  await download(MODEL_URL, ARCHIVE)

  console.log('Extracting...')
  extract(ARCHIVE, MODEL_DIR)
  fs.unlinkSync(ARCHIVE)

  console.log('Done! Model saved to', MODEL_DIR)
  console.log('Keywords file: assets/wake-words/keywords.txt')
  console.log('Say "Hey JARVIS" or "JARVIS" to activate.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
