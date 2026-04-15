import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { logout } from '../../services/api'
import { useState } from 'react'
import { Menu, X, LogOut, Home, Calendar, Building2, Clock, MapPin, Settings } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Bookings', href: '/bookings', icon: Calendar },
  { label: 'Facilities', href: '/facilities', icon: Building2 },
  { label: 'Time Slots', href: '/timeslots', icon: Clock },
  { label: 'Locations', href: '/locations', icon: MapPin },
  { label: 'Management', href: '/management', icon: Settings },
]

export default function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    setIsLoggingOut(true)
    logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl mb-6">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#01B4E7] to-[#005DAA] flex items-center justify-center shadow-lg shadow-[#01B4E7]/30 group-hover:shadow-[#01B4E7]/50 transition-all">
              <span className="text-white font-bold text-lg leading-none">R</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-extrabold text-foreground tracking-tight">
                Rotary <span className="font-light text-[#01B4E7]">Booking</span>
              </span>
              <p className="text-[10px] text-foreground/50 -mt-1">Hall Management System</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {NAV_LINKS.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname?.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                      ? 'bg-[#01B4E7]/10 text-[#01B4E7] font-semibold'
                      : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border/60 text-foreground/80 hover:border-red-500/50 hover:text-red-400 transition-all disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? 'Signing out…' : 'Sign out'}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-foreground/80"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
            <nav className="px-4 py-3 space-y-1">
              {NAV_LINKS.map(({ label, href, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                        ? 'bg-[#01B4E7]/10 text-[#01B4E7]'
                        : 'text-foreground/70 hover:bg-white/5'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </nav>
          </div>
        )}
      </header>

      <div className="mb-6 px-4 md:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#CB4335] uppercase tracking-widest">
          Dashboard Overview
        </h1>
        <p className="text-sm text-foreground/50 mt-1">
          Welcome to Rotary Club Hall Booking Management System
        </p>
      </div>
    </>
  )
}