import { useState, useEffect, useMemo } from 'react'
import {
  getFeaturedCollectionsApi,
  createFeaturedCollectionApi,
  updateFeaturedCollectionApi,
  deleteFeaturedCollectionApi,
  seedFeaturedCollectionsApi,
  getCategoriesApi,
} from '../api'

export default function FeaturedCollectionsView({ currentUser }) {
  const [collections, setCollections] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [mediaFilter, setMediaFilter] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    indexNumber: '',
    duration: '0:15',
    moq: 'MOQ 20 pcs',
    link: '/shop',
    mediaPosition: 'object-center',
    order: 1,
    status: 'Active',
  })

  // Media state
  const [imageFile, setImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoPreview, setVideoPreview] = useState('')

  // Quick Preset Links
  const quickLinkPresets = useMemo(() => {
    const list = [
      { label: 'All Products (Shop)', url: '/shop' },
      { label: 'Oversized Tees', url: '/shop?category=tees' },
      { label: 'Everyday Shirts', url: '/shop?category=shirts' },
      { label: 'Premium Hoodies', url: '/shop?category=hoodies' },
      { label: 'Denim Edit', url: '/shop?category=denim' },
      { label: 'Bottomwear', url: '/shop?category=trousers' },
    ]

    if (Array.isArray(categories)) {
      categories.forEach((cat) => {
        const slug = cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const url = `/shop?category=${encodeURIComponent(slug)}`
        if (!list.some((p) => p.url === url)) {
          list.push({ label: cat.name, url })
        }
      })
    }

    return list
  }, [categories])

  // Fetch Collections & Categories
  const fetchData = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const [colRes, catRes] = await Promise.allSettled([
        getFeaturedCollectionsApi({ all: true }),
        getCategoriesApi(),
      ])

      if (colRes.status === 'fulfilled' && colRes.value?.success && Array.isArray(colRes.value.collections)) {
        setCollections(colRes.value.collections)
      } else {
        setCollections([])
      }

      if (catRes.status === 'fulfilled' && catRes.value?.success && Array.isArray(catRes.value.categories)) {
        setCategories(catRes.value.categories)
      }
    } catch (err) {
      console.warn('Error fetching collections:', err)
      setErrorMessage(err.response?.data?.message || 'Failed to connect to backend server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Quick Notification Clearing
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCollection(null)
    const nextOrder = collections.length + 1
    const nextIndex = String(nextOrder).padStart(2, '0')
    setFormData({
      title: '',
      subtitle: '',
      indexNumber: nextIndex,
      duration: '0:15',
      moq: 'MOQ 20 pcs',
      link: '/shop',
      mediaPosition: 'object-center',
      order: nextOrder,
      status: 'Active',
    })
    setImageFile(null)
    setImageUrl('')
    setImagePreview('')
    setVideoFile(null)
    setVideoUrl('')
    setVideoPreview('')
    setErrorMessage('')
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (col) => {
    setEditingCollection(col)
    setFormData({
      title: col.title || '',
      subtitle: col.subtitle || '',
      indexNumber: col.indexNumber || '',
      duration: col.duration || '0:15',
      moq: col.moq || 'MOQ 20 pcs',
      link: col.link || '/shop',
      mediaPosition: col.mediaPosition || 'object-center',
      order: col.order !== undefined ? col.order : 1,
      status: col.status || 'Active',
    })
    setImageFile(null)
    setImageUrl(col.image || '')
    setImagePreview(col.image || '')
    setVideoFile(null)
    setVideoUrl(col.video || '')
    setVideoPreview(col.video || '')
    setErrorMessage('')
    setIsModalOpen(true)
  }

  // Image File Handling
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP).')
      return
    }
    setImageFile(file)
    setImageUrl('')
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  // Video File Handling
  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setErrorMessage('Please select a valid video file (MP4, WEBM).')
      return
    }
    setVideoFile(file)
    setVideoUrl('')
    const reader = new FileReader()
    reader.onloadend = () => setVideoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setErrorMessage('Collection title is required.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const submitData = new FormData()
      submitData.append('title', formData.title.trim())
      submitData.append('subtitle', formData.subtitle.trim())
      submitData.append('indexNumber', formData.indexNumber.trim())
      submitData.append('duration', formData.duration.trim())
      submitData.append('moq', formData.moq.trim())
      submitData.append('link', formData.link.trim())
      submitData.append('mediaPosition', formData.mediaPosition.trim())
      submitData.append('order', String(formData.order))
      submitData.append('status', formData.status)

      // Attach Image
      if (imageFile) {
        submitData.append('image', imageFile)
      } else if (imageUrl.trim()) {
        submitData.append('image', imageUrl.trim())
      }

      // Attach Video
      if (videoFile) {
        submitData.append('video', videoFile)
      } else if (videoUrl.trim()) {
        submitData.append('video', videoUrl.trim())
      }

      let res
      if (editingCollection) {
        res = await updateFeaturedCollectionApi(editingCollection._id, submitData)
      } else {
        res = await createFeaturedCollectionApi(submitData)
      }

      if (res?.success) {
        setSuccessMessage(
          editingCollection
            ? `Featured Collection "${formData.title}" updated successfully.`
            : `Featured Collection "${formData.title}" added to showcase.`
        )
        setIsModalOpen(false)
        await fetchData()
      } else {
        setErrorMessage(res?.message || 'Operation failed. Please verify fields.')
      }
    } catch (err) {
      console.error('Submission error:', err)
      setErrorMessage(err.response?.data?.message || 'An error occurred while saving the collection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Collection
  const handleDelete = async (col) => {
    if (!window.confirm(`Are you sure you want to remove "${col.title}" from Featured Collections?`)) {
      return
    }

    try {
      const res = await deleteFeaturedCollectionApi(col._id)
      if (res?.success) {
        setSuccessMessage(`Collection "${col.title}" deleted.`)
        await fetchData()
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to delete collection.')
    }
  }

  // Toggle Status
  const handleToggleStatus = async (col) => {
    const newStatus = col.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const res = await updateFeaturedCollectionApi(col._id, { status: newStatus })
      if (res?.success) {
        setCollections((prev) =>
          prev.map((item) => (item._id === col._id ? { ...item, status: newStatus } : item))
        )
        setSuccessMessage(`"${col.title}" set to ${newStatus}.`)
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update status.')
    }
  }

  // Seed / Reset
  const handleSeedDefaults = async () => {
    if (!window.confirm('Restore default 5 curated featured collections? This will refresh any missing starter reels.')) {
      return
    }
    try {
      setIsLoading(true)
      const res = await seedFeaturedCollectionsApi(false)
      if (res?.success) {
        setSuccessMessage('Default featured collections restored.')
        await fetchData()
      }
    } catch (err) {
      setErrorMessage('Failed to restore defaults.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return collections.filter((item) => {
      // Search
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.link?.toLowerCase().includes(q)

      // Status
      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter

      // Media
      const matchesMedia =
        mediaFilter === 'ALL' ||
        (mediaFilter === 'VIDEO' && Boolean(item.video)) ||
        (mediaFilter === 'IMAGE_ONLY' && !item.video)

      return matchesSearch && matchesStatus && matchesMedia
    })
  }, [collections, searchQuery, statusFilter, mediaFilter])

  // Statistics
  const stats = useMemo(() => {
    const total = collections.length
    const active = collections.filter((c) => c.status === 'Active').length
    const withVideo = collections.filter((c) => Boolean(c.video)).length
    const inactive = total - active
    return { total, active, withVideo, inactive }
  }, [collections])

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#9A6D22] uppercase">
            <span>Catalog Management</span>
            <span>/</span>
            <span className="font-semibold text-[#121214]">Featured Collections</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#121214] sm:text-3xl">
            Featured Collections &amp; Product Reels
          </h1>
          <p className="mt-1 text-xs text-[#6B6357] max-w-2xl leading-relaxed">
            Manage the homepage 5-card fan carousel, video reels, wholesale MOQ tags, and direct lookbook shopping routes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedDefaults}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DFD5C2] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#6B6357] uppercase tracking-wider transition-all hover:border-[#C59A46] hover:bg-[#FAF8F5] hover:text-[#121214] shadow-2xs"
            title="Restore starter lookbook reels"
          >
            <svg className="h-3.5 w-3.5 text-[#9A6D22]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Restore Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl border border-[#C59A46] bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2 text-xs font-bold text-[#121214] uppercase tracking-wider shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Collection</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <svg className="h-4 w-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-800">
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-800">
            &times;
          </button>
        </div>
      )}

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#EAE3D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A847B]">Total Collections</span>
            <span className="rounded-lg bg-[#FAF3E4] p-1.5 text-[#9A6D22]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#121214]">{stats.total}</p>
          <span className="text-[11px] text-[#6E685E]">Configured cards</span>
        </div>

        <div className="rounded-2xl border border-[#EAE3D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A847B]">Active in Showcase</span>
            <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1F8F5A]">{stats.active}</p>
          <span className="text-[11px] text-[#6E685E]">Visible on Homepage</span>
        </div>

        <div className="rounded-2xl border border-[#EAE3D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A847B]">Video Reels</span>
            <span className="rounded-lg bg-sky-50 p-1.5 text-sky-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-sky-700">{stats.withVideo}</p>
          <span className="text-[11px] text-[#6E685E]">Interactive MP4 media</span>
        </div>

        <div className="rounded-2xl border border-[#EAE3D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A847B]">Inactive Drafts</span>
            <span className="rounded-lg bg-gray-100 p-1.5 text-gray-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-700">{stats.inactive}</p>
          <span className="text-[11px] text-[#6E685E]">Hidden from store</span>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9A9386]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, subtitle, or link..."
              className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] py-2 pl-10 pr-4 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-medium"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center rounded-xl border border-[#E8DEC9] bg-[#FAF8F5] p-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-[#FFFFFF] text-[#121214] shadow-2xs'
                    : 'text-[#6B6357] hover:text-[#121214]'
                }`}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Active')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  statusFilter === 'Active'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-[#6B6357] hover:text-[#121214]'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Inactive')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  statusFilter === 'Inactive'
                    ? 'bg-gray-600 text-white shadow-2xs'
                    : 'text-[#6B6357] hover:text-[#121214]'
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Media Filter */}
            <div className="flex items-center rounded-xl border border-[#E8DEC9] bg-[#FAF8F5] p-1 text-xs">
              <button
                type="button"
                onClick={() => setMediaFilter('ALL')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  mediaFilter === 'ALL'
                    ? 'bg-[#FFFFFF] text-[#121214] shadow-2xs'
                    : 'text-[#6B6357] hover:text-[#121214]'
                }`}
              >
                All Media
              </button>
              <button
                type="button"
                onClick={() => setMediaFilter('VIDEO')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  mediaFilter === 'VIDEO'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-[#6B6357] hover:text-[#121214]'
                }`}
              >
                With Video
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table / Grid Content */}
      <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#7A746B]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
            <p className="mt-3 font-mono text-xs uppercase tracking-wider text-[#8A847B]">
              Loading Featured Collections...
            </p>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF3E4] text-[#9A6D22]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="mt-3 font-serif text-base font-bold text-[#121214]">No Collections Found</h3>
            <p className="mt-1 text-xs text-[#6B6357] max-w-sm">
              {searchQuery || statusFilter !== 'ALL' || mediaFilter !== 'ALL'
                ? 'No collections match your current filter criteria.'
                : 'Get started by creating your first featured lookbook collection or restore default starters.'}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleSeedDefaults}
                className="rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-semibold text-[#121214] hover:bg-[#F2ECE0]"
              >
                Restore 5 Starters
              </button>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="rounded-xl border border-[#C59A46] bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-1.5 text-xs font-bold text-[#121214]"
              >
                Add Collection
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#ECE4D5] bg-[#FAF8F5] text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
                  <th className="py-3 px-4 w-14 text-center">Rank</th>
                  <th className="py-3 px-4 w-20">Media</th>
                  <th className="py-3 px-4">Title &amp; Subtitle</th>
                  <th className="py-3 px-4 w-32">Reel Timing / MOQ</th>
                  <th className="py-3 px-4 w-44">Destination Link</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE0]">
                {filteredCollections.map((col, idx) => {
                  const isWithVideo = Boolean(col.video)
                  return (
                    <tr
                      key={col._id || idx}
                      className="hover:bg-[#FCFBF9] transition-colors"
                    >
                      {/* Order / Index */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF3E4] font-mono text-xs font-bold text-[#9A6D22] border border-[#E8DEC9]">
                          {col.indexNumber || String(col.order || idx + 1).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Poster / Video Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="relative h-14 w-11 rounded-lg overflow-hidden border border-[#E2D8C7] bg-[#121214] shrink-0 shadow-2xs">
                          {col.image ? (
                            <img
                              src={col.image}
                              alt={col.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#242429] text-[9px] font-mono text-[#D9AE6A]">
                              IMG
                            </div>
                          )}

                          {isWithVideo && (
                            <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/75 text-[#FAD79F] backdrop-blur-xs">
                              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                                <polygon points="6 4 20 12 6 20 6 4" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-3.5 px-4">
                        <div className="font-sans font-bold text-[#121214] text-[13px] leading-snug">
                          {col.title}
                        </div>
                        <div className="mt-0.5 text-[#6E685E] text-[11px] line-clamp-1">
                          {col.subtitle || 'No subtitle specified'}
                        </div>
                        {col.mediaPosition && col.mediaPosition !== 'object-center' && (
                          <span className="mt-1 inline-block font-mono text-[9px] text-[#9A6D22] bg-[#FAF3E4] px-1.5 py-0.2 rounded border border-[#E8DEC9]">
                            {col.mediaPosition}
                          </span>
                        )}
                      </td>

                      {/* Timing & MOQ */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-[#121214] font-semibold">
                          <svg className="h-3.5 w-3.5 text-[#9A6D22]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{col.duration || '0:15'}</span>
                        </div>
                        <div className="mt-0.5 inline-block rounded bg-[#FAF8F5] px-1.5 py-0.5 text-[10px] text-[#6E685E] border border-[#EAE3D5]">
                          {col.moq || 'MOQ 20 pcs'}
                        </div>
                      </td>

                      {/* Destination Link */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-[#2E72D2] truncate block max-w-[170px]" title={col.link}>
                          {col.link || '/shop'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(col)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            col.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              col.status === 'Active' ? 'bg-emerald-600' : 'bg-gray-400'
                            }`}
                          />
                          <span>{col.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(col)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DFD5C2] bg-[#FFFFFF] text-[#6B6357] transition-colors hover:border-[#C59A46] hover:bg-[#FAF8F5] hover:text-[#9A6D22]"
                            title="Edit collection"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(col)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-[#FFFFFF] text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-400"
                            title="Delete collection"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Collection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121214]/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 rounded-2xl border border-[#E2D8C7] bg-[#FFFFFF] p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ECE4D5] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF3E4] border border-[#E8DEC9] text-[#9A6D22]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#121214]">
                    {editingCollection ? 'Edit Featured Collection' : 'Add New Featured Collection'}
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#9A6D22]">
                    Homepage 5-Card Reel Showcase
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8A847B] hover:bg-[#FAF8F5] hover:text-[#121214] transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Row 1: Title & Index */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                    Collection Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Oversized Essentials"
                    className="mt-1 w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                    Index Badge
                  </label>
                  <input
                    type="text"
                    value={formData.indexNumber}
                    onChange={(e) => setFormData({ ...formData, indexNumber: e.target.value })}
                    placeholder="e.g. 01"
                    className="mt-1 w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Subtitle */}
              <div>
                <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                  Subtitle / Editorial Blurb
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Volume, comfort and the silhouettes shaping now."
                  className="mt-1 w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-medium"
                />
              </div>

              {/* Row 3: Duration & MOQ & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                    Reel Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 0:14"
                    className="mt-1 w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                    Wholesale MOQ Tag
                  </label>
                  <input
                    type="text"
                    value={formData.moq}
                    onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                    placeholder="e.g. MOQ 20 pcs"
                    className="mt-1 w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Destination Link */}
              <div>
                <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                  Destination Link (URL Route)
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="e.g. /shop?category=tees or /shop"
                    className="flex-1 rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-mono"
                  />
                  {/* Preset Selector */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) setFormData({ ...formData, link: e.target.value })
                    }}
                    defaultValue=""
                    className="rounded-xl border border-[#E8DEC9] bg-[#FAF8F5] px-3 py-2 text-xs text-[#6B6357] font-medium"
                  >
                    <option value="" disabled>
                      Presets...
                    </option>
                    {quickLinkPresets.map((p, i) => (
                      <option key={i} value={p.url}>
                        {p.label} ({p.url})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Media Alignment & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                    Media Focus / Alignment
                  </label>
                  <select
                    value={formData.mediaPosition}
                    onChange={(e) => setFormData({ ...formData, mediaPosition: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-mono"
                  >
                    <option value="object-center">Center (object-center)</option>
                    <option value="object-top">Top (object-top)</option>
                    <option value="object-bottom">Bottom (object-bottom)</option>
                    <option value="object-[50%_20%]">Upper Torso (object-[50%_20%])</option>
                    <option value="object-[50%_18%]">High Neck / Hood (object-[50%_18%])</option>
                    <option value="object-[50%_22%]">Waist &amp; Denim (object-[50%_22%])</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-medium"
                  >
                    <option value="Active">Active (Visible in Showcase)</option>
                    <option value="Inactive">Inactive (Hidden Draft)</option>
                  </select>
                </div>
              </div>

              {/* Media Section: Poster Image & Reel Video */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#EAE3D5] bg-[#FAF8F5] p-3.5">
                {/* Poster Image */}
                <div>
                  <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                    Poster Image (Vertical 3:4)
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative h-20 w-16 rounded-lg overflow-hidden border border-[#D5C9B6] bg-[#121214] shrink-0">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Poster preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-[#A8A196]">
                          No img
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="block w-full text-[11px] text-[#6B6357] file:mr-2 file:rounded-lg file:border-0 file:bg-[#FAF3E4] file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-[#9A6D22] hover:file:bg-[#F2DEB5] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value)
                          setImagePreview(e.target.value)
                          setImageFile(null)
                        }}
                        placeholder="Or paste image URL..."
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FCFBF8] px-2.5 py-1 text-[11px] text-[#121214] focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Reel Video */}
                <div>
                  <label className="block text-[11px] font-bold text-[#121214] uppercase tracking-wider">
                    Video Reel (Optional MP4 / WebM)
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative h-20 w-16 rounded-lg overflow-hidden border border-[#D5C9B6] bg-[#121214] shrink-0 flex items-center justify-center">
                      {videoPreview ? (
                        <video
                          src={videoPreview}
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-[#A8A196]">
                          No vid
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        className="block w-full text-[11px] text-[#6B6357] file:mr-2 file:rounded-lg file:border-0 file:bg-[#FAF3E4] file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-[#9A6D22] hover:file:bg-[#F2DEB5] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => {
                          setVideoUrl(e.target.value)
                          setVideoPreview(e.target.value)
                          setVideoFile(null)
                        }}
                        placeholder="Or paste video URL..."
                        className="w-full rounded-lg border border-[#E8DEC9] bg-[#FCFBF8] px-2.5 py-1 text-[11px] text-[#121214] focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECE4D5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#DFD5C2] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6B6357] hover:bg-[#FAF8F5] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#C59A46] bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm transition-all hover:brightness-105 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#121214] border-t-transparent" />
                      <span>Saving Collection...</span>
                    </>
                  ) : (
                    <span>{editingCollection ? 'Save Changes' : 'Create Collection'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
