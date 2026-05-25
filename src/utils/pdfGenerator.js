import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// ── Metadata helpers ──────────────────────────────────────────────────────────
// Format: DentalFolio-V1|<name_b64>|<maxCases>|<usedCases>|<key_b64>

function safeSetKeywords(pdfDoc, str) {
  try {
    if (typeof pdfDoc.setKeywords === 'function') pdfDoc.setKeywords([str])
    if (typeof pdfDoc.setTitle === 'function') pdfDoc.setTitle('DentalFolio Portfolio')
  } catch (e) {
    console.debug('safeSetKeywords failed', e)
  }
}

function encodePart(str) {
  try { return btoa(unescape(encodeURIComponent(str || ''))) }
  catch { return btoa(str || '') }
}

function decodePart(b64) {
  try { return decodeURIComponent(escape(atob(b64 || ''))) }
  catch { try { return atob(b64 || '') } catch { return '' } }
}

function parseMetaString(str) {
  try {
    if (!str) return null
    const parts = String(str).split('|')
    if (!parts[0]?.startsWith('DentalFolio-V1')) return null
    return {
      doctorName: decodePart(parts[1] || ''),
      maxCases: parseInt(parts[2] || '0', 10) || 0,
      usedCases: parseInt(parts[3] || '0', 10) || 0,
      activationKey: decodePart(parts[4] || ''),
    }
  } catch (e) {
    console.debug('parseMetaString error', e)
    return null
  }
}

// ── PDF Generation ────────────────────────────────────────────────────────────

export async function generateDentalPDF({ doctor, cases = [], maxCases = 20, usedCases = 0, activationKey = '' }) {
  const pdfDoc = await PDFDocument.create()

  const metaString = `DentalFolio-V1|${encodePart(doctor.name || '')}|${maxCases}|${usedCases}|${encodePart(activationKey || '')}`
  safeSetKeywords(pdfDoc, metaString)

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // ── Cover page (personal info) ──
  const page = pdfDoc.addPage([595, 842]) // A4
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(1, 1, 1) })
  page.drawRectangle({ x: 24, y: 24, width: 547, height: 794, color: rgb(0.98, 0.98, 0.98) })

  if (doctor.profileImage?.blob) {
    try {
      const imgBytes = await doctor.profileImage.blob.arrayBuffer()
      const img = doctor.profileImage.blob.type === 'image/png'
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes)
      const scale = Math.min(152 / img.width, 152 / img.height)
      page.drawImage(img, {
        x: 220 - (img.width * scale) / 2 + 24,
        y: 600,
        width: img.width * scale,
        height: img.height * scale,
      })
    } catch (e) { console.debug('Profile image embed failed', e) }
  }

  page.drawText(doctor.name || '', { x: 48, y: 560, size: 20, font, color: rgb(0, 0, 0) })
  page.drawText(doctor.university || '', { x: 48, y: 532, size: 12, font, color: rgb(0.2, 0.2, 0.2) })

  const socialLabels = ['whatsapp', 'facebook', 'instagram', 'linkedin']
  socialLabels.forEach((key, i) => {
    const val = (doctor.socials || {})[key]
    if (val) page.drawText(`${key.toUpperCase()}: ${val}`, { x: 48, y: 500 - i * 18, size: 10, font, color: rgb(0, 0, 0) })
  })

  // ── Case pages ──
  for (const c of cases) {
    const p = pdfDoc.addPage([595, 842])
    p.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.07, 0.09, 0.12) })
    p.drawText(c.category || '', { x: 40, y: 780, size: 18, font, color: rgb(0.95, 0.95, 0.95) })

    if (c.file) {
      try {
        const imgBytes = await c.file.arrayBuffer()
        const img = c.file.type === 'image/png'
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes)
        const scale = Math.min(515 / img.width, 520 / img.height)
        p.drawImage(img, {
          x: (595 - img.width * scale) / 2,
          y: (842 - img.height * scale) / 2 - 20,
          width: img.width * scale,
          height: img.height * scale,
        })
      } catch (e) { console.debug('Case image embed failed', e) }
    }

    p.drawText((c.description || '').slice(0, 250), {
      x: 40, y: 48, size: 12, font, color: rgb(0.95, 0.95, 0.95), maxWidth: 515,
    })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

// ── PDF Parsing (append mode) ─────────────────────────────────────────────────

export async function parseDentalMetadata(file) {
  try {
    if (!file) return { meta: null, error: 'no_file' }
    if (file.type !== 'application/pdf' && !file.name?.toLowerCase().endsWith('.pdf')) {
      return { meta: null, error: 'not_pdf' }
    }
    if (file.size > 50 * 1024 * 1024) return { meta: null, error: 'file_too_large' }

    const arr = await file.arrayBuffer()
    let pdfDoc
    try {
      pdfDoc = await PDFDocument.load(arr, { ignoreEncryption: true })
    } catch {
      return { meta: null, error: 'corrupted_or_encrypted' }
    }

    try {
      const keywords = typeof pdfDoc.getKeywords === 'function' ? pdfDoc.getKeywords() : null
      let meta = Array.isArray(keywords) && keywords.length ? parseMetaString(keywords[0]) : null
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
