import { useState, useEffect, useMemo } from 'react'
import {
  getPincodesApi,
  createPincodeApi,
  bulkCreatePincodesApi,
  updatePincodeApi,
  togglePincodeStatusApi,
  deletePincodeApi,
  checkPincodeApi,
  seedPincodesApi,
} from '../api'

const DELIVERY_SPEED_OPTIONS = [
  '24-48h Express',
  'Standard 3-4 Days',
  'Regional 4-6 Days',
]

export default function ServiceablePincodesView({ currentUser }) {
  const [pincodes, setPincodes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Quick live pincode tester
  const [testPincode, setTestPincode] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [isTesting, setIsTesting] = useState(false)

  // Single Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    pincode: '',
    city: '',
    estimatedDays: 3,
    deliverySpeed: 'Standard 3-4 Days',
    isCodAvailable: true,
    isPrepaidAvailable: true,
    status: 'Active',
    notes: '',
  })

  // Bulk Import Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false)
  const [bulkData, setBulkData] = useState({
    pincodesRaw: '',
    city: '',
    estimatedDays: 3,
    deliverySpeed: 'Standard 3-4 Days',
    status: 'Active',
  })

  // Delete Confirmation Modal
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch list
  const fetchPincodes = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await getPincodesApi({
        search: searchQuery,
        status: statusFilter,
      })
      if (res.success && Array.isArray(res.pincodes)) {
        setPincodes(res.pincodes)
      } else {
        setPincodes([])
      }
    } catch (err) {
      console.warn('API error fetching pincodes:', err)
      setErrorMessage(
        err.response?.data?.message || 'Failed to load serviceable pincodes.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPincodes()
  }, [searchQuery, statusFilter])

  // Auto clear toasts
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

  // Metrics
  const stats = useMemo(() => {
    const total = pincodes.length
    const active = pincodes.filter((p) => p.status === 'Active').length
    const inactive = total - active
    const expressCount = pincodes.filter((p) => (p.estimatedDays || 3) <= 2).length
    return { total, active, inactive, expressCount }
  }, [pincodes])

  // Single Modal Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null)
    setFormData({
      pincode: '',
      city: '',
      estimatedDays: 3,
      deliverySpeed: 'Standard 3-4 Days',
      isCodAvailable: true,
      isPrepaidAvailable: true,
      status: 'Active',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      pincode: item.pincode || '',
      city: item.city || '',
      estimatedDays: item.estimatedDays || 3,
      deliverySpeed: item.deliverySpeed || 'Standard 3-4 Days',
      isCodAvailable: item.isCodAvailable !== false,
      isPrepaidAvailable: item.isPrepaidAvailable !== false,
      status: item.status || 'Active',
      notes: item.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleSingleSubmit = async (e) => {
    e.preventDefault()
    if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
      setErrorMessage('Please enter a valid 6-digit Indian pincode.')
      return
    }
    if (!formData.city.trim()) {
      setErrorMessage('City is required.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    try {
      if (editingItem) {
        const res = await updatePincodeApi(editingItem._id, formData)
        if (res.success) {
          setSuccessMessage(res.message || 'Pincode updated successfully.')
          setIsModalOpen(false)
          fetchPincodes()
        }
      } else {
        const res = await createPincodeApi(formData)
        if (res.success) {
          setSuccessMessage(res.message || 'Pincode added successfully.')
          setIsModalOpen(false)
          fetchPincodes()
        }
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to save pincode.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Bulk Modal Handlers
  const handleOpenBulkModal = () => {
    setBulkData({
      pincodesRaw: '',
      city: '',
      estimatedDays: 3,
      deliverySpeed: 'Standard 3-4 Days',
      status: 'Active',
    })
    setIsBulkModalOpen(true)
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    if (!bulkData.pincodesRaw.trim()) {
      setErrorMessage('Please paste at least one 6-digit pincode.')
      return
    }

    setIsBulkSubmitting(true)
    setErrorMessage('')
    try {
      const res = await bulkCreatePincodesApi(bulkData)
      if (res.success) {
        setSuccessMessage(res.message)
        setIsBulkModalOpen(false)
        fetchPincodes()
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to import pincodes.'
      )
    } finally {
      setIsBulkSubmitting(false)
    }
  }

  // Toggle status
  const handleToggleStatus = async (item) => {
    try {
      const res = await togglePincodeStatusApi(item._id)
      if (res.success) {
        setPincodes((prev) =>
          prev.map((p) => (p._id === item._id ? { ...p, status: res.status } : p))
        )
        setSuccessMessage(`Pincode ${item.pincode} is now ${res.status}.`)
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to toggle pincode status.'
      )
    }
  }

  // Delete
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      const res = await deletePincodeApi(itemToDelete._id)
      if (res.success) {
        setSuccessMessage(res.message || 'Pincode deleted.')
        setPincodes((prev) => prev.filter((p) => p._id !== itemToDelete._id))
        setItemToDelete(null)
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to delete pincode.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Auto seed default hubs
  const handleSeedHubs = async () => {
    try {
      const res = await seedPincodesApi()
      if (res.success) {
        setSuccessMessage(res.message)
        fetchPincodes()
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to seed major hubs.'
      )
    }
  }

  // Quick checker
  const handleTestPincode = async (e) => {
    e.preventDefault()
    if (!/^[1-9][0-9]{5}$/.test(testPincode.trim())) {
      setTestResult({
        success: false,
        isAvailable: false,
        message: 'Please enter a valid 6-digit Indian postal code.',
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await checkPincodeApi(testPincode.trim())
      setTestResult(res)
    } catch (err) {
      setTestResult({
        success: false,
        isAvailable: false,
        message: err.response?.data?.message || 'Check request failed.',
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Messages */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-[#1E824C]/30 bg-[#1E824C]/10 px-4 py-3 text-xs font-semibold text-[#1E824C]">
          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-3 text-xs font-semibold text-[#C0392B]">
          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ECE4D5] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FAF3E4] text-[#9A6D22] border border-[#E5D3AF]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A6D22]">
              Logistics &amp; Delivery Matrix
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#121214] sm:text-3xl">
            Serviceable Delivery Pincodes
          </h1>
          <p className="mt-1 text-xs text-[#7A746B]">
            Configure and maintain delivery availability and committed transit days for retail orders.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedHubs}
            className="flex items-center gap-1.5 rounded-xl border border-[#DFD5C2] bg-white px-3.5 py-2 text-xs font-semibold text-[#635E56] hover:border-[#C59A46] hover:text-[#9A6D22] hover:bg-[#FAF8F5] transition-all shadow-2xs"
            title="Import top commercial hubs"
          >
            <svg className="h-3.5 w-3.5 text-[#9A6D22]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Seed Major Hubs</span>
          </button>

          <button
            type="button"
            onClick={handleOpenBulkModal}
            className="flex items-center gap-1.5 rounded-xl border border-[#DFD5C2] bg-white px-3.5 py-2 text-xs font-semibold text-[#635E56] hover:border-[#C59A46] hover:text-[#9A6D22] hover:bg-[#FAF8F5] transition-all shadow-2xs"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Bulk Import</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#121214] to-[#252422] hover:to-[#121214] px-4 py-2 text-xs font-bold text-[#FAD79F] shadow-sm transition-all hover:-translate-y-0.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Pincode</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-2xs">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#8A847B]">
            Total Serviceable Pincodes
          </span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#121214] font-serif">
            {stats.total}
          </p>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-2xs">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#1E824C]">
            Active Lines
          </span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#1E824C] font-serif">
            {stats.active}
          </p>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-2xs">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#B37D14]">
            Express (≤ 2 Days)
          </span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#B37D14] font-serif">
            {stats.expressCount}
          </p>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-2xs">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#8A847B]">
            Paused / Inactive
          </span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[#8A847B] font-serif">
            {stats.inactive}
          </p>
        </div>
      </div>

      {/* Live Pincode Quick-Test Widget */}
      <div className="rounded-2xl border border-[#E8DEC9] bg-[#FAF8F5] p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF3E4] border border-[#E5D3AF] px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[#9A6D22]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E824C]" />
              Live Simulation Desk
            </span>
            <h3 className="mt-1 font-serif text-sm font-bold text-[#121214]">
              Simulate Pincode Dispatch Check
            </h3>
            <p className="text-[11px] text-[#7A746B]">
              Instantly test if a customer or retailer&apos;s postal pincode is active for direct delivery.
            </p>
          </div>

          <form onSubmit={handleTestPincode} className="flex items-center gap-2">
            <input
              type="text"
              maxLength={6}
              value={testPincode}
              onChange={(e) => setTestPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 400013"
              className="h-10 w-36 rounded-xl border border-[#DFD5C2] bg-white px-3 font-mono text-xs font-semibold text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isTesting || testPincode.length !== 6}
              className="h-10 rounded-xl bg-[#121214] px-4 text-xs font-bold text-[#FAD79F] transition-colors hover:bg-[#252422] disabled:opacity-40"
            >
              {isTesting ? 'Checking...' : 'Check Availability'}
            </button>
          </form>
        </div>

        {/* Test Result Display */}
        {testResult && (
          <div
            className={`mt-4 rounded-xl border p-3.5 text-xs transition-all ${
              testResult.isAvailable
                ? 'border-[#1E824C]/30 bg-[#1E824C]/8 text-[#1E824C]'
                : 'border-[#C0392B]/30 bg-[#C0392B]/8 text-[#C0392B]'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <span>{testResult.isAvailable ? '✓ Direct Dispatch Available' : '✕ Not Serviceable'}</span>
              <span className="text-[11px] font-normal text-[#55514B]">· {testResult.message}</span>
            </div>
            {testResult.isAvailable && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#55514B]">
                <span>Destination: <strong>{testResult.city}</strong></span>
                <span>Speed: <strong>{testResult.deliverySpeed}</strong></span>
                <span>Transit: <strong>{testResult.estimatedDays} Days</strong></span>
                <span>COD: <strong>{testResult.isCodAvailable ? 'Supported' : 'Prepaid Only'}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#ECE4D5] shadow-2xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by 6-digit PIN or city..."
            className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] py-2 pl-9 pr-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:bg-white focus:outline-none"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-[#8A847B]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          {/* Status Filter */}
          <div className="inline-flex rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-0.5 text-xs font-semibold">
            {['ALL', 'Active', 'Inactive'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-[#121214] shadow-2xs font-bold'
                    : 'text-[#635E56] hover:text-[#121214]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pincodes Table */}
      <div className="overflow-hidden rounded-xl border border-[#ECE4D5] bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#ECE4D5] bg-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider text-[#7A746B]">
              <tr>
                <th className="px-5 py-3.5">Pincode</th>
                <th className="px-5 py-3.5">City / Area</th>
                <th className="px-5 py-3.5">Estimated Transit</th>
                <th className="px-5 py-3.5">COD / Payment</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE4D5]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#7A746B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
                      <span>Loading serviceable network...</span>
                    </div>
                  </td>
                </tr>
              ) : pincodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#7A746B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="h-8 w-8 text-[#A8A196]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-semibold text-sm text-[#121214]">No Pincodes Found</span>
                      <p className="text-xs text-[#8A847B]">
                        {searchQuery ? 'No results matched your search query.' : 'Click "+ Add Pincode" or "Seed Major Hubs" to populate.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pincodes.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    {/* Pincode */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5D3AF] bg-[#FAF3E4] px-2.5 py-1 font-mono text-xs font-bold text-[#805915]">
                        {item.pincode}
                      </span>
                    </td>

                    {/* City */}
                    <td className="px-5 py-3.5 font-semibold text-[#121214]">
                      {item.city}
                    </td>

                    {/* Estimated Transit */}
                    <td className="px-5 py-3.5 text-[#121214]">
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.estimatedDays} Days</span>
                        <span className="text-[10px] text-[#7A746B]">{item.deliverySpeed}</span>
                      </div>
                    </td>

                    {/* COD / Payment */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {item.isCodAvailable ? (
                          <span className="rounded bg-[#1E824C]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#1E824C]">
                            COD
                          </span>
                        ) : (
                          <span className="rounded bg-[#8A847B]/10 px-1.5 py-0.5 text-[10px] text-[#8A847B]">
                            No COD
                          </span>
                        )}
                        {item.isPrepaidAvailable && (
                          <span className="rounded bg-[#C59A46]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#9A6D22]">
                            Prepaid
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Toggle Switch */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                          item.status === 'Active'
                            ? 'bg-[#1E824C]/10 text-[#1E824C] hover:bg-[#1E824C]/20 border border-[#1E824C]/20'
                            : 'bg-[#C0392B]/10 text-[#C0392B] hover:bg-[#C0392B]/20 border border-[#C0392B]/20'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === 'Active' ? 'bg-[#1E824C]' : 'bg-[#C0392B]'
                          }`}
                        />
                        {item.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="rounded-lg p-1.5 text-[#635E56] hover:bg-[#FAF3E4] hover:text-[#9A6D22] transition-colors"
                          title="Edit Pincode"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="rounded-lg p-1.5 text-[#8A847B] hover:bg-[#C0392B]/10 hover:text-[#C0392B] transition-colors"
                          title="Delete Pincode"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#ECE4D5] bg-white p-6 shadow-xl animate-bvb-text">
            <div className="flex items-center justify-between border-b border-[#ECE4D5] pb-4">
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#9A6D22]">
                  {editingItem ? 'Edit Pincode' : 'New Serviceable Pincode'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#121214]">
                  {editingItem ? `Update PIN ${editingItem.pincode}` : 'Add Serviceable Pincode'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8A847B] hover:text-[#121214]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635E56]">
                  6-Digit Pincode *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 400013"
                  className="mt-1 w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-3 py-2 font-mono text-xs font-semibold text-[#121214] focus:border-[#C59A46] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635E56]">
                  City / Area *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="mt-1 w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-3 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635E56]">
                    Estimated Transit (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={formData.estimatedDays}
                    onChange={(e) => setFormData({ ...formData, estimatedDays: Number(e.target.value) || 3 })}
                    className="mt-1 w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-3 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635E56]">
                    Delivery Tier
                  </label>
                  <select
                    value={formData.deliverySpeed}
                    onChange={(e) => setFormData({ ...formData, deliverySpeed: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-3 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:bg-white focus:outline-none"
                  >
                    {DELIVERY_SPEED_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#121214]">
                  <input
                    type="checkbox"
                    checked={formData.isCodAvailable}
                    onChange={(e) => setFormData({ ...formData, isCodAvailable: e.target.checked })}
                    className="rounded border-[#DFD5C2] text-[#C59A46] focus:ring-[#C59A46]"
                  />
                  <span>Cash on Delivery (COD)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#121214]">
                  <input
                    type="checkbox"
                    checked={formData.isPrepaidAvailable}
                    onChange={(e) => setFormData({ ...formData, isPrepaidAvailable: e.target.checked })}
                    className="rounded border-[#DFD5C2] text-[#C59A46] focus:ring-[#C59A46]"
                  />
                  <span>Prepaid Order</span>
                </label>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635E56]">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-3 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:bg-white focus:outline-none"
                >
                  <option value="Active">Active (Available for Orders)</option>
                  <option value="Inactive">Inactive (Suspended Delivery)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#ECE4D5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#DFD5C2] px-4 py-2 text-xs font-semibold text-[#635E56] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#121214] px-5 py-2 text-xs font-bold text-[#FAD79F] transition-all hover:bg-[#252422] disabled:opacity-40"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Pincode' : 'Add to Network'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#ECE4D5] bg-white p-6 shadow-xl animate-bvb-text">
            <div className="flex items-center justify-between border-b border-[#ECE4D5] pb-4">
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#9A6D22]">
                  Bulk Batch Import
                </span>
                <h3 className="font-serif text-lg font-bold text-[#121214]">
                  Import Multiple Serviceable Pincodes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8A847B] hover:text-[#121214]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635E56]">
                  Paste Pincodes (Comma, Space or Newline separated) *
                </label>
                <textarea
                  rows={5}
                  required
                  value={bulkData.pincodesRaw}
                  onChange={(e) => setBulkData({ ...bulkData, pincodesRaw: e.target.value })}
                  placeholder="e.g. 400001, 400002, 400003, 400013, 110001"
                  className="mt-1 w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-3 font-mono text-xs text-[#121214] focus:border-[#C59A46] focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] text-[#7A746B]">
                  System will automatically extract all 6-digit valid Indian postal numbers and skip duplicates.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635E56]">
                    Default City / Region (Optional)
                  </label>
                  <input
                    type="text"
                    value={bulkData.city}
                    onChange={(e) => setBulkData({ ...bulkData, city: e.target.value })}
                    placeholder="e.g. Mumbai Metro"
                    className="mt-1 w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-3 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#635E56]">
                    Transit Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={bulkData.estimatedDays}
                    onChange={(e) => setBulkData({ ...bulkData, estimatedDays: Number(e.target.value) || 3 })}
                    className="mt-1 w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] px-3 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#ECE4D5]">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="rounded-xl border border-[#DFD5C2] px-4 py-2 text-xs font-semibold text-[#635E56] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBulkSubmitting}
                  className="rounded-xl bg-[#121214] px-5 py-2 text-xs font-bold text-[#FAD79F] transition-all hover:bg-[#252422] disabled:opacity-40"
                >
                  {isBulkSubmitting ? 'Importing...' : 'Start Bulk Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#ECE4D5] bg-white p-6 shadow-xl animate-bvb-text">
            <h3 className="font-serif text-lg font-bold text-[#121214]">
              Remove Pincode {itemToDelete.pincode}?
            </h3>
            <p className="mt-2 text-xs text-[#7A746B] leading-relaxed">
              Are you sure you want to remove <strong>{itemToDelete.pincode} ({itemToDelete.city})</strong> from the serviceable delivery network?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="rounded-xl border border-[#DFD5C2] px-4 py-2 text-xs font-semibold text-[#635E56] hover:bg-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-[#C0392B] px-5 py-2 text-xs font-bold text-white transition-all hover:bg-[#962D22] disabled:opacity-40"
              >
                {isDeleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
