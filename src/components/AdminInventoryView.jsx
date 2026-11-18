import { useState, useEffect, useCallback } from 'react'
import {
  getInventoryListApi,
  getLowStockAlertsApi,
  getStockMovementsApi,
  getStockLocksApi,
  releaseExpiredLocksApi,
  singleStockInwardApi,
  bulkStockInwardApi,
  downloadInwardTemplateApi,
  adjustStockApi,
  updateReorderLevelApi,
  processInventoryReturnApi,
  transferWarehouseStockApi,
  syncCatalogInventoryApi,
  getWarehousesApi,
  createWarehouseApi,
  deleteWarehouseApi,
} from '../api'

const TABS = [
  { id: 'stock', label: 'SKU Stock List' },
  { id: 'inward', label: 'Stock Inward & Excel' },
  { id: 'alerts', label: 'Low Stock Alerts' },
  { id: 'locks', label: 'Stock Locks' },
  { id: 'adjust_return', label: 'Adjust / Cycle / QC Return' },
  { id: 'movements', label: 'Movement Audit Trail' },
  { id: 'warehouses', label: 'Warehouses & Transfer' },
]

const MOVEMENT_BADGE = {
  INWARD: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RESERVE: 'bg-amber-50 text-amber-800 border-amber-200',
  DEDUCT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RELEASE: 'bg-sky-50 text-sky-700 border-sky-200',
  RETURN: 'bg-teal-50 text-teal-700 border-teal-200',
  CANCEL: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  ADJUST: 'bg-purple-50 text-purple-700 border-purple-200',
  CYCLE_COUNT: 'bg-violet-50 text-violet-700 border-violet-200',
  DAMAGED: 'bg-rose-50 text-rose-700 border-rose-200',
  TRANSFER_OUT: 'bg-orange-50 text-orange-700 border-orange-200',
  TRANSFER_IN: 'bg-lime-50 text-lime-700 border-lime-200',
}

const STATUS_BADGE = {
  'In Stock': 'bg-[#1F8F5A]/10 text-[#1F8F5A] border-[#1F8F5A]/30',
  'Low Stock': 'bg-[#C59A46]/15 text-[#805915] border-[#C59A46]/40',
  'Out of Stock': 'bg-[#C23B37]/10 text-[#C23B37] border-[#C23B37]/30',
}

export default function AdminInventoryView() {
  const [activeTab, setActiveTab] = useState('stock')

  // Core Inventory List State
  const [items, setItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [stats, setStats] = useState({
    totalSkus: 0,
    totalOnHand: 0,
    totalReserved: 0,
    totalAvailable: 0,
    totalDamaged: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    alertCount: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [warehouseFilter, setWarehouseFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Alerts, Movements & Locks
  const [alerts, setAlerts] = useState([])
  const [movements, setMovements] = useState([])
  const [movementTypeFilter, setMovementTypeFilter] = useState('ALL')
  const [movementSkuSearch, setMovementSkuSearch] = useState('')
  const [locks, setLocks] = useState([])
  const [lockStatusFilter, setLockStatusFilter] = useState('active')
  const [lockMeta, setLockMeta] = useState({ activeCount: 0, expiredPendingCount: 0 })

  // Feedback banners
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Single Inward Form
  const [inwardForm, setInwardForm] = useState({
    skuId: '',
    qty: 50,
    poNumber: '',
    warehouseId: '',
    reorderLevel: '',
    reason: '',
  })
  const [isSubmittingInward, setIsSubmittingInward] = useState(false)

  // Bulk Excel/CSV Inward
  const [bulkFile, setBulkFile] = useState(null)
  const [bulkPoNumber, setBulkPoNumber] = useState('')
  const [bulkWarehouseId, setBulkWarehouseId] = useState('')
  const [bulkReport, setBulkReport] = useState(null)
  const [isUploadingBulk, setIsUploadingBulk] = useState(false)

  // Manual Adjust / Cycle Count Form
  const [adjustForm, setAdjustForm] = useState({
    skuId: '',
    warehouseId: '',
    mode: 'ADD',
    qty: 1,
    reason: '',
  })
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false)

  // Return QC Form
  const [returnForm, setReturnForm] = useState({
    orderId: '',
    skuId: '',
    qty: 1,
    qcStatus: 'PASS',
    reason: '',
    warehouseId: '',
  })
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

  // Warehouse Create & Transfer Forms
  const [warehouseForm, setWarehouseForm] = useState({
    code: '',
    name: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
  })
  const [transferForm, setTransferForm] = useState({
    skuId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    qty: 10,
    reason: '',
  })
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false)

  // Inline Reorder Level edit
  const [editingReorderId, setEditingReorderId] = useState(null)
  const [editingReorderValue, setEditingReorderValue] = useState('')

  const flashSuccess = (msg) => {
    setErrorMsg('')
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 6000)
  }

  const flashError = (err) => {
    setSuccessMsg('')
    const msg =
      typeof err === 'string'
        ? err
        : err?.response?.data?.message || err?.message || 'Operation failed.'
    setErrorMsg(msg)
  }

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = { limit: 150 }
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (warehouseFilter !== 'ALL') params.warehouseId = warehouseFilter

      const res = await getInventoryListApi(params)
      if (res?.success) {
        setItems(res.items || [])
        if (res.stats) setStats(res.stats)
        if (Array.isArray(res.warehouses) && res.warehouses.length > 0) {
          setWarehouses(res.warehouses)
          const defaultWh = res.warehouses.find((w) => w.isDefault) || res.warehouses[0]
          if (defaultWh) {
            setInwardForm((prev) => (prev.warehouseId ? prev : { ...prev, warehouseId: defaultWh._id }))
            setAdjustForm((prev) => (prev.warehouseId ? prev : { ...prev, warehouseId: defaultWh._id }))
            setBulkWarehouseId((prev) => prev || defaultWh._id)
            setTransferForm((prev) =>
              prev.fromWarehouseId ? prev : { ...prev, fromWarehouseId: defaultWh._id }
            )
          }
        }
      }
    } catch (err) {
      flashError(err)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter, warehouseFilter])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await getLowStockAlertsApi({ warehouseId: warehouseFilter })
      if (res?.success) setAlerts(res.alerts || [])
    } catch (err) {
      flashError(err)
    }
  }, [warehouseFilter])

  const fetchMovements = useCallback(async () => {
    try {
      const params = { limit: 100 }
      if (movementTypeFilter !== 'ALL') params.type = movementTypeFilter
      if (movementSkuSearch.trim()) params.skuId = movementSkuSearch.trim()
      if (warehouseFilter !== 'ALL') params.warehouseId = warehouseFilter
      const res = await getStockMovementsApi(params)
      if (res?.success) setMovements(res.movements || [])
    } catch (err) {
      flashError(err)
    }
  }, [movementTypeFilter, movementSkuSearch, warehouseFilter])

  const fetchLocks = useCallback(async () => {
    try {
      const res = await getStockLocksApi({ status: lockStatusFilter, limit: 100 })
      if (res?.success) {
        setLocks(res.locks || [])
        setLockMeta({
          activeCount: res.activeCount || 0,
          expiredPendingCount: res.expiredPendingCount || 0,
        })
      }
    } catch (err) {
      flashError(err)
    }
  }, [lockStatusFilter])

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await getWarehousesApi()
      if (res?.success) setWarehouses(res.warehouses || [])
    } catch (err) {
      flashError(err)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory()
    }, 220)
    return () => clearTimeout(timer)
  }, [fetchInventory])

  useEffect(() => {
    if (activeTab === 'alerts') fetchAlerts()
    if (activeTab === 'movements') fetchMovements()
    if (activeTab === 'locks') fetchLocks()
    if (activeTab === 'warehouses') fetchWarehouses()
  }, [activeTab, fetchAlerts, fetchMovements, fetchLocks, fetchWarehouses])

  const handleSyncCatalog = async () => {
    try {
      setIsSyncing(true)
      const res = await syncCatalogInventoryApi()
      if (res?.success) {
        flashSuccess(res.message)
        fetchInventory()
      }
    } catch (err) {
      flashError(err)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSingleInward = async (e) => {
    e.preventDefault()
    try {
      setIsSubmittingInward(true)
      const payload = {
        skuId: inwardForm.skuId.trim().toUpperCase(),
        qty: Number(inwardForm.qty),
        poNumber: inwardForm.poNumber.trim(),
        warehouseId: inwardForm.warehouseId || undefined,
        reason: inwardForm.reason.trim(),
      }
      if (inwardForm.reorderLevel !== '') {
        payload.reorderLevel = Number(inwardForm.reorderLevel)
      }
      const res = await singleStockInwardApi(payload)
      if (res?.success) {
        flashSuccess(res.message)
        setInwardForm((prev) => ({ ...prev, qty: 50, poNumber: '', reason: '' }))
        fetchInventory()
        if (activeTab === 'alerts') fetchAlerts()
      }
    } catch (err) {
      flashError(err)
    } finally {
      setIsSubmittingInward(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadInwardTemplateApi()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'bvb-bulk-inward-template.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      flashError(err)
    }
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    if (!bulkFile) {
      flashError('Please select a .csv or .xlsx Excel file first.')
      return
    }
    try {
      setIsUploadingBulk(true)
      setBulkReport(null)
      const fd = new FormData()
      fd.append('file', bulkFile)
      if (bulkPoNumber.trim()) fd.append('poNumber', bulkPoNumber.trim())
      if (bulkWarehouseId) fd.append('warehouseId', bulkWarehouseId)

      const res = await bulkStockInwardApi(fd)
      if (res?.success) {
        flashSuccess(res.message)
        setBulkReport(res.report)
        setBulkFile(null)
        fetchInventory()
      }
    } catch (err) {
      flashError(err)
    } finally {
      setIsUploadingBulk(false)
    }
  }

  const handleAdjustSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsSubmittingAdjust(true)
      const res = await adjustStockApi({
        skuId: adjustForm.skuId.trim().toUpperCase(),
        warehouseId: adjustForm.warehouseId || undefined,
        mode: adjustForm.mode,
        qty: Number(adjustForm.qty),
        reason: adjustForm.reason.trim(),
      })
      if (res?.success) {
        flashSuccess(res.message)
        setAdjustForm((prev) => ({ ...prev, reason: '' }))
        fetchInventory()
      }
    } catch (err) {
      flashError(err)
    } finally {
      setIsSubmittingAdjust(false)
    }
  }

  const handleReturnSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsSubmittingReturn(true)
      const res = await processInventoryReturnApi({
        orderId: returnForm.orderId.trim() || undefined,
        skuId: returnForm.skuId.trim().toUpperCase(),
        qty: Number(returnForm.qty),
        qcStatus: returnForm.qcStatus,
        reason: returnForm.reason.trim(),
        warehouseId: returnForm.warehouseId || undefined,
      })
      if (res?.success) {
        flashSuccess(res.message)
        setReturnForm((prev) => ({ ...prev, orderId: '', qty: 1, reason: '' }))
        fetchInventory()
      }
    } catch (err) {
      flashError(err)
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  const handleReleaseExpiredLocks = async () => {
    try {
      const res = await releaseExpiredLocksApi()
      if (res?.success) {
        flashSuccess(res.message)
        fetchLocks()
        fetchInventory()
      }
    } catch (err) {
      flashError(err)
    }
  }

  const handleSaveReorderLevel = async (invId) => {
    try {
      const val = parseInt(editingReorderValue, 10)
      if (isNaN(val) || val < 0) return
      const res = await updateReorderLevelApi(invId, { reorderLevel: val })
      if (res?.success) {
        flashSuccess(res.message)
        setEditingReorderId(null)
        fetchInventory()
      }
    } catch (err) {
      flashError(err)
    }
  }

  const handleCreateWarehouse = async (e) => {
    e.preventDefault()
    try {
      const res = await createWarehouseApi(warehouseForm)
      if (res?.success) {
        flashSuccess(res.message)
        setWarehouseForm({ code: '', name: '', city: '', state: '', pincode: '', address: '' })
        fetchWarehouses()
      }
    } catch (err) {
      flashError(err)
    }
  }

  const handleDeleteWarehouse = async (id, name) => {
    if (!window.confirm(`Remove warehouse "${name}"?`)) return
    try {
      const res = await deleteWarehouseApi(id)
      if (res?.success) {
        flashSuccess(res.message)
        fetchWarehouses()
      }
    } catch (err) {
      flashError(err)
    }
  }

  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsSubmittingTransfer(true)
      const res = await transferWarehouseStockApi({
        skuId: transferForm.skuId.trim().toUpperCase(),
        fromWarehouseId: transferForm.fromWarehouseId,
        toWarehouseId: transferForm.toWarehouseId,
        qty: Number(transferForm.qty),
        reason: transferForm.reason.trim() || 'Inter-warehouse transfer',
      })
      if (res?.success) {
        flashSuccess(res.message)
        setTransferForm((prev) => ({ ...prev, qty: 10, reason: '' }))
        fetchInventory()
        fetchWarehouses()
      }
    } catch (err) {
      flashError(err)
    } finally {
      setIsSubmittingTransfer(false)
    }
  }

  // Quick row shortcuts
  const openQuickInward = (item) => {
    setInwardForm({
      skuId: item.skuId,
      qty: Math.max(20, (item.reorderLevel || 10) * 2),
      poNumber: `PO-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      warehouseId: item.warehouseId?._id || item.warehouseId || '',
      reorderLevel: item.reorderLevel ?? 10,
      reason: 'Low stock replenishment',
    })
    setActiveTab('inward')
  }

  const openQuickAdjust = (item) => {
    setAdjustForm({
      skuId: item.skuId,
      warehouseId: item.warehouseId?._id || item.warehouseId || '',
      mode: 'CYCLE_COUNT',
      qty: item.onHand,
      reason: '',
    })
    setActiveTab('adjust_return')
  }

  const openSkuAuditHistory = (skuId) => {
    setMovementSkuSearch(skuId)
    setMovementTypeFilter('ALL')
    setActiveTab('movements')
  }

  const formatDateTime = (dt) => {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A6D22]">
            SKU Ledger &amp; Atomic Stock Engine
          </span>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#121214] sm:text-3xl">
            Inventory Command Center
          </h1>
          <p className="mt-1 text-xs text-[#6B6357]">
            Real-time SKU stock tracking (<code className="font-mono text-[#121214]">available = onHand − reserved</code>), atomic checkout reservations, QC returns &amp; audit trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncCatalog}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DFD5C2] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#121214] shadow-2xs transition-all hover:border-[#C59A46] hover:bg-[#FAF3E4] disabled:opacity-60 cursor-pointer"
          >
            <svg className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isSyncing ? 'Syncing SKUs...' : 'Sync Catalog SKUs'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inward')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#121214] px-4 py-2 text-xs font-semibold text-[#FAD79F] shadow-xs transition-all hover:bg-[#232328] cursor-pointer"
          >
            <span>+ Stock Inward</span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} className="ml-4 font-bold">×</button>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} className="ml-4 font-bold">×</button>
        </div>
      )}

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#8A847B]">Tracked SKUs</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-[#121214]">{stats.totalSkus}</p>
          <p className="mt-0.5 text-[10px] text-[#7A746B]">Across {warehouses.length} hub(s)</p>
        </div>

        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#8A847B]">On Hand</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-[#121214]">{stats.totalOnHand.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] text-[#7A746B]">Physical warehouse pcs</p>
        </div>

        <div className="rounded-2xl border border-[#E5D3AF] bg-[#FAF3E4]/60 p-4 shadow-2xs">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#805915]">Reserved (Locked)</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-[#805915]">{stats.totalReserved.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] text-[#9A6D22]">Checkout pending locks</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-700">Available</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-emerald-800">{stats.totalAvailable.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] text-emerald-700">onHand − reserved</p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-left shadow-2xs transition-all hover:border-amber-400 cursor-pointer"
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-amber-800">Low / OOS Alerts</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-amber-900">
            {stats.lowStockCount} <span className="text-sm font-normal text-rose-700">/ {stats.outOfStockCount} OOS</span>
          </p>
          <p className="mt-0.5 text-[10px] text-amber-800">Click to inspect</p>
        </button>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-2xs">
          <p className="font-mono text-[10px] uppercase tracking-wider text-rose-700">Damaged Stock</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-rose-800">{stats.totalDamaged.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] text-rose-600">QC fail / write-offs</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#ECE4D5] pb-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#121214] text-[#FAD79F] shadow-xs'
                  : 'bg-[#FFFFFF] text-[#55514B] border border-[#E8DEC9] hover:border-[#C59A46] hover:text-[#121214]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'alerts' && stats.alertCount > 0 && (
                <span className="rounded-full bg-rose-600 px-1.5 py-0.2 font-mono text-[10px] font-bold text-white">
                  {stats.alertCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SKU STOCK LIST                                        */}
      {/* ============================================================ */}
      {activeTab === 'stock' && (
        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-[#ECE4D5] bg-[#FCFBF8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU ID, Product, Color, Size..."
              className="w-full sm:w-80 rounded-xl border border-[#E8DEC9] bg-white px-3.5 py-2 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
            />

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="rounded-xl border border-[#E8DEC9] bg-white px-3 py-2 text-xs font-medium text-[#121214] focus:border-[#C59A46] focus:outline-none"
              >
                <option value="ALL">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh._id} value={wh._id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#E8DEC9] bg-white px-3 py-2 text-xs font-medium text-[#121214] focus:border-[#C59A46] focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="RESERVED">Has Active Locks</option>
              </select>
            </div>
          </div>

          {/* SKU Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[10px] uppercase tracking-wider text-[#7A746B]">
                <tr>
                  <th className="px-4 py-3">SKU / Product</th>
                  <th className="px-4 py-3">Variant</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-right">On Hand</th>
                  <th className="px-4 py-3 text-right">Reserved</th>
                  <th className="px-4 py-3 text-right">Available</th>
                  <th className="px-4 py-3 text-right">Reorder Lvl</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E9DC]">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-[#7A746B]">
                      Loading SKU inventory ledger...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-[#7A746B]">
                      No SKU inventory records match your filter. Click <strong>Sync Catalog SKUs</strong> to import products.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const avail = Math.max(0, (item.onHand || 0) - (item.reserved || 0))
                    const badgeLabel =
                      avail <= 0
                        ? 'Out of Stock'
                        : avail <= (item.reorderLevel ?? 10)
                        ? 'Low Stock'
                        : 'In Stock'

                    return (
                      <tr key={item._id} className="hover:bg-[#FCFBF8] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="h-9 w-9 rounded-lg object-cover border border-[#ECE4D5] shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-[#FAF3E4] border border-[#E5D3AF] flex items-center justify-center font-mono text-[10px] font-bold text-[#9A6D22] shrink-0">
                                SKU
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-mono text-[11px] font-bold text-[#121214]">
                                {item.skuId}
                              </div>
                              <div className="text-[11px] text-[#6B6357] truncate max-w-[200px]">
                                {item.productName || item.productId?.name || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-3 w-3 rounded-full border border-black/15 shrink-0"
                              style={{ backgroundColor: item.colorCode || '#121214' }}
                            />
                            <span className="text-[#121214] font-medium">{item.color}</span>
                            <span className="rounded bg-[#F3EFE8] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#121214]">
                              {item.size}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[10px] font-semibold text-[#55514B]">
                            {item.warehouseId?.code || 'WH-MAIN'}
                          </span>
                          <div className="text-[10px] text-[#8A847B] truncate max-w-[120px]">
                            {item.warehouseId?.name || 'Primary'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#121214]">
                          {item.onHand}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#9A6D22]">
                          {item.reserved > 0 ? item.reserved : '0'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-bold text-emerald-700">
                          {avail}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingReorderId === item._id ? (
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={editingReorderValue}
                                onChange={(e) => setEditingReorderValue(e.target.value)}
                                className="w-14 rounded border border-[#C59A46] px-1.5 py-0.5 text-right font-mono text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveReorderLevel(item._id)}
                                className="rounded bg-[#121214] px-1.5 py-0.5 text-[10px] text-[#FAD79F]"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingReorderId(item._id)
                                setEditingReorderValue(String(item.reorderLevel ?? 10))
                              }}
                              title="Click to edit reorder alert threshold"
                              className="font-mono text-[11px] text-[#6B6357] underline decoration-dotted hover:text-[#9A6D22] cursor-pointer"
                            >
                              {item.reorderLevel ?? 10}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                              STATUS_BADGE[badgeLabel]
                            }`}
                          >
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openQuickInward(item)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                            >
                              +Inward
                            </button>
                            <button
                              type="button"
                              onClick={() => openQuickAdjust(item)}
                              className="rounded-lg border border-[#E5D3AF] bg-[#FAF3E4] px-2 py-1 text-[10px] font-semibold text-[#805915] hover:bg-[#F3E5C8] cursor-pointer"
                            >
                              Adjust
                            </button>
                            <button
                              type="button"
                              onClick={() => openSkuAuditHistory(item.skuId)}
                              className="rounded-lg border border-[#E8DEC9] bg-white px-2 py-1 text-[10px] font-semibold text-[#55514B] hover:border-[#121214] cursor-pointer"
                            >
                              Audit
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
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: STOCK INWARD (SINGLE + EXCEL/CSV BULK UPLOAD)         */}
      {/* ============================================================ */}
      {activeTab === 'inward' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Single SKU Inward */}
          <form
            onSubmit={handleSingleInward}
            className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-6 shadow-2xs space-y-4"
          >
            <div>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#9A6D22]">
                Single SKU Entry
              </span>
              <h2 className="font-serif text-lg font-bold text-[#121214]">
                Receive Stock Inward (PO Entry)
              </h2>
              <p className="text-xs text-[#6B6357]">
                Adds physical stock to <code className="font-mono">onHand</code> and logs an immutable <code className="font-mono">INWARD</code> audit record.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                SKU ID *
              </label>
              <input
                list="bvb-sku-datalist"
                required
                value={inwardForm.skuId}
                onChange={(e) => setInwardForm({ ...inwardForm, skuId: e.target.value })}
                placeholder="e.g. BVB-TEE-01-BLK-M"
                className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs uppercase focus:border-[#C59A46] focus:outline-none"
              />
              <datalist id="bvb-sku-datalist">
                {items.map((it) => (
                  <option key={it._id} value={it.skuId}>
                    {it.productName} ({it.color} · {it.size}) — Avail: {Math.max(0, it.onHand - it.reserved)}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  Inward Qty (pcs) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={inwardForm.qty}
                  onChange={(e) => setInwardForm({ ...inwardForm, qty: e.target.value })}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  PO / Challan Number *
                </label>
                <input
                  type="text"
                  required
                  value={inwardForm.poNumber}
                  onChange={(e) => setInwardForm({ ...inwardForm, poNumber: e.target.value })}
                  placeholder="PO-2026-042"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs focus:border-[#C59A46] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  Destination Warehouse
                </label>
                <select
                  value={inwardForm.warehouseId}
                  onChange={(e) => setInwardForm({ ...inwardForm, warehouseId: e.target.value })}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2.5 text-xs focus:border-[#C59A46] focus:outline-none"
                >
                  {warehouses.map((wh) => (
                    <option key={wh._id} value={wh._id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  Reorder Alert Level (Optional)
                </label>
                <input
                  type="number"
                  min={0}
                  value={inwardForm.reorderLevel}
                  onChange={(e) => setInwardForm({ ...inwardForm, reorderLevel: e.target.value })}
                  placeholder="Keep existing"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs focus:border-[#C59A46] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                Supplier / Remarks
              </label>
              <input
                type="text"
                value={inwardForm.reason}
                onChange={(e) => setInwardForm({ ...inwardForm, reason: e.target.value })}
                placeholder="e.g. Tiruppur Mill Batch #14 received & counted"
                className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 text-xs focus:border-[#C59A46] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingInward}
              className="w-full rounded-xl bg-[#121214] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FAD79F] hover:bg-[#232328] disabled:opacity-60 cursor-pointer"
            >
              {isSubmittingInward ? 'Posting Inward...' : 'Confirm Stock Inward'}
            </button>
          </form>

          {/* Bulk Excel (.xlsx) / CSV Upload */}
          <form
            onSubmit={handleBulkUpload}
            className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-6 shadow-2xs space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#9A6D22]">
                  Excel / CSV Bulk Upload
                </span>
                <h2 className="font-serif text-lg font-bold text-[#121214]">
                  Bulk Stock Inward Sheet
                </h2>
                <p className="text-xs text-[#6B6357]">
                  Upload <code className="font-mono">.xlsx</code> or <code className="font-mono">.csv</code> with columns: <code className="font-mono">skuId, qty, poNumber, warehouseCode, reorderLevel, reason</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="shrink-0 rounded-xl border border-[#DFD5C2] bg-[#FAF3E4] px-3 py-1.5 text-[11px] font-semibold text-[#805915] hover:bg-[#F3E5C8] cursor-pointer"
              >
                ↓ Template CSV
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  Default PO Number
                </label>
                <input
                  type="text"
                  value={bulkPoNumber}
                  onChange={(e) => setBulkPoNumber(e.target.value)}
                  placeholder="PO-BULK-2026-01"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  Default Warehouse
                </label>
                <select
                  value={bulkWarehouseId}
                  onChange={(e) => setBulkWarehouseId(e.target.value)}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2.5 text-xs focus:border-[#C59A46] focus:outline-none"
                >
                  {warehouses.map((wh) => (
                    <option key={wh._id} value={wh._id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-[#DFD5C2] bg-[#FAF8F5] p-6 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-[#55514B] file:mr-3 file:rounded-lg file:border-0 file:bg-[#121214] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#FAD79F] hover:file:bg-[#232328]"
              />
              {bulkFile && (
                <p className="mt-2 font-mono text-[11px] text-emerald-700">
                  Selected: {bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isUploadingBulk || !bulkFile}
              className="w-full rounded-xl bg-gradient-to-r from-[#C59A46] to-[#9A6D22] py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              {isUploadingBulk ? 'Processing Bulk Sheet...' : 'Upload & Process Inward'}
            </button>

            {bulkReport && (
              <div className="rounded-xl border border-[#ECE4D5] bg-[#FAF8F5] p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-emerald-700">Succeeded: {bulkReport.succeededCount}</span>
                  <span className="font-bold text-rose-700">Failed: {bulkReport.failedCount}</span>
                  <span className="text-[#6B6357]">Total: {bulkReport.totalRows}</span>
                </div>
                {bulkReport.failed?.length > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-800 space-y-1">
                    {bulkReport.failed.map((f, idx) => (
                      <div key={idx}>
                        Row {f.rowNumber} ({f.skuId}): {f.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: LOW STOCK & OUT OF STOCK ALERTS                       */}
      {/* ============================================================ */}
      {activeTab === 'alerts' && (
        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#ECE4D5] bg-[#FCFBF8] p-4">
            <div>
              <h2 className="font-serif text-base font-bold text-[#121214]">
                Low Stock &amp; Out of Stock Report
              </h2>
              <p className="text-xs text-[#6B6357]">
                All SKUs where <code className="font-mono">available ≤ reorderLevel</code>. Trigger quick inward to replenish.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAlerts}
              className="rounded-xl border border-[#E8DEC9] bg-white px-3 py-1.5 text-xs font-semibold text-[#55514B] hover:border-[#C59A46] cursor-pointer"
            >
              Refresh Alerts
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[10px] uppercase tracking-wider text-[#7A746B]">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-right">On Hand</th>
                  <th className="px-4 py-3 text-right">Reserved</th>
                  <th className="px-4 py-3 text-right">Available</th>
                  <th className="px-4 py-3 text-right">Reorder Level</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E9DC]">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-emerald-700 font-medium">
                      All SKUs are healthy above their reorder levels.
                    </td>
                  </tr>
                ) : (
                  alerts.map((a) => {
                    const avail = Math.max(0, (a.onHand || 0) - (a.reserved || 0))
                    const isOos = avail <= 0
                    return (
                      <tr key={a._id} className={isOos ? 'bg-rose-50/40' : 'bg-amber-50/30'}>
                        <td className="px-4 py-3 font-mono font-bold text-[#121214]">{a.skuId}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#121214]">{a.productName}</div>
                          <div className="text-[10px] text-[#7A746B]">
                            {a.color} · Size {a.size}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">{a.warehouseId?.code || 'WH-MAIN'}</td>
                        <td className="px-4 py-3 text-right font-mono">{a.onHand}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#9A6D22]">{a.reserved}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">{avail}</td>
                        <td className="px-4 py-3 text-right font-mono">{a.reorderLevel}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
                              isOos
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {isOos ? 'OUT OF STOCK' : 'LOW STOCK'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openQuickInward(a)}
                            className="rounded-lg bg-[#121214] px-3 py-1.5 text-[10px] font-semibold text-[#FAD79F] hover:bg-[#232328] cursor-pointer"
                          >
                            + Replenish
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: ACTIVE STOCK LOCKS (CHECKOUT RESERVATIONS)            */}
      {/* ============================================================ */}
      {activeTab === 'locks' && (
        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[#ECE4D5] bg-[#FCFBF8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-[#121214]">
                Checkout Stock Locks (15-Min Hold Window)
              </h2>
              <p className="text-xs text-[#6B6357]">
                Active Locks: <strong>{lockMeta.activeCount}</strong> · Expired Pending Release:{' '}
                <strong className="text-rose-700">{lockMeta.expiredPendingCount}</strong> · Auto cron runs every 60s.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={lockStatusFilter}
                onChange={(e) => setLockStatusFilter(e.target.value)}
                className="rounded-xl border border-[#E8DEC9] bg-white px-3 py-1.5 text-xs"
              >
                <option value="active">Active Locks</option>
                <option value="consumed">Consumed (Paid)</option>
                <option value="released">Released (Expired/Failed)</option>
                <option value="ALL">All Locks</option>
              </select>
              <button
                type="button"
                onClick={handleReleaseExpiredLocks}
                className="rounded-xl bg-[#121214] px-3.5 py-1.5 text-xs font-semibold text-[#FAD79F] hover:bg-[#232328] cursor-pointer"
              >
                Release Expired Now
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[10px] uppercase tracking-wider text-[#7A746B]">
                <tr>
                  <th className="px-4 py-3">Order Ref</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-right">Locked Qty</th>
                  <th className="px-4 py-3">Expires At</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E9DC]">
                {locks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[#7A746B]">
                      No stock locks found for status &ldquo;{lockStatusFilter}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  locks.map((lk) => {
                    const isExpired = lk.status === 'active' && new Date(lk.expiresAt) <= new Date()
                    return (
                      <tr key={lk._id} className="hover:bg-[#FCFBF8]">
                        <td className="px-4 py-3 font-mono font-semibold text-[#121214]">
                          {lk.orderNumber || lk.orderId?.orderId || '—'}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold">{lk.skuId}</td>
                        <td className="px-4 py-3 font-mono text-[11px]">{lk.warehouseId?.code || 'WH-MAIN'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#9A6D22]">
                          {lk.quantity}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          {formatDateTime(lk.expiresAt)}
                          {isExpired && (
                            <span className="ml-1.5 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                              OVERDUE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-[#E5D3AF] bg-[#FAF3E4] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#805915]">
                            {lk.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[#6B6357]">
                          {lk.releaseReason || (lk.consumedAt ? `Deducted ${formatDateTime(lk.consumedAt)}` : 'Active hold')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: MANUAL ADJUST / CYCLE COUNT & RETURN QC               */}
      {/* ============================================================ */}
      {activeTab === 'adjust_return' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Manual Adjust & Monthly Cycle Count */}
          <form
            onSubmit={handleAdjustSubmit}
            className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-6 shadow-2xs space-y-4"
          >
            <div>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#9A6D22]">
                Reconciliation &amp; Shrinkage
              </span>
              <h2 className="font-serif text-lg font-bold text-[#121214]">
                Manual Stock Adjust / Cycle Count
              </h2>
              <p className="text-xs text-[#6B6357]">
                Record damage, loss, or physical cycle-count reconciliation. Mandatory reason logged to audit trail.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  SKU ID *
                </label>
                <input
                  list="bvb-sku-datalist"
                  required
                  value={adjustForm.skuId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, skuId: e.target.value })}
                  placeholder="BVB-TEE-01-BLK-M"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs uppercase focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  Warehouse
                </label>
                <select
                  value={adjustForm.warehouseId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, warehouseId: e.target.value })}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2.5 text-xs focus:border-[#C59A46] focus:outline-none"
                >
                  {warehouses.map((wh) => (
                    <option key={wh._id} value={wh._id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  Adjustment Mode *
                </label>
                <select
                  value={adjustForm.mode}
                  onChange={(e) => setAdjustForm({ ...adjustForm, mode: e.target.value })}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2.5 text-xs font-medium focus:border-[#C59A46] focus:outline-none"
                >
                  <option value="ADD">Add Stock (+ onHand)</option>
                  <option value="SUBTRACT">Subtract Loss / Missing (− onHand)</option>
                  <option value="DAMAGE">Mark Damaged (− onHand, + damaged)</option>
                  <option value="CYCLE_COUNT">Cycle Count (Set exact physical onHand)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  {adjustForm.mode === 'CYCLE_COUNT' ? 'Physical Count *' : 'Quantity (pcs) *'}
                </label>
                <input
                  type="number"
                  min={adjustForm.mode === 'CYCLE_COUNT' ? 0 : 1}
                  required
                  value={adjustForm.qty}
                  onChange={(e) => setAdjustForm({ ...adjustForm, qty: e.target.value })}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs focus:border-[#C59A46] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                Mandatory Audit Reason *
              </label>
              <textarea
                rows={2}
                required
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="e.g. Monthly cycle count rack B-12 mismatch / water damage in carton #4"
                className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs focus:border-[#C59A46] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAdjust}
              className="w-full rounded-xl bg-[#121214] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FAD79F] hover:bg-[#232328] disabled:opacity-60 cursor-pointer"
            >
              {isSubmittingAdjust ? 'Recording Adjustment...' : 'Apply Adjustment & Log Audit'}
            </button>
          </form>

          {/* Return Quality Check (QC PASS vs QC FAIL) */}
          <form
            onSubmit={handleReturnSubmit}
            className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-6 shadow-2xs space-y-4"
          >
            <div>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#9A6D22]">
                Reverse Logistics Quality Check
              </span>
              <h2 className="font-serif text-lg font-bold text-[#121214]">
                Process Return with QC Inspection
              </h2>
              <p className="text-xs text-[#6B6357]">
                <strong>QC PASS</strong> restores stock to <code className="font-mono">onHand</code>. <strong>QC FAIL</strong> moves stock to <code className="font-mono">damaged</code> (sellable stock unchanged).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  Order Number (Optional)
                </label>
                <input
                  type="text"
                  value={returnForm.orderId}
                  onChange={(e) => setReturnForm({ ...returnForm, orderId: e.target.value })}
                  placeholder="BVB-PO-123456"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  SKU ID *
                </label>
                <input
                  list="bvb-sku-datalist"
                  required
                  value={returnForm.skuId}
                  onChange={(e) => setReturnForm({ ...returnForm, skuId: e.target.value })}
                  placeholder="BVB-TEE-01-BLK-M"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs uppercase focus:border-[#C59A46] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  Return Quantity *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={returnForm.qty}
                  onChange={(e) => setReturnForm({ ...returnForm, qty: e.target.value })}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  QC Inspection Result *
                </label>
                <select
                  value={returnForm.qcStatus}
                  onChange={(e) => setReturnForm({ ...returnForm, qcStatus: e.target.value })}
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2.5 text-xs font-semibold focus:border-[#C59A46] focus:outline-none"
                >
                  <option value="PASS">QC PASS → Restock to onHand</option>
                  <option value="FAIL">QC FAIL → Move to Damaged Stock</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                QC Inspection Notes *
              </label>
              <textarea
                rows={2}
                required
                value={returnForm.reason}
                onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                placeholder="e.g. Packaging intact, tags verified / Stitching defect near collar"
                className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs focus:border-[#C59A46] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReturn}
              className={`w-full rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs disabled:opacity-60 cursor-pointer ${
                returnForm.qcStatus === 'PASS'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              {isSubmittingReturn
                ? 'Processing Return QC...'
                : returnForm.qcStatus === 'PASS'
                ? 'Approve QC Pass & Restock'
                : 'Mark QC Fail & Log Damaged'}
            </button>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 6: STOCK MOVEMENT AUDIT TRAIL                            */}
      {/* ============================================================ */}
      {activeTab === 'movements' && (
        <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] shadow-2xs overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[#ECE4D5] bg-[#FCFBF8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              value={movementSkuSearch}
              onChange={(e) => setMovementSkuSearch(e.target.value)}
              placeholder="Filter movements by SKU ID..."
              className="w-full sm:w-72 rounded-xl border border-[#E8DEC9] bg-white px-3.5 py-2 font-mono text-xs focus:border-[#C59A46] focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="rounded-xl border border-[#E8DEC9] bg-white px-3 py-2 text-xs font-medium"
              >
                <option value="ALL">All Movement Types</option>
                {Object.keys(MOVEMENT_BADGE).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={fetchMovements}
                className="rounded-xl border border-[#E8DEC9] bg-white px-3 py-2 text-xs font-semibold text-[#55514B] hover:border-[#C59A46] cursor-pointer"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[10px] uppercase tracking-wider text-[#7A746B]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">OnHand (Before → After)</th>
                  <th className="px-4 py-3">Reserved</th>
                  <th className="px-4 py-3">Ref ID</th>
                  <th className="px-4 py-3">By / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E9DC]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[#7A746B]">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((mv) => (
                    <tr key={mv._id} className="hover:bg-[#FCFBF8]">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#6B6357] whitespace-nowrap">
                        {formatDateTime(mv.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
                            MOVEMENT_BADGE[mv.type] || 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {mv.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#121214]">{mv.skuId}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#121214]">
                        {mv.qty > 0 && ['INWARD', 'RETURN', 'CANCEL', 'TRANSFER_IN'].includes(mv.type)
                          ? `+${mv.qty}`
                          : mv.qty}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {mv.beforeOnHand} → <strong>{mv.afterOnHand}</strong>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#9A6D22]">
                        {mv.beforeReserved} → <strong>{mv.afterReserved}</strong>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#55514B]">
                        {mv.refId || '—'}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-[#121214] text-[11px]">
                          {mv.byName || 'System'}{' '}
                          <span className="font-mono text-[9px] text-[#8A847B]">({mv.byModel})</span>
                        </div>
                        <div className="text-[11px] text-[#6B6357] truncate" title={mv.reason}>
                          {mv.reason || '—'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 7: MULTI-WAREHOUSE & INTER-WAREHOUSE TRANSFER            */}
      {/* ============================================================ */}
      {activeTab === 'warehouses' && (
        <div className="space-y-6">
          {/* Warehouse Directory Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {warehouses.map((wh) => (
              <div
                key={wh._id}
                className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-5 shadow-2xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-[#FAF3E4] border border-[#E5D3AF] px-2 py-0.5 font-mono text-[10px] font-bold text-[#805915]">
                      {wh.code}
                    </span>
                    {wh.isDefault ? (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-700">
                        PRIMARY HUB
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteWarehouse(wh._id, wh.name)}
                        className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <h3 className="mt-2 font-serif text-base font-bold text-[#121214]">{wh.name}</h3>
                  <p className="text-xs text-[#6B6357]">
                    {[wh.city, wh.state, wh.pincode].filter(Boolean).join(', ') || 'Location not set'}
                  </p>
                </div>

                {wh.metrics && (
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#FAF8F5] border border-[#EFE8DD] p-2.5 text-center font-mono">
                    <div>
                      <div className="text-[9px] text-[#8A847B]">SKUs</div>
                      <div className="text-xs font-bold text-[#121214]">{wh.metrics.skuCount}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#8A847B]">ON HAND</div>
                      <div className="text-xs font-bold text-[#121214]">{wh.metrics.totalOnHand}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-emerald-700">AVAIL</div>
                      <div className="text-xs font-bold text-emerald-700">{wh.metrics.totalAvailable}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Inter-Warehouse Stock Transfer */}
            <form
              onSubmit={handleTransferSubmit}
              className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-6 shadow-2xs space-y-4"
            >
              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#9A6D22]">
                  Atomic Hub Relocation
                </span>
                <h2 className="font-serif text-lg font-bold text-[#121214]">
                  Transfer Stock Between Warehouses
                </h2>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                  SKU ID *
                </label>
                <input
                  list="bvb-sku-datalist"
                  required
                  value={transferForm.skuId}
                  onChange={(e) => setTransferForm({ ...transferForm, skuId: e.target.value })}
                  placeholder="BVB-TEE-01-BLK-M"
                  className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs uppercase focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                    From Warehouse *
                  </label>
                  <select
                    required
                    value={transferForm.fromWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })}
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2.5 text-xs"
                  >
                    <option value="">Select source</option>
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                    To Warehouse *
                  </label>
                  <select
                    required
                    value={transferForm.toWarehouseId}
                    onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2.5 text-xs"
                  >
                    <option value="">Select destination</option>
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                    Transfer Qty *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={transferForm.qty}
                    onChange={(e) => setTransferForm({ ...transferForm, qty: e.target.value })}
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                    Reason / Manifest Note
                  </label>
                  <input
                    type="text"
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                    placeholder="Regional replenishment"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingTransfer || warehouses.length < 2}
                className="w-full rounded-xl bg-[#121214] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FAD79F] hover:bg-[#232328] disabled:opacity-50 cursor-pointer"
              >
                {warehouses.length < 2
                  ? 'Add a 2nd Warehouse to Enable Transfers'
                  : isSubmittingTransfer
                  ? 'Transferring Stock...'
                  : 'Execute Atomic Transfer'}
              </button>
            </form>

            {/* Add New Warehouse */}
            <form
              onSubmit={handleCreateWarehouse}
              className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-6 shadow-2xs space-y-4"
            >
              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#9A6D22]">
                  Multi-Warehouse Network
                </span>
                <h2 className="font-serif text-lg font-bold text-[#121214]">
                  Register New Warehouse Hub
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={warehouseForm.code}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    placeholder="WH-MUM-02"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#55514B] mb-1">
                    Warehouse Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={warehouseForm.name}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                    placeholder="Mumbai West Dispatch Hub"
                    className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={warehouseForm.city}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })}
                  placeholder="City"
                  className="rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={warehouseForm.state}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, state: e.target.value })}
                  placeholder="State"
                  className="rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={warehouseForm.pincode}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, pincode: e.target.value })}
                  placeholder="Pincode"
                  className="rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3 py-2 font-mono text-xs"
                />
              </div>

              <input
                type="text"
                value={warehouseForm.address}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                placeholder="Full street address"
                className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] px-3.5 py-2 text-xs"
              />

              <button
                type="submit"
                className="w-full rounded-xl border border-[#D9AE6A] bg-gradient-to-r from-[#FAF3E4] to-[#F5E6C7] py-2.5 text-xs font-semibold uppercase tracking-wider text-[#7A5220] hover:bg-[#F2DEB5] cursor-pointer"
              >
                + Add Warehouse Hub
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
