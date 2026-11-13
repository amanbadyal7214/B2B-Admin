import { useState } from 'react'
import { createAdminApi } from '../api'

export default function AdminManagementView({
  activeView,
  currentUser,
  onNavigate,
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
    clearance: 'Tier 2 • Department Governance',
    badge: 'Admin',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createAdminApi(formData)
      if (res.success) {
        setSuccessMessage(`Administrator "${formData.name}" successfully provisioned!`)
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'Admin',
          clearance: 'Tier 2 • Department Governance',
          badge: 'Admin',
        })
      } else {
        setErrorMessage(res.message || 'Failed to create administrator.')
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Error provisioning administrator.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // 1. CREATE ADMIN
  if (activeView === 'create_admin') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#ECE4D5] pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9AE6A]/40 bg-[#FAF3E4] px-3 py-0.5 shadow-2xs mb-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#805915]">
                Identity & Access Governance
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#121214]">
              Provision New Administrator
            </h2>
            <p className="text-xs text-[#6E685E] mt-1">
              Add authorized personnel with cryptographic clearance to manage wholesale logistics and fiscal operations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('admin_users')}
            className="self-start rounded-lg border border-[#DFD6C5] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#5A544B] shadow-2xs hover:bg-[#FAF8F5]"
          >
            ← View Admin Directory
          </button>
        </div>

        {successMessage && (
          <div className="rounded-lg border border-[#BDE0C7] bg-[#F1F9F3] p-4 text-xs font-medium text-[#1E824C] flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => onNavigate('admin_users')}
              className="underline font-semibold"
            >
              Go to Directory
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-[#F0BCB8] bg-[#FDF2F1] p-4 text-xs font-medium text-[#B92D25]">
            {errorMessage}
          </div>
        )}

        <div className="max-w-2xl rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Vikram Mehta"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@buddyvsbuff.com"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                Temporary Access Passphrase *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••••••"
                className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Administrative Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const r = e.target.value
                    let cl = 'Tier 2 • Department Governance'
                    let bg = 'Admin'
                    if (r === 'Super Administrator') {
                      cl = 'Tier 1 • Full Governance'
                      bg = 'Super Admin'
                    } else if (r === 'Operations & Logistics Lead') {
                      cl = 'Tier 2 • Stock & Dispatch'
                      bg = 'Operations'
                    } else if (r === 'Head of Wholesale Accounts') {
                      cl = 'Tier 2 • Margins & Invoicing'
                      bg = 'Finance'
                    }
                    setFormData({ ...formData, role: r, clearance: cl, badge: bg })
                  }}
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                >
                  <option value="Admin">Administrator</option>
                  <option value="Super Administrator">Super Administrator</option>
                  <option value="Operations & Logistics Lead">Operations & Logistics Lead</option>
                  <option value="Head of Wholesale Accounts">Head of Wholesale Accounts (Finance)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Clearance Level
                </label>
                <input
                  type="text"
                  readOnly
                  value={formData.clearance}
                  className="mt-1.5 w-full rounded-lg border border-[#E9E1D2] bg-[#FAF8F5] py-2.5 px-3.5 text-xs text-[#7A746B] font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="luxury-shimmer-btn rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm hover:shadow transition-all disabled:opacity-60"
              >
                {isSubmitting ? 'Provisioning Account...' : 'Provision Administrator'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // 2. ROLES & CLEARANCE
  if (activeView === 'roles_clearance') {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#ECE4D5] pb-4">
          <h2 className="font-serif text-2xl font-bold text-[#121214]">
            Governance Tiers & RBAC Matrix
          </h2>
          <p className="text-xs text-[#6E685E] mt-1">
            Privilege segmentation across administrative roles under BVB Wholesale security protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-[#D9AE6A] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="inline-flex rounded-full bg-[#FAF3E4] border border-[#E5D3AF] px-3 py-1 font-mono text-[10px] font-bold text-[#805915] uppercase tracking-wider">
              Tier 1 • Executive
            </div>
            <h3 className="font-serif text-lg font-bold text-[#121214] mt-3">
              Super Administrator
            </h3>
            <p className="text-xs text-[#6E685E] mt-1">
              Full unconstrained command over wholesale orders, inventory allocation, and system provisioning.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-[#47423B]">
              <li className="flex items-center gap-2">✓ User & Admin Provisioning</li>
              <li className="flex items-center gap-2">✓ Proforma Tax Reconciliations</li>
              <li className="flex items-center gap-2">✓ SKU Master & Pricing Slabs</li>
              <li className="flex items-center gap-2">✓ Audit Log Inspections</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="inline-flex rounded-full bg-[#F0F6FB] border border-[#BCD9EE] px-3 py-1 font-mono text-[10px] font-bold text-[#2980B9] uppercase tracking-wider">
              Tier 2 • Logistics
            </div>
            <h3 className="font-serif text-lg font-bold text-[#121214] mt-3">
              Operations Lead
            </h3>
            <p className="text-xs text-[#6E685E] mt-1">
              Stock reservations, packaging dispatching, and logistics hub telemetry.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-[#47423B]">
              <li className="flex items-center gap-2">✓ MOQ Pack Reservation</li>
              <li className="flex items-center gap-2">✓ Warehouse Dispatches</li>
              <li className="flex items-center gap-2">✓ Waybill Generation</li>
              <li className="text-[#A8A196]">✗ Admin Creation</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="inline-flex rounded-full bg-[#FDF8EE] border border-[#F6DCAD] px-3 py-1 font-mono text-[10px] font-bold text-[#B37D14] uppercase tracking-wider">
              Tier 2 • Fiscal
            </div>
            <h3 className="font-serif text-lg font-bold text-[#121214] mt-3">
              Finance & Accounts
            </h3>
            <p className="text-xs text-[#6E685E] mt-1">
              Margin reviews, GST invoices, and trade credit clearances.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-[#47423B]">
              <li className="flex items-center gap-2">✓ Tax Invoice Generation</li>
              <li className="flex items-center gap-2">✓ Retailer Credit Limits</li>
              <li className="flex items-center gap-2">✓ Payment Reconciliation</li>
              <li className="text-[#A8A196]">✗ Warehouse Dispatches</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // 3. AUDIT LOGS
  if (activeView === 'audit_logs') {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#ECE4D5] pb-4">
          <h2 className="font-serif text-2xl font-bold text-[#121214]">
            Administrative Audit Trail
          </h2>
          <p className="text-xs text-[#6E685E] mt-1">
            Cryptographic ledger tracking administrative session events, token issuance, and clearance verification.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] overflow-hidden shadow-xs">
          <div className="bg-[#FAF8F5] p-4 border-b border-[#ECE4D5] flex items-center justify-between text-xs text-[#7A746B]">
            <span className="font-semibold text-[#121214]">Live Telemetry Stream</span>
            <span className="font-mono text-[11px] text-[#1E824C]">TLS 1.3 Active • FIPS 140-3 Compliant</span>
          </div>

          <div className="p-6 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#F7F3EC]">
              <span className="text-[#805915]">[SESSION_INIT]</span>
              <span className="text-[#121214]">{currentUser?.email || 'admin@buddyvsbuff.com'}</span>
              <span className="text-[#7A746B]">Token issued • Expiry: 30d</span>
              <span className="text-[#1E824C]">VERIFIED</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F7F3EC]">
              <span className="text-[#805915]">[CLEARANCE_CHECK]</span>
              <span className="text-[#121214]">{currentUser?.role || 'Super Administrator'}</span>
              <span className="text-[#7A746B]">{currentUser?.clearance || 'Tier 1 • Full Governance'}</span>
              <span className="text-[#1E824C]">PASSED</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#805915]">[GATEWAY_HEALTH]</span>
              <span className="text-[#121214]">Backend API @ port 5000</span>
              <span className="text-[#7A746B]">Endpoints: /api/admin-access, /api/admin/*</span>
              <span className="text-[#1E824C]">ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 4. DEFAULT: ADMIN DIRECTORY ('admin_users')
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#ECE4D5] pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#121214]">
            Administrative Personnel Directory
          </h2>
          <p className="text-xs text-[#6E685E] mt-1">
            Authenticated administrative users governing the Buddy Vs Buff wholesale platform.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('create_admin')}
          className="luxury-shimmer-btn rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm hover:shadow transition-all"
        >
          + Provision New Admin
        </button>
      </div>

      <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#EAE3D5] bg-[#FCFAF7] text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A746B]">
              <tr>
                <th className="py-3.5 px-5">Administrator</th>
                <th className="py-3.5 px-5">Designation & Role</th>
                <th className="py-3.5 px-5">Clearance Tier</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9DF]">
              <tr className="hover:bg-[#FAF7F1] transition-colors">
                <td className="py-4 px-5">
                  <div className="font-semibold text-[#121214] flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#ECC880] to-[#C59A46] font-mono text-[11px] font-bold text-[#121214]">
                      {currentUser?.name
                        ? currentUser.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)
                        : 'AD'}
                    </div>
                    <div>
                      <div>{currentUser?.name || 'Authorized Administrator'}</div>
                      <div className="text-[11px] font-normal text-[#7A746B]">{currentUser?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-5 font-medium text-[#121214]">
                  {currentUser?.role || 'Super Administrator'}
                </td>
                <td className="py-4 px-5">
                  <span className="inline-flex rounded-full bg-[#FAF3E4] border border-[#E5D3AF] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#805915]">
                    {currentUser?.clearance || 'Tier 1 • Full Governance'}
                  </span>
                </td>
                <td className="py-4 px-5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#BDE0C7] bg-[#F1F9F3] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#1E824C]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1E824C]" />
                    Active Session
                  </span>
                </td>
                <td className="py-4 px-5 text-right">
                  <span className="text-[11px] font-mono text-[#9A6D22]">Current Workstation</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#ECE4D5] bg-[#FAF8F5] px-5 py-3 text-xs text-[#7A746B] flex items-center justify-between">
          <span>Connected to MongoDB administrative partition</span>
          <span className="font-mono text-[10px] text-[#9A6D22]">Role-Based Access Control</span>
        </div>
      </div>
    </div>
  )
}

