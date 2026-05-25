import React from 'react'
import imageCompression from 'browser-image-compression'

const EGYPT_FACULTIES = [
  'Cairo University - Faculty of Dentistry',
  'Alexandria University - Faculty of Dentistry',
  'Ain Shams University - Faculty of Dentistry',
  'Mansoura University - Faculty of Dentistry',
  'Tanta University - Faculty of Dentistry',
  'Assiut University - Faculty of Dentistry',
]

export default function DoctorForm({ doctor, setDoctor, appendMode, onImportPDF }) {
  async function handleProfileImage(file) {
    if (!file) return
    const options = { maxSizeMB: 0.3, maxWidthOrHeight: 2000, useWebWorker: true }
    try {
      const compressed = await imageCompression(file, options)
      const blobUrl = URL.createObjectURL(compressed)
      setDoctor(d => ({ ...d, profileImage: { blob: compressed, url: blobUrl } }))
    } catch (e) {
      console.debug('imageCompression error', e)
      alert('Failed to process image — try a different file or reduce image size.')
    }
  }

  return (
    <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold mb-4 text-slate-900">Doctor Information</h2>

      <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
      <input
        value={doctor.name}
        onChange={(e) => setDoctor(d => ({ ...d, name: e.target.value }))}
        readOnly={!!appendMode}
        className="w-full p-2 border border-slate-300 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Full name"
      />

      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
      <input
        value={doctor.email}
        onChange={(e) => setDoctor(d => ({ ...d, email: e.target.value }))}
        className="w-full p-2 border border-slate-300 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="doctor@email.com"
        type="email"
      />

      <label className="block text-sm font-medium text-slate-700 mb-1">University</label>
      <select
        value={doctor.university}
        onChange={(e) => setDoctor(d => ({ ...d, university: e.target.value }))}
        className="w-full p-2 border border-slate-300 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select your dental faculty</option>
        {EGYPT_FACULTIES.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      <label className="block text-sm font-medium text-slate-700 mb-1">Profile picture</label>
      <div className="flex items-center gap-3 mb-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleProfileImage(e.target.files?.[0])}
          className="text-sm"
        />
        {doctor.profileImage?.url && (
          <img src={doctor.profileImage.url} alt="profile" className="w-16 h-16 object-contain rounded-lg border border-slate-200" />
        )}
      </div>

      <label className="block text-sm font-medium text-slate-700 mb-1">Social links</label>
      <input
        value={doctor.socials.whatsapp}
        onChange={(e) => setDoctor(d => ({ ...d, socials: { ...d.socials, whatsapp: e.target.value } }))}
        placeholder="WhatsApp number"
        className="w-full p-2 border border-slate-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        value={doctor.socials.facebook}
        onChange={(e) => setDoctor(d => ({ ...d, socials: { ...d.socials, facebook: e.target.value } }))}
        placeholder="Facebook URL"
        className="w-full p-2 border border-slate-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        value={doctor.socials.instagram}
        onChange={(e) => setDoctor(d => ({ ...d, socials: { ...d.socials, instagram: e.target.value } }))}
        placeholder="Instagram handle"
        className="w-full p-2 border border-slate-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        value={doctor.socials.linkedin}
        onChange={(e) => setDoctor(d => ({ ...d, socials: { ...d.socials, linkedin: e.target.value } }))}
        placeholder="LinkedIn URL"
        className="w-full p-2 border border-slate-300 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="pt-3 border-t border-slate-100">
        <label className="block text-sm font-medium text-slate-700 mb-1">Import existing DentalFolio PDF (append mode)</label>
        <input
          type="file"
          accept="application/pdf"
          className="text-sm"
          onChange={(e) => { if (e.target.files?.[0]) onImportPDF(e.target.files[0]) }}
        />
      </div>
    </section>
  )
}
