import { useState, useEffect } from 'react'
import {
  getAdminInquiriesApi,
  updateAdminInquiryStatusApi,
  deleteAdminInquiryApi,
  getAdminContactConfigApi,
  updateAdminContactConfigApi,
} from '../api'

const STATUS_BADGES = {
  new: { label: 'New / Unread', bg: 'bg-[#FDF2F1] text-[#B92D25] border-[#F0BCB8]', dot: 'bg-[#B92D25]' },
  in_review: { label: 'In Review', bg: 'bg-[#FAF3E4] text-[#805915] border-[#E5D3AF]', dot: 'bg-[#805915]' },
  contacted: { label: 'Contacted', bg: 'bg-[#F0F6FB] text-[#2980B9] border-[#BCD9EE]', dot: 'bg-[#2980B9]' },
  converted: { label: 'Converted Partner', bg: 'bg-[#F1F9F3] text-[#1E824C] border-[#BDE0C7]', dot: 'bg-[#1E824C]' },
  closed: { label: 'Closed / Archived', bg: 'bg-[#F5F2EB] text-[#7A746B] border-[#DFD6C5]', dot: 'bg-[#7A746B]' },
}

export default function ContactManagementView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('inquiries') // 'inquiries' | 'settings'

  // Inquiries State
  const [inquiries, setInquiries] = useState([])
  const [metrics, setMetrics] = useState({
    total: 0,
    new: 0,
    inReview: 0,
    contacted: 0,
    converted: 0,
    closed: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // View / Edit Modal State
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [modalStatus, setModalStatus] = useState('new')
  const [modalNotes, setModalNotes] = useState('')
  const [modalAssignedTo, setModalAssignedTo] = useState('')
  const [isUpdatingInquiry, setIsUpdatingInquiry] = useState(false)

  // Contact Desk Config State
  const [configData, setConfigData] = useState({
    supportEmail: '',
    supportPhone: '',
    whatsappNumber: '',
    businessHours: '',
    showroomAddress: '',
    millAddress: '',
    responseCommitment: '',
  })
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  // Notifications
  const [toastMessage, setToastMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  // Load Inquiries
  const fetchInquiries = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const params = {}
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (searchQuery.trim()) params.search = searchQuery.trim()

      const res = await getAdminInquiriesApi(params)
      if (res?.success) {
        setInquiries(Array.isArray(res.inquiries) ? res.inquiries : [])
        if (res.metrics) setMetrics(res.metrics)
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to load inquiries.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Load Config
  const fetchConfig = async () => {
    try {
      const res = await getAdminContactConfigApi()
      if (res?.success && res.config) {
        setConfigData({
          supportEmail: res.config.supportEmail || 'wholesale@buddyvsbuff.com',
          supportPhone: res.config.supportPhone || '+91 98204 00142',
          whatsappNumber: res.config.whatsappNumber || '+919820400142',
          businessHours: res.config.businessHours || 'Mon – Sat · 10:00 – 19:00 IST',
          showroomAddress: res.config.showroomAddress || 'Kamala Mills, Lower Parel, Mumbai',
          millAddress: res.config.millAddress || 'Avinashi Apparel Zone, Tiruppur, Tamil Nadu',
          responseCommitment: res.config.responseCommitment || '< 4h reply for verified GST accounts',
        })
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchInquiries()
    fetchConfig()
  }, [statusFilter])

  // Open Inquiry Details Modal
  const handleOpenModal = (inq) => {
    setSelectedInquiry(inq)
    setModalStatus(inq.status || 'new')
    setModalNotes(inq.adminNotes || '')
    setModalAssignedTo(inq.assignedTo || currentUser?.name || '')
  }

  // Save Inquiry Status & Notes
  const handleSaveInquiry = async (e) => {
    e?.preventDefault()
    if (!selectedInquiry) return

    setIsUpdatingInquiry(true)
    try {
      const res = await updateAdminInquiryStatusApi(selectedInquiry._id, {
        status: modalStatus,
        adminNotes: modalNotes,
        assignedTo: modalAssignedTo,
      })

      if (res.success) {
        showToast(`Inquiry ${selectedInquiry.ticketId} updated.`)
        setSelectedInquiry(null)
        fetchInquiries()
      } else {
        alert(res.message || 'Failed to update inquiry.')
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error updating inquiry.')
    } finally {
      setIsUpdatingInquiry(false)
    }
  }

  // Quick Status Change directly from table
  const handleQuickStatusChange = async (inqId, newStatus) => {
    try {
      const res = await updateAdminInquiryStatusApi(inqId, { status: newStatus })
      if (res.success) {
        showToast('Status updated successfully.')
        fetchInquiries()
      }
    } catch {
      alert('Failed to update status.')
    }
  }

  // Delete Inquiry
  const handleDeleteInquiry = async (inq) => {
    if (!window.confirm(`Permanently delete inquiry ${inq.ticketId} from ${inq.businessName}?`)) {
      return
    }

    try {
      const res = await deleteAdminInquiryApi(inq._id)
      if (res.success) {
        showToast(`Deleted inquiry ${inq.ticketId}.`)
        fetchInquiries()
      }
    } catch {
      alert('Failed to delete inquiry.')
    }
  }

  // Save Contact Config
  const handleSaveConfig = async (e) => {
    e.preventDefault()
    setIsSavingConfig(true)
    try {
      const res = await updateAdminContactConfigApi(configData)
      if (res.success) {
        showToast('Contact desk information updated and live on storefront!')
      } else {
        alert(res.message || 'Failed to update configuration.')
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error saving contact configuration.')
    } finally {
      setIsSavingConfig(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#ECE4D5] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D9AE6A]/40 bg-[#FAF3E4] px-3 py-0.5 shadow-2xs mb-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#805915]">
              B2B Concierge &amp; Inquiries
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#121214]">
            Wholesale Inquiries &amp; Contact Desk
          </h2>
          <p className="text-xs text-[#6E685E] mt-1">
            Incoming boutique onboarding inquiries, sample kit requests, and public contact information management.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#DFD6C5] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'inquiries'
                ? 'bg-[#121214] text-[#FAD79F] shadow-xs'
                : 'text-[#5A544B] hover:text-[#121214]'
            }`}
          >
            Inquiries Queue ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#121214] text-[#FAD79F] shadow-xs'
                : 'text-[#5A544B] hover:text-[#121214]'
            }`}
          >
            Contact Desk Settings
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl border border-[#BDE0C7] bg-[#F1F9F3] p-4 text-xs font-medium text-[#1E824C] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-[#F0BCB8] bg-[#FDF2F1] p-4 text-xs font-medium text-[#B92D25] flex items-center gap-2 shadow-2xs">
          <span className="text-base">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: INQUIRIES QUEUE
          ========================================================================= */}
      {activeTab === 'inquiries' && (
        <div className="space-y-5">
          {/* KPI Counters Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                statusFilter === 'ALL'
                  ? 'border-[#C59A46] bg-[#FCFAF6] shadow-xs ring-1 ring-[#C59A46]/20'
                  : 'border-[#ECE4D5] bg-[#FFFFFF] hover:border-[#D5C9B5]'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
                All Inquiries
              </div>
              <div className="font-serif text-2xl font-bold text-[#121214] mt-1">
                {metrics.total}
              </div>
            </div>

            <div
              onClick={() => setStatusFilter('new')}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                statusFilter === 'new'
                  ? 'border-[#B92D25] bg-[#FDF2F1] shadow-xs ring-1 ring-[#B92D25]/20'
                  : 'border-[#ECE4D5] bg-[#FFFFFF] hover:border-[#D5C9B5]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
                  New / Unread
                </span>
                {metrics.new > 0 && (
                  <span className="h-2 w-2 rounded-full bg-[#B92D25] animate-pulse" />
                )}
              </div>
              <div className="font-serif text-2xl font-bold text-[#B92D25] mt-1">
                {metrics.new}
              </div>
            </div>

            <div
              onClick={() => setStatusFilter('in_review')}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                statusFilter === 'in_review'
                  ? 'border-[#805915] bg-[#FAF3E4] shadow-xs ring-1 ring-[#805915]/20'
                  : 'border-[#ECE4D5] bg-[#FFFFFF] hover:border-[#D5C9B5]'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
                In Review
              </div>
              <div className="font-serif text-2xl font-bold text-[#805915] mt-1">
                {metrics.inReview}
              </div>
            </div>

            <div
              onClick={() => setStatusFilter('contacted')}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                statusFilter === 'contacted'
                  ? 'border-[#2980B9] bg-[#F0F6FB] shadow-xs ring-1 ring-[#2980B9]/20'
                  : 'border-[#ECE4D5] bg-[#FFFFFF] hover:border-[#D5C9B5]'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
                Contacted
              </div>
              <div className="font-serif text-2xl font-bold text-[#2980B9] mt-1">
                {metrics.contacted}
              </div>
            </div>

            <div
              onClick={() => setStatusFilter('converted')}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                statusFilter === 'converted'
                  ? 'border-[#1E824C] bg-[#F1F9F3] shadow-xs ring-1 ring-[#1E824C]/20'
                  : 'border-[#ECE4D5] bg-[#FFFFFF] hover:border-[#D5C9B5]'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
                Converted Partners
              </div>
              <div className="font-serif text-2xl font-bold text-[#1E824C] mt-1">
                {metrics.converted}
              </div>
            </div>
          </div>

          {/* Search & Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E9E1D2] shadow-2xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInquiries()}
                placeholder="Search ticket, buyer, store, phone..."
                className="w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2 pl-3.5 pr-4 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={fetchInquiries}
                disabled={isLoading}
                className="rounded-lg border border-[#DFD6C5] bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-semibold text-[#5A544B] hover:bg-[#FAF8F5] cursor-pointer"
              >
                {isLoading ? 'Refreshing...' : '↻ Refresh Queue'}
              </button>
            </div>
          </div>

          {/* Inquiries Table */}
          <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAE3D5] bg-[#FCFAF7] text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A746B]">
                  <tr>
                    <th className="py-3.5 px-5">Ticket &amp; Status</th>
                    <th className="py-3.5 px-5">Boutique &amp; Buyer</th>
                    <th className="py-3.5 px-5">Direct Contact</th>
                    <th className="py-3.5 px-5">Inquiry Topic &amp; Volume</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9DF]">
                  {inquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[#7A746B]">
                        {isLoading ? 'Loading inquiries...' : 'No inquiries found matching criteria.'}
                      </td>
                    </tr>
                  ) : (
                    inquiries.map((inq) => {
                      const badge = STATUS_BADGES[inq.status] || STATUS_BADGES.new
                      const cleanPhone = inq.phone ? inq.phone.replace(/[^0-9]/g, '') : ''
                      const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
                      const waUrl = waPhone
                        ? `https://wa.me/${waPhone}?text=${encodeURIComponent(
                            `Hello ${inq.fullName}, this is the Buddy Vs Buff Wholesale Buying Desk regarding your enquiry (${inq.ticketId}) for ${inq.businessName}.`
                          )}`
                        : null

                      return (
                        <tr key={inq._id} className="hover:bg-[#FAF7F1] transition-colors">
                          {/* Ticket & Status */}
                          <td className="py-4 px-5">
                            <div className="font-mono font-bold text-xs text-[#121214]">
                              {inq.ticketId}
                            </div>
                            <div className="mt-1">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 border font-mono text-[9px] font-bold uppercase ${badge.bg}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                {badge.label}
                              </span>
                            </div>
                          </td>

                          {/* Boutique & Buyer */}
                          <td className="py-4 px-5">
                            <div className="font-semibold text-xs text-[#121214]">
                              {inq.businessName}
                            </div>
                            <div className="text-[11px] text-[#7A746B]">
                              {inq.fullName} {inq.city ? `· ${inq.city}` : ''}
                            </div>
                          </td>

                          {/* Direct Contact with 1-click WhatsApp */}
                          <td className="py-4 px-5">
                            <div className="font-mono text-xs text-[#121214] flex items-center gap-2">
                              <span>{inq.phone || 'No phone'}</span>
                              {waUrl && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Chat with buyer on WhatsApp"
                                  className="inline-flex items-center gap-1 rounded bg-[#E8F5E9] border border-[#A5D6A7] px-1.5 py-0.5 font-sans text-[10px] font-bold text-[#1E824C] hover:bg-[#C8E6C9] transition-colors"
                                >
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                            <a
                              href={`mailto:${inq.email}`}
                              className="text-[11px] font-mono text-[#7A746B] hover:text-[#805915] underline block mt-0.5"
                            >
                              {inq.email}
                            </a>
                          </td>

                          {/* Topic & Volume */}
                          <td className="py-4 px-5 max-w-xs">
                            <div className="font-semibold text-xs text-[#121214] truncate">
                              {inq.topic}
                            </div>
                            <div className="text-[11px] font-mono text-[#805915]">
                              {inq.volume}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-5 font-mono text-[11px] text-[#7A746B]">
                            {inq.createdAt
                              ? new Date(inq.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Quick Status Dropdown */}
                              <select
                                value={inq.status}
                                onChange={(e) => handleQuickStatusChange(inq._id, e.target.value)}
                                className="rounded border border-[#DED4C3] bg-[#FCFBF8] py-1 px-2 text-[10px] font-semibold text-[#121214] cursor-pointer"
                              >
                                <option value="new">New</option>
                                <option value="in_review">In Review</option>
                                <option value="contacted">Contacted</option>
                                <option value="converted">Converted</option>
                                <option value="closed">Closed</option>
                              </select>

                              {/* Details Modal Trigger */}
                              <button
                                type="button"
                                onClick={() => handleOpenModal(inq)}
                                className="rounded border border-[#DED4C3] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-bold text-[#121214] hover:bg-[#FAF8F5] cursor-pointer"
                              >
                                View
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteInquiry(inq)}
                                className="rounded border border-[#F0BCB8] bg-[#FDF2F1] px-2 py-1 text-[11px] font-semibold text-[#B92D25] hover:bg-[#FBE4E2] cursor-pointer"
                                title="Delete inquiry"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-[#ECE4D5] bg-[#FAF8F5] px-5 py-3 text-xs text-[#7A746B] flex items-center justify-between">
              <span>Connected to MongoDB Buyer Inquiries Queue</span>
              <span className="font-mono text-[10px] text-[#9A6D22]">
                Active SLA: &lt; 4 Hours Response Target
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CONTACT DESK SETTINGS
          ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="border-b border-[#ECE4D5] pb-4">
              <h3 className="font-serif text-sm font-bold text-[#121214] uppercase tracking-wider">
                Public Storefront Contact Coordinates
              </h3>
              <p className="text-xs text-[#6E685E] mt-1">
                Edit the direct communication channels displayed on the Contact Us page and footer directory.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Wholesale Support Email *
                </label>
                <input
                  type="email"
                  required
                  value={configData.supportEmail}
                  onChange={(e) => setConfigData({ ...configData, supportEmail: e.target.value })}
                  placeholder="wholesale@buddyvsbuff.com"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Direct Buyer Phone Line *
                </label>
                <input
                  type="text"
                  required
                  value={configData.supportPhone}
                  onChange={(e) => setConfigData({ ...configData, supportPhone: e.target.value })}
                  placeholder="+91 98204 00142"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  WhatsApp Number (with country code)
                </label>
                <input
                  type="text"
                  value={configData.whatsappNumber}
                  onChange={(e) => setConfigData({ ...configData, whatsappNumber: e.target.value })}
                  placeholder="+919820400142"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Business Hours *
                </label>
                <input
                  type="text"
                  required
                  value={configData.businessHours}
                  onChange={(e) => setConfigData({ ...configData, businessHours: e.target.value })}
                  placeholder="Mon – Sat · 10:00 – 19:00 IST"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Mumbai Showroom Address
                </label>
                <input
                  type="text"
                  value={configData.showroomAddress}
                  onChange={(e) => setConfigData({ ...configData, showroomAddress: e.target.value })}
                  placeholder="Kamala Mills, Lower Parel, Mumbai"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Tiruppur Mill Floor Address
                </label>
                <input
                  type="text"
                  value={configData.millAddress}
                  onChange={(e) => setConfigData({ ...configData, millAddress: e.target.value })}
                  placeholder="Avinashi Apparel Zone, Tiruppur, Tamil Nadu"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Response Time Commitment Note
                </label>
                <input
                  type="text"
                  value={configData.responseCommitment}
                  onChange={(e) => setConfigData({ ...configData, responseCommitment: e.target.value })}
                  placeholder="Rate slabs &amp; catalogues · &lt; 4h reply for verified GST accounts"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#ECE4D5] flex justify-end">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="luxury-shimmer-btn rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm hover:shadow transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSavingConfig ? 'Saving Settings...' : 'Save Contact Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          INQUIRY DETAILS & NOTES MODAL
          ========================================================================= */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121214]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ECE4D5] px-6 py-4 bg-[#FAF8F5]">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#805915]">
                  Inquiry Ticket {selectedInquiry.ticketId}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#121214]">
                  {selectedInquiry.businessName}
                </h3>
                <p className="text-[11px] text-[#7A746B]">
                  Submitted by {selectedInquiry.fullName} on{' '}
                  {new Date(selectedInquiry.createdAt).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="rounded-lg p-1.5 text-[#7A746B] hover:text-[#121214] hover:bg-[#F0EBE1] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveInquiry} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Buyer Contact Card */}
              <div className="rounded-xl border border-[#ECE4D5] bg-[#FCFBF8] p-3.5 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A746B]">Email:</span>
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      className="block font-semibold text-[#121214] underline truncate"
                    >
                      {selectedInquiry.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A746B]">Phone:</span>
                    <div className="font-semibold text-[#121214]">
                      {selectedInquiry.phone || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A746B]">City:</span>
                    <div className="font-semibold text-[#121214]">
                      {selectedInquiry.city || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A746B]">Target Volume:</span>
                    <div className="font-semibold text-[#805915]">
                      {selectedInquiry.volume}
                    </div>
                  </div>
                </div>

                {/* Direct Action Links */}
                <div className="pt-2 border-t border-[#F0EAE0] flex items-center gap-2">
                  {selectedInquiry.phone && (
                    <a
                      href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hello ${selectedInquiry.fullName}, this is BVB Buying Desk regarding your wholesale enquiry ${selectedInquiry.ticketId}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F5E9] border border-[#A5D6A7] px-3 py-1 font-bold text-[#1E824C] hover:bg-[#C8E6C9]"
                    >
                      <span>💬 Chat on WhatsApp</span>
                    </a>
                  )}
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(
                      `BVB Wholesale Buying Desk - ${selectedInquiry.ticketId}`
                    )}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#F0F6FB] border border-[#BCD9EE] px-3 py-1 font-bold text-[#2980B9] hover:bg-[#E1EFF8]"
                  >
                    <span>✉ Reply by Email</span>
                  </a>
                </div>
              </div>

              {/* Inquiry Message */}
              <div>
                <label className="block text-[10.5px] font-mono uppercase tracking-wider text-[#7A746B]">
                  Buyer's Message / Requirement:
                </label>
                <div className="mt-1 p-3 rounded-lg border border-[#E9E1D2] bg-[#FAF8F5] text-xs text-[#121214] whitespace-pre-wrap leading-relaxed">
                  {selectedInquiry.message || 'No additional message provided.'}
                </div>
              </div>

              {/* Status Selector */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-[#7A746B]">
                    Inquiry Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2 px-3 text-xs font-semibold text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  >
                    <option value="new">New / Unread</option>
                    <option value="in_review">In Review</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted Partner</option>
                    <option value="closed">Closed / Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-[#7A746B]">
                    Assigned Desk Executive
                  </label>
                  <input
                    type="text"
                    value={modalAssignedTo}
                    onChange={(e) => setModalAssignedTo(e.target.value)}
                    placeholder="e.g. Aman B."
                    className="mt-1 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2 px-3 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div>
                <label className="block text-[10.5px] font-mono uppercase tracking-wider text-[#7A746B]">
                  Internal Buying Desk Notes (Confidential)
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Record call summary, sample kit dispatched, pricing quoted, or follow-up dates..."
                  className="mt-1 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] p-2.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#ECE4D5] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteInquiry(selectedInquiry)}
                  className="text-xs font-semibold text-[#B92D25] hover:underline cursor-pointer"
                >
                  Delete Inquiry
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(null)}
                    className="rounded-lg border border-[#DFD6C5] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold text-[#5A544B] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingInquiry}
                    className="rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm hover:shadow disabled:opacity-60 cursor-pointer"
                  >
                    {isUpdatingInquiry ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
