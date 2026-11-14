import { useState, useEffect, useMemo } from 'react'
import {
  getFabricsApi,
  createFabricApi,
  updateFabricApi,
  deleteFabricApi,
  toggleFabricStatusApi,
} from '../api'

function ProductFabricView({ currentUser }) {
  const [fabrics, setFabrics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingFabric, setEditingFabric] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    gsm: '',
    material: '',
    weightTier: 'Midweight',
    code: '',
    description: '',
    sortOrder: 0,
    status: 'Active',
  })

  // Fetch fabrics from DB
  const fetchFabrics = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await getFabricsApi()
      if (res.success && Array.isArray(res.fabrics)) {
        setFabrics(res.fabrics)
      } else {
        setFabrics([])
      }
    } catch (err) {
      console.warn('API error fetching fabrics:', err)
      setErrorMessage(
        err.response?.data?.message || 'Failed to load fabrics and GSM records from database.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFabrics()
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
    setEditingFabric(null)
    const nextOrder = fabrics.length > 0 ? Math.max(...fabrics.map((f) => f.sortOrder || 0)) + 1 : 1
    setFormData({
      name: '',
      gsm: '',
      material: '',
      weightTier: 'Midweight',
      code: '',
      description: '',
      sortOrder: nextOrder,
      status: 'Active',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingFabric(item)
    setFormData({
      name: item.name || '',
      gsm: item.gsm || '',
      material: item.material || '',
      weightTier: item.weightTier || 'Midweight',
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
      setErrorMessage('Please enter a fabric name.')
      return
    }

    if (!formData.gsm.trim()) {
      setErrorMessage('Please enter GSM / weight (e.g. 280 GSM).')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    const payload = {
      name: formData.name.trim(),
      gsm: formData.gsm.trim(),
      material: formData.material.trim(),
      weightTier: formData.weightTier || 'Midweight',
      code: formData.code.trim() ? formData.code.trim().toUpperCase() : undefined,
      description: formData.description.trim(),
      sortOrder: Number(formData.sortOrder) || 0,
      status: formData.status === 'Inactive' ? 'Inactive' : 'Active',
    }

    try {
      if (editingFabric) {
        const res = await updateFabricApi(editingFabric._id, payload)
        if (res.success) {
          setSuccessMessage(`Fabric "${formData.name}" updated successfully.`)
          setIsModalOpen(false)
          fetchFabrics()
        }
      } else {
        const res = await createFabricApi(payload)
        if (res.success) {
          setSuccessMessage(`Fabric "${formData.name}" added successfully.`)
          setIsModalOpen(false)
          fetchFabrics()
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Error processing fabric record.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete fabric "${name}"?`)) {
      return
    }

    try {
      const res = await deleteFabricApi(id)
      if (res.success) {
        setSuccessMessage(`Fabric "${name}" removed.`)
        fetchFabrics()
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to remove fabric.')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      const res = await toggleFabricStatusApi(id)
      if (res.success) {
        setSuccessMessage(res.message || 'Fabric status updated.')
        fetchFabrics()
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update fabric status.')
    }
  }

  // Filtered fabrics list
  const filteredFabrics = useMemo(() => {
    return fabrics.filter((f) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (f.name && f.name.toLowerCase().includes(q)) ||
        (f.gsm && f.gsm.toLowerCase().includes(q)) ||
        (f.material && f.material.toLowerCase().includes(q)) ||
        (f.code && f.code.toLowerCase().includes(q)) ||
        (f.weightTier && f.weightTier.toLowerCase().includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q))

      const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [fabrics, searchQuery, statusFilter])

  // Metrics
  const activeCount = fabrics.filter((f) => f.status === 'Active').length
  const inactiveCount = fabrics.filter((f) => f.status === 'Inactive').length

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EAE3D5] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-[10px] tracking-[0.25em] text-[#9A6D22] uppercase font-bold">
              B2B Mill Fabrics & Weaves
            </span>
            <span className="rounded-full bg-[#FAF3E4] px-2 py-0.5 font-mono text-[9px] font-bold text-[#805915] border border-[#E8D8BA]">
              Atelier Standard
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#121214]">
            Product Fabric & GSM
          </h1>
          <p className="text-xs text-[#7A746B] mt-0.5">
            Manage textile compositions, GSM weight classes, yarn structures, and wholesale catalog fabric filters.
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
            <span>Add Fabric & GSM</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#7A746B]">Total Fabric Specs</span>
            <span className="rounded-lg bg-[#FAF8F5] p-2 text-[#9A6D22]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#121214]">
            {fabrics.length}
          </div>
          <p className="mt-0.5 text-[11px] text-[#A8A196]">Direct DB Fabric Lines</p>
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
            placeholder="Search fabrics (e.g. Jersey, Terry, 280 GSM, Cotton)..."
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
              Loading fabrics and GSM specifications...
            </p>
          </div>
        ) : filteredFabrics.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-[#FAF8F5] border border-[#E8DEC9] flex items-center justify-center text-[#9A6D22] mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-serif text-base font-semibold text-[#121214]">
              No Fabrics &amp; GSM Found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-[#7A746B]">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try clearing your search query or status filters.'
                : 'No fabric specifications registered in MongoDB yet. Click "Add Fabric & GSM" to add your first textile line.'}
            </p>
            {!searchQuery && statusFilter === 'ALL' && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-4 rounded-xl bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2 text-xs font-bold text-[#121214] shadow-xs cursor-pointer"
              >
                Add First Fabric
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[10px] uppercase tracking-wider text-[#7A746B]">
                  <th className="py-3.5 px-4 font-semibold">Priority</th>
                  <th className="py-3.5 px-4 font-semibold">Fabric &amp; Material</th>
                  <th className="py-3.5 px-4 font-semibold">GSM / Weight</th>
                  <th className="py-3.5 px-4 font-semibold">Weight Tier</th>
                  <th className="py-3.5 px-4 font-semibold">Code</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE4D5]">
                {filteredFabrics.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-[#FCFBF8] transition-colors"
                  >
                    {/* Priority Order */}
                    <td className="py-3.5 px-4 font-mono text-xs text-[#7A746B]">
                      #{item.sortOrder || 0}
                    </td>

                    {/* Fabric Name & Material */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-[#121214] text-[13px]">
                          {item.name}
                        </div>
                        {item.material && (
                          <div className="text-[11px] text-[#8A847B] mt-0.5">
                            {item.material}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* GSM */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-[#9A6D22] bg-[#FAF3E4] px-2 py-0.5 rounded border border-[#E8D8BA]">
                        {item.gsm}
                      </span>
                    </td>

                    {/* Weight Tier */}
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-medium text-[#55514B] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8DEC9]">
                        {item.weightTier || 'Midweight'}
                      </span>
                    </td>

                    {/* Code */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-semibold text-[#55514B] bg-[#F4EFE6] px-2 py-0.5 rounded border border-[#DFD5C2]">
                        {item.code || `FAB-${item.name.substring(0, 3).toUpperCase()}`}
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
                          title="Edit Fabric"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id, item.name)}
                          className="rounded-lg border border-[#DFD5C2] bg-[#FFFFFF] p-1.5 text-[#8A847B] hover:border-[#B92D25] hover:text-[#B92D25] transition-colors cursor-pointer"
                          title="Delete Fabric"
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
                  {editingFabric ? 'Edit Fabric Specification' : 'New Mill Fabric Line'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#121214]">
                  {editingFabric ? `Update "${editingFabric.name}"` : 'Register Fabric & GSM'}
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
              {/* Fabric Name & GSM in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#121214] mb-1">
                    Fabric Name <span className="text-[#B92D25]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. French Terry, Combed Jersey"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#121214] mb-1">
                    GSM / Weight Spec <span className="text-[#B92D25]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.gsm}
                    onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                    placeholder="e.g. 280 GSM or 210–250 GSM"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 font-mono text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>
              </div>

              {/* Material Composition & Weight Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#121214] mb-1">
                    Fiber Composition / Material
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="e.g. 100% Combed Cotton, Linen Blend"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#121214] mb-1">
                    Weight Tier / Class
                  </label>
                  <select
                    value={formData.weightTier}
                    onChange={(e) => setFormData({ ...formData, weightTier: e.target.value })}
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none cursor-pointer"
                  >
                    <option value="Lightweight">Lightweight (210–250 GSM)</option>
                    <option value="Midweight">Midweight (260–340 GSM)</option>
                    <option value="Heavyweight">Heavyweight (360–520 GSM)</option>
                    <option value="Custom">Custom / Specialized</option>
                  </select>
                </div>
              </div>

              {/* Code & Priority Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#121214] mb-1">
                    Fabric / Mill Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FAB-FT280"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 font-mono text-xs uppercase text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

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
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#121214] mb-1">
                  Weave &amp; Mill Finish Specification
                </label>
                <textarea
                  rows="2.5"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Bio-washed compact combed yarn with micro-loop back and zero pilling..."
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              {/* Status Selector */}
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
                  {isSubmitting ? 'Saving...' : editingFabric ? 'Update Fabric' : 'Create Fabric'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductFabricView

