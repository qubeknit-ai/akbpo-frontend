import { useState, useEffect } from 'react'
import { X, Star, MapPin, ExternalLink, BadgeDollarSign } from 'lucide-react'

const TalentDetailsModal = ({ talent, isOpen, onClose }) => {
  if (!isOpen || !talent) return null

  const fallbackProfileUrl = talent.profileUrl
    ? talent.profileUrl.startsWith('http')
      ? talent.profileUrl
      : `https://www.freelancer.com${talent.profileUrl}`
    : null

  const skills = Array.isArray(talent.skills) ? talent.skills : []
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [talent])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{talent.name}</h2>
            {talent.tagline && <p className="text-sm text-gray-600">{talent.tagline}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-6 sm:grid-cols-[180px,1fr]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-36 w-36 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              {talent.image && !imageError ? (
                <img
                  src={talent.image}
                  alt={talent.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-500 bg-gray-100">
                  {talent.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            {fallbackProfileUrl && (
              <a
                href={fallbackProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                View Profile
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Rating</p>
                <div className="mt-1 flex items-center gap-2 text-gray-900">
                  <Star size={16} className="text-amber-500" />
                  <span className="text-lg font-semibold">{talent.rating ?? '—'}</span>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Hourly Rate</p>
                <div className="mt-1 flex items-center gap-2 text-gray-900">
                  <BadgeDollarSign size={16} className="text-emerald-500" />
                  <span className="text-lg font-semibold">{talent.charges || '—'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {talent.country && (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                  <MapPin size={14} />
                  {talent.country}
                </span>
              )}
              {talent.reviews && (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                  {talent.reviews} reviews
                </span>
              )}
              {talent.earnings && (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                  Earnings: {talent.earnings}
                </span>
              )}
            </div>

            {skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Top Skills</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 bg-white"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Bio</p>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {talent.bio || 'No bio provided.'}
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TalentDetailsModal


