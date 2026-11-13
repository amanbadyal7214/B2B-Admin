import { useState } from 'react'
import bvbLogo from '../assets/bvb-logo.png'
import bannerImg from '../assets/banner-season-edit.jpg'
import { adminAccessApi } from '../api'

export default function AdminLogin({ onLoginSuccess, isEmbedded = false, onCancel }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockActive, setCapsLockActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStepText, setLoadingStepText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showHelpModal, setShowHelpModal] = useState(false)

  const handleKeyDown = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim()) {
      setErrorMessage('Please provide an authorized administrative email.')
      return
    }

    if (!password) {
      setErrorMessage('Please enter your secure access key.')
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid administrative email address format.')
      return
    }

    // Authenticate with BVB Backend API using Axios Instance
    setIsLoading(true)
    setLoadingStepText('Authorizing with BVB Admin Access API...')

    try {
      const data = await adminAccessApi({
        email: email.trim(),
        password,
        rememberMe,
      })

      if (!data.success) {
        throw new Error(data.message || 'Authorization failed. Please verify credentials.')
      }

      const userProfile = {
        ...data.user,
        token: data.token,
        loginTime: data.user?.loginTime || new Date().toISOString(),
      }

      // Persist session
      const serialized = JSON.stringify(userProfile)
      if (rememberMe) {
        localStorage.setItem('bvb_admin_session', serialized)
        localStorage.setItem('bvb_admin_token', data.token)
      } else {
        sessionStorage.setItem('bvb_admin_session', serialized)
        sessionStorage.setItem('bvb_admin_token', data.token)
      }

      if (onLoginSuccess) {
        onLoginSuccess(userProfile)
      }
    } catch (err) {
      console.error('[AdminLogin] Authorization error:', err)
      const serverMessage =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to backend server. Please verify backend is running on port 5000.'
          : err.message)

      setErrorMessage(serverMessage || 'Authorization failed. Please check credentials.')
    } finally {
      setIsLoading(false)
      setLoadingStepText('')
    }
  }

  const helpModalContent = (
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
            onClick={() => setShowHelpModal(false)}
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
              1. Authorized Executive Access
            </h4>
            <p className="text-[11px] leading-relaxed text-[#6E685E]">
              Only provisioned administrative accounts with verified clearance (Super Administrator, Operations, or Finance) can access the BVB wholesale console.
            </p>
          </div>

          <div className="rounded-lg border border-[#EFE8DD] bg-[#FAF8F5] p-3">
            <h4 className="font-semibold text-[#121214] mb-1">
              2. Passphrase Recovery & Credential Provisioning
            </h4>
            <p className="text-[11px] leading-relaxed text-[#6E685E]">
              To provision a new administrator account or rotate passkeys, use the authorized management CLI or contact the corporate security administrator.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => setShowHelpModal(false)}
            className="rounded-lg border border-[#D9AE6A] bg-gradient-to-r from-[#FAF3E4] to-[#F5E6C7] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#7A5220] hover:bg-[#F2DEB5] transition-all shadow-xs"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  )

  const loginCard = (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-[#E9E2D4] bg-[#FFFFFF] shadow-[0_20px_50px_-10px_rgba(110,87,44,0.12),0_1px_3px_rgba(0,0,0,0.04)] lg:grid lg:grid-cols-12">
      {/* Left Hero Atelier Banner (Old Luxury Lookbook Atmosphere) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#FAF7F2] p-8 lg:col-span-5 lg:flex lg:p-10 border-r border-[#ECE4D5]">
        {/* Visual Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={bannerImg}
            alt="Buddy Vs Buff Seasonal Lookbook"
            className="h-full w-full object-cover object-center filter saturate-[0.85] contrast-[1.05] brightness-[1.02]"
          />
          {/* Luxury Warm Alabaster Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(170deg, rgba(250, 248, 245, 0.94) 0%, rgba(246, 241, 233, 0.88) 55%, rgba(240, 232, 219, 0.96) 100%)',
            }}
          />
          {/* Subtle Warm Gold Diagonal Slash Light Accent */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              background:
                'linear-gradient(135deg, transparent 35%, rgba(212, 163, 71, 0.3) 48%, rgba(245, 222, 179, 0.4) 52%, transparent 65%)',
            }}
          />
        </div>

        {/* Top Left Brand Plaque */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D9AE6A]/50 bg-[#FFFFFF]/90 px-3.5 py-1 backdrop-blur-md shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#805915]">
              Private Atelier Access
            </span>
          </div>

          <div className="mt-6">
            <h1 className="font-serif text-3xl font-semibold tracking-wide text-[#1A1815] leading-tight">
              High-End Garment <br />
              <span className="italic font-normal text-[#9A6D22]">Wholesale Command</span>
            </h1>
            <p className="mt-3 text-xs leading-relaxed text-[#605B53] tracking-wide max-w-sm">
              Centralized control plane for MOQ packs, inventory reservation, proforma invoicing, and verified B2B retailer networks.
            </p>
          </div>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 my-8 space-y-3.5">
          <div className="flex items-start gap-3 rounded-lg border border-[#E9E1D2] bg-[#FFFFFF]/85 p-3 backdrop-blur-sm shadow-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#FAF4E8] text-[#9A6D22] border border-[#E7D6B6]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#1E1B17]">
                Role-Based Governance
              </h4>
              <p className="text-[11px] text-[#696359] leading-snug">
                Strict segregation of duty across Super Admin, Fulfillment & Audit.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-[#E9E1D2] bg-[#FFFFFF]/85 p-3 backdrop-blur-sm shadow-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#FAF4E8] text-[#9A6D22] border border-[#E7D6B6]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-[#1E1B17]">
                Wholesale Ledger Integrity
              </h4>
              <p className="text-[11px] text-[#696359] leading-snug">
                Zero oversell under concurrency with automated tax reconciliation.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Citation & Security Seal */}
        <div className="relative z-10 border-t border-[#E5DAC8] pt-4 flex items-center justify-between text-[11px] text-[#7A746B]">
          <span className="font-mono">BUILD v2.4.0-LUX</span>
          <span className="flex items-center gap-1 font-medium">
            <svg className="w-3.5 h-3.5 text-[#9A6D22]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
            </svg>
            ISO/IEC 27001 Certified
          </span>
        </div>
      </div>

      {/* Right Authentication Form (Light Luxury Porcelain Panel) */}
      <div className="flex flex-col justify-between p-7 sm:p-10 lg:col-span-7 bg-[#FFFFFF]">
        <div>
          {/* Form Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-[#9A6D22] uppercase">
                Security Gate • BVB-AUTH
              </span>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#121214]">
                Administrative Terminal
              </h2>
            </div>
            {/* Brand Emblem */}
            <div className="h-12 w-12 rounded-xl border border-[#E8DEC9] bg-[#FAF7F2] p-1 shadow-xs flex items-center justify-center">
              <img src={bvbLogo} alt="BVB Emblem" className="max-h-full max-w-full object-contain" />
            </div>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-[#6E685E]">
            Enter authorized administrative credentials to access wholesale orders, catalog inventory, and fiscal reporting.
          </p>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#F0BCB8] bg-[#FDF2F1] p-3 text-xs text-[#B92D25]">
              <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-[#B92D25] hover:opacity-70 text-sm font-bold leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="mt-6 space-y-4">
            {/* Admin Identifier */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#47423B]">
                Corporate Email / Terminal ID
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9E978C]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@buddyvsbuff.com"
                  autoComplete="username"
                  required
                  className="w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 pl-10 pr-3.5 text-xs text-[#121214] placeholder-[#A8A196] shadow-2xs transition-all focus:border-[#C59A46] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#C59A46]/20 font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#47423B]">
                  Secure Access Passphrase
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-[11px] font-medium text-[#9A6D22] hover:text-[#7A5220] transition-colors underline-offset-2 hover:underline"
                >
                  Clearance reset?
                </button>
              </div>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9E978C]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-[#DED4C3] bg-[#FCFBF8] py-2.5 pl-10 pr-10 text-xs text-[#121214] placeholder-[#A8A196] shadow-2xs transition-all focus:border-[#C59A46] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#C59A46]/20 font-medium tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#9E978C] hover:text-[#47423B] transition-colors"
                  title={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Caps Lock Alert */}
              {capsLockActive && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#B37D14]">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Caps Lock is turned ON</span>
                </div>
              )}
            </div>

            {/* Auxiliary Checkboxes */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[#CFC4B2] text-[#C59A46] focus:ring-[#C59A46]/30 accent-[#C59A46]"
                />
                <span className="text-[11px] text-[#55514B]">
                  Trust workstation for 30 days
                </span>
              </label>

              <div className="flex items-center gap-1 text-[11px] text-[#7A746B]">
                <svg className="w-3 h-3 text-[#1E824C]" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>FIPS 140-3 Safe</span>
              </div>
            </div>

            {/* Primary Luxury Gold Sign-In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="luxury-shimmer-btn group relative flex w-full items-center justify-center rounded-lg py-3 px-4 font-sans text-xs font-bold uppercase tracking-[0.18em] transition-all shadow-[0_6px_20px_rgba(197,154,70,0.28)] hover:shadow-[0_8px_25px_rgba(197,154,70,0.38)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-75"
                style={{
                  background: 'linear-gradient(135deg, #ECC880 0%, #D4A347 45%, #B8852B 100%)',
                  color: '#121214',
                }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#121214] border-t-transparent" />
                    <span className="font-mono text-[11px] tracking-wider text-[#121214]">
                      {loadingStepText || 'Authorizing Terminal...'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Authorize & Enter Console</span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </div>
                )}
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full text-center text-xs font-medium text-[#7A746B] hover:text-[#121214] transition-colors py-2"
                >
                  ← Return to Dashboard Overview
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Bottom Security Watermark & Audit Notice */}
        <div className="mt-8 border-t border-[#EFE8DD] pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#8A847B]">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E824C]" />
              <span>Buddy Vs Buff B2B Administrative Partition</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Audit Trail Active</span>
              <span>•</span>
              <span>Session Nonce: Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // If embedded in a layout with its own side panel and header
  if (isEmbedded) {
    return (
      <div className="py-2">
        {loginCard}
        {showHelpModal && helpModalContent}
      </div>
    )
  }

  // Standalone Full-Page Mode
  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5] text-[#121214] flex flex-col justify-between selection:bg-[#EEDBB2] selection:text-[#121214]">
      {/* Background Subtle Luxury Ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-[20%] -right-[15%] w-[650px] h-[650px] rounded-full blur-[140px] opacity-40"
          style={{
            background: 'radial-gradient(circle, #EEDBB2 0%, rgba(212, 163, 71, 0.15) 60%, transparent 80%)',
          }}
        />
        <div
          className="absolute -bottom-[20%] -left-[10%] w-[580px] h-[580px] rounded-full blur-[120px] opacity-35"
          style={{
            background: 'radial-gradient(circle, #F4E8D1 0%, rgba(235, 212, 163, 0.12) 55%, transparent 75%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #7A5220 1px, transparent 1px), linear-gradient(to bottom, #7A5220 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Top Header Strip */}
      <header className="relative z-10 w-full border-b border-[#EAE3D5] bg-[#FAF8F5]/85 backdrop-blur-md px-6 py-3.5 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF] to-[#F3ECE0] p-[1.5px] shadow-[0_2px_8px_rgba(182,141,64,0.18)]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#FFFFFF] border border-[#E9DFC9]">
                <span className="font-serif text-base font-bold tracking-wider text-[#A87926]">
                  BB
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-[0.18em] text-[#121214]">
                  BUDDY VS BUFF
                </span>
                <span className="hidden rounded-full border border-[#D9AE6A]/40 bg-[#FDF8EF] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9A6D22] sm:inline-block">
                  Admin Core
                </span>
              </div>
              <p className="text-[10px] tracking-[0.22em] text-[#807A71] uppercase font-medium">
                Wear Your Vibes • Enterprise Management Suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#E7DFCE] bg-[#FFFFFF] px-3.5 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1E824C] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1E824C]"></span>
              </span>
              <span className="font-mono text-[11px] font-medium tracking-wide text-[#55514B]">
                TLS 1.3 · Operational
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 rounded border border-[#DFD5C2] bg-[#FFFFFF] px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[#6B6357] uppercase transition-all hover:border-[#C59A46] hover:text-[#9A6D22] hover:bg-[#FDF9F0]"
            >
              Clearance Help
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        {loginCard}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-[#EAE3D5] bg-[#FAF8F5]/90 py-3.5 px-6 sm:px-10 text-center text-xs text-[#787165]">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] tracking-wide">
            © 2026 <strong className="font-semibold text-[#121214]">BUDDY VS BUFF</strong>. All Rights Reserved. Private Commercial B2B Operations.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-[#9A6D22] hover:text-[#7A5220] font-medium transition-colors"
            >
              Wholesale Storefront ↗
            </a>
          </div>
        </div>
      </footer>

      {showHelpModal && helpModalContent}
    </div>
  )
}
