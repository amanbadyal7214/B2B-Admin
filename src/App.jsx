import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import AdminSidebar from './components/AdminSidebar'
import AdminLogin from './components/AdminLogin'
import AdminDashboardPreview from './components/AdminDashboardPreview'
import AdminManagementView from './components/AdminManagementView'
import ProductCategoryView from './components/ProductCategoryView'
import ProductTypeView from './components/ProductTypeView'
import ProductSizeView from './components/ProductSizeView'
import ProductColorView from './components/ProductColorView'
import ProductFitView from './components/ProductFitView'
import ProductFabricView from './components/ProductFabricView'
import { clearAdminSession } from './api'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showClearanceModal, setShowClearanceModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check for existing persistent session
    try {
      const savedSession =
        localStorage.getItem('bvb_admin_session') ||
        sessionStorage.getItem('bvb_admin_session')

      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        if (parsed && parsed.email) {
          setCurrentUser(parsed)
        }
      }
    } catch {
      // ignore
    } finally {
      setIsInitializing(false)
    }
  }, [])

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData)
    navigate('/dashboard', { replace: true })
  }

  const handleLogout = () => {
    clearAdminSession()
    setCurrentUser(null)
    navigate('/login', { replace: true })
  }

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF8F5] text-[#121214]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C59A46] border-t-transparent" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#7A746B]">
            Initializing BVB Atelier Console...
          </span>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* 1. Login Route: If already logged in, redirect immediately to /dashboard */}
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AdminLogin onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      {/* 2. Protected Dashboard Console: If logged out, redirect immediately to /login */}
      <Route
        path="/dashboard/*"
        element={
          !currentUser ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="h-screen w-full overflow-hidden bg-[#FAF8F5] text-[#121214] flex font-sans antialiased selection:bg-[#EEDBB2] selection:text-[#121214]">
              {/* Sticky Side Panel with React Router navigation */}
              <AdminSidebar
                currentUser={currentUser}
                onLogout={handleLogout}
                onOpenHelp={() => setShowClearanceModal(true)}
              />

              {/* Scrollable Main Content Area */}
              <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
                {/* Sticky Executive Top Bar */}
                <header className="sticky top-0 z-30 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#ECE4D5] px-8 py-3.5 flex items-center justify-between shadow-[0_1px_3px_rgba(110,87,44,0.03)] shrink-0">
                  {/* Search Bar */}
                  <div className="relative w-72 sm:w-96">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9A9386]">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Catalog, Categories, Admins, SKUs..."
                      className="w-full rounded-xl border border-[#E8DEC9] bg-[#FCFBF8] py-2 pl-10 pr-4 text-xs text-[#121214] placeholder-[#A8A196] focus:border-[#C59A46] focus:outline-none focus:ring-1 focus:ring-[#C59A46]/30 font-medium"
                    />
                  </div>

                  {/* Right Header Strip */}
                  <div className="flex items-center gap-4">
                    {/* Live Operational Status */}
                    <div className="hidden lg:flex items-center gap-2 rounded-full border border-[#E7DFCE] bg-[#FAF8F5] px-3.5 py-1 text-xs">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1E824C] opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1E824C]"></span>
                      </span>
                      <span className="font-mono text-[11px] font-medium tracking-wide text-[#55514B]">
                        B2B Core Online · TLS 1.3
                      </span>
                    </div>

                    {/* Help Button */}
                    <button
                      type="button"
                      onClick={() => setShowClearanceModal(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#DFD5C2] bg-[#FFFFFF] px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[#6B6357] uppercase transition-all hover:border-[#C59A46] hover:text-[#9A6D22] hover:bg-[#FDF9F0]"
                    >
                      Clearance Help
                    </button>

                    {/* User Profile Chip */}
                    <div className="flex items-center gap-3 pl-3 border-l border-[#ECE4D5]">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#ECC880] to-[#C59A46] font-mono text-xs font-bold text-[#121214] shadow-xs">
                        {currentUser?.name
                          ? currentUser.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                          : 'AD'}
                      </div>
                      <div className="text-left hidden sm:block">
                        <div className="text-xs font-bold text-[#121214] leading-tight">
                          {currentUser?.name || 'Administrator'}
                        </div>
                        <div className="text-[10px] font-mono text-[#9A6D22] leading-tight">
                          {currentUser?.role || 'Administrator'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="p-1.5 text-[#8A847B] hover:text-[#B92D25] rounded-md transition-colors"
                        title="Sign out of console"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </header>

                {/* Sub-Routes for Dashboard Pages */}
                <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto flex-1">
                  <Routes>
                    {/* /dashboard -> Overview */}
                    <Route index element={<AdminDashboardPreview user={currentUser} />} />

                    {/* /dashboard/product-category -> Product Categories Management */}
                    <Route
                      path="product-category"
                      element={<ProductCategoryView currentUser={currentUser} />}
                    />
                    <Route
                      path="product/category"
                      element={<ProductCategoryView currentUser={currentUser} />}
                    />

                    {/* /dashboard/product-type -> Product Types Management */}
                    <Route
                      path="product-type"
                      element={<ProductTypeView currentUser={currentUser} />}
                    />
                    <Route
                      path="product/type"
                      element={<ProductTypeView currentUser={currentUser} />}
                    />

                    {/* /dashboard/product-size -> Product Sizes Management */}
                    <Route
                      path="product-size"
                      element={<ProductSizeView currentUser={currentUser} />}
                    />
                    <Route
                      path="product-sizes"
                      element={<ProductSizeView currentUser={currentUser} />}
                    />
                    <Route
                      path="product/size"
                      element={<ProductSizeView currentUser={currentUser} />}
                    />
                    <Route
                      path="product/sizes"
                      element={<ProductSizeView currentUser={currentUser} />}
                    />

                    {/* /dashboard/product-color -> Product Colours Management */}
                    <Route
                      path="product-color"
                      element={<ProductColorView currentUser={currentUser} />}
                    />
                    <Route
                      path="product-colors"
                      element={<ProductColorView currentUser={currentUser} />}
                    />
                    <Route
                      path="product/color"
                      element={<ProductColorView currentUser={currentUser} />}
                    />
                    <Route
                      path="product/colors"
                      element={<ProductColorView currentUser={currentUser} />}
                    />

                    {/* /dashboard/product-fit -> Product Fits Management */}
                    <Route
                      path="product-fit"
                      element={<ProductFitView currentUser={currentUser} />}
                    />
                    <Route
                      path="product-fits"
                      element={<ProductFitView currentUser={currentUser} />}
                    />
                    <Route
                      path="product/fit"
                      element={<ProductFitView currentUser={currentUser} />}
                    />
                    <Route
                      path="product/fits"
                      element={<ProductFitView currentUser={currentUser} />}
                    />

                    {/* /dashboard/product-fabric -> Product Fabrics & GSM Management */}
                    <Route
                      path="product-fabric"
                      element={<ProductFabricView currentUser={currentUser} />}
                    />
                    <Route
                      path="product-fabrics"
                      element={<ProductFabricView currentUser={currentUser} />}
                    />
                    <Route
                      path="product/fabric"
                      element={<ProductFabricView currentUser={currentUser} />}
                    />
                    <Route
                      path="product/fabrics"
                      element={<ProductFabricView currentUser={currentUser} />}
                    />

                    {/* /dashboard/admin-users -> Administrator Directory */}
                    <Route
                      path="admin-users"
                      element={
                        <AdminManagementView
                          activeView="admin_users"
                          currentUser={currentUser}
                          onNavigate={(view) => {
                            if (view === 'create_admin') navigate('/dashboard/create-admin')
                            else navigate('/dashboard/admin-users')
                          }}
                        />
                      }
                    />

                    {/* /dashboard/create-admin -> Provision Admin Form */}
                    <Route
                      path="create-admin"
                      element={
                        <AdminManagementView
                          activeView="create_admin"
                          currentUser={currentUser}
                          onNavigate={(view) => {
                            if (view === 'admin_users') navigate('/dashboard/admin-users')
                            else navigate('/dashboard/create-admin')
                          }}
                        />
                      }
                    />

                    {/* /dashboard/roles -> Roles & Clearance Matrix */}
                    <Route
                      path="roles"
                      element={
                        <AdminManagementView
                          activeView="roles_clearance"
                          currentUser={currentUser}
                          onNavigate={() => {}}
                        />
                      }
                    />

                    {/* /dashboard/audit-logs -> Audit Trail */}
                    <Route
                      path="audit-logs"
                      element={
                        <AdminManagementView
                          activeView="audit_logs"
                          currentUser={currentUser}
                          onNavigate={() => {}}
                        />
                      }
                    />

                    {/* Fallback inside dashboard -> /dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>

              {/* Clearance Modal */}
              {showClearanceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121214]/50 backdrop-blur-xs">
                  <div className="relative w-full max-w-lg rounded-2xl border border-[#E2D8C7] bg-[#FFFFFF] p-6 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#EAE3D5] pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FAF4E8] text-[#9A6D22] border border-[#E5D7B7]">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-[#121214]">
                            Clearance & Passphrase Protocols
                          </h3>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-[#9A6D22]">
                            Buddy Vs Buff Administrative Office
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowClearanceModal(false)}
                        className="rounded-lg p-1 text-[#8A847B] hover:bg-[#F5EFE8] hover:text-[#121214] transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-4 space-y-3.5 text-xs text-[#55514B]">
                      <div className="rounded-lg border border-[#EFE8DD] bg-[#FAF8F5] p-3">
                        <h4 className="font-semibold text-[#121214] mb-1">
                          1. Enterprise Governance
                        </h4>
                        <p className="text-[11px] leading-relaxed text-[#6E685E]">
                          Each administrative session is signed with a high-entropy JSON Web Token (JWT) linked to your database clearance tier.
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#EFE8DD] bg-[#FAF8F5] p-3">
                        <h4 className="font-semibold text-[#121214] mb-1">
                          2. Passkey Rotation & Emergency Lockout
                        </h4>
                        <p className="text-[11px] leading-relaxed text-[#6E685E]">
                          Passphrase rotations require dual-signature authorization from the Lead Operations Director.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowClearanceModal(false)}
                        className="rounded-lg border border-[#D9AE6A] bg-gradient-to-r from-[#FAF3E4] to-[#F5E6C7] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#7A5220] hover:bg-[#F2DEB5] transition-all shadow-xs"
                      >
                        Acknowledge & Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        }
      />

      {/* 3. Root Route Redirect: If authenticated -> /dashboard, else /login */}
      <Route
        path="/"
        element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />}
      />

      {/* 4. Catch-all: Redirect to /dashboard if logged in, else /login */}
      <Route
        path="*"
        element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  )
}

export default App
