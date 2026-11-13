import { useState, useEffect } from 'react'
import {
  getProductTypesApi,
  createProductTypeApi,
  updateProductTypeApi,
  deleteProductTypeApi,
} from '../api'

function ProductTypeView({ currentUser }) {
  const [productTypes, setProductTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingType, setEditingType] = useState(null)

  // 4 Required Form Fields: Name, Code, Description, Status
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active',
  })

  // Fetch product types from DB
  const fetchProductTypes = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await getProductTypesApi()
      if (res && res.success && Array.isArray(res.productTypes)) {
        setProductTypes(res.productTypes)
      } else {
        setProductTypes([])
      }
    } catch (err) {
      console.warn('API error fetching product types:', err)
      setErrorMessage(
        err.response?.data?.message || 'Failed to load product types from server.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProductTypes()
  }, [])

  const handleOpenAddModal = () => {
    setEditingType(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 'Active',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingType(item)
    setFormData({
      name: item.name || '',
      code: item.code || '',
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
      description: formData.description.trim(),
      status: formData.status === 'Inactive' ? 'Inactive' : 'Active',
    }

    try {
      if (editingType) {
        // Update
        const res = await updateProductTypeApi(editingType._id, payload)
        if (res.success) {
          setSuccessMessage(`Product type "${formData.name}" updated successfully.`)
          setIsModalOpen(false)
          fetchProductTypes()
        }
      } else {
        // Create
        const res = await createProductTypeApi(payload)
        if (res.success) {
          setSuccessMessage(`Product type "${formData.name}" created successfully.`)
          setIsModalOpen(false)
          fetchProductTypes()
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Error processing product type request.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove product type "${name}"?`)) {
      return
    }

    try {
      const res = await deleteProductTypeApi(id)
      if (res.success) {
        setSuccessMessage(`Product type "${name}" removed.`)
        fetchProductTypes()
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to remove product type.'
      )
    }
  }

  // Filtered product types
  const filteredTypes = productTypes.filter((item) => {
    const matchesSearch =
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAE3D5] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-[10px] tracking-[0.25em] text-[#9A6D22] uppercase font-bold">
              Product Management
            </span>
            <span className="rounded-full bg-[#FAF3E4] px-2 py-0.5 font-mono text-[9px] font-bold text-[#805915] border border-[#E8D8BA]">
              Type Catalog
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#121214]">
            Product Types
          </h1>
          <p className="text-xs text-[#7A746B] mt-0.5">
            Define and manage product types by name, code, description, and status.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ECC880] via-[#C59A46] to-[#A3772C] px-4 py-2 text-xs font-bold text-[#121214] shadow-sm transition-all hover:opacity-95 hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Product Type</span>
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
              Total Types
            </span>
            <div className="h-7 w-7 rounded-lg bg-[#FAF4E8] flex items-center justify-center text-[#9A6D22] border border-[#EADFC9]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#121214]">
            {productTypes.length}
          </div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">
            Registered Product Types
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
            {productTypes.filter((t) => t.status === 'Active').length}
          </div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">
            Available For Catalog Use
          </div>
        </div>

        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#8A847B]">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
              Inactive Status
            </span>
            <div className="h-7 w-7 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#8A847B] border border-[#ECE4D5]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
          <div className="mt-2 text-2xl font-serif font-bold text-[#8A847B]">
            {productTypes.filter((t) => t.status === 'Inactive').length}
          </div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">
            Drafted or Archived Types
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
            placeholder="Search by product type name, code or description..."
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

      {/* Product Types Table */}
      <div className="overflow-hidden rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#8A847B]">
              Loading Product Types from Database...
            </span>
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF4E8] text-[#9A6D22] border border-[#EADFC9] mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-serif text-base font-bold text-[#121214]">
              {searchQuery ? 'No matching product types found' : 'No product types added yet'}
            </h3>
            <p className="text-xs text-[#7A746B] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search query or status filter.'
                : 'Define your first product type with name, code, description, and status.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="rounded-xl bg-[#C59A46] px-4 py-2 text-xs font-bold text-[#121214] hover:bg-[#B38734] transition-all"
              >
                + Add Product Type
              </button>
            </div>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[10px] uppercase tracking-wider text-[#8A847B]">
                <th className="py-3 px-4 font-semibold">Code</th>
                <th className="py-3 px-4 font-semibold">Product Type Name</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE1]">
              {filteredTypes.map((type) => (
                <tr key={type._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                  {/* Code */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] font-bold text-[#9A6D22] bg-[#FAF3E4] px-2 py-0.5 rounded border border-[#E9DCBF]">
                      {type.code || 'TYPE-GEN'}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="py-3.5 px-4 font-semibold text-[#121214] text-xs">
                    {type.name}
                  </td>

                  {/* Description */}
                  <td className="py-3.5 px-4 text-[#7A746B] text-[11px] max-w-md">
                    {type.description || <span className="text-[#A8A196] italic">No description provided</span>}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        type.status === 'Active'
                          ? 'bg-[#F1F9F3] text-[#1E824C] border border-[#CDE5D2]'
                          : 'bg-[#F5F2ED] text-[#8A847B] border border-[#E2DBD0]'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          type.status === 'Active' ? 'bg-[#1E824C]' : 'bg-[#9A9386]'
                        }`}
                      />
                      {type.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(type)}
                        className="rounded-lg p-1.5 text-[#7A746B] hover:text-[#9A6D22] hover:bg-[#FAF3E4] transition-colors"
                        title="Edit product type"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(type._id, type.name)}
                        className="rounded-lg p-1.5 text-[#7A746B] hover:text-[#B92D25] hover:bg-[#FDF2F2] transition-colors"
                        title="Delete product type"
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

      {/* Modal: Add or Edit Product Type */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121214]/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E2D8C7] bg-[#FFFFFF] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE3D5] pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4E8] text-[#9A6D22] border border-[#E5D7B7]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#121214]">
                    {editingType ? 'Edit Product Type' : 'Add Product Type'}
                  </h3>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-[#9A6D22]">
                    Product Type Definition
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

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* 1. Product Type Name */}
              <div>
                <label className="block font-semibold text-[#121214] mb-1">
                  Product Type Name <span className="text-[#B92D25]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Oversized Tee, Hoodie, Relaxed Pant"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              {/* 2. Code */}
              <div>
                <label className="block font-semibold text-[#121214] mb-1">
                  Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. TYPE-TEE-01 (Auto-generated if empty)"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 font-mono text-xs uppercase text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              {/* 3. Status (Active / Inactive) */}
              <div>
                <label className="block font-semibold text-[#121214] mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* 4. Description */}
              <div>
                <label className="block font-semibold text-[#121214] mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter details or notes for this product type..."
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
                  <span>{editingType ? 'Update Product Type' : 'Save Product Type'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductTypeView
export { ProductTypeView }
