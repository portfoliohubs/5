import React from 'react'
import { BookOpen } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-white flex-shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">DentalFolio</h1>
            <p className="text-sm text-slate-500">Premium PDF portfolio builder for graduating dentists</p>
          </div>
        </div>
        <nav className="ml-auto text-sm text-slate-600 hidden sm:flex">
          <a className="px-3 py-2 hover:text-slate-900 transition-colors" href="#">How it works</a>
          <a className="px-3 py-2 hover:text-slate-900 transition-colors" href="#">Pricing</a>
        </nav>
      </div>
    </header>
  )
}
