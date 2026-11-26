import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function AdminSidebar({
  currentUser,
  onLogout,
  onOpenHelp,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const currentSearch = location.search

  const [isCollapsed, setIsCollapsed] = useState(false)

  // RBAC Module Access Evaluation
  const isSuperAdmin = currentUser?.role === 'Super Administrator'
  const userModules =
    Array.isArray(currentUser?.modules) && currentUser.modules.length > 0
      ? currentUser.modules
      : isSuperAdmin
      ? ['orders', 'products', 'inventory', 'retailers', 'invoices', 'pincodes', 'blog', 'referrals', 'roles']
      : ['orders', 'products']

  const canAccess = (moduleKey) => isSuperAdmin || userModules.includes(moduleKey)

  // Active path detectors
  const isOverview = currentPath === '/dashboard' || currentPath === '/dashboard/'

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

  const isOrderPath =
    currentPath.includes('/orders') ||
    currentPath.includes('/order') ||
    currentPath.includes('/wholesale-orders') ||
    currentPath.includes('/manifests')

  const isCustomerPath =
    currentPath.includes('/customer') ||
    currentPath.includes('/customers') ||
    currentPath.includes('/retailer') ||
    currentPath.includes('/retailers')

  const isInventoryPath =
    currentPath.includes('/inventory') ||
    currentPath.includes('/stock') ||
    currentPath.includes('/warehouses')

  const isPincodePath = currentPath.includes('/pincode')
  const isBlogPath = currentPath.includes('/blog')
  const isStoryPath =
    currentPath.includes('/our-story') ||
    currentPath.includes('/story') ||
    currentPath.includes('/about-us')
  const isReferralPath =
    currentPath.includes('/referral') ||
    currentPath.includes('/reward')

  const isAdministratorPath =
    currentPath.includes('/admin-users') ||
    currentPath.includes('/create-admin') ||
    currentPath.includes('/roles') ||
    currentPath.includes('/audit-logs')

  // Customer sub-tab active checks
  const isRetailersAllActive =
    isCustomerPath &&
    !currentSearch.includes('status=') &&
    !currentSearch.includes('sampleKit=')
  const isPendingActive = isCustomerPath && currentSearch.includes('status=pending')
  const isVerifiedActive = isCustomerPath && currentSearch.includes('status=verified')
  const isSampleKitActive = isCustomerPath && currentSearch.includes('sampleKit=requested')

  // Inventory sub-tab active checks
  const isStockListActive =
    isInventoryPath &&
    (!currentSearch.includes('tab=') || currentSearch.includes('tab=stock'))
  const isInwardActive = isInventoryPath && currentSearch.includes('tab=inward')
  const isAlertsActive = isInventoryPath && currentSearch.includes('tab=alerts')
  const isLocksActive = isInventoryPath && currentSearch.includes('tab=locks')
  const isAdjustReturnActive = isInventoryPath && currentSearch.includes('tab=adjust_return')
  const isMovementsActive = isInventoryPath && currentSearch.includes('tab=movements')
  const isWarehousesActive =
    isInventoryPath &&
    (currentSearch.includes('tab=warehouses') || currentPath.includes('/warehouses'))

  // Dropdown states
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const [isInventoryDropdownOpen, setIsInventoryDropdownOpen] = useState(false)
  const [isDeliveryDropdownOpen, setIsDeliveryDropdownOpen] = useState(false)
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false)

  // Keep dropdowns open if on their sub-path
  useEffect(() => {
    if (isProductPath) setIsProductDropdownOpen(true)
    if (isCustomerPath) setIsCustomerDropdownOpen(true)
    if (isInventoryPath) setIsInventoryDropdownOpen(true)
    if (isPincodePath) setIsDeliveryDropdownOpen(true)
    if (isAdministratorPath) setIsAdminDropdownOpen(true)
  }, [isProductPath, isCustomerPath, isInventoryPath, isPincodePath, isAdministratorPath])

  const handleNav = (path) => {
    navigate(path)
  }

  return (
    <aside
      className={`sticky top-0 h-screen shrink-0 bg-[#0B1E38] border-r border-[#162D4A] flex flex-col z-40 select-none transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64 sm:w-68'
      }`}
    >
      {/* 1. Header: Orange Diamond Icon + "Admin Panel" + Toggle Collapse */}
      <div className="flex items-center justify-between px-3.5 pt-4 pb-2.5">
        <div
          onClick={() => handleNav('/dashboard')}
          className="flex items-center gap-3 cursor-pointer select-none min-w-0"
        >
          {/* Orange Box with White Diamond Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F95700] shadow-[0_3px_10px_rgba(249,87,0,0.35)]">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 9l10 13 10-13-10-7zm0 2.8L19.2 9H4.8L12 4.8zm-7 5.2h4.5L12 18 5 10zm6 0h2l-1 7.2L11 10zm3.5 0H19l-7 8 2.5-8z" />
            </svg>
          </div>

          {!isCollapsed && (
            <span className="text-[17px] font-bold tracking-wide text-[#F95700] truncate">
              Admin Panel
            </span>
          )}
        </div>

        {/* Collapse / Expand Toggle Button (≡< icon) */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-[#8E9CAE] hover:text-white rounded-lg hover:bg-[#122744] transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="16" y2="6" />
            <line x1="4" y1="12" x2="16" y2="12" />
            <line x1="4" y1="18" x2="16" y2="18" />
            {isCollapsed ? (
              <polyline points="15 9 18 12 15 15" />
            ) : (
              <polyline points="18 9 15 12 18 15" />
            )}
          </svg>
        </button>
      </div>

      {/* 2. User Profile Strip (Avatar + Admin User + email + Logout) */}
      <div className="border-t border-[#162D4A] py-2.5 px-3.5 my-1 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#142A45] text-[#CBD5E1] border border-[#1E3B60]">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white truncate leading-tight">
                {currentUser?.name || 'Admin User'}
              </div>
              <div className="text-[11px] text-[#8E9CAE] truncate leading-tight mt-0.5">
                {currentUser?.email || 'admin@gmail.com'}
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-[#8E9CAE] hover:text-[#F95700] rounded-lg hover:bg-[#122744] transition-colors"
            title="Sign out of console"
          >
            {/* Logout icon: door with right arrow */}
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* 3. Navigation List with Custom Scrollbar */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#1B3454] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {/* 1. Dashboard (Home Icon) */}
        <button
          type="button"
          onClick={() => handleNav('/dashboard')}
          title="Dashboard"
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
            isOverview
              ? 'bg-[#F95700] text-white font-semibold shadow-[0_4px_12px_rgba(249,87,0,0.35)]'
              : 'text-[#9AA8BC] hover:bg-[#122744] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className={isOverview ? 'text-white' : 'text-[#8E9CAE]'}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </span>
            {!isCollapsed && <span className="truncate">Dashboard</span>}
          </div>
        </button>

        {/* 2. Products (Package Icon + Submenu) */}
        {canAccess('products') && (
          <div>
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) setIsCollapsed(false)
                setIsProductDropdownOpen((prev) => !prev)
              }}
              title="Products"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                isProductPath && !isProductDropdownOpen
                  ? 'bg-[#F95700] text-white font-semibold shadow-[0_4px_12px_rgba(249,87,0,0.35)]'
                  : 'text-[#9AA8BC] hover:bg-[#122744] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isProductPath && !isProductDropdownOpen ? 'text-white' : 'text-[#8E9CAE]'}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 9.07v6.36l6 3.38v-6.38L5 9.07zm14 6.36V9.07l-6 3.36v6.38l6-3.38z" />
                  </svg>
                </span>
                {!isCollapsed && <span className="truncate">Products</span>}
              </div>

              {!isCollapsed && (
                <svg
                  className={`h-4 w-4 text-[#8E9CAE] transition-transform duration-200 ${
                    isProductDropdownOpen ? 'rotate-90 text-[#F95700]' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>

            {/* Products Submenu */}
            {isProductDropdownOpen && !isCollapsed && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#1D3A60] space-y-1 py-1">
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/products')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/products' ||
                    currentPath === '/dashboard/product' ||
                    currentPath === '/dashboard/product-list'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>All Products</span>
                  {(currentPath === '/dashboard/products' ||
                    currentPath === '/dashboard/product' ||
                    currentPath === '/dashboard/product-list') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-type')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/product-type'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Product Type</span>
                  {currentPath === '/dashboard/product-type' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-category')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/product-category'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Product Category</span>
                  {currentPath === '/dashboard/product-category' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-size')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/product-size' ||
                    currentPath === '/dashboard/product-sizes'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Product Sizes</span>
                  {(currentPath === '/dashboard/product-size' ||
                    currentPath === '/dashboard/product-sizes') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-color')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/product-color' ||
                    currentPath === '/dashboard/product-colors'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Product Colours</span>
                  {(currentPath === '/dashboard/product-color' ||
                    currentPath === '/dashboard/product-colors') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-fit')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/product-fit' ||
                    currentPath === '/dashboard/product-fits'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Product Fits</span>
                  {(currentPath === '/dashboard/product-fit' ||
                    currentPath === '/dashboard/product-fits') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-fabric')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/product-fabric' ||
                    currentPath === '/dashboard/product-fabrics'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Product Fabrics &amp; GSM</span>
                  {(currentPath === '/dashboard/product-fabric' ||
                    currentPath === '/dashboard/product-fabrics') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/product-moq')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/product-moq' ||
                    currentPath === '/dashboard/product-moqs'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Product MOQ &amp; Packs</span>
                  {(currentPath === '/dashboard/product-moq' ||
                    currentPath === '/dashboard/product-moqs') && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Orders (Shopping Cart Icon) */}
        {canAccess('orders') && (
          <button
            type="button"
            onClick={() => handleNav('/dashboard/orders')}
            title="Orders"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
              isOrderPath
                ? 'bg-[#F95700] text-white font-semibold shadow-[0_4px_12px_rgba(249,87,0,0.35)]'
                : 'text-[#9AA8BC] hover:bg-[#122744] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={isOrderPath ? 'text-white' : 'text-[#8E9CAE]'}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </span>
              {!isCollapsed && <span className="truncate">Orders</span>}
            </div>
          </button>
        )}

        {/* 4. Customers (Users Icon + Submenu) */}
        {canAccess('retailers') && (
          <div>
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) setIsCollapsed(false)
                setIsCustomerDropdownOpen((prev) => !prev)
              }}
              title="Customers"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                isCustomerPath && !isCustomerDropdownOpen
                  ? 'bg-[#F95700] text-white font-semibold shadow-[0_4px_12px_rgba(249,87,0,0.35)]'
                  : 'text-[#9AA8BC] hover:bg-[#122744] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isCustomerPath && !isCustomerDropdownOpen ? 'text-white' : 'text-[#8E9CAE]'}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </span>
                {!isCollapsed && <span className="truncate">Customers</span>}
              </div>

              {!isCollapsed && (
                <svg
                  className={`h-4 w-4 text-[#8E9CAE] transition-transform duration-200 ${
                    isCustomerDropdownOpen ? 'rotate-90 text-[#F95700]' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>

            {/* Customers Submenu */}
            {isCustomerDropdownOpen && !isCollapsed && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#1D3A60] space-y-1 py-1">
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/retailers')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isRetailersAllActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Retailers Directory</span>
                  {isRetailersAllActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/retailers?status=pending')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isPendingActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Pending Clearance</span>
                  {isPendingActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/retailers?status=verified')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isVerifiedActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Verified Partners</span>
                  {isVerifiedActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/retailers?sampleKit=requested')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isSampleKitActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Sample Kit Requests</span>
                  {isSampleKitActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. Inventory (Diamond Icon + Submenu) */}
        {canAccess('inventory') && (
          <div>
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) setIsCollapsed(false)
                setIsInventoryDropdownOpen((prev) => !prev)
              }}
              title="Inventory"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                isInventoryPath && !isInventoryDropdownOpen
                  ? 'bg-[#F95700] text-white font-semibold shadow-[0_4px_12px_rgba(249,87,0,0.35)]'
                  : 'text-[#9AA8BC] hover:bg-[#122744] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isInventoryPath && !isInventoryDropdownOpen ? 'text-white' : 'text-[#8E9CAE]'}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 9l10 13 10-13-10-7zm0 2.8L19.2 9H4.8L12 4.8zm-7 5.2h4.5L12 18 5 10zm6 0h2l-1 7.2L11 10zm3.5 0H19l-7 8 2.5-8z" />
                  </svg>
                </span>
                {!isCollapsed && <span className="truncate">Inventory</span>}
              </div>

              {!isCollapsed && (
                <svg
                  className={`h-4 w-4 text-[#8E9CAE] transition-transform duration-200 ${
                    isInventoryDropdownOpen ? 'rotate-90 text-[#F95700]' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>

            {/* Inventory Submenu */}
            {isInventoryDropdownOpen && !isCollapsed && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#1D3A60] space-y-1 py-1">
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/inventory?tab=stock')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isStockListActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>SKU Stock List</span>
                  {isStockListActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/inventory?tab=inward')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isInwardActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Stock Inward &amp; Excel</span>
                  {isInwardActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/inventory?tab=alerts')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isAlertsActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Low Stock Alerts</span>
                  {isAlertsActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/inventory?tab=locks')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isLocksActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Active Stock Locks</span>
                  {isLocksActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/inventory?tab=adjust_return')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isAdjustReturnActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Adjust &amp; QC Returns</span>
                  {isAdjustReturnActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/inventory?tab=movements')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isMovementsActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Movement Audit Trail</span>
                  {isMovementsActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/inventory?tab=warehouses')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isWarehousesActive
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Warehouses &amp; Transfer</span>
                  {isWarehousesActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 10. Delivery Management (Truck Icon + Submenu) */}
        {canAccess('pincodes') && (
          <div>
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) setIsCollapsed(false)
                setIsDeliveryDropdownOpen((prev) => !prev)
              }}
              title="Delivery Management"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                isPincodePath && !isDeliveryDropdownOpen
                  ? 'bg-[#F95700] text-white font-semibold shadow-[0_4px_12px_rgba(249,87,0,0.35)]'
                  : 'text-[#9AA8BC] hover:bg-[#122744] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isPincodePath && !isDeliveryDropdownOpen ? 'text-white' : 'text-[#8E9CAE]'}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </svg>
                </span>
                {!isCollapsed && <span className="truncate">Delivery Management</span>}
              </div>

              {!isCollapsed && (
                <svg
                  className={`h-4 w-4 text-[#8E9CAE] transition-transform duration-200 ${
                    isDeliveryDropdownOpen ? 'rotate-90 text-[#F95700]' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>

            {/* Delivery Submenu */}
            {isDeliveryDropdownOpen && !isCollapsed && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#1D3A60] space-y-1 py-1">
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/pincodes')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    isPincodePath
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Delivery Pincodes</span>
                  {isPincodePath && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 10.5 Blog & Editorial CMS */}
        {canAccess('blog') && (
          <button
            type="button"
            onClick={() => handleNav('/dashboard/blogs')}
            title="Editorial & Blog CMS"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
              isBlogPath
                ? 'bg-[#F95700] text-white font-semibold shadow-[0_4px_12px_rgba(249,87,0,0.35)]'
                : 'text-[#9AA8BC] hover:bg-[#122744] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={isBlogPath ? 'text-white' : 'text-[#8E9CAE]'}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {!isCollapsed && <span className="truncate">Editorial &amp; Blogs</span>}
            </div>
            {!isCollapsed && (
              <span className="rounded bg-[#F95700]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#F95700] uppercase font-mono">
                CMS
              </span>
            )}
          </button>
        )}

        {/* 10.6 Our Story CMS */}
        {canAccess('blog') && (
          <button
            type="button"
            onClick={() => handleNav('/dashboard/our-story')}
            title="Our Story & Atelier CMS"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
              isStoryPath
                ? 'bg-[#F95700] text-white font-semibold shadow-[0_4px_12px_rgba(249,87,0,0.35)]'
                : 'text-[#9AA8BC] hover:bg-[#122744] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={isStoryPath ? 'text-white' : 'text-[#8E9CAE]'}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              {!isCollapsed && <span className="truncate">Our Story CMS</span>}
            </div>
            {!isCollapsed && (
              <span className="rounded bg-[#F95700]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#F95700] uppercase font-mono">
                About Us
              </span>
            )}
          </button>
        )}

        {/* 10.7 Referral & Rewards Ledger */}
        {canAccess('referrals') && (
          <button
            type="button"
            onClick={() => handleNav('/dashboard/referrals')}
            title="Referral & Rewards Ledger"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
              isReferralPath
                ? 'bg-[#F95700] text-white font-semibold shadow-[0_4px_12px_rgba(249,87,0,0.35)]'
                : 'text-[#9AA8BC] hover:bg-[#122744] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={isReferralPath ? 'text-white' : 'text-[#8E9CAE]'}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              {!isCollapsed && <span className="truncate">Referrals &amp; Wallet</span>}
            </div>
            {!isCollapsed && (
              <span className="rounded bg-[#F95700]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#F95700] uppercase font-mono">
                Rewards
              </span>
            )}
          </button>
        )}

        {/* 11. Administrator (Shield Icon + Submenu) */}
        {canAccess('roles') && (
          <div>
            <button
              type="button"
              onClick={() => {
                if (isCollapsed) setIsCollapsed(false)
                setIsAdminDropdownOpen((prev) => !prev)
              }}
              title="Administrator"
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                isAdministratorPath && !isAdminDropdownOpen
                  ? 'bg-[#F95700] text-white font-semibold shadow-[0_4px_12px_rgba(249,87,0,0.35)]'
                  : 'text-[#9AA8BC] hover:bg-[#122744] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isAdministratorPath && !isAdminDropdownOpen ? 'text-white' : 'text-[#8E9CAE]'}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                  </svg>
                </span>
                {!isCollapsed && <span className="truncate">Administrator</span>}
              </div>

              {!isCollapsed && (
                <svg
                  className={`h-4 w-4 text-[#8E9CAE] transition-transform duration-200 ${
                    isAdminDropdownOpen ? 'rotate-90 text-[#F95700]' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </button>

            {/* Administrator Submenu */}
            {isAdminDropdownOpen && !isCollapsed && (
              <div className="mt-1 ml-4 pl-3 border-l border-[#1D3A60] space-y-1 py-1">
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/admin-users')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/admin-users'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Admin Directory</span>
                  {currentPath === '/dashboard/admin-users' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/create-admin')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/create-admin'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Create Admin</span>
                  {currentPath === '/dashboard/create-admin' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/roles')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/roles'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Roles &amp; Clearance</span>
                  {currentPath === '/dashboard/roles' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('/dashboard/audit-logs')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    currentPath === '/dashboard/audit-logs'
                      ? 'text-[#F95700] bg-[#122744] font-semibold border-l-2 border-[#F95700]'
                      : 'text-[#8E9CAE] hover:text-white hover:bg-[#122744]'
                  }`}
                >
                  <span>Audit Trail</span>
                  {currentPath === '/dashboard/audit-logs' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F95700]" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* 4. Bottom Footer Security / Help */}
      {!isCollapsed && onOpenHelp && (
        <div className="p-3 border-t border-[#162D4A] shrink-0">
          <button
            type="button"
            onClick={onOpenHelp}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#142A45]/80 hover:bg-[#142A45] text-[#8E9CAE] hover:text-white text-xs font-medium transition-colors"
          >
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Clearance &amp; Security Help</span>
          </button>
        </div>
      )}
    </aside>
  )
}
