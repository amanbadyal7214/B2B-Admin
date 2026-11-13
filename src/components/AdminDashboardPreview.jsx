import { useState } from 'react'

export default function AdminDashboardPreview({ user }) {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Sample luxury wholesale orders for B2B garment commerce
  const orders = [
    {
      id: 'BVB-ORD-9281',
      retailer: 'Apex Luxury Apparel & Co.',
      location: 'Mumbai, Maharashtra',
      items: 'Heavyweight Loopback Terry Hoodie (Pack of 50)',
      sku: 'BVB-HD-450',
      units: 150,
      total: '₹4,35,000',
      status: 'CONFIRMED',
      date: 'Today, 14:20',
      tier: 'Diamond Wholesale',
    },
    {
      id: 'BVB-ORD-9280',
      retailer: 'Sartorial Streetwear Collective',
      location: 'Bengaluru, Karnataka',
      items: 'Brushed French Terry Cargo Jogger (Pack of 30)',
      sku: 'BVB-JG-380',
      units: 90,
      total: '₹2,61,000',
      status: 'DISPATCHED',
      date: 'Today, 11:45',
      tier: 'Platinum Retail',
    },
    {
      id: 'BVB-ORD-9279',
      retailer: 'Vogue District Multi-Brand Store',
      location: 'New Delhi, NCR',
      items: 'Oversized 280 GSM Acid Wash Tees (Pack of 100)',
      sku: 'BVB-TS-280',
      units: 300,
      total: '₹5,10,000',
      status: 'PENDING_MOQ',
      date: 'Yesterday, 18:10',
      tier: 'Gold Partner',
    },
    {
      id: 'BVB-ORD-9278',
      retailer: 'Urban Fabric Studios',
      location: 'Hyderabad, Telangana',
      items: 'Vintage Wash Drop-Shoulder Sweatshirt (Pack of 40)',
      sku: 'BVB-SW-320',
      units: 80,
      total: '₹1,92,000',
      status: 'CONFIRMED',
      date: 'Yesterday, 16:35',
      tier: 'Silver Partner',
    },
    {
      id: 'BVB-ORD-9277',
      retailer: 'Opulence Menswear Galleria',
      location: 'Ahmedabad, Gujarat',
      items: 'Brushed Champagne Satin Bomber Jacket (Pack of 20)',
      sku: 'BVB-JK-500',
      units: 60,
      total: '₹3,72,000',
      status: 'INVOICED',
      date: '12 Nov 2026',
      tier: 'Diamond Wholesale',
    },
  ]

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true
    return o.status === statusFilter
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#BDE0C7] bg-[#F1F9F3] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#1E824C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1E824C]" />
            Confirmed
          </span>
        )
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#BCD9EE] bg-[#F0F6FB] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#2980B9]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2980B9]" />
            In Transit
          </span>
        )
      case 'PENDING_MOQ':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#F6DCAD] bg-[#FDF8EE] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#B37D14]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B37D14]" />
            MOQ Review
          </span>
        )
      case 'INVOICED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#E0D5BE] bg-[#FBF7EE] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#805915]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
            Proforma Issued
          </span>
        )
      default:
        return (
          <span className="rounded-full border border-[#E5E0D5] bg-[#F5F2EC] px-2.5 py-0.5 font-mono text-[10px] text-[#635E56]">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-7">
      {/* Welcome Banner Card in Old Luxury Theme */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E9E1D2] bg-gradient-to-r from-[#FFFFFF] via-[#FAF7F2] to-[#FAF5EB] p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9AE6A]/40 bg-[#FFFFFF] px-3 py-0.5 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#1E824C] animate-pulse" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#805915]">
                Active Executive Session Granted
              </span>
            </div>
            <h1 className="mt-3 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1815]">
              Welcome to Atelier Command, {user?.name || 'Aman Badyal'}
            </h1>
            <p className="mt-1 text-xs text-[#635E56] max-w-2xl leading-relaxed">
              Wholesale order reconciliation, bulk inventory allocation, and verified garment retailer accounts running under active B2B luxury protocols.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => alert('Exporting Wholesale Tax Ledger (CSV / PDF)...')}
              className="rounded-lg border border-[#DFD5C2] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#5A544B] shadow-2xs hover:bg-[#FAF8F5] transition-all"
            >
              Tax Ledger Export
            </button>
            <button
              type="button"
              onClick={() => alert('New SKU Launch Modal opened')}
              className="luxury-shimmer-btn rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm hover:shadow transition-all"
            >
              + New SKU Launch
            </button>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-xl border border-[#E9E1D2] bg-[#FFFFFF] p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#7A746B]">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
              Wholesale GMV (MTD)
            </span>
            <span className="rounded-full bg-[#F1F9F3] border border-[#BDE0C7] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#1E824C]">
              +18.4%
            </span>
          </div>
          <div className="mt-3 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#121214]">
            ₹48,92,400
          </div>
          <div className="mt-1 text-[11px] text-[#7A746B]">
            Across 42 verified apparel stores
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-xl border border-[#E9E1D2] bg-[#FFFFFF] p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#7A746B]">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
              Pending Pack Dispatches
            </span>
            <span className="rounded-full bg-[#FDF8EE] border border-[#F6DCAD] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#B37D14]">
              14 Orders
            </span>
          </div>
          <div className="mt-3 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#121214]">
            1,240 Units
          </div>
          <div className="mt-1 text-[11px] text-[#7A746B]">
            Ludhiana & Tirupur hubs active
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-xl border border-[#E9E1D2] bg-[#FFFFFF] p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#7A746B]">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
              Retailer Accounts
            </span>
            <span className="rounded-full bg-[#F0F6FB] border border-[#BCD9EE] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#2980B9]">
              142 Active
            </span>
          </div>
          <div className="mt-3 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#121214]">
            12 In KYC
          </div>
          <div className="mt-1 text-[11px] text-[#7A746B]">
            GST & store documentation review
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-xl border border-[#E9E1D2] bg-[#FFFFFF] p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#7A746B]">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
              Reserved Inventory
            </span>
            <span className="rounded-full bg-[#FBF7EE] border border-[#E0D5BE] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#805915]">
              94.8% SLA
            </span>
          </div>
          <div className="mt-3 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#121214]">
            38,450 pcs
          </div>
          <div className="mt-1 text-[11px] text-[#7A746B]">
            Zero oversell under concurrency
          </div>
        </div>
      </div>

      {/* Wholesale Orders Management Section */}
      <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] shadow-xs overflow-hidden">
        {/* Table Control Header */}
        <div className="border-b border-[#ECE4D5] bg-[#FAF8F5] p-5 sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-bold text-[#121214]">
                Wholesale Pack Orders & Re-Orders
              </h3>
              <span className="rounded-full border border-[#D9AE6A]/40 bg-[#FFFFFF] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#9A6D22]">
                {filteredOrders.length} Records
              </span>
            </div>
            <p className="text-xs text-[#736C61]">
              Real-time stream of wholesale transactions and MOQ bulk fulfillment.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="mt-3 sm:mt-0 flex items-center gap-1.5">
            {['ALL', 'CONFIRMED', 'DISPATCHED', 'PENDING_MOQ', 'INVOICED'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  statusFilter === f
                    ? 'bg-[#121214] text-[#FAF8F5]'
                    : 'border border-[#DFD6C5] bg-[#FFFFFF] text-[#635E56] hover:bg-[#F5EFE8]'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#EAE3D5] bg-[#FCFAF7] text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A746B]">
              <tr>
                <th className="py-3.5 px-5">Order Reference</th>
                <th className="py-3.5 px-5">Retail Partner</th>
                <th className="py-3.5 px-5">Bulk Garment & SKU</th>
                <th className="py-3.5 px-5 text-right">Units</th>
                <th className="py-3.5 px-5 text-right">Invoice Total</th>
                <th className="py-3.5 px-5 text-center">Fulfillment Status</th>
                <th className="py-3.5 px-5 text-right">Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9DF]">
              {filteredOrders.map((ord) => (
                <tr
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className="hover:bg-[#FAF7F1] cursor-pointer transition-colors"
                >
                  <td className="py-4 px-5 font-mono font-semibold text-[#121214]">
                    {ord.id}
                    <div className="text-[10px] font-sans font-normal text-[#8A847B]">
                      {ord.date}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-semibold text-[#121214]">{ord.retailer}</div>
                    <div className="text-[11px] text-[#7A746B]">{ord.location}</div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-[#36322D]">{ord.items}</div>
                    <span className="font-mono text-[10px] text-[#9A6D22]">{ord.sku}</span>
                  </td>
                  <td className="py-4 px-5 text-right font-mono font-medium text-[#121214]">
                    {ord.units} pcs
                  </td>
                  <td className="py-4 px-5 text-right font-mono font-bold text-[#121214]">
                    {ord.total}
                  </td>
                  <td className="py-4 px-5 text-center">{getStatusBadge(ord.status)}</td>
                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        alert(`Viewing Proforma Invoice for ${ord.id}`)
                      }}
                      className="rounded border border-[#D9AE6A] bg-[#FFFBF4] px-2.5 py-1 text-[11px] font-semibold text-[#9A6D22] hover:bg-[#F8EED8] transition-colors"
                    >
                      Invoice ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between border-t border-[#ECE4D5] bg-[#FAF8F5] px-5 py-3 text-xs text-[#7A746B]">
          <span>Showing {filteredOrders.length} of {orders.length} orders</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#9A6D22]">
              Live Replica Sync • Ludhiana Gateway
            </span>
          </div>
        </div>
      </div>

      {/* Selected Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121214]/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAE3D5] pb-3">
              <div>
                <span className="font-mono text-[10px] text-[#9A6D22] uppercase tracking-wider font-semibold">
                  Wholesale Order Detail
                </span>
                <h3 className="font-serif text-xl font-bold text-[#121214]">
                  {selectedOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-[#8A847B] hover:bg-[#FAF8F5] hover:text-[#121214]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F5EFE8]">
                <span className="text-[#7A746B]">Retail Partner:</span>
                <span className="font-semibold text-[#121214]">{selectedOrder.retailer}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F5EFE8]">
                <span className="text-[#7A746B]">Wholesale Tier:</span>
                <span className="font-medium text-[#9A6D22]">{selectedOrder.tier}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F5EFE8]">
                <span className="text-[#7A746B]">Garment Line:</span>
                <span className="text-[#121214]">{selectedOrder.items}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F5EFE8]">
                <span className="text-[#7A746B]">Order Quantity:</span>
                <span className="font-mono font-bold text-[#121214]">{selectedOrder.units} Units</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F5EFE8]">
                <span className="text-[#7A746B]">Settlement Value:</span>
                <span className="font-mono text-base font-bold text-[#121214]">{selectedOrder.total}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#7A746B]">Fulfillment Status:</span>
                <span>{getStatusBadge(selectedOrder.status)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-[#DFD6C5] px-4 py-2 text-xs font-semibold text-[#635E56] hover:bg-[#FAF8F5]"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Proforma lading exported for ${selectedOrder.id}`)
                  setSelectedOrder(null)
                }}
                className="rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#121214]"
              >
                Print Proforma Lading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
