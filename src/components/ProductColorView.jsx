import { useState, useEffect, useMemo } from 'react'
import {
  getColorsApi,
  createColorApi,
  updateColorApi,
  deleteColorApi,
  toggleColorStatusApi,
} from '../api'

function ProductColorView({ currentUser }) {
  const [colors, setColors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingColor, setEditingColor] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    hexCode: '#121214',
    code: '',
    sortOrder: 0,
    description: '',
    status: 'Active',
  })

  // Fetch colors from DB
  const fetchColors = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await getColorsApi()
      if (res.success && Array.isArray(res.colors)) {
        setColors(res.colors)
      } else {
        setColors([])
      }
    } catch (err) {
      console.warn('API error fetching colors:', err)
      setErrorMessage(
        err.response?.data?.message || 'Failed to load color palette from database.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchColors()
  }, [])

  // Auto-clear notification messages
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(''), 3500)
      return () => clearTimeout(t)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(''), 5000)
      return () => clearTimeout(t)
    }
  }, [errorMessage])

  const handleOpenAddModal = () => {
    setEditingColor(null)
    const nextOrder = colors.length > 0 ? Math.max(...colors.map((c) => c.sortOrder || 0)) + 1 : 1
    setFormData({
      name: '',
      hexCode: '#121214',
      code: '',
      sortOrder: nextOrder,
      description: '',
      status: 'Active',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingColor(item)
    setFormData({
      name: item.name || '',
      hexCode: item.hexCode || item.hex || '#121214',
      code: item.code || '',
      sortOrder: item.sortOrder !== undefined ? item.sortOrder : 0,
      description: item.description || '',
      status: item.status || 'Active',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setErrorMessage('Please enter a color name.')
      return
    }

    if (!formData.hexCode.trim()) {
      setErrorMessage('Please enter or select a HEX code.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    let cleanHex = formData.hexCode.trim().toUpperCase()
    if (!cleanHex.startsWith('#')) {
      cleanHex = `#${cleanHex}`
    }

    const payload = {
      name: formData.name.trim(),
      hexCode: cleanHex,
      code: formData.code.trim() ? formData.code.trim().toUpperCase() : undefined,
      sortOrder: Number(formData.sortOrder) || 0,
      description: formData.description.trim(),
      status: formData.status === 'Inactive' ? 'Inactive' : 'Active',
    }

    try {
      if (editingColor) {
        const res = await updateColorApi(editingColor._id, payload)
        if (res.success) {
          setSuccessMessage(`Color "${formData.name}" updated successfully.`)
          setIsModalOpen(false)
          fetchColors()
        }
      } else {
        const res = await createColorApi(payload)
        if (res.success) {
          setSuccessMessage(`Color "${formData.name}" added successfully.`)
          setIsModalOpen(false)
          fetchColors()
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Error processing color record.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete color "${name}"?`)) {
      return
    }

    try {
      const res = await deleteColorApi(id)
      if (res.success) {
        setSuccessMessage(`Color "${name}" removed.`)
        fetchColors()
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to remove color.')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      const res = await toggleColorStatusApi(id)
      if (res.success) {
        setSuccessMessage(res.message || 'Color status updated.')
        fetchColors()
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update color status.')
    }
  }

  // Filtered colors list
  const filteredColors = useMemo(() => {
    return colors.filter((c) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.hexCode && c.hexCode.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [colors, searchQuery, statusFilter])

  // Metrics
  const activeCount = colors.filter((c) => c.status === 'Active').length
  const inactiveCount = colors.filter((c) => c.status === 'Inactive').length

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAE3D5] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-[10px] tracking-[0.25em] text-[#9A6D22] uppercase font-bold">
              B2B Colorways & Dyes
            </span>
            <span className="rounded-full bg-[#FAF3E4] px-2 py-0.5 font-mono text-[9px] font-bold text-[#805915] border border-[#E8D8BA]">
              Atelier Standard
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#121214]">
            Product Colours
          </h1>
          <p className="text-xs text-[#7A746B] mt-0.5">
            Manage curated wholesale color palette, HEX colorways, and swatch codes.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2.5 text-xs font-bold text-[#121214] shadow-sm transition-all hover:brightness-105 active:scale-[0.99] cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Colorway</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7A746B]">Total Swatches</span>
            <span className="rounded-lg bg-[#FAF8F5] p-2 text-[#9A6D22]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#121214]">
            {colors.length}
          </div>
          <p className="mt-0.5 text-[11px] text-[#A8A196]">Direct DB Swatches</p>
        </div>

        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7A746B]">Active in Catalog</span>
            <span className="rounded-lg bg-[#F1F9F3] p-2 text-[#1E824C]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#1E824C]">
            {activeCount}
          </div>
          <p className="mt-0.5 text-[11px] text-[#A8A196]">Visible on Shop Filters</p>
        </div>

        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7A746B]">Inactive / Draft</span>
            <span className="rounded-lg bg-[#FAF8F5] p-2 text-[#8A847B]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#7A746B]">
            {inactiveCount}
          </div>
          <p className="mt-0.5 text-[11px] text-[#A8A196]">Hidden from Retail Front</p>
        </div>
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#CDE5D2] bg-[#F1F9F3] p-3 text-xs text-[#1E824C] animate-in fade-in duration-200">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#F5C6CB] bg-[#FDF2F2] p-3 text-xs text-[#B92D25] animate-in fade-in duration-200">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-3 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9A9386]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search colors (e.g. Black, Sand, #1C1D1F)..."
            className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] py-2 pl-9 pr-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          {['ALL', 'Active', 'Inactive'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#FAF3E4] text-[#805915] border border-[#E5D3AF]'
                  : 'text-[#7A746B] hover:text-[#121214] hover:bg-[#FAF8F5]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Colors Table */}
      <div className="overflow-hidden rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#8A847B]">
              Loading Colorways Database...
            </span>
          </div>
        ) : filteredColors.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF4E8] text-[#9A6D22] mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="font-serif text-sm font-bold text-[#121214]">No Colors Found</h3>
            <p className="text-xs text-[#7A746B] mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No colors match your active search filters.'
                : 'No colorways exist in the database yet. Click "Add Colorway" above to create your first palette swatch.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[10.5px] uppercase tracking-wider text-[#8A847B]">
                  <th className="py-3 px-4 font-bold">Swatch</th>
                  <th className="py-3 px-4 font-bold">Colorway Name</th>
                  <th className="py-3 px-4 font-bold">HEX Code</th>
                  <th className="py-3 px-4 font-bold">Color Code</th>
                  <th className="py-3 px-4 font-bold">Priority</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE0]">
                {filteredColors.map((item) => {
                  const hex = item.hexCode || item.hex || '#121214'
                  return (
                    <tr
                      key={item._id}
                      className="group transition-colors hover:bg-[#FCFBF8]"
                    >
                      {/* Swatch Circle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="inline-block h-6 w-6 rounded-full border border-[#121214]/25 shadow-xs"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        </div>
                      </td>

                      {/* Name & Description */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#121214]">
                            {item.name}
                          </span>
                          {item.description && (
                            <span className="text-[11px] text-[#7A746B] hidden md:inline">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* HEX Code */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E8DEC9] bg-[#FAF8F5] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#121214]">
                          <span
                            className="h-2 w-2 rounded-full border border-black/20"
                            style={{ backgroundColor: hex }}
                          />
                          {hex}
                        </span>
                      </td>

                      {/* Color Code */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#9A6D22] font-semibold">
                        {item.code || `CLR-${item.name.substring(0, 3).toUpperCase()}`}
                      </td>

                      {/* Sort Order */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#7A746B]">
                        {item.sortOrder || 0}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                            item.status === 'Active'
                              ? 'bg-[#F1F9F3] text-[#1E824C] border border-[#CDE5D2]'
                              : 'bg-[#F5F2ED] text-[#8A847B] border border-[#E2DBD0]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status === 'Active' ? 'bg-[#1E824C]' : 'bg-[#8A847B]'
                            }`}
                          />
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item._id)}
                            title={item.status === 'Active' ? 'Deactivate' : 'Activate'}
                            className="p-1 text-[#8A847B] hover:text-[#121214] rounded-md hover:bg-[#F2ECE0] transition-colors cursor-pointer"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Color"
                            className="p-1 text-[#8A847B] hover:text-[#9A6D22] rounded-md hover:bg-[#FAF3E4] transition-colors cursor-pointer"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item._id, item.name)}
                            title="Delete Color"
                            className="p-1 text-[#8A847B] hover:text-[#B92D25] rounded-md hover:bg-[#FDF2F2] transition-colors cursor-pointer"
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

      {/* Add / Edit Color Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121214]/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[#DFD5C2] bg-white p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ECE4D5] pb-3">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#9A6D22] font-bold">
                  {editingColor ? 'Modify Colorway' : 'New Colorway'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#121214]">
                  {editingColor ? `Edit "${editingColor.name}"` : 'Add Product Color'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-lg text-[#8A847B] hover:bg-[#FAF8F5] hover:text-[#121214] flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Row 1: Name and Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#121214] mb-1">
                    Colorway Name <span className="text-[#B92D25]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Obsidian Black, Sage Green"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#121214] mb-1">
                    Color Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. CLR-BLK, CLR-SAGE"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 font-mono text-xs uppercase text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: HEX Code & Native Color Picker with Live Swatch Preview */}
              <div className="rounded-xl border border-[#E8DEC9] bg-[#FAF8F5]/80 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase font-bold text-[#805915]">
                    HEX Color Code & Swatch <span className="text-[#B92D25]">*</span>
                  </label>
                  <span className="text-[10px] text-[#8A847B]">Live Preview</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Native Color Picker input */}
                  <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-xl border border-[#DFD5C2] shadow-2xs cursor-pointer">
                    <input
                      type="color"
                      value={formData.hexCode.startsWith('#') && formData.hexCode.length === 7 ? formData.hexCode : '#121214'}
                      onChange={(e) => setFormData({ ...formData, hexCode: e.target.value.toUpperCase() })}
                      className="absolute -top-2 -left-2 h-14 w-16 cursor-pointer border-0 bg-transparent"
                      title="Click to pick color visually"
                    />
                  </div>

                  {/* Manual HEX text input */}
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-mono text-xs text-[#8A847B]">
                      #
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.hexCode.replace(/^#/, '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)
                        setFormData({ ...formData, hexCode: `#${val.toUpperCase()}` })
                      }}
                      placeholder="1C1D1F"
                      className="w-full rounded-xl border border-[#E8DEC9] bg-white py-2 pl-7 pr-3 font-mono text-xs text-[#121214] uppercase focus:border-[#C59A46] focus:outline-none"
                    />
                  </div>

                  {/* Live Swatch Preview Pill */}
                  <div className="flex items-center gap-2 rounded-xl border border-[#DFD5C2] bg-white px-3 py-2 shrink-0">
                    <span
                      className="h-5 w-5 rounded-full border border-black/25 shadow-xs"
                      style={{ backgroundColor: formData.hexCode || '#121214' }}
                    />
                    <span className="font-mono text-xs font-bold text-[#121214]">
                      {formData.hexCode || '#121214'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Sort Order and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#121214] mb-1">
                    Sort Priority (Lower = First)
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    placeholder="e.g. 1, 2, 3"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 font-mono text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#121214] mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  >
                    <option value="Active">Active (Available for B2B Retail Orders)</option>
                    <option value="Inactive">Inactive (Draft / Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Description */}
              <div>
                <label className="block font-semibold text-[#121214] mb-1">
                  Description / Dye Details (Optional)
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Reactive cold garment-dye with vintage patina"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ECE4D5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-[#DFD5C2] px-4 py-2 text-xs font-semibold text-[#6B6357] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-5 py-2 text-xs font-bold text-[#121214] shadow-sm hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingColor ? 'Update Color' : 'Add Color'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductColorView

