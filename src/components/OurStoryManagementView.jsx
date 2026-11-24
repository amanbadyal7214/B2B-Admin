import { useState, useEffect } from 'react'
import { getOurStoryApi, updateOurStoryApi } from '../api'

function OurStoryManagementView({ currentUser }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form State
  const [storyData, setStoryData] = useState({
    eyebrow: 'OUR STORY · BORN IN TIRUPPUR',
    heading: 'Why We Built Buddy Vs Buff: Restoring Fabric Integrity to Indian Wholesale.',
    paragraph1:
      'For over three decades, independent boutique owners travelled to crowded wholesale mandis. By the time a basic cotton t-shirt arrived on the retail shelf, it had passed through commission agents, state stockists, and city sub-distributors — each taking an 8% to 15% margin cut.',
    paragraph2:
      'To protect margins, traditional manufacturers downgraded fabrics to flimsy 160 GSM carded yarn that warped and developed bacon necklines after two washes. We created Buddy Vs Buff to eliminate the middlemen and deliver genuine heavyweight 240 to 420 GSM streetwear directly from our Tiruppur circular looms to your store counter at honest factory wholesale rates.',
    image: '',
    badgeText: 'Tiruppur Circular Loom #04',
    quote:
      'Every garment begins as raw combed cotton bales in Tamil Nadu, passing through our circular looms, reactive dye baths, and automated laser cutters before arriving in your store cartons.',
    quoteAuthor: '100% Combed Compact Cotton',
    quoteSubtext: 'Batch Tiruppur',
    pillars: [
      {
        number: '01',
        title: '240 to 420 GSM Rigor',
        description: 'High-density 24-gauge circular knits that drape crisply and never bacon.',
      },
      {
        number: '02',
        title: 'Zero Middlemen',
        description: 'Direct mill billing with full GSTR-1 input tax credit on every carton.',
      },
      {
        number: '03',
        title: 'Boutique Exclusivity',
        description: 'We never sell single pieces to retail consumers, protecting your store prices.',
      },
      {
        number: '04',
        title: '48-Hour Hub Dispatch',
        description: 'Central warehouse pre-assorted 1:2:2:2:1 size packs with zero deadstock.',
      },
    ],
    metrics: [
      { label: 'Verified Boutiques: ', val: '500+ Across 28 States' },
      { label: 'First-Pass QC: ', val: '99.4% Accuracy' },
      { label: 'Fabric Weight: ', val: '100% Combed Cotton' },
    ],
  })

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  // Fetch story on mount
  useEffect(() => {
    const fetchStory = async () => {
      setIsLoading(true)
      setErrorMessage('')
      try {
        const res = await getOurStoryApi()
        if (res?.success && res.data) {
          setStoryData({
            eyebrow: res.data.eyebrow || '',
            heading: res.data.heading || '',
            paragraph1: res.data.paragraph1 || '',
            paragraph2: res.data.paragraph2 || '',
            image: res.data.image || '',
            badgeText: res.data.badgeText || '',
            quote: res.data.quote || '',
            quoteAuthor: res.data.quoteAuthor || '',
            quoteSubtext: res.data.quoteSubtext || '',
            pillars:
              res.data.pillars && res.data.pillars.length > 0
                ? res.data.pillars
                : storyData.pillars,
            metrics:
              res.data.metrics && res.data.metrics.length > 0
                ? res.data.metrics
                : storyData.metrics,
          })
          if (res.data.image) {
            setImagePreview(res.data.image)
          }
        }
      } catch (err) {
        console.error('fetchOurStory error:', err)
        setErrorMessage('Failed to fetch Our Story content from server.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStory()
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePillarChange = (index, field, value) => {
    setStoryData((prev) => {
      const updatedPillars = [...prev.pillars]
      updatedPillars[index] = { ...updatedPillars[index], [field]: value }
      return { ...prev, pillars: updatedPillars }
    })
  }

  const handleMetricChange = (index, field, value) => {
    setStoryData((prev) => {
      const updatedMetrics = [...prev.metrics]
      updatedMetrics[index] = { ...updatedMetrics[index], [field]: value }
      return { ...prev, metrics: updatedMetrics }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      let payload
      if (selectedFile) {
        // Use FormData for file upload
        const fd = new FormData()
        fd.append('eyebrow', storyData.eyebrow)
        fd.append('heading', storyData.heading)
        fd.append('paragraph1', storyData.paragraph1)
        fd.append('paragraph2', storyData.paragraph2)
        fd.append('badgeText', storyData.badgeText)
        fd.append('quote', storyData.quote)
        fd.append('quoteAuthor', storyData.quoteAuthor)
        fd.append('quoteSubtext', storyData.quoteSubtext)
        fd.append('image', selectedFile)
        fd.append('pillars', JSON.stringify(storyData.pillars))
        fd.append('metrics', JSON.stringify(storyData.metrics))
        payload = fd
      } else {
        // Plain JSON
        payload = {
          ...storyData,
          image: storyData.image,
        }
      }

      const res = await updateOurStoryApi(payload)
      if (res?.success) {
        setSuccessMessage('Our Story section updated successfully!')
        if (res.data?.image) {
          setStoryData((p) => ({ ...p, image: res.data.image }))
          setImagePreview(res.data.image)
        }
        setSelectedFile(null)
      } else {
        setErrorMessage(res?.message || 'Failed to update Our Story section')
      }
    } catch (err) {
      console.error('saveOurStory error:', err)
      setErrorMessage(err.response?.data?.message || err.message || 'Error updating Our Story')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#F95700] border-t-transparent" />
        <span className="font-mono text-xs uppercase tracking-wider text-[#7A746B]">
          Loading Our Story Content...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header Strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F95700]/10 text-[#F95700] border border-[#F95700]/20">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#121214] sm:text-2xl">
                Our Story Section CMS
              </h1>
              <p className="text-xs text-[#7A746B]">
                Customize the Brand Story, Tiruppur atelier image, 4 core pillars, and metrics shown on the About Us page.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F95700] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(249,87,0,0.3)] transition-all hover:bg-[#e04e00] hover:shadow-[0_6px_20px_rgba(249,87,0,0.4)] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Save &amp; Publish Our Story</span>
            </>
          )}
        </button>
      </div>

      {/* Alert Notices */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')} className="font-bold text-red-600 hover:text-red-900">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center justify-between">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage('')} className="font-bold text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* Main 2-Column Grid: Left CMS Form + Right Live Visual Preview */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 items-start">
        {/* Left Form Column (7 cols) */}
        <form onSubmit={handleSubmit} className="xl:col-span-7 space-y-6">
          {/* Card 1: Headings & Tagline */}
          <div className="rounded-2xl border border-[#ECE4D5] bg-white p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#121214] border-b border-[#F2ECE1] pb-2.5">
              1. Story Headings &amp; Eyebrow
            </h3>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                Eyebrow / Tagline
              </label>
              <input
                type="text"
                required
                value={storyData.eyebrow}
                onChange={(e) => setStoryData((p) => ({ ...p, eyebrow: e.target.value }))}
                placeholder="OUR STORY · BORN IN TIRUPPUR"
                className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3.5 py-2 text-xs font-semibold text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                Main Story Headline
              </label>
              <input
                type="text"
                required
                value={storyData.heading}
                onChange={(e) => setStoryData((p) => ({ ...p, heading: e.target.value }))}
                placeholder="Why We Built Buddy Vs Buff: Restoring Fabric Integrity to Indian Wholesale."
                className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3.5 py-2 text-xs font-serif font-bold text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Card 2: Narrative Paragraphs */}
          <div className="rounded-2xl border border-[#ECE4D5] bg-white p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#121214] border-b border-[#F2ECE1] pb-2.5">
              2. Story Paragraphs
            </h3>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                Paragraph 1: The Problem (Legacy Mandi Wholesale)
              </label>
              <textarea
                rows={3}
                required
                value={storyData.paragraph1}
                onChange={(e) => setStoryData((p) => ({ ...p, paragraph1: e.target.value }))}
                className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                Paragraph 2: The Solution (Buddy Vs Buff Mill-Direct Standard)
              </label>
              <textarea
                rows={3}
                required
                value={storyData.paragraph2}
                onChange={(e) => setStoryData((p) => ({ ...p, paragraph2: e.target.value }))}
                className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Card 3: Atelier Image & Quote Overlay */}
          <div className="rounded-2xl border border-[#ECE4D5] bg-white p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#121214] border-b border-[#F2ECE1] pb-2.5">
              3. Workshop Atelier Image &amp; Quote Overlay
            </h3>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                Upload New Workshop Photo (or paste image URL)
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-xs text-[#6B6357] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0B1E38] file:text-white hover:file:bg-[#122744] cursor-pointer"
                />
                <span className="text-[11px] text-[#9A9386] font-mono">OR</span>
                <input
                  type="url"
                  value={storyData.image}
                  onChange={(e) => {
                    setStoryData((p) => ({ ...p, image: e.target.value }))
                    if (e.target.value) setImagePreview(e.target.value)
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3 py-1.5 text-xs text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none"
                />
              </div>
              {imagePreview && (
                <div className="mt-3 flex items-center gap-3 bg-[#FAF8F5] p-2 rounded-xl border border-[#ECE4D5]">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-24 rounded-lg object-cover border border-[#DFD8CA]"
                  />
                  <div className="text-xs text-[#6B6357]">
                    <div className="font-semibold text-[#121214]">Selected Photo Preview</div>
                    <div className="text-[10px] text-[#9A9386]">Will be displayed in the left atelier frame.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                  Image Corner Badge Text
                </label>
                <input
                  type="text"
                  value={storyData.badgeText}
                  onChange={(e) => setStoryData((p) => ({ ...p, badgeText: e.target.value }))}
                  placeholder="Tiruppur Circular Loom #04"
                  className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3 py-2 text-xs text-[#121214] focus:border-[#F95700] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                  Quote Author / Subtext
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={storyData.quoteAuthor}
                    onChange={(e) => setStoryData((p) => ({ ...p, quoteAuthor: e.target.value }))}
                    placeholder="100% Combed Compact Cotton"
                    className="w-1/2 rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-2.5 py-2 text-xs text-[#121214]"
                  />
                  <input
                    type="text"
                    value={storyData.quoteSubtext}
                    onChange={(e) => setStoryData((p) => ({ ...p, quoteSubtext: e.target.value }))}
                    placeholder="Batch Tiruppur"
                    className="w-1/2 rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-2.5 py-2 text-xs text-[#121214]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#55514B] mb-1">
                Quote Text (Overlay Card on Image)
              </label>
              <textarea
                rows={2}
                value={storyData.quote}
                onChange={(e) => setStoryData((p) => ({ ...p, quote: e.target.value }))}
                className="w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#121214] italic focus:border-[#F95700] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Card 4: The 4 Core Pillars */}
          <div className="rounded-2xl border border-[#ECE4D5] bg-white p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#121214] border-b border-[#F2ECE1] pb-2.5">
              4. The 4 Core Pillars
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {storyData.pillars.map((pillar, idx) => (
                <div key={idx} className="rounded-xl border border-[#E8DEC9] bg-[#FAF8F5] p-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pillar.number}
                      onChange={(e) => handlePillarChange(idx, 'number', e.target.value)}
                      className="w-10 rounded-md border border-[#DFD8CA] bg-white px-2 py-1 text-center font-mono text-xs font-bold text-[#805915]"
                    />
                    <input
                      type="text"
                      value={pillar.title}
                      onChange={(e) => handlePillarChange(idx, 'title', e.target.value)}
                      placeholder="Pillar Title"
                      className="flex-1 rounded-md border border-[#DFD8CA] bg-white px-2.5 py-1 text-xs font-bold text-[#121214]"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={pillar.description}
                    onChange={(e) => handlePillarChange(idx, 'description', e.target.value)}
                    placeholder="Short description of this pillar"
                    className="w-full rounded-md border border-[#DFD8CA] bg-white px-2.5 py-1 text-xs text-[#5C5852] leading-tight"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Bottom Quick Metrics */}
          <div className="rounded-2xl border border-[#ECE4D5] bg-white p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-[#121214] border-b border-[#F2ECE1] pb-2.5">
              5. Bottom Quick Metrics (3 Strip Badges)
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {storyData.metrics.map((metric, idx) => (
                <div key={idx} className="rounded-xl border border-[#E8DEC9] bg-[#FAF8F5] p-3 space-y-1.5">
                  <input
                    type="text"
                    value={metric.label}
                    onChange={(e) => handleMetricChange(idx, 'label', e.target.value)}
                    placeholder="Metric Label"
                    className="w-full rounded-md border border-[#DFD8CA] bg-white px-2 py-1 text-[11px] font-mono text-[#8A847B]"
                  />
                  <input
                    type="text"
                    value={metric.val}
                    onChange={(e) => handleMetricChange(idx, 'val', e.target.value)}
                    placeholder="Metric Value"
                    className="w-full rounded-md border border-[#DFD8CA] bg-white px-2 py-1 text-xs font-mono font-bold text-[#121214]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#F95700] px-6 py-3 text-xs font-semibold text-white shadow-md hover:bg-[#e04e00] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save & Publish Our Story'}
            </button>
          </div>
        </form>

        {/* Right Column: Live Visual Replica Preview (5 cols) */}
        <div className="xl:col-span-5 sticky top-20">
          <div className="rounded-2xl border border-[#ECE4D5] bg-[#FAF8F5] p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E8DEC9] pb-3 mb-4">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#9A6D22]">
                ✦ Live Storefront Preview
              </span>
              <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                Real-Time Replica
              </span>
            </div>

            {/* Simulated About Us "Our Story" Box */}
            <div className="overflow-hidden rounded-2xl border border-[#DFD8CA] bg-white shadow-sm text-[#121214] scale-95 origin-top">
              {/* Top Simulated Image Banner */}
              <div className="relative h-44 bg-[#121214] overflow-hidden">
                <img
                  src={imagePreview || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80'}
                  alt="Atelier Preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute top-2.5 left-2.5 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[9px] font-bold text-[#FAD79F] border border-white/20">
                  {storyData.badgeText || 'Tiruppur Circular Loom #04'}
                </span>
                <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/80 p-2 text-white text-[9.5px] italic">
                  "{storyData.quote?.slice(0, 80)}..."
                </div>
              </div>

              {/* Story Content Simulated */}
              <div className="p-4 space-y-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#9A6D22]">
                  {storyData.eyebrow}
                </span>
                <h4 className="font-serif text-sm font-bold text-[#121214] leading-snug">
                  {storyData.heading}
                </h4>
                <p className="text-[11px] text-[#5C5852] line-clamp-2 leading-relaxed">
                  {storyData.paragraph1}
                </p>
                <p className="text-[11px] text-[#5C5852] line-clamp-2 leading-relaxed">
                  {storyData.paragraph2}
                </p>

                {/* Simulated 4 Pillars */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F2ECE1]">
                  {storyData.pillars.map((p, i) => (
                    <div key={i} className="text-[9.5px]">
                      <span className="font-bold text-[#805915] font-mono mr-1">{p.number}</span>
                      <span className="font-bold text-[#121214]">{p.title}</span>
                    </div>
                  ))}
                </div>

                {/* Simulated Bottom Metrics */}
                <div className="pt-2 border-t border-[#F2ECE1] flex items-center justify-between text-[9px] font-mono text-[#8A847B]">
                  <span>{storyData.metrics[0]?.label} <b>{storyData.metrics[0]?.val}</b></span>
                  <span>{storyData.metrics[1]?.val}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OurStoryManagementView
