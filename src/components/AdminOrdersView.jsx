import { useState, useEffect } from 'react'
import {
  getAdminOrdersApi,
  updateAdminOrderStatusApi,
  partialCancelOrderItemApi,
  processOrderReturnApi,
} from '../api'

const STATUS_CONFIG = {
  paid: { label: 'Paid (Ready to Pack)', bg: 'bg-[#1F8F5A]/10', border: 'border-[#1F8F5A]/30', text: 'text-[#1F8F5A]', dot: 'bg-[#1F8F5A]' },
  processing: { label: 'Processing / Picking', bg: 'bg-[#2E72D2]/10', border: 'border-[#2E72D2]/30', text: 'text-[#2E72D2]', dot: 'bg-[#2E72D2]' },
  dispatched: { label: 'Dispatched / In Transit', bg: 'bg-[#C59A46]/10', border: 'border-[#C59A46]/30', text: 'text-[#9A6D22]', dot: 'bg-[#C59A46]' },
  delivered: { label: 'Delivered', bg: 'bg-[#1F8F5A]/15', border: 'border-[#1F8F5A]/40', text: 'text-[#14603B]', dot: 'bg-[#1F8F5A]' },
  pending: { label: 'Pending (Stock Locked)', bg: 'bg-[#FAF3E4]', border: 'border-[#E5D3AF]', text: 'text-[#805915]', dot: 'bg-[#C59A46]' },
  payment_pending: { label: 'Payment Pending', bg: 'bg-[#FAF3E4]', border: 'border-[#E5D3AF]', text: 'text-[#805915]', dot: 'bg-[#C59A46]' },
  partially_cancelled: { label: 'Partially Cancelled', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-600' },
  cancelled: { label: 'Cancelled', bg: 'bg-[#C23B37]/10', border: 'border-[#C23B37]/30', text: 'text-[#C23B37]', dot: 'bg-[#C23B37]' },
  returned: { label: 'Returned', bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-800', dot: 'bg-teal-600' },
  expired: { label: 'Expired (Lock Released)', bg: 'bg-[#EAEAEA]', border: 'border-[#D0D0D0]', text: 'text-[#707070]', dot: 'bg-[#808080]' },
  failed: { label: 'Failed', bg: 'bg-[#C23B37]/10', border: 'border-[#C23B37]/30', text: 'text-[#C23B37]', dot: 'bg-[#C23B37]' },
}

export default function AdminOrdersView() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalPiecesSold: 0,
    paidCount: 0,
    pendingCount: 0,
    dispatchedCount: 0,
    deliveredCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // View / Edit Order Modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [editTrackingNumber, setEditTrackingNumber] = useState('')
  const [editHub, setEditHub] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0)
  }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const params = {}
      if (selectedStatusTab !== 'ALL') {
        params.status = selectedStatusTab
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const res = await getAdminOrdersApi(params)
      if (res?.success) {
        setOrders(res.orders || [])
        if (res.stats) {
          setStats(res.stats)
        }
      } else {
        setErrorMessage(res?.message || 'Failed to fetch wholesale orders.')
      }
    } catch (err) {
      console.error('[AdminOrdersView] Fetch error:', err)
      setErrorMessage(err.response?.data?.message || err.message || 'Error connecting to orders service.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [selectedStatusTab])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders()
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Open Order Detail Drawer
  const handleOpenOrder = (order) => {
    setSelectedOrder(order)
    setEditStatus(order.status || 'paid')
    setEditTrackingNumber(order.deliveryDetails?.trackingNumber || '')
    setEditHub(order.deliveryDetails?.hub || '')
    setEditNotes(order.notes || '')
  }

  // Quick Status change directly from row or detail drawer
  const handlePartialCancelItem = async (order, item) => {
    const remaining = Math.max(0, item.quantity - (item.cancelledQty || 0))
    if (remaining <= 0) return
    const qtyStr = window.prompt(
      `Partial cancel SKU ${item.skuId} (${item.size}). Enter qty to cancel (max ${remaining}):`,
      String(remaining)
    )
    if (!qtyStr) return
    const qty = parseInt(qtyStr, 10)
    if (isNaN(qty) || qty <= 0 || qty > remaining) {
      setErrorMessage(`Please enter a valid qty between 1 and ${remaining}.`)
      return
    }
    const reason = window.prompt('Reason for partial cancellation:', 'Retailer requested SKU cancellation') || 'Partial cancellation'
    try {
      setIsUpdatingStatus(true)
      const res = await partialCancelOrderItemApi(order._id, { skuId: item.skuId, qty, reason })
      if (res?.success && res.order) {
        setSuccessMessage(res.message)
        setSelectedOrder(res.order)
        fetchOrders()
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleReturnItem = async (order, item, qcStatus) => {
    const remaining = Math.max(
      0,
      item.quantity - (item.cancelledQty || 0) - (item.returnedQty || 0) - (item.damagedQty || 0)
    )
    if (remaining <= 0) return
    const qtyStr = window.prompt(
      `Return QC ${qcStatus} for ${item.skuId}. Enter qty (max ${remaining}):`,
      String(remaining)
    )
    if (!qtyStr) return
    const qty = parseInt(qtyStr, 10)
    if (isNaN(qty) || qty <= 0 || qty > remaining) {
      setErrorMessage(`Please enter a valid qty between 1 and ${remaining}.`)
      return
    }
    const reason =
      window.prompt(
        'QC Inspection Notes:',
        qcStatus === 'PASS' ? 'Packaging & tags intact - restockable' : 'Damaged / failed QC inspection'
      ) || `Return QC ${qcStatus}`
    try {
      setIsUpdatingStatus(true)
      const res = await processOrderReturnApi(order._id, {
        skuId: item.skuId,
        qty,
        qcStatus,
        reason,
      })
      if (res?.success && res.order) {
        setSuccessMessage(res.message)
        setSelectedOrder(res.order)
        fetchOrders()
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus, trackingNo = null) => {
    try {
      setIsUpdatingStatus(true)
      setErrorMessage('')
      setSuccessMessage('')

      const payload = { status: newStatus }
      if (trackingNo !== null) {
        payload.trackingNumber = trackingNo
      } else if (editTrackingNumber) {
        payload.trackingNumber = editTrackingNumber
      }
      if (editHub) payload.hub = editHub
      if (editNotes) payload.notes = editNotes

      const res = await updateAdminOrderStatusApi(orderId, payload)
      if (res?.success && res.order) {
        setSuccessMessage(`Order ${res.order.orderId} updated to ${res.order.status}.`)
        // Update in list
        setOrders((prev) =>
          prev.map((o) => (o._id === res.order._id ? res.order : o))
        )
        if (selectedOrder && selectedOrder._id === res.order._id) {
          setSelectedOrder(res.order)
        }
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage(res?.message || 'Failed to update order status.')
      }
    } catch (err) {
      console.error('[AdminOrdersView] Update error:', err)
      setErrorMessage(err.response?.data?.message || err.message || 'Error updating order.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A6D22]">
              Wholesale Order Management
            </span>
            <span className="h-1 w-1 rounded-full bg-[#9A6D22]" />
            <span className="font-mono text-[10px] uppercase text-[#7A746B]">
              Real-time Dispatch Console
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#121214] sm:text-3xl">
            Retailer Wholesale Orders
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#ECE4D5] bg-white px-3.5 py-2 text-xs font-semibold text-[#635E56] shadow-2xs transition-all hover:border-[#C59A46] hover:bg-[#FAF8F5] hover:text-[#121214]"
          >
            <svg
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#9A6D22]' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Manifests</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#1F8F5A]/30 bg-[#1F8F5A]/10 p-3.5 text-xs font-medium text-[#14603B]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1F8F5A] text-[10px] text-white">✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#C23B37]/30 bg-[#C23B37]/10 p-3.5 text-xs font-medium text-[#C23B37]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C23B37] text-[10px] text-white">✕</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Executive KPI Stats Strip */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-2xs">
          <p className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#7A746B]">
            Total Manifests
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-[#121214]">
            {stats.totalOrders}
          </p>
          <p className="mt-0.5 text-[10.5px] text-[#8A847B]">All B2B Orders</p>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-2xs">
          <p className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#1F8F5A]">
            Paid &amp; Ready
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-[#1F8F5A]">
            {stats.paidCount}
          </p>
          <p className="mt-0.5 text-[10.5px] text-[#8A847B]">Verified Razorpay</p>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-2xs">
          <p className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#C59A46]">
            In Transit
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-[#9A6D22]">
            {stats.dispatchedCount}
          </p>
          <p className="mt-0.5 text-[10.5px] text-[#8A847B]">Dispatched to Hub</p>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-2xs">
          <p className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#14603B]">
            Delivered
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-[#14603B]">
            {stats.deliveredCount}
          </p>
          <p className="mt-0.5 text-[10.5px] text-[#8A847B]">Store Received</p>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-white p-4 shadow-2xs">
          <p className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#9A6D22]">
            Total Volume
          </p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-[#121214]">
            {stats.totalPiecesSold} <span className="text-xs font-normal text-[#8A847B]">pcs</span>
          </p>
          <p className="mt-0.5 text-[10.5px] text-[#8A847B]">Ready-stock Units</p>
        </div>

        <div className="rounded-xl border border-[#D9AE6A]/40 bg-gradient-to-br from-[#FAF6EE] to-white p-4 shadow-2xs">
          <p className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#9A6D22]">
            Total Revenue
          </p>
          <p className="mt-1 truncate font-mono text-xl font-extrabold text-[#805915]">
            {formatPrice(stats.totalRevenue)}
          </p>
          <p className="mt-0.5 text-[10.5px] text-[#8A847B]">Gross Settled POs</p>
        </div>
      </div>

      {/* Main Order Ledger Card */}
      <div className="rounded-xl border border-[#ECE4D5] bg-white shadow-2xs">
        {/* Status Filters & Live Search */}
        <div className="flex flex-col gap-3.5 border-b border-[#ECE4D5] p-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs font-medium">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'paid', label: 'Paid' },
              { id: 'processing', label: 'Processing' },
              { id: 'dispatched', label: 'Dispatched' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'pending', label: 'Pending Lock' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatusTab(tab.id)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 transition-all ${
                  selectedStatusTab === tab.id
                    ? 'bg-[#121214] text-[#FAF8F5] shadow-2xs font-semibold'
                    : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Store, Phone, Pin..."
              className="h-9 w-full rounded-lg border border-[#DFD8CA] bg-[#FAF8F5] pl-8 pr-3 text-xs text-[#121214] placeholder-[#8A847B] focus:border-[#121214] focus:bg-white focus:outline-none"
            />
            <svg
              className="absolute left-2.5 top-2.5 h-4 w-4 text-[#8A847B]"
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
                className="absolute right-2.5 top-2 text-xs text-[#8A847B] hover:text-[#121214]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[9.5px] uppercase tracking-wider text-[#7A746B]">
              <tr>
                <th className="px-4 py-3">Order Ref / Time</th>
                <th className="px-4 py-3">Buyer Storefront</th>
                <th className="px-4 py-3">Units &amp; SKUs</th>
                <th className="px-4 py-3">Invoice Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Fulfillment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#ECE4D5]/70">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A746B]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
                      <span className="font-mono text-xs uppercase tracking-wider">Loading orders manifest...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A746B]">
                    <p className="font-serif text-base font-semibold text-[#121214]">No wholesale orders found</p>
                    <p className="mt-1 text-xs text-[#8A847B]">
                      {searchQuery
                        ? `No orders matching "${searchQuery}". Try clearing filters.`
                        : 'New orders placed by retailers in the frontend will appear here instantly.'}
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusMeta = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                  const isPaid = ['paid', 'processing', 'dispatched', 'delivered'].includes(order.status)

                  return (
                    <tr key={order._id} className="transition-colors hover:bg-[#FAF8F5]/60">
                      {/* Order Reference */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-[#121214]">
                            {order.orderId}
                          </span>
                          <span className="mt-0.5 text-[10.5px] text-[#8A847B]">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            ·{' '}
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Store Details */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-[#121214]">
                            {order.shippingAddress?.storeName || 'Direct Retailer'}
                          </span>
                          <span className="text-[#635E56]">
                            {order.shippingAddress?.contactName} ({order.shippingAddress?.phone})
                          </span>
                          <span className="font-mono text-[10px] text-[#8A847B]">
                            {order.shippingAddress?.city}, {order.shippingAddress?.pincode}
                            {order.shippingAddress?.gstin ? ` · GSTIN: ${order.shippingAddress.gstin}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Units & SKU */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-[#121214]">
                            {order.totalUnits} pcs
                          </span>
                          <span className="text-[10.5px] text-[#8A847B]">
                            {order.items?.length || 0} unique line item{order.items?.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-col">
                          <span className="font-mono font-extrabold text-[#7A5220]">
                            {formatPrice(order.pricing?.grandTotal)}
                          </span>
                          <span className="text-[10px] text-[#8A847B]">
                            Incl. 5% GST {order.pricing?.freightCost === 0 ? '· Free Freight' : ''}
                          </span>
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider ${
                              isPaid
                                ? 'border border-[#1F8F5A]/30 bg-[#1F8F5A]/10 text-[#1F8F5A]'
                                : 'border border-[#C59A46]/30 bg-[#FAF3E4] text-[#805915]'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isPaid ? 'bg-[#1F8F5A]' : 'bg-[#C59A46]'
                              }`}
                            />
                            <span>{order.paymentStatus || 'unpaid'}</span>
                          </span>

                          {order.razorpayOrderId && (
                            <span className="truncate font-mono text-[9px] text-[#8A847B]" title={order.razorpayOrderId}>
                              RZP: {order.razorpayOrderId.substring(0, 14)}...
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fulfillment Status & Quick Changer */}
                      <td className="px-4 py-3.5 align-top">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                          className={`cursor-pointer rounded-lg border px-2.5 py-1 font-mono text-[10.5px] font-semibold transition-all focus:outline-none ${statusMeta.border} ${statusMeta.bg} ${statusMeta.text}`}
                        >
                          <option value="pending">Pending Lock</option>
                          <option value="payment_pending">Payment Pending</option>
                          <option value="paid">Paid</option>
                          <option value="processing">Processing / Picking</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {order.deliveryDetails?.trackingNumber && (
                          <p className="mt-1 font-mono text-[9.5px] text-[#8A847B]">
                            AWB: {order.deliveryDetails.trackingNumber}
                          </p>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenOrder(order)}
                            title="View Full Manifest / Proforma Invoice"
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#ECE4D5] bg-[#FAF8F5] px-2.5 py-1 text-xs font-semibold text-[#121214] transition-all hover:border-[#121214] hover:bg-white"
                          >
                            <span>Inspect Manifest</span>
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

      {/* ORDER INSPECTION & FULFILLMENT MODAL / DRAWER */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs sm:p-6"
        >
          <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-[#ECE4D5] bg-white shadow-2xl">
            {/* Header */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#D9AE6A] via-[#BE8E4C] to-[#D9AE6A]" />

            <div className="flex items-start justify-between border-b border-[#ECE4D5] p-5 sm:p-6">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A6D22]">
                  Proforma Tax Invoice &amp; Dispatch Ledger
                </span>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#121214]">
                  {selectedOrder.orderId}
                </h2>
                <p className="mt-0.5 font-mono text-xs text-[#8A847B]">
                  Logged on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#ECE4D5] bg-[#FAF8F5] px-3 py-1.5 text-xs font-semibold text-[#121214] hover:border-[#121214]"
                >
                  <span>🖨️ Print Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#7A746B] hover:bg-[#FAF8F5] hover:text-[#121214]"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Buyer & Dispatch Info Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#ECE4D5] bg-[#FAF8F5] p-4 text-xs">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7A746B]">
                    Retailer Store Information
                  </p>
                  <p className="mt-2 font-bold text-sm text-[#121214]">
                    {selectedOrder.shippingAddress?.storeName}
                  </p>
                  <p className="text-[#635E56]">
                    Contact: {selectedOrder.shippingAddress?.contactName}
                  </p>
                  <p className="font-mono text-[#635E56]">
                    Phone: {selectedOrder.shippingAddress?.phone}
                  </p>
                  <p className="font-mono text-[#635E56]">
                    Email: {selectedOrder.shippingAddress?.email || '—'}
                  </p>
                  <p className="mt-1 font-mono font-semibold text-[#9A6D22]">
                    GSTIN: {selectedOrder.shippingAddress?.gstin || 'Unregistered / Retail'}
                  </p>
                </div>

                <div className="rounded-xl border border-[#ECE4D5] bg-[#FAF8F5] p-4 text-xs">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7A746B]">
                    Delivery Destination &amp; Hub
                  </p>
                  <p className="mt-2 text-[#121214]">
                    {selectedOrder.shippingAddress?.street}
                  </p>
                  <p className="text-[#635E56]">
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{' '}
                    <span className="font-mono font-bold text-[#121214]">
                      {selectedOrder.shippingAddress?.pincode}
                    </span>
                  </p>
                  <p className="mt-2 font-semibold text-[#1F8F5A]">
                    ✓ Dispatch Hub: {selectedOrder.deliveryDetails?.hub || 'Regional Direct Hub'}
                  </p>
                  <p className="font-mono text-[11px] text-[#8A847B]">
                    ETA: {selectedOrder.deliveryDetails?.estimatedDeliveryDate
                      ? new Date(selectedOrder.deliveryDetails.estimatedDeliveryDate).toLocaleDateString('en-IN')
                      : '2-3 Business Days'}
                  </p>
                </div>
              </div>

              {/* Status & Dispatch Management Box */}
              <div className="rounded-xl border border-[#D9AE6A]/40 bg-[#FAF6EE] p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#9A6D22]">
                  Dispatch &amp; Fulfillment Controls
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7A746B]">
                      Order Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-[#DFD8CA] bg-white px-2.5 font-mono text-xs font-semibold text-[#121214] focus:outline-none"
                    >
                      <option value="pending">Pending (Stock Lock)</option>
                      <option value="payment_pending">Payment Pending</option>
                      <option value="paid">Paid (Verified)</option>
                      <option value="processing">Processing / Picking</option>
                      <option value="dispatched">Dispatched / In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled (Restore Stock)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7A746B]">
                      Courier AWB / Tracking #
                    </label>
                    <input
                      type="text"
                      value={editTrackingNumber}
                      onChange={(e) => setEditTrackingNumber(e.target.value)}
                      placeholder="e.g. BLUEDART-849201"
                      className="mt-1 h-9 w-full rounded-lg border border-[#DFD8CA] bg-white px-2.5 font-mono text-xs text-[#121214] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#7A746B]">
                      Dispatch Hub
                    </label>
                    <input
                      type="text"
                      value={editHub}
                      onChange={(e) => setEditHub(e.target.value)}
                      placeholder="West Direct Hub"
                      className="mt-1 h-9 w-full rounded-lg border border-[#DFD8CA] bg-white px-2.5 font-sans text-xs text-[#121214] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleUpdateOrderStatus(selectedOrder._id, editStatus, editTrackingNumber)}
                    disabled={isUpdatingStatus}
                    className="cursor-pointer rounded-lg bg-[#121214] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#FAD79F] hover:bg-[#232326] disabled:opacity-50"
                  >
                    {isUpdatingStatus ? 'Saving...' : 'Save Dispatch Updates'}
                  </button>
                </div>
              </div>

              {/* Items Manifest */}
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#7A746B] mb-2">
                  Garment Units Manifest ({selectedOrder.totalUnits} pcs total)
                </p>
                <div className="overflow-hidden rounded-xl border border-[#ECE4D5]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#ECE4D5] bg-[#FAF8F5] font-mono text-[9.5px] uppercase tracking-wider text-[#7A746B]">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Color / Size</th>
                        <th className="p-3 text-center">Quantity</th>
                        <th className="p-3 text-right">Unit Rate</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-right">Stock Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECE4D5]/70">
                      {selectedOrder.items?.map((item, idx) => {
                        const activeRem = Math.max(
                          0,
                          item.quantity -
                            (item.cancelledQty || 0) -
                            (item.returnedQty || 0) -
                            (item.damagedQty || 0)
                        )
                        const canPartialCancel =
                          activeRem > 0 &&
                          ['pending', 'payment_pending', 'paid', 'processing', 'partially_cancelled'].includes(
                            selectedOrder.status
                          )
                        const canReturnQc =
                          activeRem > 0 && ['dispatched', 'delivered'].includes(selectedOrder.status)

                        return (
                          <tr key={idx} className="hover:bg-[#FAF8F5]/40">
                            <td className="p-3 font-semibold text-[#121214]">
                              <div>{item.productName}</div>
                              {(item.cancelledQty > 0 || item.returnedQty > 0 || item.damagedQty > 0) && (
                                <div className="mt-0.5 font-mono text-[9.5px] text-amber-700">
                                  {item.cancelledQty > 0 ? `Cancelled: ${item.cancelledQty} ` : ''}
                                  {item.returnedQty > 0 ? `Restocked: ${item.returnedQty} ` : ''}
                                  {item.damagedQty > 0 ? `Damaged: ${item.damagedQty}` : ''}
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-[#7A746B]">{item.skuId}</td>
                            <td className="p-3 text-[#635E56]">
                              {item.color} · <span className="font-mono font-bold">{item.size}</span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-[#121214]">
                              {item.quantity} pcs
                            </td>
                            <td className="p-3 text-right font-mono text-[#635E56]">
                              {formatPrice(item.unitPrice)}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-[#121214]">
                              {formatPrice(item.totalPrice)}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              {canPartialCancel && (
                                <button
                                  type="button"
                                  disabled={isUpdatingStatus}
                                  onClick={() => handlePartialCancelItem(selectedOrder, item)}
                                  className="rounded border border-rose-200 bg-rose-50 px-2 py-1 font-mono text-[9.5px] font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                                >
                                  Cancel SKU
                                </button>
                              )}
                              {canReturnQc && (
                                <div className="inline-flex gap-1">
                                  <button
                                    type="button"
                                    disabled={isUpdatingStatus}
                                    onClick={() => handleReturnItem(selectedOrder, item, 'PASS')}
                                    className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[9.5px] font-semibold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                  >
                                    QC Pass
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isUpdatingStatus}
                                    onClick={() => handleReturnItem(selectedOrder, item, 'FAIL')}
                                    className="rounded border border-rose-200 bg-rose-50 px-2 py-1 font-mono text-[9.5px] font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                                  >
                                    QC Fail
                                  </button>
                                </div>
                              )}
                              {!canPartialCancel && !canReturnQc && (
                                <span className="font-mono text-[10px] text-[#9A9386]">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Ledger */}
              <div className="rounded-xl border border-[#ECE4D5] bg-[#FAF8F5] p-4 text-xs">
                <div className="flex justify-between py-1 text-[#635E56]">
                  <span>Gross Merchandise</span>
                  <span className="font-mono font-bold text-[#121214]">
                    {formatPrice(selectedOrder.pricing?.grossMerchandise)}
                  </span>
                </div>

                {selectedOrder.pricing?.discountAmount > 0 && (
                  <div className="flex justify-between py-1 text-[#1F8F5A]">
                    <span>Volume Rebate ({Math.round((selectedOrder.pricing?.discountRate || 0) * 100)}%)</span>
                    <span className="font-mono font-bold">
                      − {formatPrice(selectedOrder.pricing?.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 text-[#635E56]">
                  <span>Apparel GST (5% Input Tax Credit)</span>
                  <span className="font-mono font-bold text-[#121214]">
                    {formatPrice(selectedOrder.pricing?.gstAmount)}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-[#635E56]">
                  <span>Insured Carton Freight</span>
                  <span className="font-mono font-bold text-[#121214]">
                    {selectedOrder.pricing?.freightCost === 0 ? 'Complimentary' : formatPrice(selectedOrder.pricing?.freightCost)}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between border-t border-[#ECE4D5] pt-2 text-sm font-bold text-[#121214]">
                  <span>Net Payable Grand Total</span>
                  <span className="font-mono text-xl font-extrabold text-[#7A5220]">
                    {formatPrice(selectedOrder.pricing?.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
