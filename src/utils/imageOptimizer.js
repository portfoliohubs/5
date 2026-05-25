import imageCompression from 'browser-image-compression'

// Simple concurrency queue to avoid OOM when compressing many large images
const MAX_CONCURRENT = 3
let active = 0
const queue = []

function runNext() {
  if (queue.length === 0 || active >= MAX_CONCURRENT) return
  const { file, opts, resolve, reject } = queue.shift()
  active++
  imageCompression(file, opts).then((res) => {
    active--
    resolve(res)
    runNext()
  }).catch((err) => {
    active--
    reject(err)
    runNext()
  })
}

export function optimizeImageQueued(file, { maxSizeKB = 300 } = {}) {
  return new Promise((resolve, reject) => {
    const maxSizeMB = Math.max(0.03, maxSizeKB / 1024)
    const options = {
      maxSizeMB,
      maxWidthOrHeight: 2400,
      useWebWorker: true,
      initialQuality: 0.8,
    }
    queue.push({ file, opts: options, resolve, reject })
    runNext()
  })
}

export async function optimizeImage(file, opts) {
  // Backwards-compatible wrapper: uses queued implementation
  return optimizeImageQueued(file, opts)
}
