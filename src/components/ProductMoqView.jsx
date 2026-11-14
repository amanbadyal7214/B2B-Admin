import { useState, useEffect, useMemo } from 'react'
import {
  getMoqsApi,
  createMoqApi,
  updateMoqApi,
  deleteMoqApi,
  toggleMoqStatusApi,
} from '../api'

function ProductMoqView({ currentUser }) {
  const [moqs, setMoqs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMoq, setEditingMoq] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    hint: '',
    minQuantity: 1,
    code: '',
    description: '',
    sortOrder: 0,
    status: 'Active',
  })

  // Fetch MOQ types from DB
  const fetchMoqs = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await getMoqsApi()
      if (res.success && Array.isArray(res.moqs)) {
        setMoqs(res.moqs)
      } else {
        setMoqs([])
      }
    } catch (err) {
      console.warn('API error fetching MOQ types:', err)
      setErrorMessage(
        err.response?.data?.message || 'Failed to load MOQ & pack types from database.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMoqs()
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
    setEditingMoq(null)
    const nextOrder = moqs.length > 0 ? Math.max(...moqs.map((m) => m.sortOrder || 0)) + 1 : 1
    setFormData({
      name: '',
      hint: '',
      minQuantity: 10,
      code: '',
      description: '',
      sortOrder: nextOrder,
      status: 'Active',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingMoq(item)
    setFormData({
      name: item.name || '',
      hint: item.hint || '',
      minQuantity: item.minQuantity !== undefined ? item.minQuantity : 1,
      code: item.code || '',
      description: item.description || '',
      sortOrder: item.sortOrder !== undefined ? item.sortOrder : 0,
      status: item.status || 'Active',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setErrorMessage('Please enter an MOQ / Pack Type name.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    const payload = {
      name: formData.name.trim(),
      hint: formData.hint.trim() ? formData.hint.trim().toUpperCase() : undefined,
      minQuantity: Number(formData.minQuantity) || 1,
      code: formData.code.trim() ? formData.code.trim().toUpperCase() : undefined,
      description: formData.description.trim(),
      sortOrder: Number(formData.sortOrder) || 0,
      status: formData.status === 'Inactive' ? 'Inactive' : 'Active',
    }

    try {
      if (editingMoq) {
        const res = await updateMoqApi(editingMoq._id, payload)
        if (res.success) {
          setSuccessMessage(`MOQ Type "${formData.name}" updated successfully.`)
          setIsModalOpen(false)
          fetchMoqs()
        }
      } else {
        const res = await createMoqApi(payload)
        if (res.success) {
          setSuccessMessage(`MOQ Type "${formData.name}" added successfully.`)
          setIsModalOpen(false)
          fetchMoqs()
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Error processing MOQ record.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete MOQ / Pack Type "${name}"?`)) {
      return
    }

    try {
      const res = await deleteMoqApi(id)
      if (res.success) {
        setSuccessMessage(`MOQ Type "${name}" removed.`)
        fetchMoqs()
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to remove MOQ type.')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      const res = await toggleMoqStatusApi(id)
      if (res.success) {
        setSuccessMessage(res.message || 'MOQ status updated.')
        fetchMoqs()
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update MOQ status.')
    }
  }

  // Filtered list
  const filteredMoqs = useMemo(() => {
    return moqs.filter((m) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.hint && m.hint.toLowerCase().includes(q)) ||
        (m.code && m.code.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))

      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [moqs, searchQuery, statusFilter])

  // Metrics
  const activeCount = moqs.filter((m) => m.status === 'Active').length
  const inactiveCount = moqs.filter((m) => m.status === 'Inactive').length

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAE3D5] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-[10px] tracking-[0.25em] text-[#9A6D22] uppercase font-bold">
              B2B Order Slabs & Packs
            </span>
            <span className="rounded-full bg-[#FAF3E4] px-2 py-0.5 font-mono text-[9px] font-bold text-[#805915] border border-[#E8D8BA]">
              Atelier Standard
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#121214]">
            MOQ &amp; Pack Types
          </h1>
          <p className="text-xs text-[#7A746B] mt-0.5">
            Manage minimum order quantities, carton bundle configurations, and wholesale catalog MOQ filters.
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
            <span>Add MOQ / Pack Type</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7A746B]">Total MOQ Tiers</span>
            <span className="rounded-lg bg-[#FAF8F5] p-2 text-[#9A6D22]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#121214]">
            {moqs.length}
          </div>
          <p className="mt-0.5 text-[11px] text-[#A8A196]">Direct DB Pack Rules</p>
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
          <p className="mt-0.5 text-[11px] text-[#A8A196]">Visible in Filter Dropdown</p>
        </div>

        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7A746B]">Inactive / Archived</span>
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
            placeholder="Search MOQ types (e.g. Low MOQ, Bulk Pack, Custom)..."
            className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] py-2 pl-9 pr-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-[#FAF8F5] p-1 border border-[#E8DEC9]">
          {['ALL', 'Active', 'Inactive'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#FFFFFF] text-[#9A6D22] shadow-2xs'
                  : 'text-[#7A746B] hover:text-[#121214]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
            <p className="mt-3 font-mono text-xs uppercase tracking-wider text-[#7A746B]">
              Loading MOQ &amp; Pack Types...
            </p>
          </div>
        ) : filteredMoqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-[#FAF8F5] border border-[#E8DEC9] flex items-center justify-center text-[#9A6D22] mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-serif text-base font-semibold text-[#121214]">
              No MOQ &amp; Pack Types Found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-[#7A746B]">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try clearing your search query or status filters.'
                : 'No MOQ configurations registered in MongoDB yet. Click "Add MOQ / Pack Type" to add your first ordering rule.'}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-4 rounded-xl bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2 text-xs font-bold text-[#121214] shadow-xs cursor-pointer"
              >
                Add First MOQ Type
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[10px] uppercase tracking-wider text-[#7A746B]">
                  <th className="py-3.5 px-4 font-semibold">Priority</th>
                  <th className="py-3.5 px-4 font-semibold">MOQ / Pack Name</th>
                  <th className="py-3.5 px-4 font-semibold">Hint / Ratio Tag</th>
                  <th className="py-3.5 px-4 font-semibold">Min Qty</th>
                  <th className="py-3.5 px-4 font-semibold">Code</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE4D5]">
                {filteredMoqs.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-[#FCFBF8] transition-colors"
                  >
                    {/* Priority Order */}
                    <td className="py-3.5 px-4 font-mono text-xs text-[#7A746B]">
                      #{item.sortOrder || 0}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-[#121214] text-[13px]">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-[#8A847B] mt-0.5 max-w-xs truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Hint / Badge */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-[#9A6D22] bg-[#FAF3E4] px-2 py-0.5 rounded border border-[#E8D8BA]">
                        {item.hint || 'ANY QTY'}
                      </span>
                    </td>

                    {/* Min Qty */}
                    <td className="py-3.5 px-4 font-mono text-xs text-[#55514B]">
                      {item.minQuantity} {item.minQuantity === 1 ? 'pc / pack' : 'pcs'}
                    </td>

                    {/* Code */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-semibold text-[#55514B] bg-[#F4EFE6] px-2 py-0.5 rounded border border-[#DFD5C2]">
                        {item.code || `MOQ-${item.name.substring(0, 3).toUpperCase()}`}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item._id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
                          item.status === 'Active'
                            ? 'bg-[#F1F9F3] text-[#1E824C] border border-[#CDE5D2] hover:bg-[#E3F4E8]'
                            : 'bg-[#FAF8F5] text-[#8A847B] border border-[#E8DEC9] hover:bg-[#ECE4D5]'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === 'Active' ? 'bg-[#1E824C]' : 'bg-[#8A847B]'
                          }`}
                        />
                        <span>{item.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="rounded-lg border border-[#DFD5C2] bg-[#FFFFFF] p-1.5 text-[#55514B] hover:border-[#C59A46] hover:text-[#9A6D22] transition-colors cursor-pointer"
                          title="Edit MOQ Type"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id, item.name)}
                          className="rounded-lg border border-[#DFD5C2] bg-[#FFFFFF] p-1.5 text-[#8A847B] hover:border-[#B92D25] hover:text-[#B92D25] transition-colors cursor-pointer"
                          title="Delete MOQ Type"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121214]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#E8DEC9] bg-[#FFFFFF] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ECE4D5] pb-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#9A6D22] font-bold">
                  {editingMoq ? 'Edit MOQ / Pack Rule' : 'New MOQ & Pack Type'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#121214]">
                  {editingMoq ? `Update "${editingMoq.name}"` : 'Register MOQ & Pack Type'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[#8A847B] hover:bg-[#FAF8F5] hover:text-[#121214] transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* MOQ Name & Hint */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#121214] mb-1">
                    MOQ / Pack Name <span className="text-[#B92D25]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Editable MOQ, Low MOQ, Bulk Pack"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#121214] mb-1">
                    Hint / Badge Text
                  </label>
                  <input
                    type="text"
                    value={formData.hint}
                    onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                    placeholder="e.g. 10–30 PCS, CUSTOM RATIO"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 font-mono text-xs uppercase text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>
              </div>

              {/* Min Quantity & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#121214] mb-1">
                    Minimum Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                    placeholder="10"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 font-mono text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#121214] mb-1">
                    Tier Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. MOQ-EDT, MOQ-LOW"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 font-mono text-xs uppercase text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-semibold text-[#121214] mb-1">
                  Display Priority Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 font-mono text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#121214] mb-1">
                  Ratio &amp; Packaging Notes
                </label>
                <textarea
                  rows="2.5"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Custom size ratio selection with low minimum starting slab for boutique retailers..."
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#121214] mb-1">
                  Catalog Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none cursor-pointer"
                >
                  <option value="Active">Active — Visible in Shop Catalog Filter</option>
                  <option value="Inactive">Inactive — Draft / Hidden from Catalog</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ECE4D5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-4 py-2 text-xs font-semibold text-[#635E56] hover:bg-[#ECE4D5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-5 py-2 text-xs font-bold text-[#121214] shadow-sm hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingMoq ? 'Update MOQ Type' : 'Create MOQ Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductMoqView

