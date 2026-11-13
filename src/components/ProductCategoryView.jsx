import { useState, useEffect } from 'react'
import {
  getCategoriesApi,
  createCategoryApi,
  deleteCategoryApi,
  updateCategoryApi,
} from '../api'

export default function ProductCategoryView({ currentUser }) {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active',
  })

  // Edit Mode State
  const [editingCategory, setEditingCategory] = useState(null)

  // Fetch categories from DB
  const fetchCategories = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await getCategoriesApi()
      if (res.success && Array.isArray(res.categories)) {
        setCategories(res.categories)
      } else {
        setCategories([])
      }
    } catch (err) {
      console.warn('API error fetching categories:', err)
      // If DB error, display user-friendly notice
      setErrorMessage(
        err.response?.data?.message ||
          'Failed to load categories. Please check MongoDB connection.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleOpenAddModal = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 'Active',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name || '',
      code: cat.code || '',
      description: cat.description || '',
      status: cat.status || 'Active',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (editingCategory) {
        // Update
        const res = await updateCategoryApi(editingCategory._id, formData)
        if (res.success) {
          setSuccessMessage(`Category "${formData.name}" updated successfully.`)
          setIsModalOpen(false)
          fetchCategories()
        }
      } else {
        // Create
        const res = await createCategoryApi(formData)
        if (res.success) {
          setSuccessMessage(`Category "${formData.name}" created successfully.`)
          setIsModalOpen(false)
          fetchCategories()
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Error processing category request.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      return
    }

    try {
      const res = await deleteCategoryApi(id)
      if (res.success) {
        setSuccessMessage(`Category "${name}" removed.`)
        fetchCategories()
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to remove category.'
      )
    }
  }

  const handleSeedDefaults = async () => {
    setIsSubmitting(true)
    setErrorMessage('')
    const defaultCats = [
      {
        name: 'Supima Cotton Tees',
        code: 'CAT-TEE-01',
        description: '240 GSM Combed interlock heavy jersey t-shirts for bulk retail',
        status: 'Active',
      },
      {
        name: 'Signature Polos & Henleys',
        code: 'CAT-POLO-02',
        description: 'Mercerized pique & mother-of-pearl buttoned luxury essentials',
        status: 'Active',
      },
      {
        name: 'Raw Selvedge Denim',
        code: 'CAT-DNM-03',
        description: '14.5oz shuttle loom Japanese Kurabo selvedge jeans',
        status: 'Active',
      },
      {
        name: 'Loom-Woven Overshirts',
        code: 'CAT-OVS-04',
        description: 'Wool blend and brushed cotton workwear executive shirting',
        status: 'Active',
      },
    ]

    try {
      for (const item of defaultCats) {
        try {
          await createCategoryApi(item)
        } catch {
          // ignore duplicate conflicts
        }
      }
      setSuccessMessage('Standard Atelier categories seeded successfully!')
      fetchCategories()
    } catch (err) {
      setErrorMessage('Could not seed defaults: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      (cat.name && cat.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cat.code && cat.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cat.slug && cat.slug.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus =
      statusFilter === 'ALL' || cat.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAE3D5] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-[10px] tracking-[0.25em] text-[#9A6D22] uppercase font-bold">
              Product Catalog Management
            </span>
            <span className="rounded-full bg-[#FAF3E4] px-2 py-0.5 font-mono text-[9px] font-bold text-[#805915] border border-[#E8D8BA]">
              B2B Taxonomy
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#121214]">
            Product Categories
          </h1>
          <p className="text-xs text-[#7A746B] mt-0.5">
            Organize wholesale styles, apparel classification tiers, and SKU taxonomy.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          {categories.length === 0 && (
            <button
              type="button"
              onClick={handleSeedDefaults}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl border border-[#DFD5C2] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#6B6357] transition-all hover:border-[#C59A46] hover:text-[#9A6D22] shadow-2xs disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>Seed Defaults</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ECC880] via-[#C59A46] to-[#A3772C] px-4 py-2 text-xs font-bold text-[#121214] shadow-sm transition-all hover:opacity-95 hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Category</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="rounded-xl border border-[#CDE5D2] bg-[#F1F9F3] p-3.5 flex items-center justify-between text-xs text-[#1E6B37]">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-[#1E6B37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-[#F2C7C4] bg-[#FDF2F2] p-3.5 flex items-center justify-between text-xs text-[#9B2C24]">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-[#9B2C24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#8A847B]">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
              Total Categories
            </span>
            <div className="h-7 w-7 rounded-lg bg-[#FAF4E8] flex items-center justify-center text-[#9A6D22] border border-[#EADFC9]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#121214]">
            {categories.length}
          </div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">
            Active in Atelier Catalog
          </div>
        </div>

        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#8A847B]">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
              Active Status
            </span>
            <div className="h-7 w-7 rounded-lg bg-[#F1F9F3] flex items-center justify-center text-[#1E824C] border border-[#CDE5D2]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#1E824C]">
            {categories.filter((c) => c.status === 'Active').length}
          </div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">
            Live for Retailer Order Placement
          </div>
        </div>

        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#8A847B]">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
              Archived / Inactive
            </span>
            <div className="h-7 w-7 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#8A847B] border border-[#ECE4D5]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#8A847B]">
            {categories.filter((c) => c.status === 'Inactive').length}
          </div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">
            Hidden from Wholesale Portal
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#ECE4D5] rounded-2xl p-3 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9A9386]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter categories by name, code or slug..."
            className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] py-2 pl-9 pr-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 border-l border-[#ECE4D5] pl-3">
          {['ALL', 'Active', 'Inactive'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-[#FAF3E4] text-[#805915] border border-[#E5D3AF]'
                  : 'text-[#7A746B] hover:text-[#121214] hover:bg-[#FAF8F5]'
              }`}
            >
              {st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-hidden rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#8A847B]">
              Loading Categories from Database...
            </span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF4E8] text-[#9A6D22] border border-[#EADFC9] mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-serif text-base font-bold text-[#121214]">
              {searchQuery ? 'No matching categories found' : 'No product categories yet'}
            </h3>
            <p className="text-xs text-[#7A746B] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search criteria or filter tags.'
                : 'Create your first apparel category or seed default BVB wholesale classifications.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="rounded-xl bg-[#C59A46] px-4 py-2 text-xs font-bold text-[#121214] hover:bg-[#B38734] transition-all"
              >
                + Add Category
              </button>
              {categories.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  className="rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-4 py-2 text-xs font-semibold text-[#6B6357] hover:bg-[#F3EFE8] transition-all"
                >
                  Seed Standard Defaults
                </button>
              )}
            </div>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[10px] uppercase tracking-wider text-[#8A847B]">
                <th className="py-3 px-4 font-semibold">Category Code</th>
                <th className="py-3 px-4 font-semibold">Category Name</th>
                <th className="py-3 px-4 font-semibold">Slug Identifier</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE1]">
              {filteredCategories.map((cat) => (
                <tr key={cat._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                  {/* Code */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] font-bold text-[#9A6D22] bg-[#FAF3E4] px-2 py-0.5 rounded border border-[#E9DCBF]">
                      {cat.code || 'CAT-GEN'}
                    </span>
                  </td>

                  {/* Name & Description */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#121214] text-xs">
                      {cat.name}
                    </div>
                    {cat.description && (
                      <div className="text-[11px] text-[#8A847B] line-clamp-1 mt-0.5">
                        {cat.description}
                      </div>
                    )}
                  </td>

                  {/* Slug */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#7A746B]">
                    /{cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-')}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        cat.status === 'Active'
                          ? 'bg-[#F1F9F3] text-[#1E824C] border border-[#CDE5D2]'
                          : 'bg-[#F5F2ED] text-[#8A847B] border border-[#E2DBD0]'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          cat.status === 'Active' ? 'bg-[#1E824C]' : 'bg-[#9A9386]'
                        }`}
                      />
                      {cat.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#8A847B]">
                    {cat.createdAt
                      ? new Date(cat.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(cat)}
                        className="rounded-lg p-1.5 text-[#7A746B] hover:text-[#9A6D22] hover:bg-[#FAF3E4] transition-colors"
                        title="Edit category"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat._id, cat.name)}
                        className="rounded-lg p-1.5 text-[#7A746B] hover:text-[#B92D25] hover:bg-[#FDF2F2] transition-colors"
                        title="Delete category"
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

      {/* Modal: Create or Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121214]/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2D8C7] bg-[#FFFFFF] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE3D5] pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4E8] text-[#9A6D22] border border-[#E5D7B7]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#121214]">
                    {editingCategory ? 'Edit Category' : 'Create Product Category'}
                  </h3>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-[#9A6D22]">
                    BVB Wholesale Catalog Definition
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[#8A847B] hover:bg-[#F5EFE8] hover:text-[#121214] transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Category Name */}
              <div>
                <label className="block font-semibold text-[#121214] mb-1">
                  Category Name <span className="text-[#B92D25]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Signature Polos & Henleys"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block font-semibold text-[#121214] mb-1">
                  Category Code / Prefix (Optional)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CAT-POLO-01 (Auto-generated if empty)"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 font-mono text-xs uppercase text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold text-[#121214] mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                >
                  <option value="Active">Active (Visible in Retail Order Catalog)</option>
                  <option value="Inactive">Inactive (Draft / Archived)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-[#121214] mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Apparel fabric, GSM specs, or collection classification details..."
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-4 py-2 text-xs font-semibold text-[#6B6357] hover:bg-[#F3EFE8] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2 text-xs font-bold text-[#121214] shadow-sm hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#121214] border-t-transparent" />
                  )}
                  <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

