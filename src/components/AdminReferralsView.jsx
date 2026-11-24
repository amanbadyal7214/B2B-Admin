/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import {
  getAdminReferralsListApi,
  getAdminReferralConfigApi,
  updateAdminReferralConfigApi,
  overrideReferralApi,
  getAdminUserLedgerApi,
  createAdminAdjustmentApi,
  getAdminReferralReportsApi,
  triggerMaturedReferralsApi,
  getAdminRetailersApi,
} from '../api/adminApi'

export default function AdminReferralsView() {
  const [activeTab, setActiveTab] = useState('referrals') // 'referrals' | 'rules' | 'ledger' | 'reports'

  // Reports & Overview Stats
  const [reports, setReports] = useState(null)
  const [isLoadingReports, setIsLoadingReports] = useState(false)

  // Referrals List State
  const [referrals, setReferrals] = useState([])
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [fraudOnly, setFraudOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Config State
  const [config, setConfig] = useState({
    rewardType: 'wallet_credit',
    referrerRewardAmount: 1000,
    refereeRewardAmount: 500,
    minFirstOrderValue: 10000,
    returnWindowDays: 7,
    monthlyReferralCap: 10,
    monthlyRewardCap: 25000,
    maxOrderRedemptionPercent: 20,
    rewardExpiryDays: 365,
    isActive: true,
  })
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  // Ledger Inspector State
  const [retailers, setRetailers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [userLedger, setUserLedger] = useState(null)
  const [isLoadingLedger, setIsLoadingLedger] = useState(false)

  // Adjustment Modal State
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false)
  const [adjData, setAdjData] = useState({
    amount: '',
    type: 'credit',
    note: '',
  })
  const [isSubmittingAdj, setIsSubmittingAdj] = useState(false)

  // Override Modal State
  const [overrideTarget, setOverrideTarget] = useState(null)
  const [overrideAction, setOverrideAction] = useState('blocked')
  const [overrideReason, setOverrideReason] = useState('')
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false)

  // UI Feedback
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Load Initial Overview & Config
  const loadReportsAndConfig = async () => {
    try {
      setIsLoadingReports(true)
      const [repRes, cfgRes] = await Promise.all([
        getAdminReferralReportsApi(),
        getAdminReferralConfigApi(),
      ])
      if (repRes?.success) setReports(repRes)
      if (cfgRes?.success && cfgRes.config) setConfig(cfgRes.config)
    } catch (err) {
      console.warn('Reports/Config load error:', err)
    } finally {
      setIsLoadingReports(false)
    }
  }

  // Load Referrals List
  const loadReferrals = async (page = 1) => {
    try {
      setIsLoadingReferrals(true)
      const res = await getAdminReferralsListApi({
        status: statusFilter,
        search: searchQuery,
        fraudOnly: fraudOnly ? 'true' : 'false',
        page,
        limit: 25,
      })
      if (res?.success) {
        setReferrals(res.referrals || [])
        setTotalPages(res.totalPages || 1)
        setCurrentPage(res.page || 1)
        setTotalCount(res.totalCount || 0)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load referral records.')
    } finally {
      setIsLoadingReferrals(false)
    }
  }

  // Load Retailers for Ledger Search
  const loadRetailers = async () => {
    try {
      const res = await getAdminRetailersApi({ limit: 100 })
      if (res?.success && Array.isArray(res.retailers)) {
        setRetailers(res.retailers)
        if (!selectedUserId && res.retailers.length > 0) {
          setSelectedUserId(res.retailers[0]._id)
        }
      }
    } catch (e) {
      console.warn('Failed to load retailers list:', e)
    }
  }

  // Load User Ledger
  const loadLedger = async (uid) => {
    if (!uid) return
    try {
      setIsLoadingLedger(true)
      const res = await getAdminUserLedgerApi(uid)
      if (res?.success) {
        setUserLedger(res)
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch ledger.')
    } finally {
      setIsLoadingLedger(false)
    }
  }

  useEffect(() => {
    loadReportsAndConfig()
    loadRetailers()
  }, [])

  useEffect(() => {
    if (activeTab === 'referrals') {
      loadReferrals(currentPage)
    }
  }, [activeTab, statusFilter, fraudOnly, currentPage])

  useEffect(() => {
    if (activeTab === 'ledger' && selectedUserId) {
      loadLedger(selectedUserId)
    }
  }, [activeTab, selectedUserId])

  // Auto-dismiss banners
  useEffect(() => {
    if (feedbackMsg) {
      const t = setTimeout(() => setFeedbackMsg(''), 4000)
      return () => clearTimeout(t)
    }
  }, [feedbackMsg])

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    try {
      setIsSavingConfig(true)
      const res = await updateAdminReferralConfigApi(config)
      if (res?.success) {
        setFeedbackMsg('✓ Referral program parameters and anti-abuse caps updated.')
        loadReportsAndConfig()
      } else {
        setErrorMsg(res?.message || 'Failed to update configuration.')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error updating configuration.')
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleTriggerMatured = async () => {
    try {
      const res = await triggerMaturedReferralsApi()
      if (res?.success) {
        setFeedbackMsg(`✓ Batch completed: ${res.message}`)
        loadReferrals(currentPage)
        loadReportsAndConfig()
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Batch trigger failed.')
    }
  }

  const handleOverrideSubmit = async (e) => {
    e.preventDefault()
    if (!overrideTarget) return
    try {
      setIsSubmittingOverride(true)
      const res = await overrideReferralApi(
        overrideTarget._id,
        overrideAction,
        overrideReason
      )
      if (res?.success) {
        setFeedbackMsg(`✓ Referral marked as ${overrideAction}.`)
        setOverrideTarget(null)
        setOverrideReason('')
        loadReferrals(currentPage)
        loadReportsAndConfig()
      } else {
        setErrorMsg(res?.message || 'Override failed.')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error updating override.')
    } finally {
      setIsSubmittingOverride(false)
    }
  }

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUserId || !adjData.amount || !adjData.note) {
      setErrorMsg('Please enter an amount and a mandatory reason.')
      return
    }
    try {
      setIsSubmittingAdj(true)
      const res = await createAdminAdjustmentApi({
        userId: selectedUserId,
        amount: Number(adjData.amount),
        type: adjData.type,
        note: adjData.note,
      })
      if (res?.success) {
        setFeedbackMsg(`✓ Manual ${adjData.type} adjustment logged successfully.`)
        setIsAdjModalOpen(false)
        setAdjData({ amount: '', type: 'credit', note: '' })
        loadLedger(selectedUserId)
        loadReportsAndConfig()
      } else {
        setErrorMsg(res?.message || 'Adjustment failed.')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error processing adjustment.')
    } finally {
      setIsSubmittingAdj(false)
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECE4D5] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#F95700]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#A67C38] font-bold">
              Milestone 9 · FR-12
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold text-[#121214] sm:text-3xl">
            Referral Marketing &amp; Rewards Wallet Ledger
          </h1>
          <p className="mt-1 text-xs text-[#7A746B]">
            Automated qualification, anti-abuse fraud rules, and immutable double-entry store credit ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerMatured}
            title="Scan & credit referrals whose return window has elapsed"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#DFD5C2] bg-white px-3.5 py-2 font-mono text-xs font-semibold text-[#121214] hover:bg-[#FAF8F5] transition-colors cursor-pointer shadow-2xs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            <span>Process Matured (Cron Run)</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedbackMsg && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 shadow-xs flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} className="text-emerald-700 hover:text-emerald-950">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-900 shadow-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-700 hover:text-rose-950">✕</button>
        </div>
      )}

      {/* Top 4 Financial & Operational Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Rewards Issued */}
        <div className="rounded-2xl border border-[#DFD5C2] bg-white p-4 shadow-sm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8A847B] block">
            Total Rewards Issued
          </span>
          <span className="mt-1 font-serif text-2xl font-bold text-[#121214] block">
            {formatCurrency(reports?.totals?.totalIssued || 0)}
          </span>
          <span className="mt-1 text-[11px] text-emerald-700 font-medium block">
            Across {reports?.totals?.creditedCount || 0} credited referrals
          </span>
        </div>

        {/* Total Redeemed */}
        <div className="rounded-2xl border border-[#DFD5C2] bg-white p-4 shadow-sm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8A847B] block">
            Total Redeemed at Checkout
          </span>
          <span className="mt-1 font-serif text-2xl font-bold text-[#805915] block">
            {formatCurrency(reports?.totals?.totalRedeemed || 0)}
          </span>
          <span className="mt-1 text-[11px] text-[#7A746B] block">
            Applied against live cartons
          </span>
        </div>

        {/* Outstanding Liability */}
        <div className="rounded-2xl border border-[#D9AE6A] bg-[#FAF8F5] p-4 shadow-sm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#9A6D22] block">
            Outstanding Financial Liability
          </span>
          <span className="mt-1 font-serif text-2xl font-bold text-[#9A6D22] block">
            {formatCurrency(reports?.totals?.outstandingLiability || 0)}
          </span>
          <span className="mt-1 text-[11px] text-[#805915] font-medium block">
            Unredeemed wallet credit balance
          </span>
        </div>

        {/* Fraud & Moderation Alerts */}
        <div className={`rounded-2xl border p-4 shadow-sm ${
          (reports?.totals?.fraudCount || 0) > 0
            ? 'border-rose-300 bg-rose-50/70 text-rose-950'
            : 'border-[#DFD5C2] bg-white text-[#121214]'
        }`}>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider block opacity-75">
            Security &amp; Fraud Flags
          </span>
          <span className="mt-1 font-serif text-2xl font-bold block">
            {reports?.totals?.fraudCount || 0}
          </span>
          <span className="mt-1 text-[11px] block opacity-85">
            Matching IP / GSTIN / Phone flags
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#DFD5C2] bg-white rounded-t-xl px-4 pt-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          className={`px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'referrals'
              ? 'border-[#F95700] text-[#F95700]'
              : 'border-transparent text-[#7A746B] hover:text-[#121214]'
          }`}
        >
          Referral Moderation ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'rules'
              ? 'border-[#F95700] text-[#F95700]'
              : 'border-transparent text-[#7A746B] hover:text-[#121214]'
          }`}
        >
          Reward Rules &amp; Caps
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-[#F95700] text-[#F95700]'
              : 'border-transparent text-[#7A746B] hover:text-[#121214]'
          }`}
        >
          User Ledger &amp; Manual Adjustment
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'border-[#F95700] text-[#F95700]'
              : 'border-transparent text-[#7A746B] hover:text-[#121214]'
          }`}
        >
          Top Referrers Leaderboard
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REFERRAL MODERATION & TABLE                                        */}
      {/* ========================================================================= */}
      {activeTab === 'referrals' && (
        <div className="bg-white rounded-2xl border border-[#DFD5C2] p-5 shadow-sm space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {['all', 'pending', 'qualified', 'credited', 'reversed', 'blocked'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st)
                    setCurrentPage(1)
                  }}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#121214] text-white font-bold'
                      : 'bg-[#FAF8F5] border border-[#DFD5C2] text-[#6E675E] hover:text-[#121214]'
                  }`}
                >
                  {st}
                </button>
              ))}

              <label className="flex items-center gap-1.5 ml-2 text-xs font-mono text-rose-900 cursor-pointer bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
                <input
                  type="checkbox"
                  checked={fraudOnly}
                  onChange={(e) => {
                    setFraudOnly(e.target.checked)
                    setCurrentPage(1)
                  }}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Fraud Flags Only</span>
              </label>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <input
                type="text"
                placeholder="Search code, buyer, store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadReferrals(1)}
                className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] py-1.5 pl-3 pr-8 text-xs text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
              />
              <button
                type="button"
                onClick={() => loadReferrals(1)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8A847B] hover:text-[#121214]"
              >
                🔍
              </button>
            </div>
          </div>

          {/* Table */}
          {isLoadingReferrals ? (
            <div className="py-12 text-center font-mono text-xs text-[#8A847B]">
              Loading referrals database...
            </div>
          ) : referrals.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs text-[#8A847B]">
              No matching referral records found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#ECE4D5]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#ECE4D5] font-mono text-[10px] uppercase text-[#7A746B]">
                  <tr>
                    <th className="py-3 px-3.5">Code / Referrer</th>
                    <th className="py-3 px-3">Referred Buyer (Referee)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Order Value</th>
                    <th className="py-3 px-3 text-right">Reward</th>
                    <th className="py-3 px-3">Lifecycle / Window</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE1]">
                  {referrals.map((r) => {
                    const isFraud = r.isFraudFlagged || r.fraudFlags?.length > 0
                    return (
                      <tr key={r._id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-[#F95700] block">
                            {r.referralCode}
                          </span>
                          <span className="font-semibold text-[#121214] block">
                            {r.referrerStoreName || r.referrerName || r.referrerId?.name || 'Referrer'}
                          </span>
                          <span className="font-mono text-[10px] text-[#8A847B] block">
                            {r.referrerId?.phone || r.referrerId?.email || ''}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#121214] block">
                            {r.referredStoreName || r.referredName || r.referredId?.name || 'Referee'}
                          </span>
                          <span className="font-mono text-[10px] text-[#8A847B] block">
                            {r.referredId?.phone || r.referredId?.email || ''}
                          </span>
                          {isFraud && (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-800 font-mono mt-1">
                              ⚠️ {r.fraudFlags?.[0]?.flagType || 'Fraud Alert'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                            r.status === 'credited'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : r.status === 'qualified'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : r.status === 'blocked'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : r.status === 'reversed'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                          }`}>
                            {r.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          {r.qualifiedOrderValue ? (
                            <div>
                              <span className="font-bold text-[#121214] block">
                                {formatCurrency(r.qualifiedOrderValue)}
                              </span>
                              <span className="text-[10px] text-[#8A847B] block">
                                {r.qualifiedOrderId}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#8A847B]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          +{formatCurrency(r.rewardAmount)}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-[#5C5852]">
                          {r.status === 'credited' ? (
                            <span className="text-emerald-800">
                              Credited on {new Date(r.creditedAt).toLocaleDateString('en-IN')}
                            </span>
                          ) : r.status === 'qualified' && r.returnWindowEndsAt ? (
                            <div>
                              <span className="font-mono text-[#9A6D22] font-semibold block">
                                Return window ends:
                              </span>
                              <span>{new Date(r.returnWindowEndsAt).toLocaleDateString('en-IN')}</span>
                            </div>
                          ) : (
                            <span className="text-[#8A847B]">
                              Registered {new Date(r.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {r.status === 'blocked' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setOverrideTarget(r)
                                  setOverrideAction('approved')
                                }}
                                className="rounded px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-bold hover:bg-emerald-100 cursor-pointer"
                              >
                                Approve
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setOverrideTarget(r)
                                  setOverrideAction('blocked')
                                }}
                                className="rounded px-2 py-1 bg-rose-50 text-rose-800 border border-rose-300 font-mono text-[10px] font-bold hover:bg-rose-100 cursor-pointer"
                              >
                                Block
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 font-mono text-xs text-[#7A746B]">
              <span>Page {currentPage} of {totalPages} ({totalCount} total)</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-[#DFD5C2] bg-white px-3 py-1 disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-[#DFD5C2] bg-white px-3 py-1 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REWARD RULES CONFIGURATION                                         */}
      {/* ========================================================================= */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-[#DFD5C2] p-6 shadow-sm space-y-6 max-w-4xl">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#121214]">
              Referral Program Parameters &amp; Anti-Abuse Rules
            </h2>
            <p className="text-xs text-[#7A746B] mt-0.5">
              Control reward amounts, qualification thresholds, return holding windows, and order checkout limits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Referrer Reward Amount */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                Referrer Reward (Store Credit ₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={config.referrerRewardAmount}
                onChange={(e) => setConfig({ ...config, referrerRewardAmount: e.target.value })}
                className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-2.5 text-xs font-mono font-bold text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
              />
              <p className="text-[10.5px] text-[#8A847B] mt-1">
                Credited to referrer after the qualifying order's return window passes.
              </p>
            </div>

            {/* Referee Welcome Bonus */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                Referee Welcome Credit (New Buyer ₹)
              </label>
              <input
                type="number"
                min="0"
                value={config.refereeRewardAmount}
                onChange={(e) => setConfig({ ...config, refereeRewardAmount: e.target.value })}
                className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-2.5 text-xs font-mono font-bold text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
              />
              <p className="text-[10.5px] text-[#8A847B] mt-1">
                Two-sided reward: welcome credit given to the newly referred boutique.
              </p>
            </div>

            {/* Minimum First Order Value */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                Minimum First Order Qualification Value (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={config.minFirstOrderValue}
                onChange={(e) => setConfig({ ...config, minFirstOrderValue: e.target.value })}
                className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-2.5 text-xs font-mono font-bold text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
              />
              <p className="text-[10.5px] text-[#8A847B] mt-1">
                Referral remains pending until referee places a paid order of at least this value.
              </p>
            </div>

            {/* Return Window Duration */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                Return Holding Window (Days) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={config.returnWindowDays}
                onChange={(e) => setConfig({ ...config, returnWindowDays: e.target.value })}
                className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-2.5 text-xs font-mono font-bold text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
              />
              <p className="text-[10.5px] text-[#8A847B] mt-1">
                Number of days after order before wallet credit is unlocked (prevents reward leakage on returns).
              </p>
            </div>

            {/* Monthly Referral Cap */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                Monthly Referral Cap per Referrer (Count)
              </label>
              <input
                type="number"
                min="1"
                value={config.monthlyReferralCap}
                onChange={(e) => setConfig({ ...config, monthlyReferralCap: e.target.value })}
                className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-2.5 text-xs font-mono text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
              />
              <p className="text-[10.5px] text-[#8A847B] mt-1">
                Maximum qualified referrals a single buyer can claim in one calendar month.
              </p>
            </div>

            {/* Max Order Redemption Percent */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                Max Order Redemption Cap (%) *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={config.maxOrderRedemptionPercent}
                onChange={(e) => setConfig({ ...config, maxOrderRedemptionPercent: e.target.value })}
                className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-2.5 text-xs font-mono text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
              />
              <p className="text-[10.5px] text-[#8A847B] mt-1">
                Maximum percentage of an order grand total that can be settled using rewards wallet credit.
              </p>
            </div>

            {/* Reward Expiry Days */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                Reward Validity Period (Days)
              </label>
              <input
                type="number"
                min="30"
                value={config.rewardExpiryDays}
                onChange={(e) => setConfig({ ...config, rewardExpiryDays: e.target.value })}
                className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-2.5 text-xs font-mono text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
              />
              <p className="text-[10.5px] text-[#8A847B] mt-1">
                Store credits expire automatically after this duration if unspent.
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isActive}
                  onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F95700]"></div>
              </label>
              <div>
                <span className="font-mono text-xs font-bold uppercase text-[#121214] block">
                  Referral Program Active
                </span>
                <span className="text-[10.5px] text-[#8A847B] block">
                  When paused, no new referral records or credits will be issued.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#ECE4D5]">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="rounded-xl bg-[#F95700] px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-[#D84B00] transition-colors disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isSavingConfig ? 'Saving Parameters...' : 'Save Referral Configuration'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: USER LEDGER & MANUAL ADJUSTMENT                                     */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* User Selector Bar */}
          <div className="bg-white rounded-2xl border border-[#DFD5C2] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <label className="font-mono text-xs font-bold uppercase text-[#7A746B] whitespace-nowrap">
                Inspect Retailer:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] py-2 px-3 text-xs text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
              >
                {retailers.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.storeName || r.name} ({r.cityState || r.city || 'India'}) · {r.email}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsAdjModalOpen(true)}
              className="rounded-xl bg-[#121214] text-[#FAD79F] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#1E1E22] transition-colors cursor-pointer shadow-sm"
            >
              + Manual Balance Adjustment
            </button>
          </div>

          {/* User Profile Summary */}
          {userLedger && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div className="rounded-xl border border-[#DFD5C2] bg-white p-3.5">
                <span className="font-mono text-[10px] font-bold uppercase text-[#8A847B] block">Available Wallet Balance</span>
                <span className="font-serif text-2xl font-bold text-emerald-800 block mt-1">
                  {formatCurrency(userLedger.availableBalance || 0)}
                </span>
              </div>
              <div className="rounded-xl border border-[#DFD5C2] bg-white p-3.5">
                <span className="font-mono text-[10px] font-bold uppercase text-[#8A847B] block">Pending Holding Balance</span>
                <span className="font-serif text-2xl font-bold text-amber-800 block mt-1">
                  {formatCurrency(userLedger.pendingBalance || 0)}
                </span>
              </div>
              <div className="rounded-xl border border-[#DFD5C2] bg-white p-3.5">
                <span className="font-mono text-[10px] font-bold uppercase text-[#8A847B] block">Lifetime Earned</span>
                <span className="font-serif text-2xl font-bold text-[#121214] block mt-1">
                  {formatCurrency(userLedger.lifetimeEarned || 0)}
                </span>
              </div>
              <div className="rounded-xl border border-[#DFD5C2] bg-white p-3.5">
                <span className="font-mono text-[10px] font-bold uppercase text-[#8A847B] block">Lifetime Redeemed</span>
                <span className="font-serif text-2xl font-bold text-[#805915] block mt-1">
                  {formatCurrency(userLedger.lifetimeRedeemed || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Immutable Ledger Entries Table */}
          <div className="bg-white rounded-2xl border border-[#DFD5C2] p-5 shadow-sm space-y-3">
            <h3 className="font-serif text-base font-bold text-[#121214]">
              Immutable Double-Entry Ledger Statement
            </h3>
            <p className="text-xs text-[#7A746B]">
              Every transaction is strictly append-only. Corrections are recorded as reversing entries.
            </p>

            {isLoadingLedger ? (
              <div className="py-8 text-center font-mono text-xs text-[#8A847B]">
                Loading ledger transactions...
              </div>
            ) : !userLedger?.transactions || userLedger.transactions.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-[#8A847B]">
                No ledger transactions recorded for this buyer yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#ECE4D5]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#ECE4D5] font-mono text-[10px] uppercase text-[#7A746B]">
                    <tr>
                      <th className="py-2.5 px-3">Entry ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-center">Type</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Balance After</th>
                      <th className="py-2.5 px-3">Source &amp; Reference</th>
                      <th className="py-2.5 px-3">Note / Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE1]">
                    {userLedger.transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#121214]">
                          {tx.entryId}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#7A746B]">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase ${
                            tx.type === 'credit'
                              ? 'bg-emerald-100 text-emerald-900'
                              : tx.type === 'debit'
                              ? 'bg-rose-100 text-rose-900'
                              : tx.type === 'reversal'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                          tx.type === 'credit' || tx.type === 'reversal'
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}>
                          {tx.type === 'debit' || tx.type === 'expiry' ? '−' : '+'}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#121214]">
                          {formatCurrency(tx.balanceAfter)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10.5px]">
                          <span className="text-[#121214] block font-medium">{tx.source}</span>
                          <span className="text-[#8A847B] block">{tx.referenceId}</span>
                        </td>
                        <td className="py-2.5 px-3 text-[#5C5852] text-[11px] max-w-xs">
                          {tx.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TOP REFERRERS LEADERBOARD                                          */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-[#DFD5C2] p-6 shadow-sm space-y-4 max-w-4xl">
          <h2 className="font-serif text-lg font-bold text-[#121214]">
            Top Referring Wholesale Partners
          </h2>
          <p className="text-xs text-[#7A746B]">
            Retailers generating the highest verified boutique signups and repeat carton orders.
          </p>

          {!reports?.topReferrers || reports.topReferrers.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-[#8A847B]">
              No credited referrals recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#ECE4D5]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#ECE4D5] font-mono text-[10px] uppercase text-[#7A746B]">
                  <tr>
                    <th className="py-3 px-3.5 text-center">Rank</th>
                    <th className="py-3 px-3">Boutique / Referrer</th>
                    <th className="py-3 px-3 text-center">Successful Referrals</th>
                    <th className="py-3 px-3 text-right">Total Rewards Credited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE1]">
                  {reports.topReferrers.map((row, idx) => (
                    <tr key={row._id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-[#F95700]">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#121214] block">
                          {row.referrerStoreName || row.referrerName || 'Partner'}
                        </span>
                        <span className="font-mono text-[10px] text-[#8A847B] block">
                          ID: {row._id}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-serif text-base font-bold text-[#121214]">
                        {row.successfulReferrals}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                        {formatCurrency(row.totalRewardsEarned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Balance Adjustment Modal */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#DFD5C2] shadow-2xl p-6 text-xs text-[#121214]">
            <div className="flex items-center justify-between border-b border-[#ECE4D5] pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-[#121214]">
                Manual Ledger Balance Adjustment
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjModalOpen(false)}
                className="text-[#8A847B] hover:text-[#121214] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                  Adjustment Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjData({ ...adjData, type: 'credit' })}
                    className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold uppercase ${
                      adjData.type === 'credit'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#FAF8F5] border border-[#DFD5C2] text-[#55514B]'
                    }`}
                  >
                    Credit (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjData({ ...adjData, type: 'debit' })}
                    className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold uppercase ${
                      adjData.type === 'debit'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-[#FAF8F5] border border-[#DFD5C2] text-[#55514B]'
                    }`}
                  >
                    Debit (−)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 1500"
                  value={adjData.amount}
                  onChange={(e) => setAdjData({ ...adjData, amount: e.target.value })}
                  className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-2.5 font-mono text-xs font-bold text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                  Mandatory Audit Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide detailed justification for this adjustment (e.g. VIP trade fair promo grant, dispute resolution)..."
                  value={adjData.note}
                  onChange={(e) => setAdjData({ ...adjData, note: e.target.value })}
                  className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-2.5 text-xs text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE4D5]">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="rounded-xl border border-[#DFD5C2] px-4 py-2 font-mono text-xs font-semibold text-[#55514B] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdj}
                  className="rounded-xl bg-[#F95700] px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-[#D84B00] disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmittingAdj ? 'Logging Entry...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override Referral Modal */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#DFD5C2] shadow-2xl p-6 text-xs text-[#121214]">
            <div className="flex items-center justify-between border-b border-[#ECE4D5] pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-[#121214]">
                Override Referral Record
              </h3>
              <button
                type="button"
                onClick={() => setOverrideTarget(null)}
                className="text-[#8A847B] hover:text-[#121214] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <p className="text-xs text-[#5C5852]">
                Action: <strong className="uppercase font-mono text-[#F95700]">{overrideAction}</strong> for referral{' '}
                <strong className="font-mono">{overrideTarget.referralCode}</strong>.
              </p>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#55514B] mb-1 font-bold">
                  Administrative Reason
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide audit reason for this manual override..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full rounded-xl border border-[#DFD5C2] bg-[#FAF8F5] p-2.5 text-xs text-[#121214] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F95700]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE4D5]">
                <button
                  type="button"
                  onClick={() => setOverrideTarget(null)}
                  className="rounded-xl border border-[#DFD5C2] px-4 py-2 font-mono text-xs font-semibold text-[#55514B] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOverride}
                  className={`rounded-xl px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50 cursor-pointer shadow-sm ${
                    overrideAction === 'blocked' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmittingOverride ? 'Saving...' : `Confirm ${overrideAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
