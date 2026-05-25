import React, { useState } from 'react'
import { optimizeImage } from '../utils/imageOptimizer'

const CATEGORIES = ['Restorative', 'Endodontics', 'Periodontics', 'Oral Surgery', 'Prosthodontics', 'Orthodontics']

export default function CaseManager({ cases, setCases, maxCases, usedCases, appendMode }) {
  const [filter, setFilter] = useState('All')

  const remaining = Math.max(0, maxCases - usedCases - cases.length)

  async function handleAddCase(file) {
    if (!file) return
    if (cases.length >= remaining) return alert(`You can add up to ${remaining} more cases.`)
    try {
      const optimized = await optimizeImage(file, { maxSizeKB: 300 })
      const url = URL.createObjectURL(optimized)
      setCases(prev => [...prev, { id: Date.now().toString(), category: 'Restorative', description: '', file: optimized, url }])
    } catch (e) {
      console.debug('optimizeImage error', e)
      alert('Failed to optimize image — try a different photo or lower resolution source.')
    }
  }

  function updateCase(id, patch) {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  function removeCase(id) {
    setCases(prev => prev.filter(c => c.id !== id))
  }

  return (
    <section className="bg-white rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Cases ({usedCases} used, {maxCases} max)</h2>

      <div className="flex gap-3 items-center mb-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="p-2 border rounded">
          <option>All</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="file" accept="image/*" multiple onChange={(e) => {
          const files = Array.from(e.target.files || [])
          files.forEach(f => handleAddCase(f))
        }} />
        <div className="ml-auto text-sm text-slate-500">Remaining uploads: {remaining}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.filter(c => filter === 'All' || c.category === filter).map(c => (
          <div key={c.id} className="border rounded p-3 flex gap-3">
            <img src={c.url} alt="case" className="w-28 h-28 object-contain bg-slate-100 rounded" />
            <div className="flex-1">
              <select value={c.category} onChange={(e) => updateCase(c.id, { category: e.target.value })} className="w-full p-2 border rounded mb-2">
                {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
              </select>
              <textarea maxLength={250} value={c.description} onChange={(e) => updateCase(c.id, { description: e.target.value })} className="w-full p-2 border rounded mb-2" placeholder="Short clinical description (max 250 chars)"></textarea>
              <div className="flex gap-2">
                <button onClick={() => removeCase(c.id)} className="px-3 py-1 bg-red-500 text-white rounded">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
