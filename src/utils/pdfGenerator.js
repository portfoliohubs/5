import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

function safeSetKeywords(pdfDoc, str) {
  try {
    if (typeof pdfDoc.setKeywords === 'function') pdfDoc.setKeywords([str])
    if (typeof pdfDoc.setTitle === 'function') pdfDoc.setTitle('DentalFolio Portfolio')
  } catch (e) {
    // non-fatal
    console.debug('safeSetKeywords failed', e)
  }
}

function encodePart(str) {
  // base64-encode UTF-8 to safely store special chars
  try {
    return btoa(unescape(encodeURIComponent(str || '')))
  } catch (e) {
    return btoa(str || '')
  }
}

function decodePart(b64) {
  try {
    return decodeURIComponent(escape(atob(b64 || '')))
  } catch (e) {
    try { return atob(b64 || '') } catch (_) { return '' }
  }
}

function parseMetaString(str) {
  try {
    if (!str) return null
    const parts = String(str).split('|')
    if (!parts[0] || !parts[0].startsWith('DentalFolio-V1')) return null
    // parts: [tag, name_b64, max, used, key_b64]
    return {
      doctorName: decodePart(parts[1] || ''),
      maxCases: parseInt(parts[2] || '0', 10) || 0,
      usedCases: parseInt(parts[3] || '0', 10) || 0,
      activationKey: decodePart(parts[4] || '')
    }
  } catch (e) {
    console.debug('parseMetaString error', e)
    return null
  }
}

export async function generateDentalPDF({ doctor, cases = [], maxCases = 20, usedCases = 0, activationKey = '' }) {
  const pdfDoc = await PDFDocument.create()

  const metaString = `DentalFolio-V1|${encodePart(doctor.name || '')}|${maxCases}|${usedCases}|${encodePart(activationKey || '')}`
  safeSetKeywords(pdfDoc, metaString)

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Page 1 - Personal Info
  const page = pdfDoc.addPage([595, 842]) // A4 portrait points
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(1, 1, 1) })
  page.drawRectangle({ x: 24, y: 24, width: 547, height: 794, color: rgb(0.98, 0.98, 0.98) })

  // Profile image
  if (doctor.profileImage?.blob) {
    try {
      const imgBytes = await doctor.profileImage.blob.arrayBuffer()
      let img
      const type = doctor.profileImage.blob.type
      if (type === 'image/png') img = await pdfDoc.embedPng(imgBytes)
      else img = await pdfDoc.embedJpg(imgBytes)
      const scale = Math.min(152 / img.width, 152 / img.height)
      const drawW = img.width * scale
      const drawH = img.height * scale
      page.drawImage(img, { x: 220 - drawW / 2 + 24, y: 600, width: drawW, height: drawH })
    } catch (e) {
      console.debug('Profile image embed failed', e)
    }
  }

  page.drawText(doctor.name || '', { x: 48, y: 560, size: 20, font, color: rgb(0, 0, 0) })
  page.drawText(doctor.university || '', { x: 48, y: 532, size: 12, font, color: rgb(0.2, 0.2, 0.2) })

  const socialYStart = 500
  const socials = doctor.socials || {}
  const socialLabels = ['whatsapp', 'facebook', 'instagram', 'linkedin']
  socialLabels.forEach((key, i) => {
    const val = socials[key]
    if (val) {
      page.drawText(`${key.toUpperCase()}: ${val}`, { x: 48, y: socialYStart - i * 18, size: 10, font, color: rgb(0, 0, 0) })
    }
  })

  // Case pages
  for (const c of cases) {
    const p = pdfDoc.addPage([595, 842])
    // dark background
    p.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.07, 0.09, 0.12) })
    // Category label
    p.drawText(c.category || '', { x: 40, y: 780, size: 18, font, color: rgb(0.95, 0.95, 0.95) })

    // Image: center with object-contain
    if (c.file) {
      try {
        const imgBytes = await c.file.arrayBuffer()
        let img
        const type = c.file.type
        if (type === 'image/png') img = await pdfDoc.embedPng(imgBytes)
        else img = await pdfDoc.embedJpg(imgBytes)
        const availableW = 515
        const availableH = 520
        const scale = Math.min(availableW / img.width, availableH / img.height)
        const drawW = img.width * scale
        const drawH = img.height * scale
        const x = (595 - drawW) / 2
        const y = (842 - drawH) / 2 - 20
        p.drawImage(img, { x, y, width: drawW, height: drawH })
      } catch (e) {
        console.debug('Case image embed failed', e)
      }
    }

    // Description at bottom
    p.drawText((c.description || '').slice(0, 250), { x: 40, y: 48, size: 12, font, color: rgb(0.95, 0.95, 0.95), maxWidth: 515 })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

export async function parseDentalMetadata(file) {
  try {
    // basic checks
    if (!file) return { meta: null, error: 'no_file' }
    if (file.type !== 'application/pdf' && !file.name?.toLowerCase().endsWith('.pdf')) {
      return { meta: null, error: 'not_pdf' }
    }
    const sizeLimit = 50 * 1024 * 1024 // 50MB guard
    if (file.size > sizeLimit) return { meta: null, error: 'file_too_large' }

    const arr = await file.arrayBuffer()
    let pdfDoc
    try {
      pdfDoc = await PDFDocument.load(arr, { ignoreEncryption: true })
    } catch (e) {
      return { meta: null, error: 'corrupted_or_encrypted' }
    }

    try {
      const keywords = typeof pdfDoc.getKeywords === 'function' ? pdfDoc.getKeywords() : null
      let meta = null
      if (Array.isArray(keywords) && keywords.length) meta = parseMetaString(keywords[0])
      if (!meta) {
        const title = typeof pdfDoc.getTitle === 'function' ? pdfDoc.getTitle() : null
        meta = parseMetaString(title)
      }
      if (!meta) return { meta: null, error: 'no_dentalfolio_metadata' }
      return { meta, error: null }
    } catch (e) {
      console.debug('parseDentalMetadata inner error', e)
      return { meta: null, error: 'metadata_parse_error' }
    }
  } catch (e) {
    console.debug('parseDentalMetadata unexpected error', e)
    return { meta: null, error: 'unexpected' }
  }
}
