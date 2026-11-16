import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import bvbLogo from '../assets/bvb-logo.png'

export default function AdminSidebar({
  currentUser,
  onLogout,
  onOpenHelp,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const isAdministratorPath =
    currentPath.includes('/admin-users') ||
    currentPath.includes('/create-admin') ||
    currentPath.includes('/roles') ||
    currentPath.includes('/audit-logs')

  const isProductPath =
    currentPath.includes('/products') ||
    currentPath.includes('/product-category') ||
    currentPath.includes('/product-type') ||
    currentPath.includes('/product-size') ||
    currentPath.includes('/product-color') ||
    currentPath.includes('/product-fit') ||
    currentPath.includes('/product-fabric') ||
    currentPath.includes('/product-moq') ||
    currentPath.includes('/product')

  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(true)
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(true)

  // Keep dropdowns open if on their sub-path
  useEffect(() => {
    if (isAdministratorPath) {
      setIsAdminDropdownOpen(true)
    }
    if (isProductPath) {
      setIsProductDropdownOpen(true)
    }
  }, [isAdministratorPath, isProductPath])

  const handleNav = (path) => {
    navigate(path)
  }

  const isOverview = currentPath === '/dashboard' || currentPath === '/dashboard/'

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 bg-[#FFFFFF] border-r border-[#ECE4D5] flex flex-col justify-between py-6 px-4 z-40 shadow-[1px_0_6px_rgba(110,87,44,0.04)] select-none">
      <div className="overflow-y-auto pr-1">
        {/* Brand Header with Circular BB Monogram */}
        <div
          onClick={() => handleNav('/dashboard')}
          className="flex items-center gap-3 px-2 mb-6 cursor-pointer"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E8DEC9] bg-[#FAF8F5] p-1 shadow-2xs">
            <img src={bvbLogo} alt="Buddy Vs Buff" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-serif text-sm font-bold tracking-[0.16em] text-[#121214] truncate">
              BUDDY VS BUFF
            </span>
            <span className="text-[9px] uppercase font-mono tracking-[0.18em] text-[#9A6D22] font-semibold truncate">
              Atelier Command
            </span>
          </div>
        </div>

        {/* Main Navigation Section */}
        <nav className="space-y-1.5 text-xs">
          {/* 1. Overview (/dashboard) */}
          <button
            type="button"
            onClick={() => handleNav('/dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold transition-all ${
              isOverview
                ? 'bg-[#FAF3E4] border border-[#E5D3AF] text-[#121214] shadow-2xs'
                : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={isOverview ? 'text-[#9A6D22]' : 'text-[#8A847B]'}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </span>
              <span className="tracking-wide text-xs">Overview</span>
            </div>
            {isOverview && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
            )}
          </button>

          {/* 2. Product Dropdown Menu */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsProductDropdownOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isProductPath
                  ? 'bg-[#FAF8F5] border border-[#E8DEC9] text-[#121214]'
                  : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isProductPath ? 'text-[#9A6D22]' : 'text-[#8A847B]'}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </span>
                <span className="tracking-wide text-xs">Product</span>
              </div>

              <div className="flex items-center gap-1.5">
                <svg
                  className={`h-3.5 w-3.5 text-[#8A847B] transition-transform duration-200 ${
                    isProductDropdownOpen ? 'rotate-180 text-[#9A6D22]' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Dropdown Items */}
            {isProductDropdownOpen && (
              <div className="mt-1 ml-4 pl-3.5 border-l-2 border-[#EADFC9] space-y-1 py-1">
                {/* All Wholesale Products */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/products')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                    currentPath === '/dashboard/products' || currentPath === '/dashboard/product' || currentPath === '/dashboard/product-list'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    <span>All Products</span>
                  </div>
                  {(currentPath === '/dashboard/products' || currentPath === '/dashboard/product' || currentPath === '/dashboard/product-list') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>

                {/* Product Type */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-type')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                    currentPath === '/dashboard/product-type'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    <span>Product Type</span>
                  </div>
                  {currentPath === '/dashboard/product-type' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>
                {/* Product Category */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-category')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                    currentPath === '/dashboard/product-category'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    <span>Product Category</span>
                  </div>
                  {currentPath === '/dashboard/product-category' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>

                {/* Product Sizes */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-size')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left cursor-pointer ${
                    currentPath === '/dashboard/product-size' || currentPath === '/dashboard/product-sizes'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Product Sizes</span>
                  </div>
                  {(currentPath === '/dashboard/product-size' || currentPath === '/dashboard/product-sizes') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>

                {/* Product Colours */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-color')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left cursor-pointer ${
                    currentPath === '/dashboard/product-color' || currentPath === '/dashboard/product-colors'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    <span>Product Colours</span>
                  </div>
                  {(currentPath === '/dashboard/product-color' || currentPath === '/dashboard/product-colors') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>

                {/* Product Fits */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-fit')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left cursor-pointer ${
                    currentPath === '/dashboard/product-fit' || currentPath === '/dashboard/product-fits'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M4 6h16M4 12h16m-7 6h7"
                      />
                    </svg>
                    <span>Product Fits</span>
                  </div>
                  {(currentPath === '/dashboard/product-fit' || currentPath === '/dashboard/product-fits') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>

                {/* Product Fabrics & GSM */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-fabric')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left cursor-pointer ${
                    currentPath === '/dashboard/product-fabric' || currentPath === '/dashboard/product-fabrics'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <span>Product Fabrics &amp; GSM</span>
                  </div>
                  {(currentPath === '/dashboard/product-fabric' || currentPath === '/dashboard/product-fabrics') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>

                {/* Product MOQ & Packs */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-moq')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left cursor-pointer ${
                    currentPath === '/dashboard/product-moq' || currentPath === '/dashboard/product-moqs'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <span>Product MOQ &amp; Packs</span>
                  </div>
                  {(currentPath === '/dashboard/product-moq' || currentPath === '/dashboard/product-moqs') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>

                
              </div>
            )}
          </div>

          {/* 3. Administrator Dropdown Menu */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAdminDropdownOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isAdministratorPath
                  ? 'bg-[#FAF8F5] border border-[#E8DEC9] text-[#121214]'
                  : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isAdministratorPath ? 'text-[#9A6D22]' : 'text-[#8A847B]'}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </span>
                <span className="tracking-wide text-xs">Administrator</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-[#FAF3E4] px-1.5 py-0.2 text-[9px] font-mono font-bold text-[#9A6D22] border border-[#E7D6B6]">
                  Tier 1
                </span>
                <svg
                  className={`h-3.5 w-3.5 text-[#8A847B] transition-transform duration-200 ${
                    isAdminDropdownOpen ? 'rotate-180 text-[#9A6D22]' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Dropdown Items */}
            {isAdminDropdownOpen && (
              <div className="mt-1 ml-4 pl-3.5 border-l-2 border-[#EADFC9] space-y-1 py-1">
                {/* Admin Directory */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/admin-users')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                    currentPath === '/dashboard/admin-users'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Admin Directory</span>
                  </div>
                  {currentPath === '/dashboard/admin-users' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>

                {/* Provision New Admin */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/create-admin')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                    currentPath === '/dashboard/create-admin'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Create Admin</span>
                  </div>
                  {currentPath === '/dashboard/create-admin' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>

                {/* Roles & Clearance */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/roles')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                    currentPath === '/dashboard/roles'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Roles & Clearance</span>
                  </div>
                  {currentPath === '/dashboard/roles' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>

                {/* Audit Trail */}
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/audit-logs')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                    currentPath === '/dashboard/audit-logs'
                      ? 'bg-[#FAF3E4] text-[#805915] font-semibold border border-[#E5D3AF]/60'
                      : 'text-[#635E56] hover:bg-[#FAF8F5] hover:text-[#121214]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span>Audit Trail</span>
                  </div>
                  {currentPath === '/dashboard/audit-logs' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
                  )}
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Bottom Pinned Footer */}
      <div className="pt-4 border-t border-[#ECE4D5] px-1 shrink-0 space-y-3">
        {/* User Card if logged in */}
        {currentUser && (
          <div className="flex items-center justify-between rounded-xl border border-[#ECE4D5] bg-[#FAF8F5] p-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#ECC880] to-[#C59A46] font-mono text-[11px] font-bold text-[#121214] shadow-xs">
                {currentUser?.name
                  ? currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                  : 'AD'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#121214] truncate">
                  {currentUser?.name || 'Administrator'}
                </div>
                <div className="text-[10px] font-mono text-[#9A6D22] truncate">
                  {currentUser?.role || 'Administrator'}
                </div>
              </div>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-[#8A847B] hover:text-[#B92D25] rounded transition-colors"
                title="Sign out of console"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Security & System Status */}
        <div className="flex items-center justify-between text-[11px] text-[#7A746B]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#1E824C] animate-pulse" />
            <span className="font-mono text-[10px]">TLS 1.3 Active</span>
          </div>
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              className="text-[#9A6D22] hover:text-[#805915] text-[11px] font-medium underline-offset-2 hover:underline"
            >
              Clearance Help
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
