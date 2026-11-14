import { useState, useEffect, useMemo } from 'react'
import {
  getSizesApi,
  createSizeApi,
  updateSizeApi,
  deleteSizeApi,
  getCategoriesApi,
  getProductTypesApi,
} from '../api'

function ProductSizeView({ currentUser }) {
  const [sizes, setSizes] = useState([])
  const [categories, setCategories] = useState([])
  const [productTypes, setProductTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [systemFilter, setSystemFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingSize, setEditingSize] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    system: 'Alpha',
    category: '',
    categoryType: 'General',
    chest: '',
    waist: '',
    length: '',
    sortOrder: 0,
    description: '',
    status: 'Active',
  })

  // Fetch sizes, categories, and types from DB
  const fetchInitialData = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const [sizeRes, catRes, typeRes] = await Promise.allSettled([
        getSizesApi(),
        getCategoriesApi(),
        getProductTypesApi(),
      ])

      if (sizeRes.status === 'fulfilled' && sizeRes.value?.success && Array.isArray(sizeRes.value.sizes)) {
        setSizes(sizeRes.value.sizes)
      } else {
        setSizes([])
      }

      if (catRes.status === 'fulfilled' && catRes.value?.success && Array.isArray(catRes.value.categories)) {
        setCategories(catRes.value.categories.filter((c) => c.status !== 'Inactive'))
      }

      if (typeRes.status === 'fulfilled' && typeRes.value?.success && Array.isArray(typeRes.value.productTypes)) {
        setProductTypes(typeRes.value.productTypes.filter((pt) => pt.status !== 'Inactive'))
      }
    } catch (err) {
      console.warn('API error fetching initial data:', err)
      setErrorMessage(
        err.response?.data?.message || 'Failed to load data from database.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
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
    setEditingSize(null)
    const nextOrder = sizes.length > 0 ? Math.max(...sizes.map((s) => s.sortOrder || 0)) + 1 : 1
    setFormData({
      name: '',
      code: '',
      system: 'Alpha',
      category: '',
      categoryType: 'General',
      chest: '',
      waist: '',
      length: '',
      sortOrder: nextOrder,
      description: '',
      status: 'Active',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingSize(item)
    const catId = item.category?._id || (typeof item.category === 'string' ? item.category : '')
    const catName = item.category?.name || item.categoryType || 'General'

    setFormData({
      name: item.name || '',
      code: item.code || '',
      system: item.system || 'Alpha',
      category: catId,
      categoryType: catName,
      chest: item.chest || '',
      waist: item.waist || '',
      length: item.length || '',
      sortOrder: item.sortOrder !== undefined ? item.sortOrder : 0,
      description: item.description || '',
      status: item.status || 'Active',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim() ? formData.code.trim().toUpperCase() : undefined,
      system: formData.system,
      category: formData.category || undefined,
      categoryType: formData.categoryType || 'General',
      chest: formData.chest.trim(),
      waist: formData.waist.trim(),
      length: formData.length.trim(),
      sortOrder: Number(formData.sortOrder) || 0,
      description: formData.description.trim(),
      status: formData.status === 'Inactive' ? 'Inactive' : 'Active',
    }

    try {
      if (editingSize) {
        const res = await updateSizeApi(editingSize._id, payload)
        if (res.success) {
          setSuccessMessage(`Size "${formData.name}" updated successfully.`)
          setIsModalOpen(false)
          fetchInitialData()
        }
      } else {
        const res = await createSizeApi(payload)
        if (res.success) {
          setSuccessMessage(`Size "${formData.name}" added successfully.`)
          setIsModalOpen(false)
          fetchInitialData()
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Error processing size record.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove size "${name}"?`)) {
      return
    }

    try {
      const res = await deleteSizeApi(id)
      if (res.success) {
        setSuccessMessage(`Size "${name}" removed.`)
        fetchInitialData()
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to remove size.')
    }
  }

  // Filtered sizes list
  const filteredSizes = useMemo(() => {
    return sizes.filter((s) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.categoryType && s.categoryType.toLowerCase().includes(q)) ||
        (s.category?.name && s.category.name.toLowerCase().includes(q))

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter
      const matchesSystem = systemFilter === 'ALL' || s.system === systemFilter
      const matchesCategory =
        categoryFilter === 'ALL' ||
        s.categoryType === categoryFilter ||
        s.category?.name === categoryFilter ||
        s.category?._id === categoryFilter ||
        s.category === categoryFilter

      return matchesSearch && matchesStatus && matchesSystem && matchesCategory
    })
  }, [sizes, searchQuery, statusFilter, systemFilter, categoryFilter])

  // Metrics
  const alphaCount = sizes.filter((s) => s.system === 'Alpha').length
  const numericCount = sizes.filter((s) => s.system === 'Numeric').length
  const activeCount = sizes.filter((s) => s.status === 'Active').length

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAE3D5] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-[10px] tracking-[0.25em] text-[#9A6D22] uppercase font-bold">
              B2B Sizing Taxonomy
            </span>
            <span className="rounded-full bg-[#FAF3E4] px-2 py-0.5 font-mono text-[9px] font-bold text-[#805915] border border-[#E8D8BA]">
              Atelier Standard
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#121214]">
            Product Sizes
          </h1>
          <p className="text-xs text-[#7A746B] mt-0.5">
            Manage wholesale sizing matrices for tops (XS–3XL) and bottomwear waist lines (28–38).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2.5 text-xs font-bold text-[#121214] shadow-sm transition-all hover:brightness-105 active:scale-[0.99] cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Size</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#8A847B]">Total Sizes</div>
          <div className="mt-1 font-serif text-2xl font-bold text-[#121214]">{sizes.length}</div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">Configured in DB</div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#9A6D22]">Alpha Sizing</div>
          <div className="mt-1 font-serif text-2xl font-bold text-[#9A6D22]">{alphaCount}</div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">XS to 3XL Tops/Knit</div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#7A5220]">Numeric / Waist</div>
          <div className="mt-1 font-serif text-2xl font-bold text-[#7A5220]">{numericCount}</div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">28 to 38 Inseam/Waist</div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#1E824C]">Active in Catalog</div>
          <div className="mt-1 font-serif text-2xl font-bold text-[#1E824C]">{activeCount}</div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">Live for B2B Retail Orders</div>
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
            placeholder="Search sizes (e.g. M, 32, XL)..."
            className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] py-2 pl-9 pr-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* System Filter */}
          <div className="flex items-center gap-1">
            {['ALL', 'Alpha', 'Numeric', 'FreeSize'].map((sys) => (
              <button
                key={sys}
                type="button"
                onClick={() => setSystemFilter(sys)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  systemFilter === sys
                    ? 'bg-[#121214] text-[#FAF5EB] shadow-2xs'
                    : 'text-[#7A746B] hover:text-[#121214] hover:bg-[#FAF8F5]'
                }`}
              >
                {sys === 'ALL' ? 'All Systems' : sys}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-[#EAE3D5] mx-1" />

          {/* Category Filter */}
          <div className="flex items-center">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[#E8DEC9] bg-[#FCFBF8] px-2.5 py-1.5 text-xs font-semibold text-[#7A746B] focus:border-[#C59A46] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-[1px] bg-[#EAE3D5] mx-1" />

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
      </div>

      {/* Sizes Table */}
      <div className="overflow-hidden rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#8A847B]">
              Loading Sizing Database...
            </span>
          </div>
        ) : filteredSizes.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF4E8] text-[#9A6D22] border border-[#EADFC9] mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-serif text-base font-bold text-[#121214]">
              {searchQuery ? 'No matching sizes found' : 'No product sizes configured'}
            </h3>
            <p className="text-xs text-[#7A746B] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search query or filter tags.'
                : 'Click "Seed Standard Sizes" to immediately populate XS-3XL and 28-38 waist sizes, or add a custom size.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleSeedDefaults}
                className="rounded-xl bg-[#C59A46] px-4 py-2 text-xs font-bold text-[#121214] hover:bg-[#B38734] transition-all cursor-pointer"
              >
                Seed Standard Sizes (1-Click)
              </button>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-4 py-2 text-xs font-semibold text-[#6B6357] hover:bg-[#F3EFE8] transition-all cursor-pointer"
              >
                + Add Custom Size
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[10px] uppercase tracking-wider text-[#8A847B]">
                <th className="py-3 px-4 font-semibold w-16">Sort</th>
                <th className="py-3 px-4 font-semibold">Size Label</th>
                <th className="py-3 px-4 font-semibold">Size Code</th>
                <th className="py-3 px-4 font-semibold">System</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Measurements / Specs</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE1]">
              {filteredSizes.map((item) => (
                <tr key={item._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                  {/* Sort Order */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#8A847B]">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-[#FAF4E8] text-[#805915] font-bold border border-[#E8DEC9]">
                      {item.sortOrder}
                    </span>
                  </td>

                  {/* Size Label / Value */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-1 rounded-lg bg-[#121214] text-[#FAF5EB] font-mono font-bold text-xs shadow-xs">
                        {item.name}
                      </span>
                      {item.description && (
                        <span className="text-[11px] text-[#7A746B] hidden md:inline">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Size Code */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#9A6D22] font-semibold">
                    {item.code || `SZ-${item.name}`}
                  </td>

                  {/* System */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        item.system === 'Alpha'
                          ? 'bg-[#FAF3E4] text-[#805915] border border-[#E5D3AF]'
                          : item.system === 'Numeric'
                            ? 'bg-[#EBF3FB] text-[#1E5D88] border border-[#C5DCF0]'
                            : 'bg-[#F2ECE0] text-[#635E56] border border-[#DDD4C3]'
                      }`}
                    >
                      {item.system}
                    </span>
                  </td>

                  {/* Category Type */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#635E56]">
                    {item.category?.name ? (
                      <span className="inline-flex items-center gap-1 rounded bg-[#FAF5EB] px-2 py-0.5 font-sans font-semibold text-[#805915] border border-[#EFE3C8]">
                        {item.category.name}
                      </span>
                    ) : (
                      item.categoryType || 'General'
                    )}
                  </td>

                  {/* Measurements */}
                  <td className="py-3.5 px-4 text-[11px] text-[#55514B]">
                    {item.chest && <span className="mr-2">Chest: {item.chest}</span>}
                    {item.waist && <span className="mr-2">Waist: {item.waist}</span>}
                    {item.length && <span>Len: {item.length}</span>}
                    {!item.chest && !item.waist && !item.length && (
                      <span className="text-[#A8A196] font-mono">—</span>
                    )}
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
                          item.status === 'Active' ? 'bg-[#1E824C]' : 'bg-[#9A9386]'
                        }`}
                      />
                      {item.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="rounded-lg p-1.5 text-[#7A746B] hover:text-[#9A6D22] hover:bg-[#FAF3E4] transition-colors cursor-pointer"
                        title="Edit size"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id, item.name)}
                        className="rounded-lg p-1.5 text-[#7A746B] hover:text-[#B92D25] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                        title="Delete size"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create or Edit Size */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121214]/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E2D8C7] bg-[#FFFFFF] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EAE3D5] px-6 py-4 bg-[#FAF8F5]/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF4E8] text-[#9A6D22] border border-[#E5D7B7]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#121214]">
                    {editingSize ? 'Edit Product Size' : 'Create Product Size'}
                  </h3>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-[#9A6D22] font-semibold">
                    Wholesale Sizing Architecture
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8A847B] hover:bg-[#F5EFE8] hover:text-[#121214] transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Row 1: Name and Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#121214] mb-1">
                    Size Value / Name <span className="text-[#B92D25]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. M, XL, 32, Free Size"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#121214] mb-1">
                    Size Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Auto-generated: SZ-M"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 font-mono text-xs uppercase text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: System and Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#121214] mb-1">
                    Sizing System
                  </label>
                  <select
                    value={formData.system}
                    onChange={(e) => setFormData({ ...formData, system: e.target.value })}
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  >
                    <option value="Alpha">Alpha (XS, S, M, L, XL, XXL, 3XL)</option>
                    <option value="Numeric">Numeric / Waist (28, 30, 32, 34, 36...)</option>
                    <option value="FreeSize">Free Size / Universal</option>
                    <option value="Custom">Custom / Specialty</option>
                  </select>
                </div>

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
              </div>

              {/* Row 3: Optional Measurements */}
              <div className="rounded-xl border border-[#E8DEC9] bg-[#FAF8F5]/80 p-3.5 space-y-2.5">
                <div className="font-mono text-[10px] uppercase font-bold text-[#805915]">
                  Standard Apparel Measurements (Optional)
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-[#7A746B] mb-0.5">Chest</label>
                    <input
                      type="text"
                      value={formData.chest}
                      onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                      placeholder="e.g. 38-40 in"
                      className="w-full rounded-lg border border-[#E2D8C7] bg-white p-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#7A746B] mb-0.5">Waist</label>
                    <input
                      type="text"
                      value={formData.waist}
                      onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                      placeholder="e.g. 32 in"
                      className="w-full rounded-lg border border-[#E2D8C7] bg-white p-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#7A746B] mb-0.5">Length</label>
                    <input
                      type="text"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      placeholder="e.g. 30 in"
                      className="w-full rounded-lg border border-[#E2D8C7] bg-white p-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#121214] mb-1">
                    Apparel Category (From DB)
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (!val) {
                        setFormData({ ...formData, category: '', categoryType: '' })
                      } else {
                        const matchedCat = categories.find((c) => c._id === val || c.name === val)
                        if (matchedCat) {
                          setFormData({
                            ...formData,
                            category: matchedCat._id,
                            categoryType: matchedCat.name,
                          })
                        } else {
                          setFormData({ ...formData, category: '', categoryType: val })
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  >
                    <option value="">None / General</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name} {cat.productType?.name ? `(${cat.productType.name})` : ''}
                      </option>
                    ))}
                  </select>
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

              {/* Description */}
              <div>
                <label className="block font-semibold text-[#121214] mb-1">
                  Description / Specification Notes
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Recommended for oversized boxy drop-shoulder cut..."
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-[#ECE4D5] flex items-center justify-end gap-2.5 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-4 py-2 text-xs font-semibold text-[#6B6357] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#C59A46] px-5 py-2 text-xs font-bold text-[#121214] hover:bg-[#B38734] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : editingSize ? 'Update Size' : 'Create Size'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductSizeView

