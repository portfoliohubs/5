import React, { useState } from 'react'

const SECRET_SALT = 's3cr3t_DentalFolio_SALT_2026'

async function hmacHex(message, salt) {
  const enc = new TextEncoder()
  const keyData = enc.encode(salt)
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false
  let res = 0
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return res === 0
}

export default function KeyValidator({ doctor, activationKey, setActivationKey, unlocked, setUnlocked, maxCases, usedCases, setMaxCases }) {
  const [tier, setTier] = useState('Pro')
  const tierMap = { Basic: 5, Pro: 20, Premium: 50 }

  async function validateKey() {
    if (!doctor.email) return alert('Enter your email first')
    const tierLimit = tierMap[tier]
    try {
      const expected = await hmacHex(`${doctor.email}|${tierLimit}`, SECRET_SALT)
      const provided = activationKey.replace(/\s/g, '').toLowerCase()
      if (provided.length !== expected.length) {
        setUnlocked(false)
        return alert('Invalid Activation Key format')
      }
      const ok = constantTimeEqual(provided, expected)
      if (ok) {
        setUnlocked(true)
        setMaxCases(tierLimit)
        alert('Activation successful — downloads unlocked')
      } else {
        setUnlocked(false)
        alert('Invalid Activation Key')
      }
    } catch (e) {
      console.debug('validateKey error', e)
      alert('Activation failed due to internal error')
    }
  }

  return (
    <section className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="font-semibold mb-2">Activation</h3>
      <div className="mb-2">
        <label className="block text-sm">Tier</label>
        <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full p-2 border rounded">
          <option>Basic</option>
          <option>Pro</option>
          <option>Premium</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block text-sm">Activation Key</label>
        <input className="w-full p-2 border rounded" value={activationKey} onChange={(e) => setActivationKey(e.target.value)} placeholder="Enter activation key (hex)" />
      </div>
      <div className="flex gap-2">
        <button onClick={validateKey} className="px-3 py-2 bg-blue-600 text-white rounded">Validate Key</button>
        <button onClick={() => {
          const whatsappMessage = `Hello, I want to activate my ${tier} package for Email: ${doctor.email || ''}`
          const url = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`
          window.open(url, '_blank')
        }} className="px-3 py-2 bg-emerald-500 text-white rounded">Unlock via WhatsApp</button>
      </div>
      <p className="text-sm text-slate-500 mt-2">Download is {unlocked ? 'unlocked' : 'locked'} — used: {usedCases}</p>
    </section>
  )
}
