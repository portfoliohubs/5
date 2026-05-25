import React, { useState } from 'react'
import { optimizeImage } from '../utils/imageOptimizer'

const CATEGORIES = [
  'Restorative', 'Endodontics', 'Periodontics',
  'Oral Surgery', 'Prosthodontics', 'Orthodontics'
]

export default function CaseManager({ cases, setCases, maxCases, usedCases, appendMode }) {
  const [filter, setFilter] = useState('All')

  const remaining = Math.max(0, maxCases - usedCases - cases.length)

  async function handleAddCase(file) {
    if (!file) return
    if (cases.length + usedCases >= maxCases) {
      return alert(`You can add up to ${remaining} more cases.`)
    }
    try {
      const optimized = await optimizeImage(file, { maxSizeKB: 300 })
      const url = URL.createObjectURL(optimized)
      setCases(prev => [...prev, {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        category: 'Restorative',
        description: '',
        file: optimized,
        url,
      }])
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

  const filtered = cases.filter(c => filter === 'All' || c.category === filter)

  return (
    <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Cases
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({usedCases} used, {maxCases} max, {remaining} remaining)
          </span>
        </h2>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>All</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <label className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          + Add Images
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              files.forEach(f => handleAddCase(f))
              e.target.value = ''
            }}
          />
        </label>

        <div className="ml-auto text-sm text-slate-500">
          {cases.length} / {maxCases - usedCases} cases added
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg mb-1">No cases yet</p>
          <p className="text-sm">Click "+ Add Images" to upload your clinical case photos</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="border border-slate-200 rounded-xl p-3 flex gap-3">
            <img
              src={c.url}
              alt="case"
              className="w-28 h-28 object-contain bg-slate-100 rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <select
                value={c.category}
                onChange={(e) => updateCase(c.id, { category: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
              </select>
              <textarea
                maxLength={250}
                value={c.description}
                onChange={(e) => updateCase(c.id, { description: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg mb-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Short clinical description (max 250 chars)"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{c.description.length}/250</span>
                <button
                  onClick={() => removeCase(c.id)}
                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
