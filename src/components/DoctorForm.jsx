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
    // Use browser-image-compression to compress and strip EXIF
    const options = { maxSizeMB: 0.3, maxWidthOrHeight: 2000, useWebWorker: true }
    try {
      const compressed = await imageCompression(file, options)
      const blobUrl = URL.createObjectURL(compressed)
      setDoctor({ ...doctor, profileImage: { blob: compressed, url: blobUrl } })
    } catch (e) {
      console.debug('imageCompression error', e)
      alert('Failed to process image — try a different file or reduce image size.')
    }
  }

  return (
    <section className="bg-white rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Doctor Information</h2>

      <label className="block text-sm">Full name</label>
      <input
        value={doctor.name}
        onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
        readOnly={!!appendMode}
        className="w-full p-2 border rounded mb-3"
        placeholder="Full name"
      />

      <label className="block text-sm">Email</label>
      <input
        value={doctor.email}
        onChange={(e) => setDoctor({ ...doctor, email: e.target.value })}
        className="w-full p-2 border rounded mb-3"
        placeholder="doctor@email.com"
      />

      <label className="block text-sm">University</label>
      <select
        value={doctor.university}
        onChange={(e) => setDoctor({ ...doctor, university: e.target.value })}
        className="w-full p-2 border rounded mb-3"
      >
        <option value="">Select your dental faculty</option>
        {EGYPT_FACULTIES.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      <label className="block text-sm">Profile picture</label>
      <div className="flex items-center gap-3 mb-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleProfileImage(e.target.files?.[0])}
        />
        {doctor.profileImage?.url && (
          <img src={doctor.profileImage.url} alt="profile" className="w-16 h-16 object-contain rounded" />
        )}
      </div>

      <label className="block text-sm">Social links</label>
      <input
        value={doctor.socials.whatsapp}
        onChange={(e) => setDoctor({ ...doctor, socials: { ...doctor.socials, whatsapp: e.target.value } })}
        placeholder="WhatsApp"
        className="w-full p-2 border rounded mb-2"
      />
      <input
        value={doctor.socials.facebook}
        onChange={(e) => setDoctor({ ...doctor, socials: { ...doctor.socials, facebook: e.target.value } })}
        placeholder="Facebook"
        className="w-full p-2 border rounded mb-2"
      />
      <input
        value={doctor.socials.instagram}
        onChange={(e) => setDoctor({ ...doctor, socials: { ...doctor.socials, instagram: e.target.value } })}
        placeholder="Instagram"
        className="w-full p-2 border rounded mb-2"
      />
      <input
        value={doctor.socials.linkedin}
        onChange={(e) => setDoctor({ ...doctor, socials: { ...doctor.socials, linkedin: e.target.value } })}
        placeholder="LinkedIn"
        className="w-full p-2 border rounded mb-2"
      />

      <div className="mt-3">
        <label className="block text-sm">Import existing DentalFolio PDF (append mode)</label>
        <input type="file" accept="application/pdf" onChange={(e) => onImportPDF(e.target.files?.[0])} />
      </div>
    </section>
  )
}
