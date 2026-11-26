import { useState, useEffect, useRef } from 'react'
import {
  getAnnouncementsApi,
  updateAnnouncementsApi,
  resetAnnouncementsApi,
} from '../api'

export default function AnnouncementManagementView({ currentUser }) {
  const [isEnabled, setIsEnabled] = useState(true)
  const [rotationSpeedSeconds, setRotationSpeedSeconds] = useState(4.8)
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Live preview interactive state
  const [previewIndex, setPreviewIndex] = useState(0)
  const previewTimerRef = useRef(null)

  // Fetch announcements on load
  const loadConfig = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await getAnnouncementsApi()
      if (res?.success && res.config) {
        setIsEnabled(res.config.isEnabled !== undefined ? res.config.isEnabled : true)
        setRotationSpeedSeconds(res.config.rotationSpeedSeconds || 4.8)
        setAnnouncements(
          Array.isArray(res.config.announcements) ? res.config.announcements : []
        )
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to load announcement configuration.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  // Auto-slide live preview
  useEffect(() => {
    const activeAnnouncements = announcements.filter((a) => a.isActive !== false)
    if (!isEnabled || activeAnnouncements.length <= 1) return undefined

    previewTimerRef.current = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % activeAnnouncements.length)
    }, rotationSpeedSeconds * 1000)

    return () => {
      if (previewTimerRef.current) clearInterval(previewTimerRef.current)
    }
  }, [isEnabled, announcements, rotationSpeedSeconds])

  // Save changes
  const handleSave = async (e) => {
    e?.preventDefault()
    setIsSaving(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const payload = {
        isEnabled,
        rotationSpeedSeconds: Number(rotationSpeedSeconds) || 4.8,
        announcements: announcements.map((item, index) => ({
          _id: item._id,
          badge: (item.badge || 'ANNOUNCEMENT').trim().toUpperCase(),
          text: (item.text || '').trim(),
          ctaText: (item.ctaText || 'Explore').trim(),
          link: (item.link || '/shop').trim(),
          highlight: (item.highlight || '').trim(),
          isActive: item.isActive !== undefined ? item.isActive : true,
          order: index,
        })),
      }

      const res = await updateAnnouncementsApi(payload)
      if (res.success) {
        setSuccessMessage('Announcement banner updated and live on storefront!')
        if (res.config?.announcements) {
          setAnnouncements(res.config.announcements)
        }
        setTimeout(() => setSuccessMessage(''), 4500)
      } else {
        setErrorMessage(res.message || 'Failed to update announcements.')
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Error updating announcements.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Reset to Factory Defaults
  const handleReset = async () => {
    if (
      !window.confirm(
        'Are you sure you want to restore the 4 factory default announcement slides? Any custom slides will be replaced.'
      )
    ) {
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const res = await resetAnnouncementsApi()
      if (res.success && res.config) {
        setIsEnabled(res.config.isEnabled !== undefined ? res.config.isEnabled : true)
        setRotationSpeedSeconds(res.config.rotationSpeedSeconds || 4.8)
        setAnnouncements(res.config.announcements || [])
        setSuccessMessage('Restored factory default announcement slides.')
        setTimeout(() => setSuccessMessage(''), 4500)
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to reset announcement slides.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Add new slide
  const handleAddSlide = () => {
    const newSlide = {
      badge: 'PROMO',
      text: 'New Seasonal Wholesale Drop · Instant Dispatch Available',
      ctaText: 'View Drop',
      link: '/shop',
      highlight: 'Limited Run',
      isActive: true,
      order: announcements.length,
    }
    setAnnouncements((prev) => [...prev, newSlide])
  }

  // Delete slide
  const handleDeleteSlide = (index) => {
    if (announcements.length <= 1) {
      alert('You must keep at least 1 announcement slide. You can disable the banner instead.')
      return
    }
    setAnnouncements((prev) => prev.filter((_, i) => i !== index))
  }

  // Move slide up/down
  const handleMoveSlide = (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= announcements.length) return

    setAnnouncements((prev) => {
      const copy = [...prev]
      const temp = copy[index]
      copy[index] = copy[targetIndex]
      copy[targetIndex] = temp
      return copy
    })
  }

  // Update specific slide property
  const handleUpdateSlide = (index, field, value) => {
    setAnnouncements((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const activeAnnouncements = announcements.filter((a) => a.isActive !== false)
  const currentPreview =
    activeAnnouncements[previewIndex] ||
    activeAnnouncements[0] || {
      badge: 'ANNOUNCEMENT',
      text: 'No active slides configured.',
      ctaText: '',
      link: '/shop',
    }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#ECE4D5] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D9AE6A]/40 bg-[#FAF3E4] px-3 py-0.5 shadow-2xs mb-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#805915]">
              Storefront CMS Engine
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#121214]">
            Top Announcement Banner Ticker
          </h2>
          <p className="text-xs text-[#6E685E] mt-1">
            Configure the live rotating ticker banner at the top of the storefront with dynamic wholesale badges, copy, and link buttons.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving || isLoading}
            className="rounded-lg border border-[#DFD6C5] bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-[#5A544B] shadow-2xs hover:bg-[#FAF8F5] cursor-pointer disabled:opacity-60"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="luxury-shimmer-btn rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm hover:shadow transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? 'Publishing...' : 'Publish to Storefront'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="rounded-xl border border-[#BDE0C7] bg-[#F1F9F3] p-4 text-xs font-medium text-[#1E824C] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-[#F0BCB8] bg-[#FDF2F1] p-4 text-xs font-medium text-[#B92D25] flex items-center gap-2 shadow-2xs">
          <span className="text-base">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Real-Time Interactive Storefront Preview */}
      <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#805915]">
              Real-Time Storefront Header Preview
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#1E824C] animate-pulse" />
          </div>
          <span className="text-[11px] font-mono text-[#7A746B]">
            Showing Slide {activeAnnouncements.length > 0 ? previewIndex + 1 : 0} of {activeAnnouncements.length}
          </span>
        </div>

        {/* The Live Marquee Strip as rendered on Storefront */}
        <div className="rounded-xl overflow-hidden border border-[#D9AE6A]/30 bg-[#121214] shadow-inner text-[#F9F8F6]">
          {isEnabled && activeAnnouncements.length > 0 ? (
            <div className="relative mx-auto flex h-10 max-w-[1360px] items-center justify-between px-4 text-[11px] sm:px-6">
              {/* Left Arrow */}
              <button
                type="button"
                onClick={() =>
                  setPreviewIndex(
                    (prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length
                  )
                }
                className="h-6 w-6 flex items-center justify-center rounded-full text-white/40 hover:text-[#FAD79F] cursor-pointer"
              >
                ‹
              </button>

              {/* Center Slide */}
              <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 px-3 text-center">
                {currentPreview.badge && (
                  <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#D9AE6A]/35 bg-[#D9AE6A]/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#FAD79F]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1F8F5A] animate-pulse" />
                    <span>{currentPreview.badge}</span>
                  </span>
                )}
                <span className="truncate font-sans text-xs font-medium text-[#E6E0D4]">
                  {currentPreview.text}
                </span>
                {currentPreview.ctaText && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FAD79F] underline decoration-[#D9AE6A]/40 underline-offset-3">
                    <span>{currentPreview.ctaText}</span>
                    <span>→</span>
                  </span>
                )}
              </div>

              {/* Right Arrow */}
              <button
                type="button"
                onClick={() =>
                  setPreviewIndex((prev) => (prev + 1) % activeAnnouncements.length)
                }
                className="h-6 w-6 flex items-center justify-center rounded-full text-white/40 hover:text-[#FAD79F] cursor-pointer"
              >
                ›
              </button>
            </div>
          ) : (
            <div className="py-2.5 px-4 text-center text-xs text-[#A8A196] italic bg-[#1E1E22]">
              ⚠️ Banner is currently disabled or has no active slides (Header ticker is hidden on storefront).
            </div>
          )}
        </div>
      </div>

      {/* 3. Global Banner Settings Card */}
      <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] p-6 shadow-xs">
        <h3 className="font-serif text-sm font-bold text-[#121214] uppercase tracking-wider mb-4">
          Global Ticker Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Visibility Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-[#ECE4D5] bg-[#FAF8F5]">
            <div>
              <div className="font-semibold text-xs text-[#121214]">
                Storefront Banner Display
              </div>
              <p className="text-[11px] text-[#7A746B] mt-0.5">
                Toggle whether the top announcement bar is visible to wholesale buyers.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#D8D2C5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E824C]"></div>
            </label>
          </div>

          {/* Rotation Timer Slider */}
          <div className="p-4 rounded-xl border border-[#ECE4D5] bg-[#FAF8F5]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#121214]">
                Rotation Speed (Seconds per slide)
              </span>
              <span className="font-mono font-bold text-[#805915] bg-[#FAF3E4] px-2 py-0.5 rounded border border-[#E5D3AF]">
                {rotationSpeedSeconds}s
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="15"
              step="0.5"
              value={rotationSpeedSeconds}
              onChange={(e) => setRotationSpeedSeconds(parseFloat(e.target.value))}
              className="mt-3 w-full h-2 bg-[#E5DDCF] rounded-lg appearance-none cursor-pointer accent-[#C59A46]"
            />
            <div className="flex justify-between text-[10px] text-[#A8A196] font-mono mt-1">
              <span>Fast (2s)</span>
              <span>Default (4.8s)</span>
              <span>Slow (15s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Slides Manager Card */}
      <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECE4D5] pb-4 mb-5">
          <div>
            <h3 className="font-serif text-sm font-bold text-[#121214] uppercase tracking-wider">
              Announcement Slides ({announcements.length} Total, {activeAnnouncements.length} Active)
            </h3>
            <p className="text-[11px] text-[#7A746B] mt-0.5">
              Edit the text, badge, and links for each slide in the rotating marquee.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddSlide}
            className="self-start rounded-lg bg-[#121214] px-3.5 py-2 text-xs font-bold text-[#FAD79F] hover:bg-[#232326] cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>+</span>
            <span>Add Announcement Slide</span>
          </button>
        </div>

        {/* Slides List */}
        <div className="space-y-4">
          {announcements.map((slide, idx) => (
            <div
              key={slide._id || idx}
              className={`rounded-xl border transition-all p-4 ${
                slide.isActive !== false
                  ? 'border-[#ECE4D5] bg-[#FCFBF8]'
                  : 'border-[#EAE3D5] bg-[#FAF8F5]/60 opacity-60'
              }`}
            >
              {/* Slide Top Bar */}
              <div className="flex items-center justify-between border-b border-[#F0EAE0] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FAF3E4] border border-[#D9AE6A] font-mono text-[11px] font-bold text-[#805915]">
                    {idx + 1}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#121214]">
                    Slide #{idx + 1}
                  </span>
                  {slide.isActive !== false ? (
                    <span className="rounded bg-[#F1F9F3] border border-[#BDE0C7] px-2 py-0.5 font-mono text-[9px] font-bold text-[#1E824C] uppercase">
                      Active
                    </span>
                  ) : (
                    <span className="rounded bg-[#FDF2F1] border border-[#F0BCB8] px-2 py-0.5 font-mono text-[9px] font-bold text-[#B92D25] uppercase">
                      Paused
                    </span>
                  )}
                </div>

                {/* Actions: Reorder, Toggle, Delete */}
                <div className="flex items-center gap-1.5">
                  {/* Reorder Up */}
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveSlide(idx, -1)}
                    className="p-1 rounded text-[#7A746B] hover:text-[#121214] hover:bg-[#EFE9DF] disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    ▲
                  </button>

                  {/* Reorder Down */}
                  <button
                    type="button"
                    disabled={idx === announcements.length - 1}
                    onClick={() => handleMoveSlide(idx, 1)}
                    className="p-1 rounded text-[#7A746B] hover:text-[#121214] hover:bg-[#EFE9DF] disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    ▼
                  </button>

                  {/* Toggle Active */}
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateSlide(idx, 'isActive', slide.isActive === false ? true : false)
                    }
                    className="ml-2 rounded border border-[#DFD6C5] bg-[#FFFFFF] px-2 py-1 text-[11px] font-semibold text-[#5A544B] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    {slide.isActive === false ? 'Activate' : 'Pause'}
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(idx)}
                    className="rounded border border-[#F0BCB8] bg-[#FDF2F1] px-2 py-1 text-[11px] font-semibold text-[#B92D25] hover:bg-[#FBE4E2] cursor-pointer ml-1"
                    title="Delete slide"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Slide Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                {/* Badge (e.g. HEAVYWEIGHT GSM) */}
                <div className="sm:col-span-3">
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#47423B]">
                    Badge Tag (e.g. HEAVYWEIGHT GSM) *
                  </label>
                  <input
                    type="text"
                    value={slide.badge || ''}
                    onChange={(e) => handleUpdateSlide(idx, 'badge', e.target.value)}
                    placeholder="HEAVYWEIGHT GSM"
                    className="mt-1 w-full rounded-lg border border-[#DED4C3] bg-[#FFFFFF] py-2 px-3 text-xs font-mono font-semibold text-[#805915] uppercase focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                {/* Main Copy */}
                <div className="sm:col-span-9">
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#47423B]">
                    Announcement Text Copy *
                  </label>
                  <input
                    type="text"
                    required
                    value={slide.text || ''}
                    onChange={(e) => handleUpdateSlide(idx, 'text', e.target.value)}
                    placeholder="240–500 GSM Luxury Silhouettes · Low Starting Pack MOQ from 6 Pcs"
                    className="mt-1 w-full rounded-lg border border-[#DED4C3] bg-[#FFFFFF] py-2 px-3 text-xs text-[#121214] font-medium focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                {/* CTA Button Text */}
                <div className="sm:col-span-3">
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#47423B]">
                    CTA Link Text
                  </label>
                  <input
                    type="text"
                    value={slide.ctaText || ''}
                    onChange={(e) => handleUpdateSlide(idx, 'ctaText', e.target.value)}
                    placeholder="Browse Drops"
                    className="mt-1 w-full rounded-lg border border-[#DED4C3] bg-[#FFFFFF] py-2 px-3 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                {/* Destination Link */}
                <div className="sm:col-span-5">
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#47423B]">
                    Destination Route / URL
                  </label>
                  <input
                    type="text"
                    value={slide.link || ''}
                    onChange={(e) => handleUpdateSlide(idx, 'link', e.target.value)}
                    placeholder="/shop, /become-retailer, etc."
                    className="mt-1 w-full rounded-lg border border-[#DED4C3] bg-[#FFFFFF] py-2 px-3 text-xs text-[#121214] font-mono focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                {/* Highlight Tag */}
                <div className="sm:col-span-4">
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-[#47423B]">
                    Internal Highlight Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={slide.highlight || ''}
                    onChange={(e) => handleUpdateSlide(idx, 'highlight', e.target.value)}
                    placeholder="Ready 48h Dispatch"
                    className="mt-1 w-full rounded-lg border border-[#DED4C3] bg-[#FFFFFF] py-2 px-3 text-xs text-[#7A746B] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Save Action */}
        <div className="mt-6 pt-4 border-t border-[#ECE4D5] flex items-center justify-between">
          <span className="text-[11px] text-[#7A746B]">
            All changes apply instantly to the storefront header banner upon publishing.
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="luxury-shimmer-btn rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm hover:shadow transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? 'Publishing...' : 'Publish to Storefront'}
          </button>
        </div>
      </div>
    </div>
  )
}
