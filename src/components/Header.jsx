import React from 'react'
import { BookOpen } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-5xl mx-auto p-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">DentalFolio</h1>
            <p className="text-sm text-slate-500">Premium PDF portfolio builder for graduating dentists</p>
          </div>
        </div>
        <nav className="ml-auto text-sm text-slate-600">
          <a className="px-3 py-2 hover:text-slate-900" href="#">How it works</a>
          <a className="px-3 py-2 hover:text-slate-900" href="#">Pricing</a>
        </nav>
      </div>
    </header>
  )
}
