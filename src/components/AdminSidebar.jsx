import bvbLogo from '../assets/bvb-logo.png'

export default function AdminSidebar({
  currentUser,
  onLogout,
  onOpenHelp,
}) {
  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 bg-[#FFFFFF] border-r border-[#ECE4D5] flex flex-col justify-between py-6 px-4 z-40 shadow-[1px_0_6px_rgba(110,87,44,0.04)] select-none">
      <div>
        {/* Brand Header with Circular BB Monogram */}
        <div className="flex items-center gap-3 px-2 mb-7">
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

        {/* Navigation - ONLY Overview */}
        <nav className="space-y-1 text-xs">
          <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FAF3E4] border border-[#E5D3AF] text-[#121214] font-semibold shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-[#9A6D22]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </span>
              <span className="tracking-wide text-xs">Overview</span>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-[#C59A46]" />
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
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-mono text-[#9A6D22] truncate">
                  {currentUser.role || 'Super Admin'}
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
