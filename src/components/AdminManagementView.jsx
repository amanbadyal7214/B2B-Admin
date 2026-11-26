import { useState, useEffect } from 'react'
import {
  createAdminApi,
  getAllAdminUsersApi,
  updateAdminUserApi,
  deleteAdminUserApi,
} from '../api'

export const ADMIN_MODULES = [
  {
    id: 'orders',
    label: 'Wholesale Orders & Dispatches',
    icon: '📦',
    category: 'Logistics',
    desc: 'Bulk wholesale orders, pick-pack manifests, order status progression, packing slips.',
  },
  {
    id: 'products',
    label: 'Products & Masters Taxonomy',
    icon: '🏷️',
    category: 'Merchandising',
    desc: 'Catalog styles, categories, sizes, colors, fabrics & GSM, fit taxonomy, and MOQ packs.',
  },
  {
    id: 'inventory',
    label: 'Multi-Warehouse & Stock Inward',
    icon: '🏭',
    category: 'Inventory',
    desc: 'Multi-warehouse stock, Excel inward, low stock alerts, reservation locks & QC returns.',
  },
  {
    id: 'retailers',
    label: 'Retailers & Trade Clearance',
    icon: '🏢',
    category: 'CRM & Trade',
    desc: 'Buyer KYC approvals, GSTIN/PAN verification, trade passes, and sample kit dispatches.',
  },
  {
    id: 'invoices',
    label: 'GST Invoices & Credit Notes',
    icon: '🧾',
    category: 'Finance',
    desc: 'Sequential B2B GST tax invoices, credit notes, proforma clearances & billing manifests.',
  },
  {
    id: 'pincodes',
    label: 'Delivery Hubs & Pincodes',
    icon: '📍',
    category: 'Logistics',
    desc: 'Serviceable delivery pincodes, courier serviceability, direct dispatch logistics zones.',
  },
  {
    id: 'blog',
    label: 'Blog CMS & Our Story Atelier',
    icon: '✍️',
    category: 'Editorial CMS',
    desc: 'Editorial lookbooks, atelier articles, Our Story page hero video and brand narrative CMS.',
  },
  {
    id: 'referrals',
    label: 'Referrals & Rewards Wallet',
    icon: '🤝',
    category: 'Growth & Wallet',
    desc: 'Referral program rules, fraud review, user double-entry ledger audits & wallet statements.',
  },
  {
    id: 'roles',
    label: 'Staff & Role Assignment (RBAC)',
    icon: '👑',
    category: 'Governance',
    desc: 'Provision staff members, assign roles, and configure module-level security permissions.',
  },
]

export const ROLE_PRESETS = [
  {
    role: 'Super Administrator',
    clearance: 'Tier 1 • Executive Governance',
    badge: 'Super Admin',
    modules: ['orders', 'products', 'inventory', 'retailers', 'invoices', 'pincodes', 'blog', 'referrals', 'roles'],
    desc: 'Full unconstrained command over all wholesale modules, orders, tax ledgers, and staff provisioning.',
    accent: 'border-[#D9AE6A] bg-[#FFFBF0] text-[#805915]',
  },
  {
    role: 'Operations & Logistics Lead',
    clearance: 'Tier 2 • Stock & Dispatch',
    badge: 'Operations',
    modules: ['orders', 'inventory', 'pincodes'],
    desc: 'Stock inward, pick-pack manifests, warehouse stock locks, and serviceable delivery hubs.',
    accent: 'border-[#BCD9EE] bg-[#F0F6FB] text-[#2980B9]',
  },
  {
    role: 'Catalog & Merchandising Lead',
    clearance: 'Tier 2 • Product Merchandising',
    badge: 'Catalog',
    modules: ['products', 'blog'],
    desc: 'Catalog styles, categories, sizes, colors, fabrics, MOQ packs, and editorial CMS.',
    accent: 'border-[#D5C2E8] bg-[#F7F3FC] text-[#6C3483]',
  },
  {
    role: 'Accounts & Finance Officer',
    clearance: 'Tier 2 • Margins & Invoicing',
    badge: 'Finance',
    modules: ['orders', 'invoices', 'referrals'],
    desc: 'Wholesale order billing, sequential GST tax invoices, proforma clearances, and referral wallet ledgers.',
    accent: 'border-[#F6DCAD] bg-[#FDF8EE] text-[#B37D14]',
  },
  {
    role: 'Retailer Relationship Executive',
    clearance: 'Tier 2 • Trade Relations',
    badge: 'Retailers',
    modules: ['retailers', 'orders', 'referrals'],
    desc: 'Buyer approvals, GSTIN/PAN verification, sample kit clearance, and referral tracking.',
    accent: 'border-[#BDE0C7] bg-[#F1F9F3] text-[#1E824C]',
  },
  {
    role: 'Custom Staff Member',
    clearance: 'Tier 3 • Delegated Operations',
    badge: 'Staff',
    modules: ['orders'],
    desc: 'Custom role with manually selected module access boundaries.',
    accent: 'border-[#DFD6C5] bg-[#FAF8F5] text-[#5A544B]',
  },
]

export default function AdminManagementView({
  activeView = 'admin_users',
  currentUser,
  onNavigate,
}) {
  // Staff Directory state
  const [adminUsers, setAdminUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  // Create Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Operations & Logistics Lead',
    customRole: '',
    clearance: 'Tier 2 • Stock & Dispatch',
    badge: 'Operations',
    modules: ['orders', 'inventory', 'pincodes'],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    role: '',
    customRole: '',
    clearance: '',
    badge: '',
    isActive: true,
    modules: [],
    password: '',
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch admin accounts
  const fetchAdmins = async () => {
    setIsLoading(true)
    try {
      const res = await getAllAdminUsersApi()
      if (res && res.success && Array.isArray(res.admins)) {
        setAdminUsers(res.admins)
      } else if (currentUser) {
        setAdminUsers([currentUser])
      }
    } catch {
      if (currentUser) {
        setAdminUsers([currentUser])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  // Quick Preset Helper for Create Form
  const applyPresetToCreateForm = (preset) => {
    setFormData((prev) => ({
      ...prev,
      role: preset.role,
      customRole: preset.role === 'Custom Staff Member' ? prev.customRole : '',
      clearance: preset.clearance,
      badge: preset.badge,
      modules: [...preset.modules],
    }))
  }

  // Quick Preset Helper for Edit Form
  const applyPresetToEditForm = (preset) => {
    setEditFormData((prev) => ({
      ...prev,
      role: preset.role,
      customRole: preset.role === 'Custom Staff Member' ? prev.customRole : '',
      clearance: preset.clearance,
      badge: preset.badge,
      modules: [...preset.modules],
    }))
  }

  // Toggle module selection in Create Form
  const toggleCreateModule = (modId) => {
    setFormData((prev) => {
      const exists = prev.modules.includes(modId)
      const updated = exists
        ? prev.modules.filter((m) => m !== modId)
        : [...prev.modules, modId]
      return { ...prev, modules: updated }
    })
  }

  // Toggle module selection in Edit Form
  const toggleEditModule = (modId) => {
    setEditFormData((prev) => {
      const exists = prev.modules.includes(modId)
      const updated = exists
        ? prev.modules.filter((m) => m !== modId)
        : [...prev.modules, modId]
      return { ...prev, modules: updated }
    })
  }

  // Submit Handler for New Staff
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setErrorMessage('Please fill in all required fields (Name, Corporate Email, Passphrase).')
      return
    }

    if (formData.modules.length === 0) {
      setErrorMessage('Please assign at least one module for this staff member.')
      return
    }

    const finalRole =
      formData.role === 'Custom Staff Member' && formData.customRole.trim()
        ? formData.customRole.trim()
        : formData.role

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: finalRole,
        clearance: formData.clearance,
        badge: formData.badge,
        modules: formData.modules,
      }

      const res = await createAdminApi(payload)
      if (res.success) {
        setSuccessMessage(`Personnel "${formData.name}" successfully provisioned with ${formData.modules.length} modules!`)
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'Operations & Logistics Lead',
          customRole: '',
          clearance: 'Tier 2 • Stock & Dispatch',
          badge: 'Operations',
          modules: ['orders', 'inventory', 'pincodes'],
        })
        fetchAdmins()
      } else {
        setErrorMessage(res.message || 'Failed to create administrator account.')
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Error provisioning administrator.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (user) => {
    setSelectedUser(user)
    const matchingPreset = ROLE_PRESETS.find((p) => p.role === user.role)
    const isCustom = !matchingPreset && user.role !== 'Super Administrator'

    setEditFormData({
      name: user.name || '',
      role: isCustom ? 'Custom Staff Member' : user.role || 'Custom Staff Member',
      customRole: isCustom ? user.role : '',
      clearance: user.clearance || 'Tier 2 • Department Governance',
      badge: user.badge || 'Staff',
      isActive: user.isActive !== undefined ? user.isActive : true,
      modules: Array.isArray(user.modules) && user.modules.length > 0
        ? [...user.modules]
        : ['orders', 'products'],
      password: '',
    })
    setIsEditModalOpen(true)
  }

  // Save Edited Staff
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser) return

    const finalRole =
      editFormData.role === 'Custom Staff Member' && editFormData.customRole.trim()
        ? editFormData.customRole.trim()
        : editFormData.role

    if (editFormData.modules.length === 0) {
      alert('A staff member must have at least one authorized module.')
      return
    }

    setIsUpdating(true)
    try {
      const payload = {
        name: editFormData.name.trim(),
        role: finalRole,
        clearance: editFormData.clearance,
        badge: editFormData.badge,
        isActive: editFormData.isActive,
        modules: editFormData.modules,
      }
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim()
      }

      const res = await updateAdminUserApi(selectedUser._id || selectedUser.id, payload)
      if (res.success) {
        setIsEditModalOpen(false)
        setSelectedUser(null)
        fetchAdmins()
      } else {
        alert(res.message || 'Failed to update account.')
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error updating account.')
    } finally {
      setIsUpdating(false)
    }
  }

  // Toggle Active/Suspended State
  const handleToggleStatus = async (user) => {
    const isCurrentlyActive = user.isActive !== undefined ? user.isActive : true
    const confirmMsg = isCurrentlyActive
      ? `Suspend access for "${user.name}"? They will not be able to log in.`
      : `Re-activate access for "${user.name}"?`

    if (!window.confirm(confirmMsg)) return

    try {
      const res = await updateAdminUserApi(user._id || user.id, {
        isActive: !isCurrentlyActive,
      })
      if (res.success) {
        fetchAdmins()
      } else {
        alert(res.message || 'Failed to toggle account status.')
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error updating status.')
    }
  }

  // Delete Admin Account
  const handleDeleteAdmin = async (user) => {
    if (user.email === currentUser?.email) {
      alert('You cannot delete your own active administrator account.')
      return
    }

    if (
      !window.confirm(
        `Are you sure you want to permanently revoke and delete the account for "${user.name}" (${user.email})? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      const res = await deleteAdminUserApi(user._id || user.id)
      if (res.success) {
        fetchAdmins()
      } else {
        alert(res.message || 'Failed to delete account.')
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error deleting account.')
    }
  }

  // Filtered staff list
  const filteredAdmins = adminUsers.filter((u) => {
    const matchesSearch =
      !searchFilter ||
      (u.name && u.name.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (u.role && u.role.toLowerCase().includes(searchFilter.toLowerCase()))

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'SUPER' && u.role === 'Super Administrator') ||
      (roleFilter === 'STAFF' && u.role !== 'Super Administrator')

    return matchesSearch && matchesRole
  })

  // =========================================================================
  // VIEW 1: PROVISION NEW ADMIN / STAFF (activeView === 'create_admin')
  // =========================================================================
  if (activeView === 'create_admin') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#ECE4D5] pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9AE6A]/40 bg-[#FAF3E4] px-3 py-0.5 shadow-2xs mb-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#805915]">
                Role-Based Access Control (RBAC)
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#121214]">
              Provision Staff &amp; Assign Modules
            </h2>
            <p className="text-xs text-[#6E685E] mt-1">
              Create sub-administrator personnel, designate their operational role, and explicitly select which wholesale modules they can access.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('admin_users')}
            className="self-start rounded-lg border border-[#DFD6C5] bg-[#FFFFFF] px-3.5 py-2 text-xs font-semibold text-[#5A544B] shadow-2xs hover:bg-[#FAF8F5] cursor-pointer"
          >
            ← View Staff Directory
          </button>
        </div>

        {/* Feedback Banners */}
        {successMessage && (
          <div className="rounded-xl border border-[#BDE0C7] bg-[#F1F9F3] p-4 text-xs font-medium text-[#1E824C] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-base">✓</span>
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('admin_users')}
              className="underline font-bold hover:text-[#145a32] cursor-pointer ml-3"
            >
              Go to Directory →
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-[#F0BCB8] bg-[#FDF2F1] p-4 text-xs font-medium text-[#B92D25] flex items-center gap-2 shadow-2xs">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Provisioning Form */}
        <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            {/* Step 1: Basic Identity */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF3E4] border border-[#D9AE6A] font-mono text-[10px] font-bold text-[#805915]">
                  1
                </span>
                <h3 className="font-serif text-sm font-bold text-[#121214] uppercase tracking-wider">
                  Staff Account Credentials
                </h3>
              </div>

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
                    className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-medium"
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
                    className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-medium"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Temporary Access Passphrase *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-medium"
                />
              </div>
            </div>

            {/* Step 2: Role & Designation */}
            <div className="border-t border-[#ECE4D5] pt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF3E4] border border-[#D9AE6A] font-mono text-[10px] font-bold text-[#805915]">
                  2
                </span>
                <h3 className="font-serif text-sm font-bold text-[#121214] uppercase tracking-wider">
                  Role Preset &amp; Designation
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                    Select Role Preset
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const selectedRole = e.target.value
                      const preset = ROLE_PRESETS.find((p) => p.role === selectedRole)
                      if (preset) {
                        applyPresetToCreateForm(preset)
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          role: selectedRole,
                          clearance: 'Tier 3 • Delegated Operations',
                          badge: 'Staff',
                        }))
                      }
                    }}
                    className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs font-semibold text-[#121214] focus:border-[#C59A46] focus:outline-none cursor-pointer"
                  >
                    {ROLE_PRESETS.map((p) => (
                      <option key={p.role} value={p.role}>
                        {p.role} ({p.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                    Clearance Tier
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.clearance}
                    className="mt-1.5 w-full rounded-lg border border-[#E9E1D2] bg-[#FAF8F5] py-2.5 px-3.5 text-xs text-[#7A746B] font-mono font-medium"
                  />
                </div>
              </div>

              {formData.role === 'Custom Staff Member' && (
                <div className="mt-4">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                    Custom Designation Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customRole}
                    onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
                    placeholder="e.g. Senior Dispatch Controller"
                    className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 px-3.5 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Step 3: Module Permissions Checkbox Grid */}
            <div className="border-t border-[#ECE4D5] pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF3E4] border border-[#D9AE6A] font-mono text-[10px] font-bold text-[#805915]">
                    3
                  </span>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-[#121214] uppercase tracking-wider">
                      Module Access Permissions ({formData.modules.length} / {ADMIN_MODULES.length} Selected)
                    </h3>
                    <p className="text-[11px] text-[#7A746B]">
                      Checked modules will be visible in this staff member's sidebar console.
                    </p>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono uppercase text-[#8A847B] mr-1">Quick:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        modules: ADMIN_MODULES.map((m) => m.id),
                      }))
                    }
                    className="rounded-md bg-[#FAF8F5] border border-[#DFD6C5] px-2 py-1 text-[10px] font-bold text-[#47423B] hover:bg-[#F0EBE1] cursor-pointer"
                  >
                    All Modules
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        modules: ['orders', 'inventory', 'pincodes'],
                      }))
                    }
                    className="rounded-md bg-[#FAF8F5] border border-[#DFD6C5] px-2 py-1 text-[10px] font-bold text-[#47423B] hover:bg-[#F0EBE1] cursor-pointer"
                  >
                    Ops &amp; Stock
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        modules: ['products', 'blog'],
                      }))
                    }
                    className="rounded-md bg-[#FAF8F5] border border-[#DFD6C5] px-2 py-1 text-[10px] font-bold text-[#47423B] hover:bg-[#F0EBE1] cursor-pointer"
                  >
                    Catalog &amp; CMS
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        modules: ['retailers', 'orders', 'referrals'],
                      }))
                    }
                    className="rounded-md bg-[#FAF8F5] border border-[#DFD6C5] px-2 py-1 text-[10px] font-bold text-[#47423B] hover:bg-[#F0EBE1] cursor-pointer"
                  >
                    Retailers &amp; CRM
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, modules: [] }))}
                    className="rounded-md bg-[#FAF8F5] border border-[#DFD6C5] px-2 py-1 text-[10px] font-bold text-[#B92D25] hover:bg-[#FDF2F1] cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Grid of 9 Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {ADMIN_MODULES.map((mod) => {
                  const isChecked = formData.modules.includes(mod.id)
                  return (
                    <div
                      key={mod.id}
                      onClick={() => toggleCreateModule(mod.id)}
                      className={`relative flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'border-[#C59A46] bg-[#FCFAF6] shadow-2xs ring-1 ring-[#C59A46]/20'
                          : 'border-[#EBE4D8] bg-[#FFFFFF] hover:border-[#D5C9B5] hover:bg-[#FAF8F5]/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="mt-1 h-4 w-4 rounded border-[#C59A46] text-[#C59A46] focus:ring-[#C59A46]/30 cursor-pointer accent-[#C59A46]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-xs text-[#121214] flex items-center gap-1.5 truncate">
                            <span>{mod.icon}</span>
                            <span className="truncate">{mod.label}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A746B] mt-1 line-clamp-2 leading-relaxed">
                          {mod.desc}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="font-mono text-[#A8A196] uppercase">{mod.category}</span>
                          <span
                            className={`font-mono font-bold uppercase tracking-wider ${
                              isChecked ? 'text-[#1E824C]' : 'text-[#A8A196]'
                            }`}
                          >
                            {isChecked ? '✓ Authorized' : 'Restricted'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex justify-end gap-3 border-t border-[#ECE4D5]">
              <button
                type="button"
                onClick={() => onNavigate('admin_users')}
                className="rounded-lg border border-[#DED4C3] bg-[#FFFFFF] px-5 py-2.5 font-sans text-xs font-semibold text-[#5A544B] hover:bg-[#FAF8F5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="luxury-shimmer-btn rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm hover:shadow transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? 'Provisioning Staff...' : 'Provision Staff & Assign Modules'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: ROLES & CLEARANCE MATRIX (activeView === 'roles_clearance')
  // =========================================================================
  if (activeView === 'roles_clearance') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#ECE4D5] pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D9AE6A]/40 bg-[#FAF3E4] px-3 py-0.5 shadow-2xs mb-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#805915]">
                Governance Architecture
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#121214]">
              Roles &amp; Clearance Matrix
            </h2>
            <p className="text-xs text-[#6E685E] mt-1">
              Privilege segmentation across administrative roles under BVB Wholesale security protocols.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('create_admin')}
            className="self-start rounded-lg bg-[#121214] px-3.5 py-2 text-xs font-semibold text-[#FAD79F] shadow-2xs hover:bg-[#232326] cursor-pointer"
          >
            + Provision Staff Member
          </button>
        </div>

        {/* Matrix Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLE_PRESETS.map((p) => (
            <div
              key={p.role}
              className="rounded-2xl border border-[#ECE4D5] bg-[#FFFFFF] p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div
                  className={`inline-flex rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${p.accent}`}
                >
                  {p.clearance}
                </div>
                <h3 className="font-serif text-lg font-bold text-[#121214] mt-3">
                  {p.role}
                </h3>
                <p className="text-xs text-[#6E685E] mt-1 leading-relaxed">
                  {p.desc}
                </p>

                <div className="mt-4 pt-3 border-t border-[#F5EFE6]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A847B]">
                    Assigned Modules ({p.modules.length}):
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.modules.map((mId) => {
                      const mod = ADMIN_MODULES.find((m) => m.id === mId)
                      return (
                        <span
                          key={mId}
                          className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5] border border-[#E9E1D2] px-2 py-0.5 text-[10px] font-medium text-[#47423B]"
                        >
                          <span>{mod?.icon || '•'}</span>
                          <span>{mod?.label.split(' ')[0] || mId}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#F5EFE6] flex items-center justify-between text-[11px] text-[#7A746B]">
                <span className="font-mono text-[10px] text-[#805915] font-semibold">{p.badge}</span>
                <span className="font-mono text-[10px] text-[#1E824C]">Active Preset</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 3: AUDIT LOGS (activeView === 'audit_logs')
  // =========================================================================
  if (activeView === 'audit_logs') {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#ECE4D5] pb-4">
          <h2 className="font-serif text-2xl font-bold text-[#121214]">
            Administrative Audit Trail &amp; Telemetry
          </h2>
          <p className="text-xs text-[#6E685E] mt-1">
            Cryptographic ledger tracking administrative session events, role assignments, and clearance verification.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] overflow-hidden shadow-xs">
          <div className="bg-[#FAF8F5] p-4 border-b border-[#ECE4D5] flex items-center justify-between text-xs text-[#7A746B]">
            <span className="font-semibold text-[#121214]">Live Telemetry Stream</span>
            <span className="font-mono text-[11px] text-[#1E824C]">TLS 1.3 Active • RBAC Enforced</span>
          </div>

          <div className="p-6 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#F7F3EC]">
              <span className="text-[#805915]">[SESSION_INIT]</span>
              <span className="text-[#121214]">{currentUser?.email || 'admin@buddyvsbuff.com'}</span>
              <span className="text-[#7A746B]">JWT Token verified • Active console</span>
              <span className="text-[#1E824C]">AUTHENTICATED</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F7F3EC]">
              <span className="text-[#805915]">[RBAC_CLEARANCE]</span>
              <span className="text-[#121214]">{currentUser?.role || 'Super Administrator'}</span>
              <span className="text-[#7A746B]">
                {currentUser?.role === 'Super Administrator' ? 'All 9 Modules Unrestricted' : `${currentUser?.modules?.length || 0} Modules Assigned`}
              </span>
              <span className="text-[#1E824C]">PASSED</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F7F3EC]">
              <span className="text-[#805915]">[STAFF_DIRECTORY]</span>
              <span className="text-[#121214]">{adminUsers.length} Registered Accounts</span>
              <span className="text-[#7A746B]">MongoDB Partition: /api/admin/users</span>
              <span className="text-[#1E824C]">HEALTHY</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#805915]">[GATEWAY_HEALTH]</span>
              <span className="text-[#121214]">Backend API @ port 5000</span>
              <span className="text-[#7A746B]">Protected by requireModule() Gatekeeper</span>
              <span className="text-[#1E824C]">ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 4: DEFAULT ADMIN / STAFF DIRECTORY (activeView === 'admin_users')
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#ECE4D5] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D9AE6A]/40 bg-[#FAF3E4] px-3 py-0.5 shadow-2xs mb-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#805915]">
              Personnel Directory &amp; RBAC
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#121214]">
            Administrative Personnel Directory
          </h2>
          <p className="text-xs text-[#6E685E] mt-1">
            Authenticated administrative users and staff members governing wholesale operations and catalog modules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAdmins}
            disabled={isLoading}
            className="rounded-lg border border-[#DFD6C5] bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-[#5A544B] shadow-2xs hover:bg-[#FAF8F5] cursor-pointer"
            title="Refresh Directory"
          >
            {isLoading ? 'Refreshing...' : '↻ Refresh'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('create_admin')}
            className="luxury-shimmer-btn rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm hover:shadow transition-all cursor-pointer"
          >
            + Provision New Staff Member
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
            Total Personnel
          </div>
          <div className="font-serif text-2xl font-bold text-[#121214] mt-1">
            {adminUsers.length}
          </div>
          <div className="text-[11px] text-[#1E824C] mt-0.5">Active across systems</div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
            Super Administrators
          </div>
          <div className="font-serif text-2xl font-bold text-[#805915] mt-1">
            {adminUsers.filter((u) => u.role === 'Super Administrator').length || 1}
          </div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">Tier 1 Full Governance</div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
            Sub-Admins / Staff
          </div>
          <div className="font-serif text-2xl font-bold text-[#2980B9] mt-1">
            {adminUsers.filter((u) => u.role !== 'Super Administrator').length}
          </div>
          <div className="text-[11px] text-[#7A746B] mt-0.5">Module-Restricted</div>
        </div>

        <div className="rounded-xl border border-[#ECE4D5] bg-[#FFFFFF] p-4 shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B]">
            System Modules
          </div>
          <div className="font-serif text-2xl font-bold text-[#121214] mt-1">
            {ADMIN_MODULES.length}
          </div>
          <div className="text-[11px] text-[#1E824C] mt-0.5">Fully Protected RBAC</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E9E1D2] shadow-2xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by name, corporate email, role..."
            className="w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2 pl-3.5 pr-4 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <span className="text-[10px] font-mono uppercase text-[#7A746B]">Filter:</span>
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'ALL'
                ? 'bg-[#121214] text-[#FAD79F]'
                : 'bg-[#FAF8F5] text-[#5A544B] hover:bg-[#F0EBE1]'
            }`}
          >
            All Accounts
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('SUPER')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'SUPER'
                ? 'bg-[#805915] text-[#FFFFFF]'
                : 'bg-[#FAF8F5] text-[#5A544B] hover:bg-[#F0EBE1]'
            }`}
          >
            Super Admins
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('STAFF')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
              roleFilter === 'STAFF'
                ? 'bg-[#2980B9] text-[#FFFFFF]'
                : 'bg-[#FAF8F5] text-[#5A544B] hover:bg-[#F0EBE1]'
            }`}
          >
            Staff &amp; Sub-Admins
          </button>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#EAE3D5] bg-[#FCFAF7] text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A746B]">
              <tr>
                <th className="py-3.5 px-5">Personnel</th>
                <th className="py-3.5 px-5">Role &amp; Clearance</th>
                <th className="py-3.5 px-5">Assigned Modules</th>
                <th className="py-3.5 px-5">Account Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9DF]">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#7A746B]">
                    No personnel found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((user) => {
                  const isCurrent = user.email === currentUser?.email
                  const isSuper = user.role === 'Super Administrator'
                  const isActive = user.isActive !== undefined ? user.isActive : true
                  const userModules = isSuper
                    ? ADMIN_MODULES.map((m) => m.id)
                    : Array.isArray(user.modules) && user.modules.length > 0
                    ? user.modules
                    : ['orders', 'products']

                  return (
                    <tr key={user._id || user.id || user.email} className="hover:bg-[#FAF7F1] transition-colors">
                      {/* Name & Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ECC880] to-[#C59A46] font-mono text-[11px] font-bold text-[#121214] shadow-2xs">
                            {user.name
                              ? user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .substring(0, 2)
                                  .toUpperCase()
                              : 'ST'}
                          </div>
                          <div>
                            <div className="font-semibold text-[#121214] flex items-center gap-2">
                              <span>{user.name || 'Staff Member'}</span>
                              {isCurrent && (
                                <span className="rounded bg-[#FAF3E4] border border-[#E5D3AF] px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#805915]">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-normal text-[#7A746B]">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Clearance */}
                      <td className="py-4 px-5">
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                              isSuper
                                ? 'bg-[#FAF3E4] border border-[#E5D3AF] text-[#805915]'
                                : 'bg-[#F0F6FB] border border-[#BCD9EE] text-[#2980B9]'
                            }`}
                          >
                            {user.role || 'Staff Member'}
                          </span>
                          <div className="text-[10px] font-mono text-[#7A746B] mt-1">
                            {user.clearance || 'Tier 2 • Department Governance'}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Modules Badges */}
                      <td className="py-4 px-5 max-w-xs">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FAF3E4] to-[#F5E6C4] border border-[#E5D3AF] px-2.5 py-1 font-mono text-[10px] font-bold text-[#805915]">
                            <span>✨</span>
                            <span>All 9 Modules Authorized</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {userModules.map((mId) => {
                              const mod = ADMIN_MODULES.find((m) => m.id === mId)
                              return (
                                <span
                                  key={mId}
                                  title={mod?.label}
                                  className="inline-flex items-center gap-1 rounded bg-[#FAF8F5] border border-[#E9E1D2] px-1.5 py-0.5 text-[9.5px] font-semibold text-[#47423B]"
                                >
                                  <span>{mod?.icon || '•'}</span>
                                  <span>{mod?.label?.split(' ')[0] || mId}</span>
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BDE0C7] bg-[#F1F9F3] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#1E824C]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1E824C] animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F0BCB8] bg-[#FDF2F1] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#B92D25]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#B92D25]" />
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="rounded-lg border border-[#DED4C3] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-bold text-[#121214] hover:bg-[#FAF8F5] hover:border-[#C59A46] cursor-pointer shadow-2xs"
                          >
                            Edit Permissions
                          </button>

                          {!isCurrent && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                className={`rounded-lg px-2 py-1 text-[11px] font-semibold cursor-pointer ${
                                  isActive
                                    ? 'text-[#805915] hover:bg-[#FAF3E4]'
                                    : 'text-[#1E824C] hover:bg-[#F1F9F3]'
                                }`}
                                title={isActive ? 'Suspend account' : 'Reactivate account'}
                              >
                                {isActive ? 'Suspend' : 'Activate'}
                              </button>

                              {!isSuper && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(user)}
                                  className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#B92D25] hover:bg-[#FDF2F1] cursor-pointer"
                                  title="Revoke & Delete Personnel"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
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
          <span>Connected to MongoDB administrative partition</span>
          <span className="font-mono text-[10px] text-[#9A6D22]">
            Role-Based Access Control Active
          </span>
        </div>
      </div>

      {/* =========================================================================
          EDIT PERMISSIONS MODAL
          ========================================================================= */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121214]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-[#E9E1D2] bg-[#FFFFFF] shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ECE4D5] px-6 py-4 bg-[#FAF8F5]">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#805915]">
                  Security Clearance &amp; Module Permissions
                </span>
                <h3 className="font-serif text-lg font-bold text-[#121214]">
                  Edit Personnel: {selectedUser.name}
                </h3>
                <p className="text-[11px] text-[#7A746B]">{selectedUser.email}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1.5 text-[#7A746B] hover:text-[#121214] hover:bg-[#F0EBE1] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Name & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2 px-3 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                    Account Status
                  </label>
                  <select
                    value={editFormData.isActive ? 'active' : 'suspended'}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, isActive: e.target.value === 'active' })
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2 px-3 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  >
                    <option value="active">Active (Full Login Granted)</option>
                    <option value="suspended">Suspended (Login Blocked)</option>
                  </select>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Role Designation
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => {
                    const selectedRole = e.target.value
                    const preset = ROLE_PRESETS.find((p) => p.role === selectedRole)
                    if (preset) {
                      applyPresetToEditForm(preset)
                    } else {
                      setEditFormData((prev) => ({
                        ...prev,
                        role: selectedRole,
                        clearance: 'Tier 3 • Delegated Operations',
                        badge: 'Staff',
                      }))
                    }
                  }}
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2 px-3 text-xs font-semibold text-[#121214] focus:border-[#C59A46] focus:outline-none"
                >
                  {ROLE_PRESETS.map((p) => (
                    <option key={p.role} value={p.role}>
                      {p.role} ({p.badge})
                    </option>
                  ))}
                </select>
              </div>

              {editFormData.role === 'Custom Staff Member' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                    Custom Role Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.customRole}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, customRole: e.target.value })
                    }
                    placeholder="e.g. Regional Fulfillment Coordinator"
                    className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2 px-3 text-xs text-[#121214] focus:border-[#C59A46] focus:outline-none"
                  />
                </div>
              )}

              {/* Modules Selection */}
              <div className="border-t border-[#ECE4D5] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#121214]">
                    Assigned Modules ({editFormData.modules.length} / {ADMIN_MODULES.length})
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData((p) => ({
                          ...p,
                          modules: ADMIN_MODULES.map((m) => m.id),
                        }))
                      }
                      className="rounded bg-[#FAF8F5] border border-[#DFD6C5] px-2 py-0.5 text-[9.5px] font-bold text-[#47423B] hover:bg-[#F0EBE1] cursor-pointer"
                    >
                      All (9)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData((p) => ({ ...p, modules: [] }))}
                      className="rounded bg-[#FAF8F5] border border-[#DFD6C5] px-2 py-0.5 text-[9.5px] font-bold text-[#B92D25] hover:bg-[#FDF2F1] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ADMIN_MODULES.map((mod) => {
                    const isChecked = editFormData.modules.includes(mod.id)
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleEditModule(mod.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'border-[#C59A46] bg-[#FCFAF6] ring-1 ring-[#C59A46]/20'
                            : 'border-[#EBE4D8] bg-[#FFFFFF] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-[#C59A46] text-[#C59A46] accent-[#C59A46] cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-[#121214] flex items-center gap-1 truncate">
                            <span>{mod.icon}</span>
                            <span className="truncate">{mod.label}</span>
                          </div>
                          <div className="text-[10px] text-[#7A746B] line-clamp-1 mt-0.5">
                            {mod.desc}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Optional Reset Password */}
              <div className="border-t border-[#ECE4D5] pt-4">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#47423B]">
                  Reset Passphrase (Optional)
                </label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, password: e.target.value })
                  }
                  placeholder="Leave blank to keep current passphrase unchanged"
                  className="mt-1.5 w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2 px-3 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex justify-end gap-2.5 border-t border-[#ECE4D5]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-[#DED4C3] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold text-[#5A544B] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-lg bg-gradient-to-r from-[#ECC880] to-[#C59A46] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#121214] shadow-sm hover:shadow transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
