import React, { useState } from 'react'

const SECRET_SALT = 's3cr3t_DentalFolio_SALT_2026'

async function hmacHex(message, salt) {
  const enc = new TextEncoder()
  const keyData = enc.encode(salt)
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false
  let res = 0
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return res === 0
}

const tierMap = { Basic: 5, Pro: 20, Premium: 50 }

export default function KeyValidator({
  doctor, activationKey, setActivationKey,
  unlocked, setUnlocked, maxCases, usedCases, setMaxCases
}) {
  const [tier, setTier] = useState('Pro')

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
      if (constantTimeEqual(provided, expected)) {
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
    <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <h3 className="font-semibold mb-3 text-slate-900">Activation</h3>

      <label className="block text-sm font-medium text-slate-700 mb-1">Tier</label>
      <select
        value={tier}
        onChange={(e) => setTier(e.target.value)}
        className="w-full p-2 border border-slate-300 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option>Basic</option>
        <option>Pro</option>
        <option>Premium</option>
      </select>

      <label className="block text-sm font-medium text-slate-700 mb-1">Activation Key</label>
      <input
        className="w-full p-2 border border-slate-300 rounded-lg mb-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={activationKey}
        onChange={(e) => setActivationKey(e.target.value)}
        placeholder="Enter activation key (64-char hex)"
      />

      <div className="flex gap-2 mb-3">
        <button
          onClick={validateKey}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Validate Key
        </button>
        <button
          onClick={() => {
            const msg = `Hello, I want to activate my ${tier} package for Email: ${doctor.email || ''}`
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
          }}
          className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Buy via WhatsApp
        </button>
      </div>

      <div className={`flex items-center gap-2 text-sm ${unlocked ? 'text-emerald-600' : 'text-slate-500'}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${unlocked ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
        {unlocked
          ? `Unlocked — ${maxCases} cases max (${usedCases} used)`
          : 'Locked — enter activation key to unlock'}
      </div>
    </section>
  )
}
