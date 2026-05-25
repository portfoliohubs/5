import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import DoctorForm from './components/DoctorForm'
import CaseManager from './components/CaseManager'
import KeyValidator from './components/KeyValidator'
import { generateDentalPDF, parseDentalMetadata } from './utils/pdfGenerator'

export default function App() {
  const [doctor, setDoctor] = useState({
    name: '',
    email: '',
    university: '',
    socials: { whatsapp: '', facebook: '', instagram: '', linkedin: '' },
    profileImage: null,
  })

  const [cases, setCases] = useState([])
  const [maxCases, setMaxCases] = useState(20)
  const [usedCases, setUsedCases] = useState(0)
  const [activationKey, setActivationKey] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [appendMode, setAppendMode] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Read persisted state once on start, guard rendering until hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dentalfolio:state')
      if (saved) {
        const parsed = JSON.parse(saved)
        setDoctor(parsed.doctor || {})
        setCases(parsed.cases || [])
        setMaxCases(parsed.maxCases ?? 20)
        setUsedCases(parsed.usedCases ?? 0)
        setActivationKey(parsed.activationKey || '')
        setUnlocked(parsed.unlocked || false)
        setAppendMode(parsed.appendMode || false)
      }
    } catch (e) {
      console.debug('Failed reading localStorage', e)
    } finally {
      setHydrated(true)
    }
  }, [])

  // debounce localStorage writes to avoid excessive IO
  useEffect(() => {
    if (!hydrated) return
    const toSave = { doctor, cases, maxCases, usedCases, activationKey, unlocked, appendMode }
    const id = setTimeout(() => {
      try { localStorage.setItem('dentalfolio:state', JSON.stringify(toSave)) } catch (e) { console.debug('localStorage write failed', e) }
    }, 400)
    return () => clearTimeout(id)
  }, [doctor, cases, maxCases, usedCases, activationKey, unlocked, appendMode, hydrated])

  async function handleGeneratePDF() {
    if (!unlocked) return alert('Please enter a valid Activation Key to unlock downloads.')
    try {
      const blob = await generateDentalPDF({ doctor, cases, maxCases, usedCases, activationKey })
      const url = URL.createObjectURL(blob)
      // iOS detection: show tooltip instruction
      const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !window.MSStream
      if (isIOS) {
        alert("iOS open files in a new tab. Tap the 'Share' icon and select 'Save to Files' to download your portfolio.")
      }
      const a = document.createElement('a')
      a.href = url
      a.download = `${doctor.name || 'DentalFolio'}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.debug('PDF generation failed', e)
      alert('Failed to generate PDF. Try removing very large images or retry later.')
    }
  }

  async function handleImportPDF(file) {
    if (!file) return
    const { meta, error } = await parseDentalMetadata(file)
    if (error) {
      const messages = {
        no_file: 'No file provided.',
        not_pdf: 'Selected file is not a PDF.',
        file_too_large: 'PDF is too large to import (limit 50MB).',
        corrupted_or_encrypted: 'PDF appears corrupted or encrypted and cannot be read.',
        no_dentalfolio_metadata: 'This PDF does not contain DentalFolio metadata.',
        metadata_parse_error: 'Failed to parse DentalFolio metadata.',
        unexpected: 'Unknown error while parsing PDF.'
      }
      alert(messages[error] || 'Failed to import PDF.')
      return
    }
    if (meta) {
      setAppendMode(true)
      setDoctor((d) => ({ ...d, name: meta.doctorName }))
      setMaxCases(meta.maxCases)
      setUsedCases(meta.usedCases)
    } else {
      alert('No valid DentalFolio metadata found in this PDF.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-5xl mx-auto p-6">
        {!hydrated ? (
          <div className="text-center py-20 text-slate-500">Restoring your session...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-4">
              <DoctorForm doctor={doctor} setDoctor={setDoctor} appendMode={appendMode} onImportPDF={handleImportPDF} />
              <KeyValidator
                doctor={doctor}
                activationKey={activationKey}
                setActivationKey={setActivationKey}
                unlocked={unlocked}
                setUnlocked={setUnlocked}
                maxCases={maxCases}
                usedCases={usedCases}
                setMaxCases={setMaxCases}
              />
              <div>
                <button
                  onClick={() => {
                    const whatsappMessage = `Hello, I want to activate my package for Email: ${doctor.email || ''}`
                    const url = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`
                    window.open(url, '_blank')
                  }}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-500 text-white font-semibold"
                >
                  Contact via WhatsApp to Purchase
                </button>
              </div>
              <div>
                <button
                  disabled={!unlocked}
                  onClick={handleGeneratePDF}
                  className="w-full py-3 px-4 rounded-lg text-white font-semibold pdf-btn disabled:opacity-50"
                >
                  Download Portfolio (PDF)
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <CaseManager
                cases={cases}
                setCases={setCases}
                maxCases={maxCases}
                usedCases={usedCases}
                appendMode={appendMode}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
