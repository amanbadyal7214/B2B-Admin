/* eslint-disable react/prop-types */
import { useRef } from 'react'
import bvbLogo from '../assets/bvb-logo.png'

export default function TaxInvoiceModal({
  invoice,
  isOpen,
  onClose,
  onIssueCreditNote,
}) {
  const printAreaRef = useRef(null)

  if (!isOpen || !invoice) return null

  const isCreditNote = invoice.type === 'credit_note'
  const seller = invoice.sellerDetails || {}
  const buyer = invoice.buyerDetails || {}
  const totals = invoice.totals || {}
  const payment = invoice.paymentDetails || {}
  const items = invoice.items || []

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(num) || 0)
  }

  const formatDate = (d) => {
    if (!d) return '—'
    try {
      const dt = new Date(d)
      return dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return String(d)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#D9AE6A]/40 overflow-hidden text-[#121214]">
        {/* Top Control Bar */}
        <div className="print:hidden flex items-center justify-between px-6 py-3.5 bg-[#FAF8F5] border-b border-[#E6E0D4] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10.5px] uppercase font-bold tracking-wider text-[#9A6D22]">
              Atelier GST Accounting Console
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                isCreditNote
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : payment.paymentStatus === 'paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isCreditNote ? 'Credit Note' : payment.paymentStatus || invoice.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isCreditNote && invoice.status !== 'cancelled' && onIssueCreditNote && (
              <button
                type="button"
                onClick={() => onIssueCreditNote(invoice._id || invoice.invoiceNumber)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-purple-900 hover:bg-purple-100 transition-colors cursor-pointer"
              >
                <span>Issue Credit Note</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9AE6A] bg-white px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#7A5220] hover:bg-[#FAF1D6] transition-colors cursor-pointer shadow-2xs"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-[#E6E0D4] bg-white flex items-center justify-center text-[#5C5852] hover:text-[#121214] hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close invoice"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div ref={printAreaRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:overflow-visible">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#121214]/15 pb-5">
            <div className="flex items-start gap-4">
              <img
                src={bvbLogo}
                alt="Buddy Vs Buff"
                className="h-12 w-auto object-contain shrink-0"
              />
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#121214] uppercase">
                  {seller.legalName || 'BUDDY VS BUFF TEXTILE MILLS PRIVATE LIMITED'}
                </h1>
                <p className="text-xs text-[#5C5852] mt-0.5 leading-relaxed max-w-md">
                  {seller.address || 'Plot 42, Mill Gate Industrial Hub, Ring Road, Surat, Gujarat 395002'}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs font-mono text-[#7A5220]">
                  <span><strong>GSTIN:</strong> {seller.gstin || '24AAACB1234F1Z5'}</span>
                  <span><strong>PAN:</strong> {seller.pan || 'AAACB1234F'}</span>
                  <span><strong>State:</strong> Gujarat (Code: 24)</span>
                </div>
              </div>
            </div>

            {/* Document Reference */}
            <div className="sm:text-right shrink-0 bg-[#FAF8F5] sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#E6E0D4]">
              <div className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-wider text-[#7A5220]">
                {isCreditNote ? 'CREDIT NOTE' : 'TAX INVOICE'}
              </div>
              <div className="mt-1 font-mono text-xs space-y-0.5 text-[#121214]">
                <div>
                  <span className="text-[#7A746B]">Doc No:</span>{' '}
                  <strong className="text-base text-[#121214]">{invoice.invoiceNumber}</strong>
                </div>
                <div>
                  <span className="text-[#7A746B]">Date:</span>{' '}
                  <strong>{formatDate(invoice.issuedAt || invoice.createdAt)}</strong>
                </div>
                <div>
                  <span className="text-[#7A746B]">Order Ref:</span>{' '}
                  <strong className="text-[#9A6D22]">{invoice.orderId}</strong>
                </div>
                {isCreditNote && invoice.creditNoteReference && (
                  <div className="text-purple-800 font-semibold">
                    <span>Original Inv:</span> {invoice.creditNoteReference}
                  </div>
                )}
                <div>
                  <span className="text-[#7A746B]">Reverse Charge:</span>{' '}
                  <strong>No (N)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Parties Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Seller Contact & Remittance */}
            <div className="rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]/60 p-4 space-y-1.5">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#9A6D22] block mb-1">
                Dispatch &amp; Remittance Details
              </span>
              <div>
                <span className="text-[#7A746B]">Email:</span>{' '}
                <span className="font-medium text-[#121214]">{seller.email || 'billing@buddyvsbuff.com'}</span>
              </div>
              <div>
                <span className="text-[#7A746B]">Phone:</span>{' '}
                <span className="font-medium text-[#121214]">{seller.phone || '+91 98765 43210'}</span>
              </div>
              <div className="pt-2 border-t border-[#E6E0D4] space-y-0.5 font-mono text-[11px]">
                <strong className="text-[#121214] block">Direct Bank Remittance (RTGS/NEFT):</strong>
                <div>Bank: {seller.bankDetails?.bankName || 'HDFC Bank Ltd.'}</div>
                <div>A/C Name: {seller.bankDetails?.accountName || 'Buddy Vs Buff Private Limited'}</div>
                <div>A/C No: <strong className="text-[#7A5220]">{seller.bankDetails?.accountNumber || '50200012345678'}</strong></div>
                <div>IFSC: <strong>{seller.bankDetails?.ifscCode || 'HDFC0001234'}</strong></div>
                <div>Branch: {seller.bankDetails?.branch || 'Surat Hub'}</div>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="rounded-xl border border-[#E6E0D4] bg-[#FAF8F5]/60 p-4 space-y-1.5">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#9A6D22] block mb-1">
                Details of Receiver (Billed &amp; Shipped To)
              </span>
              <div className="text-sm font-bold text-[#121214]">
                {buyer.businessName || 'Wholesale Retail Partner'}
              </div>
              {buyer.contactName && (
                <div>
                  <span className="text-[#7A746B]">Attn:</span> {buyer.contactName}
                </div>
              )}
              <div>
                <span className="text-[#7A746B]">GSTIN:</span>{' '}
                <strong className="font-mono text-[#7A5220]">{buyer.gstin || 'Unregistered (URP)'}</strong>
              </div>
              {buyer.pan && (
                <div>
                  <span className="text-[#7A746B]">PAN:</span>{' '}
                  <span className="font-mono">{buyer.pan}</span>
                </div>
              )}
              <div className="leading-tight text-[#5C5852]">
                <span className="text-[#7A746B]">Shipping Address:</span>{' '}
                {buyer.shippingAddress?.street ? (
                  <span>
                    {buyer.shippingAddress.street}, {buyer.shippingAddress.city},{' '}
                    {buyer.shippingAddress.state} - {buyer.shippingAddress.pincode}
                  </span>
                ) : (
                  <span>Standard Store Address</span>
                )}
              </div>
              <div className="pt-1 font-mono text-[11px] text-[#7A5220]">
                <strong>Place of Supply:</strong> {buyer.placeOfSupply || '27-Maharashtra'} (
                {buyer.isInterState ? 'Inter-State · IGST' : 'Intra-State · CGST+SGST'})
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto rounded-xl border border-[#121214]/15">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#121214] text-[#FAD79F] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Garment Style / SKU Description</th>
                  <th className="py-2.5 px-3 text-center">HSN</th>
                  <th className="py-2.5 px-3 text-center">Packs / Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate / Pc</th>
                  <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                  {buyer.isInterState ? (
                    <th className="py-2.5 px-3 text-right">IGST</th>
                  ) : (
                    <>
                      <th className="py-2.5 px-3 text-right">CGST</th>
                      <th className="py-2.5 px-3 text-right">SGST</th>
                    </>
                  )}
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E0D4] font-mono text-xs">
                {items.map((item, idx) => (
                  <tr key={item._id || idx} className={idx % 2 === 1 ? 'bg-[#FAF8F5]' : 'bg-white'}>
                    <td className="py-2.5 px-3 text-[#7A746B]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-bold text-[#121214]">{item.productName}</div>
                      <div className="text-[11px] text-[#7A746B] font-mono">
                        SKU: {item.skuId || item.productSku} · Shade: {item.color} · Size: {item.size}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#7A5220]">{item.hsnCode || '6109'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <strong>{item.quantity}</strong> pcs
                      <div className="text-[10px] text-[#8A847B]">({item.packs || Math.ceil(item.quantity / 4)} packs)</div>
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(item.ratePerPc)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{formatCurrency(item.taxableAmount)}</td>
                    {buyer.isInterState ? (
                      <td className="py-2.5 px-3 text-right text-[#5C5852]">
                        {formatCurrency(item.igstAmount)}
                        <div className="text-[10px] text-[#8A847B]">({(item.igstRate * 100).toFixed(0)}%)</div>
                      </td>
                    ) : (
                      <>
                        <td className="py-2.5 px-3 text-right text-[#5C5852]">
                          {formatCurrency(item.cgstAmount)}
                          <div className="text-[10px] text-[#8A847B]">({(item.cgstRate * 100).toFixed(1)}%)</div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#5C5852]">
                          {formatCurrency(item.sgstAmount)}
                          <div className="text-[10px] text-[#8A847B]">({(item.sgstRate * 100).toFixed(1)}%)</div>
                        </td>
                      </>
                    )}
                    <td className="py-2.5 px-3 text-right font-bold text-[#121214]">{formatCurrency(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Grand Total */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
            <div className="sm:col-span-7 space-y-4">
              <div className="rounded-xl border border-[#E6E0D4] bg-[#FAF8F5] p-3 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#7A5220] block mb-1">
                  Invoice Amount in Words:
                </span>
                <div className="font-serif text-sm font-bold text-[#121214] italic">
                  {totals.amountInWords || 'Indian Rupees Only'}
                </div>
              </div>

              <div className="rounded-xl border border-[#E6E0D4] p-3 text-[11px] text-[#5C5852] space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#121214] block">
                  Terms &amp; Conditions:
                </span>
                <p>1. Certified goods sold under BVB Surat mill warranty.</p>
                <p>2. Subject to Surat, Gujarat jurisdiction only.</p>
              </div>

              <div className="flex items-center gap-3 pt-2 text-xs text-[#7A746B]">
                <div className="h-9 w-9 rounded-full border border-[#D9AE6A] bg-[#FAF1D6] flex items-center justify-center text-[#7A5220] font-mono text-[10px] font-bold">
                  BVB
                </div>
                <div>
                  <div className="font-bold text-[#121214]">Official B2B GST Tax Accounting Console</div>
                  <div className="text-[11px] font-mono">BVB Central Atelier ERP · Certified Electronic Audit Trail</div>
                </div>
              </div>
            </div>

            <div className="sm:col-span-5 rounded-xl border border-[#121214]/15 bg-[#FAF8F5] p-4 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-[#5C5852]">
                <span>Taxable Subtotal:</span>
                <span className="font-bold text-[#121214]">{formatCurrency(totals.taxableSubtotal)}</span>
              </div>

              {totals.discountTotal > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Tier Volume Discount:</span>
                  <span>- {formatCurrency(totals.discountTotal)}</span>
                </div>
              )}

              {totals.rewardApplied > 0 && (
                <div className="flex items-center justify-between text-[#1F8F5A] font-semibold">
                  <span>Rewards Wallet Credit Applied:</span>
                  <span>- {formatCurrency(totals.rewardApplied)}</span>
                </div>
              )}

              {buyer.isInterState ? (
                <div className="flex items-center justify-between text-[#5C5852]">
                  <span>Integrated GST (IGST):</span>
                  <span>{formatCurrency(totals.igstTotal || totals.totalTax)}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-[#5C5852]">
                    <span>Central GST (CGST):</span>
                    <span>{formatCurrency(totals.cgstTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#5C5852]">
                    <span>State GST (SGST):</span>
                    <span>{formatCurrency(totals.sgstTotal)}</span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-[#5C5852]">
                <span>Total Tax Amount:</span>
                <span className="font-semibold text-[#121214]">{formatCurrency(totals.totalTax)}</span>
              </div>

              {totals.freightCost > 0 && (
                <div className="flex items-center justify-between text-[#5C5852]">
                  <span>Logistics &amp; Freight:</span>
                  <span>{formatCurrency(totals.freightCost)}</span>
                </div>
              )}

              {Math.abs(totals.roundOff || 0) > 0 && (
                <div className="flex items-center justify-between text-[#8A847B]">
                  <span>Round Off:</span>
                  <span>{totals.roundOff > 0 ? `+${totals.roundOff}` : totals.roundOff}</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-[#121214] flex items-baseline justify-between text-base">
                <span className="font-serif font-bold uppercase text-[#121214]">Grand Total:</span>
                <span className="font-bold text-xl text-[#7A5220]">{formatCurrency(totals.grandTotal)}</span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E6E0D4] text-[11px] flex items-center justify-between">
                <span className="text-[#7A746B]">Payment Terms:</span>
                <span className="font-bold uppercase text-[#121214]">{payment.paymentTerms || 'Prepaid'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#7A746B]">Status:</span>
                <span className="font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {payment.paymentStatus || invoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
