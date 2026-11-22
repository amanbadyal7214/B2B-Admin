import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getAdminRetailersApi,
  getAdminRetailerByIdApi,
  updateRetailerStatusApi,
  verifyRetailerApi,
  updateRetailerSampleKitApi,
  deleteRetailerApi,
} from '../api'

const STATUS_CONFIG = {
  verified: {
    label: 'Verified Partner',
    sub: 'Trade Pass Active',
    bg: 'bg-[#1F8F5A]/10',
    border: 'border-[#1F8F5A]/30',
    text: 'text-[#1F8F5A]',
    dot: 'bg-[#1F8F5A]',
  },
  pending: {
    label: 'Pending Review',
    sub: 'Clearance Awaiting',
    bg: 'bg-[#FAF3E4]',
    border: 'border-[#E5D3AF]',
    text: 'text-[#805915]',
    dot: 'bg-[#C59A46]',
  },
  suspended: {
    label: 'Suspended',
    sub: 'Trade Revoked',
    bg: 'bg-[#C23B37]/10',
    border: 'border-[#C23B37]/30',
    text: 'text-[#C23B37]',
    dot: 'bg-[#C23B37]',
  },
  rejected: {
    label: 'Rejected',
    sub: 'Application Closed',
    bg: 'bg-stone-100',
    border: 'border-stone-300',
    text: 'text-stone-600',
    dot: 'bg-stone-400',
  },
}

const SAMPLE_KIT_CONFIG = {
  none: { label: 'Not Requested', bg: 'bg-stone-100', text: 'text-stone-600' },
  requested: { label: 'Kit Requested', bg: 'bg-[#FAF3E4]', text: 'text-[#805915]' },
  dispatched: { label: 'Kit Dispatched', bg: 'bg-blue-50', text: 'text-blue-700' },
  credited: { label: 'Sample Credited', bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

const SLAB_OPTIONS = [
  { value: 'Starter Assortment (20–49 pcs)', label: 'Starter Assortment (20–49 pcs) · 0% Rebate' },
  { value: 'Boutique Partner · 6% Off', label: 'Boutique Partner (50–149 pcs) · 6% Off' },
  { value: 'Stockist Direct · 12% + Free Freight', label: 'Stockist Direct (150+ pcs) · 12% + Free Freight' },
  { value: 'Private Label & OEM Mill Line', label: 'Private Label & OEM (300+ pcs) · 15% Off' },
]

export default function AdminRetailersView({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialStatus = searchParams.get('status') || 'ALL'
  const initialSampleKit = searchParams.get('sampleKit') || 'ALL'
  const initialFormat = searchParams.get('format') || 'ALL'
  const initialSearch = searchParams.get('search') || ''

  const [retailers, setRetailers] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    suspended: 0,
    sampleKitsRequested: 0,
    totalGMV: 0,
  })
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedStatusTab, setSelectedStatusTab] = useState(initialStatus)
  const [selectedFormat, setSelectedFormat] = useState(initialFormat)
  const [selectedSampleKit, setSelectedSampleKit] = useState(initialSampleKit)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Sync state if URL query params change (e.g. from sidebar Customer dropdown clicks)
  useEffect(() => {
    const s = searchParams.get('status') || 'ALL'
    const k = searchParams.get('sampleKit') || 'ALL'
    const f = searchParams.get('format') || 'ALL'
    const q = searchParams.get('search')
    setSelectedStatusTab(s)
    setSelectedSampleKit(k)
    setSelectedFormat(f)
    if (q !== null) {
      setSearchQuery(q)
    }
  }, [searchParams])

  const handleSelectStatusTab = (tabId) => {
    setSelectedStatusTab(tabId)
    const nextParams = new URLSearchParams(searchParams)
    if (tabId === 'ALL') {
      nextParams.delete('status')
    } else {
      nextParams.set('status', tabId)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const handleSelectSampleKit = (kitVal) => {
    setSelectedSampleKit(kitVal)
    const nextParams = new URLSearchParams(searchParams)
    if (kitVal === 'ALL') {
      nextParams.delete('sampleKit')
    } else {
      nextParams.set('sampleKit', kitVal)
    }
    setSearchParams(nextParams, { replace: true })
  }

  // Detailed Retailer Drawer
  const [selectedRetailer, setSelectedRetailer] = useState(null)
  const [retailerOrders, setRetailerOrders] = useState([])
  const [retailerMetrics, setRetailerMetrics] = useState(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [drawerTab, setDrawerTab] = useState('overview') // 'overview', 'orders', 'edit'

  // Quick action / Edit states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editStatus, setEditStatus] = useState('pending')
  const [editSlab, setEditSlab] = useState('')
  const [editSampleKit, setEditSampleKit] = useState('none')
  const [editAdminNotes, setEditAdminNotes] = useState('')
  const [editGstin, setEditGstin] = useState('')

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [retailerToDelete, setRetailerToDelete] = useState(null)

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const fetchRetailers = async (page = 1) => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const params = { page, limit: 50 }
      if (selectedStatusTab !== 'ALL') {
        params.status = selectedStatusTab
      }
      if (selectedFormat !== 'ALL') {
        params.storeFormat = selectedFormat
      }
      if (selectedSampleKit !== 'ALL') {
        params.sampleKitStatus = selectedSampleKit
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const res = await getAdminRetailersApi(params)
      if (res?.success) {
        setRetailers(res.retailers || [])
        if (res.stats) setStats(res.stats)
        if (res.pagination) setPagination(res.pagination)
      } else {
        setErrorMessage(res?.message || 'Failed to load retailers directory.')
      }
    } catch (err) {
      console.error('[AdminRetailersView] Fetch error:', err)
      setErrorMessage(
        err.response?.data?.message || err.message || 'Error connecting to retailers service.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRetailers(1)
  }, [selectedStatusTab, selectedFormat, selectedSampleKit])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRetailers(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Open retailer detail drawer
  const handleOpenRetailer = async (ret) => {
    setSelectedRetailer(ret)
    setEditStatus(ret.status || 'pending')
    setEditSlab(ret.assignedSlab || '')
    setEditSampleKit(ret.sampleKitStatus || 'none')
    setEditAdminNotes(ret.adminNotes || '')
    setEditGstin(ret.gstin || '')
    setDrawerTab('overview')
    setIsLoadingDetail(true)

    try {
      const res = await getAdminRetailerByIdApi(ret._id)
      if (res?.success) {
        setSelectedRetailer(res.retailer || ret)
        setRetailerOrders(res.orders || [])
        setRetailerMetrics(res.metrics || null)
      }
    } catch (err) {
      console.error('[handleOpenRetailer] Error:', err)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Quick verify/approve toggle
  const handleQuickVerify = async (ret, nextVerified = true) => {
    try {
      setIsSubmitting(true)
      const res = await verifyRetailerApi(ret._id, {
        isVerified: nextVerified,
        adminNotes: nextVerified
          ? `Trade Pass approved by ${currentUser?.name || 'Administrator'} on ${new Date().toLocaleDateString()}`
          : 'Trade clearance suspended for review',
      })
      if (res?.success) {
        setSuccessMessage(
          `Store ${ret.storeName || ret.name} is now ${nextVerified ? 'Verified & Trade Pass Activated' : 'Moved to Pending Review'}.`
        )
        setTimeout(() => setSuccessMessage(''), 4000)
        fetchRetailers(pagination.page)
        if (selectedRetailer?._id === ret._id) {
          setSelectedRetailer(res.retailer)
          setEditStatus(res.retailer.status)
        }
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Error updating clearance.')
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Save changes from Edit Drawer
  const handleSaveRetailerDetails = async () => {
    if (!selectedRetailer) return
    try {
      setIsSubmitting(true)
      const payload = {
        status: editStatus,
        assignedSlab: editSlab,
        sampleKitStatus: editSampleKit,
        adminNotes: editAdminNotes,
        gstin: editGstin,
      }
      const res = await updateRetailerStatusApi(selectedRetailer._id, payload)
      if (res?.success) {
        setSuccessMessage(`Retailer profile for ${res.retailer.storeName || res.retailer.name} saved.`)
        setTimeout(() => setSuccessMessage(''), 4000)
        setSelectedRetailer(res.retailer)
        fetchRetailers(pagination.page)
        setDrawerTab('overview')
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update retailer details.')
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick sample kit status change
  const handleUpdateSampleKit = async (statusVal) => {
    if (!selectedRetailer) return
    try {
      setIsSubmitting(true)
      const res = await updateRetailerSampleKitApi(selectedRetailer._id, {
        sampleKitStatus: statusVal,
      })
      if (res?.success) {
        setSuccessMessage(`Sample kit status marked as ${statusVal}.`)
        setTimeout(() => setSuccessMessage(''), 3000)
        setSelectedRetailer(res.retailer)
        setEditSampleKit(statusVal)
        fetchRetailers(pagination.page)
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Error updating sample kit.')
      setTimeout(() => setErrorMessage(''), 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete retailer
  const handleConfirmDelete = async () => {
    if (!retailerToDelete) return
    try {
      setIsSubmitting(true)
      const res = await deleteRetailerApi(retailerToDelete._id)
      if (res?.success) {
        setSuccessMessage(`Store account ${retailerToDelete.storeName || retailerToDelete.name} removed.`)
        setTimeout(() => setSuccessMessage(''), 4000)
        if (selectedRetailer?._id === retailerToDelete._id) {
          setSelectedRetailer(null)
        }
        setShowDeleteModal(false)
        setRetailerToDelete(null)
        fetchRetailers(pagination.page)
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to delete retailer.')
      setTimeout(() => setErrorMessage(''), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text, label) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setSuccessMessage(`${label} copied to clipboard`)
    setTimeout(() => setSuccessMessage(''), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#C23B37]/30 bg-[#C23B37]/10 px-4 py-3 text-xs font-medium text-[#C23B37] shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-[#C23B37] hover:opacity-80">
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#1F8F5A]/30 bg-[#1F8F5A]/10 px-4 py-3 text-xs font-medium text-[#1F8F5A] shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-[#1F8F5A] hover:opacity-80">
            &times;
          </button>
        </div>
      )}

      {/* Executive Header & KPI Ribbon */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#ECE4D5] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#121214]">
              Retailers &amp; Trade Pass Directory
            </h1>
            <span className="rounded-full border border-[#E7D6B6] bg-[#FAF3E4] px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#9A6D22] uppercase">
              B2B Accounts
            </span>
          </div>
          <p className="mt-1 text-xs text-[#7A746B]">
            Commercial verification, GSTIN clearance, volume rebate slabs, and lifetime wholesale manifests.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchRetailers(pagination.page)}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-[#DFD5C2] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#6B6357] shadow-xs transition hover:border-[#C59A46] hover:bg-[#FAF8F5] disabled:opacity-60"
          >
            <svg
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Retailers */}
        <div
          onClick={() => handleSelectStatusTab('ALL')}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-xs hover:border-[#C59A46] ${
            selectedStatusTab === 'ALL'
              ? 'border-[#C59A46] bg-[#FAF3E4]/70 ring-1 ring-[#C59A46]/20'
              : 'border-[#ECE4D5] bg-[#FFFFFF]'
          }`}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
            Registered Stores
          </div>
          <div className="mt-1 font-serif text-2xl font-bold text-[#121214]">
            {stats.total || 0}
          </div>
          <div className="mt-1 text-[10px] text-[#9A9386]">All B2B buyers</div>
        </div>

        {/* Pending Review */}
        <div
          onClick={() => handleSelectStatusTab('pending')}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-xs hover:border-[#C59A46] ${
            selectedStatusTab === 'pending'
              ? 'border-[#C59A46] bg-[#FAF3E4] ring-1 ring-[#C59A46]/20'
              : 'border-[#ECE4D5] bg-[#FFFFFF]'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#805915]">
            <span>Pending Review</span>
            <span className="h-2 w-2 rounded-full bg-[#C59A46] animate-pulse" />
          </div>
          <div className="mt-1 font-serif text-2xl font-bold text-[#805915]">
            {stats.pending || 0}
          </div>
          <div className="mt-1 text-[10px] font-medium text-[#C59A46]">
            Needs Clearance
          </div>
        </div>

        {/* Verified Partners */}
        <div
          onClick={() => handleSelectStatusTab('verified')}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-xs hover:border-[#1F8F5A] ${
            selectedStatusTab === 'verified'
              ? 'border-[#1F8F5A] bg-[#1F8F5A]/10 ring-1 ring-[#1F8F5A]/20'
              : 'border-[#ECE4D5] bg-[#FFFFFF]'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#1F8F5A]">
            <span>Verified Partners</span>
            <span className="h-2 w-2 rounded-full bg-[#1F8F5A]" />
          </div>
          <div className="mt-1 font-serif text-2xl font-bold text-[#1F8F5A]">
            {stats.verified || 0}
          </div>
          <div className="mt-1 text-[10px] text-[#1F8F5A]">Trade Pass Active</div>
        </div>

        {/* Sample Kit Requests */}
        <div
          onClick={() => {
            handleSelectSampleKit(selectedSampleKit === 'requested' ? 'ALL' : 'requested')
          }}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-xs hover:border-[#2E72D2] ${
            selectedSampleKit === 'requested'
              ? 'border-[#2E72D2] bg-[#2E72D2]/10 ring-1 ring-[#2E72D2]/20'
              : 'border-[#ECE4D5] bg-[#FFFFFF]'
          }`}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#2E72D2]">
            Sample Kits
          </div>
          <div className="mt-1 font-serif text-2xl font-bold text-[#2E72D2]">
            {stats.sampleKitsRequested || 0}
          </div>
          <div className="mt-1 text-[10px] text-[#2E72D2]">Pending Dispatch</div>
        </div>

        {/* Suspended Accounts */}
        <div
          onClick={() => handleSelectStatusTab('suspended')}
          className={`cursor-pointer rounded-2xl border p-4 transition shadow-xs hover:border-[#C23B37] ${
            selectedStatusTab === 'suspended'
              ? 'border-[#C23B37] bg-[#C23B37]/10 ring-1 ring-[#C23B37]/20'
              : 'border-[#ECE4D5] bg-[#FFFFFF]'
          }`}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#C23B37]">
            Suspended
          </div>
          <div className="mt-1 font-serif text-2xl font-bold text-[#C23B37]">
            {stats.suspended || 0}
          </div>
          <div className="mt-1 text-[10px] text-[#C23B37]">Trade Revoked</div>
        </div>

        {/* Wholesale GMV */}
        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
            Wholesale GMV
          </div>
          <div className="mt-1 font-serif text-xl font-bold text-[#121214] truncate">
            {formatPrice(stats.totalGMV || 0)}
          </div>
          <div className="mt-1 text-[10px] text-[#7A746B]">Total Settled Revenue</div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Stores', count: stats.total },
              { id: 'pending', label: 'Pending Review', count: stats.pending, alert: true },
              { id: 'verified', label: 'Verified Partners', count: stats.verified },
              { id: 'suspended', label: 'Suspended', count: stats.suspended },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectStatusTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  selectedStatusTab === tab.id
                    ? 'border border-[#C59A46] bg-[#FAF3E4] text-[#121214] shadow-2xs'
                    : 'text-[#6B6357] hover:bg-[#FAF8F5] hover:text-[#121214]'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                      tab.alert && tab.count > 0
                        ? 'bg-[#C59A46] text-[#FFFFFF]'
                        : selectedStatusTab === tab.id
                        ? 'bg-[#E5D3AF] text-[#805915]'
                        : 'bg-[#ECE4D5] text-[#7A746B]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 sm:w-64 sm:flex-initial">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store, buyer, GSTIN, phone..."
                className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] py-1.5 pl-8 pr-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-medium"
              />
              <svg
                className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9A9386]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-[#9A9386] hover:text-[#121214]"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Store Format Filter */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-1.5 text-xs font-medium text-[#6B6357] focus:border-[#C59A46] focus:outline-none"
            >
              <option value="ALL">All Store Formats</option>
              <option value="Boutique">Independent Boutique</option>
              <option value="Multi-Brand">Multi-Brand Retail (MBO)</option>
              <option value="Regional Chain">Regional Chain</option>
              <option value="Department">Department Store</option>
            </select>

            {/* Sample Kit Filter */}
            <select
              value={selectedSampleKit}
              onChange={(e) => setSelectedSampleKit(e.target.value)}
              className="rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-1.5 text-xs font-medium text-[#6B6357] focus:border-[#C59A46] focus:outline-none"
            >
              <option value="ALL">All Sample Kits</option>
              <option value="requested">Kit Requested</option>
              <option value="dispatched">Kit Dispatched</option>
              <option value="credited">Kit Credited</option>
              <option value="none">No Kit</option>
            </select>

            {(searchQuery || selectedStatusTab !== 'ALL' || selectedFormat !== 'ALL' || selectedSampleKit !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedStatusTab('ALL')
                  setSelectedFormat('ALL')
                  setSelectedSampleKit('ALL')
                }}
                className="text-[11px] font-semibold text-[#9A6D22] hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Retailers Table */}
      <div className="overflow-hidden rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-xs">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#7A746B]">
              Loading Retailer Accounts &amp; Commercial Terms...
            </span>
          </div>
        ) : retailers.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E5D7B7] bg-[#FAF4E8] text-[#9A6D22]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="mt-3 font-serif text-base font-bold text-[#121214]">
              No Retailer Accounts Found
            </h3>
            <p className="mt-1 text-xs text-[#7A746B] max-w-sm">
              {searchQuery || selectedStatusTab !== 'ALL'
                ? 'No stores match your search criteria. Try clearing active filters.'
                : 'No wholesale retailer applications registered yet in the system.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ECE4D5] bg-[#FAF8F5] text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
                  <th className="py-3 px-4 font-semibold">Store &amp; Buyer</th>
                  <th className="py-3 px-4 font-semibold">Contact &amp; Location</th>
                  <th className="py-3 px-4 font-semibold">GSTIN &amp; Commercial Tier</th>
                  <th className="py-3 px-4 font-semibold">Sample Kit</th>
                  <th className="py-3 px-4 font-semibold">Wholesale Orders</th>
                  <th className="py-3 px-4 font-semibold">Trade Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1] text-xs">
                {retailers.map((ret) => {
                  const statusConf = STATUS_CONFIG[ret.status] || STATUS_CONFIG.pending
                  const kitConf = SAMPLE_KIT_CONFIG[ret.sampleKitStatus] || SAMPLE_KIT_CONFIG.none
                  const storeInitials = (ret.storeName || ret.companyName || ret.name || 'ST')
                    .substring(0, 2)
                    .toUpperCase()

                  return (
                    <tr
                      key={ret._id}
                      className="transition hover:bg-[#FAF8F5]/80 cursor-pointer"
                      onClick={() => handleOpenRetailer(ret)}
                    >
                      {/* Store & Buyer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E7D6B6] bg-[#FAF3E4] font-mono text-xs font-bold text-[#805915]">
                            {storeInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-serif font-bold text-[#121214] truncate max-w-[180px]">
                                {ret.storeName || ret.companyName || 'Store Pending'}
                              </span>
                              {ret.appRef && (
                                <span className="font-mono text-[9px] text-[#9A9386]">
                                  {ret.appRef}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6B6357] truncate">
                              Buyer: <span className="font-medium text-[#121214]">{ret.ownerName || ret.name}</span>
                            </div>
                            {ret.storeFormat && (
                              <div className="text-[10px] text-[#9A9386] truncate">
                                {ret.storeFormat}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-0.5">
                          <div className="font-medium text-[#121214] truncate max-w-[170px]">
                            <a
                              href={`mailto:${ret.email}`}
                              className="hover:text-[#9A6D22] hover:underline"
                            >
                              {ret.email}
                            </a>
                          </div>
                          {(ret.phone || ret.mobile) && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#7A746B]">
                              <a
                                href={`tel:${ret.phone || ret.mobile}`}
                                className="font-mono hover:text-[#121214]"
                              >
                                {ret.phone || ret.mobile}
                              </a>
                              <a
                                href={`https://wa.me/${(ret.phone || ret.mobile).replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
                                className="text-emerald-600 hover:text-emerald-700 font-semibold text-[10px]"
                              >
                                WA
                              </a>
                            </div>
                          )}
                          {(ret.cityState || ret.city || ret.pincode) && (
                            <div className="text-[10px] text-[#9A9386] truncate max-w-[170px]">
                              {[ret.city || ret.cityState, ret.pincode].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* GSTIN & Commercial Tier */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {ret.gstin ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-semibold text-[#121214] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E7DFCE]">
                                {ret.gstin}
                              </span>
                              <span className="text-[9px] font-mono text-[#1F8F5A] font-semibold">
                                Validated
                              </span>
                            </div>
                          ) : (
                            <span className="inline-block font-mono text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Unregistered / Non-GST
                            </span>
                          )}
                          <div className="text-[10px] text-[#805915] font-medium truncate max-w-[180px]">
                            {ret.assignedSlab || ret.orderVolume || 'Tier Assigned on Review'}
                          </div>
                          {ret.tradePass?.passCode && (
                            <div className="font-mono text-[9px] text-[#9A9386]">
                              Pass: {ret.tradePass.passCode}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Sample Kit */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${kitConf.bg} ${kitConf.text}`}
                        >
                          {kitConf.label}
                        </span>
                      </td>

                      {/* Wholesale Orders */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-serif font-bold text-[#121214]">
                            {formatPrice(ret.metrics?.totalSpent || 0)}
                          </div>
                          <div className="text-[10px] text-[#7A746B]">
                            {ret.metrics?.orderCount || 0} manifest(s)
                          </div>
                          {ret.metrics?.lastOrderAt && (
                            <div className="text-[9px] font-mono text-[#9A9386]">
                              Last: {formatDate(ret.metrics.lastOrderAt)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Trade Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusConf.bg} ${statusConf.border} ${statusConf.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConf.dot}`} />
                          <span>{statusConf.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Verify / Revoke button */}
                          {ret.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => handleQuickVerify(ret, true)}
                              disabled={isSubmitting}
                              className="rounded-lg bg-[#C59A46] px-2.5 py-1 font-mono text-[10px] font-bold text-[#121214] shadow-xs transition hover:bg-[#D4AC5B]"
                              title="Approve Trade Pass"
                            >
                              Approve
                            </button>
                          ) : ret.status === 'verified' ? (
                            <button
                              type="button"
                              onClick={() => handleQuickVerify(ret, false)}
                              disabled={isSubmitting}
                              className="rounded-lg border border-[#DFD5C2] bg-[#FFFFFF] px-2 py-1 font-mono text-[10px] font-medium text-[#7A746B] transition hover:border-[#C23B37] hover:text-[#C23B37]"
                              title="Revert to Pending"
                            >
                              Suspend
                            </button>
                          ) : null}

                          {/* Inspect drawer button */}
                          <button
                            type="button"
                            onClick={() => handleOpenRetailer(ret)}
                            className="rounded-lg border border-[#DFD5C2] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-semibold text-[#6B6357] transition hover:border-[#C59A46] hover:bg-[#FAF8F5]"
                          >
                            Inspect
                          </button>

                          {/* Delete Store */}
                          <button
                            type="button"
                            onClick={() => {
                              setRetailerToDelete(ret)
                              setShowDeleteModal(true)
                            }}
                            className="p-1 text-[#9A9386] transition hover:text-[#C23B37]"
                            title="Delete Retailer"
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

      {/* Retailer Detail Inspection Drawer */}
      {selectedRetailer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#121214]/50 backdrop-blur-xs transition-opacity animate-fadeIn">
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl bg-[#FFFFFF] border-l border-[#ECE4D5] shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="border-b border-[#ECE4D5] bg-[#FAF8F5] p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E7D6B6] bg-[#FAF3E4] font-serif text-lg font-bold text-[#805915]">
                      {(selectedRetailer.storeName || selectedRetailer.name || 'ST').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-serif text-xl font-bold text-[#121214]">
                          {selectedRetailer.storeName || selectedRetailer.companyName || 'Store Profile'}
                        </h2>
                        {selectedRetailer.appRef && (
                          <span
                            onClick={() => copyToClipboard(selectedRetailer.appRef, 'Application Reference')}
                            className="cursor-pointer rounded-md bg-[#ECE4D5] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#55514B] hover:bg-[#E2D6C0]"
                            title="Click to copy"
                          >
                            {selectedRetailer.appRef}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#7A746B]">
                        Buyer: <span className="font-semibold text-[#121214]">{selectedRetailer.ownerName || selectedRetailer.name}</span> · Registered {formatDate(selectedRetailer.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRetailer(null)}
                    className="rounded-lg p-1.5 text-[#8A847B] hover:bg-[#ECE4D5] hover:text-[#121214]"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Status & Trade Pass Strip */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#EAE3D5]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        STATUS_CONFIG[selectedRetailer.status]?.bg || 'bg-stone-100'
                      } ${STATUS_CONFIG[selectedRetailer.status]?.text || 'text-stone-700'}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[selectedRetailer.status]?.dot || 'bg-stone-500'}`} />
                      <span>{STATUS_CONFIG[selectedRetailer.status]?.label || selectedRetailer.status}</span>
                    </span>

                    {selectedRetailer.tradePass?.passCode && (
                      <span className="rounded-full border border-[#E7D6B6] bg-[#FAF3E4] px-2.5 py-1 font-mono text-[10px] font-bold text-[#805915]">
                        Trade Pass: {selectedRetailer.tradePass.passCode}
                      </span>
                    )}
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {selectedRetailer.status !== 'verified' ? (
                      <button
                        type="button"
                        onClick={() => handleQuickVerify(selectedRetailer, true)}
                        disabled={isSubmitting}
                        className="rounded-xl bg-[#C59A46] px-3 py-1.5 font-mono text-xs font-bold text-[#121214] shadow-xs hover:bg-[#D4AC5B]"
                      >
                        Approve Partner
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickVerify(selectedRetailer, false)}
                        disabled={isSubmitting}
                        className="rounded-xl border border-[#DFD5C2] bg-[#FFFFFF] px-3 py-1.5 font-mono text-xs font-semibold text-[#C23B37] hover:border-[#C23B37]"
                      >
                        Suspend Clearance
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="mt-4 flex items-center gap-2 border-b border-[#EAE3D5] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDrawerTab('overview')}
                    className={`pb-2.5 px-3 border-b-2 transition ${
                      drawerTab === 'overview'
                        ? 'border-[#C59A46] text-[#121214]'
                        : 'border-transparent text-[#7A746B] hover:text-[#121214]'
                    }`}
                  >
                    Store Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('orders')}
                    className={`pb-2.5 px-3 border-b-2 transition ${
                      drawerTab === 'orders'
                        ? 'border-[#C59A46] text-[#121214]'
                        : 'border-transparent text-[#7A746B] hover:text-[#121214]'
                    }`}
                  >
                    Wholesale Orders ({retailerOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerTab('edit')}
                    className={`pb-2.5 px-3 border-b-2 transition ${
                      drawerTab === 'edit'
                        ? 'border-[#C59A46] text-[#121214]'
                        : 'border-transparent text-[#7A746B] hover:text-[#121214]'
                    }`}
                  >
                    Edit Commercial Terms
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoadingDetail ? (
                  <div className="flex h-48 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
                  </div>
                ) : drawerTab === 'overview' ? (
                  <>
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-[#ECE4D5] bg-[#FAF8F5] p-3 text-center">
                        <div className="text-[10px] font-mono uppercase text-[#7A746B]">
                          Lifetime GMV
                        </div>
                        <div className="mt-1 font-serif text-lg font-bold text-[#121214]">
                          {formatPrice(retailerMetrics?.totalSpent || 0)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#ECE4D5] bg-[#FAF8F5] p-3 text-center">
                        <div className="text-[10px] font-mono uppercase text-[#7A746B]">
                          Total Manifests
                        </div>
                        <div className="mt-1 font-serif text-lg font-bold text-[#121214]">
                          {retailerOrders.length}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#ECE4D5] bg-[#FAF8F5] p-3 text-center">
                        <div className="text-[10px] font-mono uppercase text-[#7A746B]">
                          Settled Orders
                        </div>
                        <div className="mt-1 font-serif text-lg font-bold text-[#1F8F5A]">
                          {retailerMetrics?.paidOrders || 0}
                        </div>
                      </div>
                    </div>

                    {/* Commercial Terms & Verification */}
                    <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-xs space-y-3">
                      <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#121214]">
                        Commercial Tier &amp; Tax Credentials
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] text-[#7A746B] block">Assigned Slab</span>
                          <span className="font-medium text-[#121214]">
                            {selectedRetailer.assignedSlab || 'Standard Tier (Pending Assignment)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7A746B] block">Order Volume Bracket</span>
                          <span className="font-medium text-[#121214]">
                            {selectedRetailer.orderVolume || 'Not Specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7A746B] block">GSTIN Number</span>
                          <span className="font-mono font-semibold text-[#121214]">
                            {selectedRetailer.gstin || (
                              <span className="text-amber-700">Unregistered / Form Pending</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7A746B] block">Store Format</span>
                          <span className="font-medium text-[#121214]">
                            {selectedRetailer.storeFormat || 'Boutique'}
                          </span>
                        </div>
                      </div>

                      {/* Sample Kit Status & Dispatch control */}
                      <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#7A746B] block">3-Piece Sample Kit Status</span>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mt-0.5 ${
                              SAMPLE_KIT_CONFIG[selectedRetailer.sampleKitStatus]?.bg || 'bg-stone-100'
                            } ${SAMPLE_KIT_CONFIG[selectedRetailer.sampleKitStatus]?.text || 'text-stone-700'}`}
                          >
                            {SAMPLE_KIT_CONFIG[selectedRetailer.sampleKitStatus]?.label || 'Not Requested'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {selectedRetailer.sampleKitStatus === 'requested' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateSampleKit('dispatched')}
                              disabled={isSubmitting}
                              className="rounded-lg bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
                            >
                              Mark Dispatched
                            </button>
                          )}
                          {selectedRetailer.sampleKitStatus === 'dispatched' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateSampleKit('credited')}
                              disabled={isSubmitting}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                            >
                              Mark Credited
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Credentials */}
                    <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-xs space-y-3">
                      <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#121214]">
                        Contact Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] text-[#7A746B] block">Official Email</span>
                          <a
                            href={`mailto:${selectedRetailer.email}`}
                            className="font-medium text-[#121214] hover:text-[#9A6D22] hover:underline"
                          >
                            {selectedRetailer.email}
                          </a>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#7A746B] block">Phone / WhatsApp</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#121214]">
                              {selectedRetailer.phone || selectedRetailer.mobile || '—'}
                            </span>
                            {(selectedRetailer.phone || selectedRetailer.mobile) && (
                              <a
                                href={`https://wa.me/${(selectedRetailer.phone || selectedRetailer.mobile).replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sourcing Categories */}
                    {Array.isArray(selectedRetailer.categories) && selectedRetailer.categories.length > 0 && (
                      <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-xs space-y-2">
                        <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#121214]">
                          Preferred Sourcing Categories
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedRetailer.categories.map((cat, i) => (
                            <span
                              key={i}
                              className="rounded-full border border-[#E8DEC9] bg-[#FAF8F5] px-2.5 py-1 font-mono text-[10px] font-medium text-[#6B6357]"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Addresses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-xs space-y-1 text-xs">
                        <span className="font-serif text-xs font-bold text-[#121214] block">
                          Billing Address
                        </span>
                        {selectedRetailer.billingAddress?.street ? (
                          <div className="text-[#6B6357] leading-relaxed">
                            <div>{selectedRetailer.billingAddress.street}</div>
                            <div>
                              {[
                                selectedRetailer.billingAddress.city,
                                selectedRetailer.billingAddress.state,
                                selectedRetailer.billingAddress.pincode,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                            <div>{selectedRetailer.billingAddress.country || 'India'}</div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#9A9386]">
                            {[selectedRetailer.cityState, selectedRetailer.pincode].filter(Boolean).join(', ') ||
                              'No separate billing address filed.'}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-xs space-y-1 text-xs">
                        <span className="font-serif text-xs font-bold text-[#121214] block">
                          Shipping Warehouse
                        </span>
                        {selectedRetailer.shippingAddress?.street ? (
                          <div className="text-[#6B6357] leading-relaxed">
                            <div>{selectedRetailer.shippingAddress.street}</div>
                            <div>
                              {[
                                selectedRetailer.shippingAddress.city,
                                selectedRetailer.shippingAddress.state,
                                selectedRetailer.shippingAddress.pincode,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                            <div>{selectedRetailer.shippingAddress.country || 'India'}</div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#9A9386]">
                            Same as registered billing location.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Review Notes */}
                    {selectedRetailer.adminNotes && (
                      <div className="rounded-2xl border border-[#E5D7B7] bg-[#FAF4E8] p-4 shadow-xs">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#9A6D22] font-semibold">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Executive Review Notes</span>
                        </div>
                        <p className="mt-1 text-xs text-[#5C4518] leading-relaxed">
                          {selectedRetailer.adminNotes}
                        </p>
                      </div>
                    )}
                  </>
                ) : drawerTab === 'orders' ? (
                  <div className="space-y-3">
                    {retailerOrders.length === 0 ? (
                      <div className="rounded-2xl border border-[#ECE4D5] bg-[#FAF8F5] p-8 text-center">
                        <p className="text-xs text-[#7A746B]">
                          No wholesale order manifests placed by this retailer yet.
                        </p>
                      </div>
                    ) : (
                      retailerOrders.map((ord) => (
                        <div
                          key={ord._id || ord.orderId}
                          className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-xs space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-2">
                            <div>
                              <span className="font-mono font-bold text-[#121214]">
                                {ord.orderId}
                              </span>
                              <span className="ml-2 font-mono text-[10px] text-[#7A746B]">
                                {formatDate(ord.createdAt)}
                              </span>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                                ['paid', 'success', 'captured'].includes(ord.paymentStatus)
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {ord.status || ord.paymentStatus || 'Placed'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <div>
                              <span className="text-[10px] text-[#7A746B] block">Units</span>
                              <span className="font-medium text-[#121214]">
                                {ord.totalUnits || ord.items?.length || 0} pcs
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#7A746B] block">Net Payable</span>
                              <span className="font-serif font-bold text-[#121214]">
                                {formatPrice(ord.pricing?.totalPayable || 0)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#7A746B] block">Payment Mode</span>
                              <span className="font-mono text-[11px] text-[#6B6357] uppercase">
                                {ord.paymentMethod || 'Razorpay / Bank'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Edit Tab */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#121214] uppercase tracking-wider mb-1">
                        Trade Clearance Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2 text-xs font-medium text-[#121214] focus:border-[#C59A46] focus:outline-none"
                      >
                        <option value="pending">Pending Review (Clearance Awaiting)</option>
                        <option value="verified">Verified Partner (Trade Pass Active)</option>
                        <option value="suspended">Suspended (Trade Pass Revoked)</option>
                        <option value="rejected">Rejected (Application Declined)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#121214] uppercase tracking-wider mb-1">
                        Commercial Slab &amp; Volume Discount
                      </label>
                      <select
                        value={editSlab}
                        onChange={(e) => setEditSlab(e.target.value)}
                        className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2 text-xs font-medium text-[#121214] focus:border-[#C59A46] focus:outline-none"
                      >
                        <option value="">Select or leave standard</option>
                        {SLAB_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#121214] uppercase tracking-wider mb-1">
                        GSTIN Number
                      </label>
                      <input
                        type="text"
                        value={editGstin}
                        onChange={(e) => setEditGstin(e.target.value.toUpperCase())}
                        placeholder="e.g. 07AAAAA0000A1Z5"
                        className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2 font-mono text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none uppercase"
                      >
                      </input>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#121214] uppercase tracking-wider mb-1">
                        Sample Kit Status
                      </label>
                      <select
                        value={editSampleKit}
                        onChange={(e) => setEditSampleKit(e.target.value)}
                        className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2 text-xs font-medium text-[#121214] focus:border-[#C59A46] focus:outline-none"
                      >
                        <option value="none">None / Not Requested</option>
                        <option value="requested">Requested by Retailer</option>
                        <option value="dispatched">Dispatched from Warehouse</option>
                        <option value="credited">Credited on First Bulk Order</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#121214] uppercase tracking-wider mb-1">
                        Executive Review Notes
                      </label>
                      <textarea
                        rows={3}
                        value={editAdminNotes}
                        onChange={(e) => setEditAdminNotes(e.target.value)}
                        placeholder="Record review notes, verification phone call details, or special terms..."
                        className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] p-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                      />
                    </div>

                    <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDrawerTab('overview')}
                        className="rounded-xl border border-[#DFD5C2] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold text-[#6B6357] hover:bg-[#FAF8F5]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveRetailerDetails}
                        disabled={isSubmitting}
                        className="rounded-xl bg-[#C59A46] px-5 py-2 font-mono text-xs font-bold text-[#121214] shadow-xs hover:bg-[#D4AC5B] disabled:opacity-60"
                      >
                        {isSubmitting ? 'Saving Changes...' : 'Save Retailer Profile'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && retailerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121214]/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#E8DEC9] bg-[#FFFFFF] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#121214]">
                  Delete Retailer Account?
                </h3>
                <p className="text-xs text-[#7A746B]">
                  Are you sure you want to remove <span className="font-semibold text-[#121214]">{retailerToDelete.storeName || retailerToDelete.name}</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setRetailerToDelete(null)
                }}
                className="rounded-xl border border-[#DFD5C2] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold text-[#6B6357] hover:bg-[#FAF8F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="rounded-xl bg-red-600 px-4 py-2 font-mono text-xs font-bold text-white shadow-xs hover:bg-red-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Store'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
