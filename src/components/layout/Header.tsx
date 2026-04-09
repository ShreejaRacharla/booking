import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useRouter } from "next/router"
import { RootState, AppDispatch } from "../../store"
import { logout } from "../../store/slices/authSlice"
import Cookies from "js-cookie"
import {
  Menu,
  X,
  LogOut,
  Home,
  Calendar,
  Building2,
  Clock,
  MapPin,
  Settings
} from "lucide-react"

const NAV_LINKS = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Bookings", href: "/user/booking", icon: Calendar },
  { label: "Booking Status", href: "/user/booking-status", icon: Building2 },
  // { label: "Booking Detail", href: "/user/booking-detail", icon: Clock },
  { label: "Payment", href: "/user/payment", icon: MapPin },
  { label: "Management", href: "/management", icon: Settings },
]

export default function Header() {
  const dispatch = useDispatch<AppDispatch>() 
  const router = useRouter()
  const pathname = router.pathname

  const user = useSelector((s: RootState) => s.auth.user)
  const [mobileOpen, setMobileOpen] = useState(false)

  // ✅ FIXED LOGOUT (NO ERROR)
  const handleLogout = () => {
    dispatch(logout());

    ["accessToken", "sessionId", "refreshToken", "user"].forEach((name) => {
      Cookies.remove(name, { path: "/" });
      Cookies.remove(name);
    });

    router.replace("/login");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
      
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#01B4E7] to-[#005DAA] flex items-center justify-center">
            <span className="text-white font-bold">R</span>
          </div>
          <span className="text-white font-bold text-sm">
            Booking <span className="text-white/50">Service</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-2">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                isActive(href)
                  ? "bg-[#01B4E7]/10 text-[#01B4E7]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* User */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-white">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-white/50 capitalize">
              {user?.role || "admin"}
            </p>
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#01B4E7] flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-white/70"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <button
              key={href}
              onClick={() => {
                router.push(href)
                setMobileOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg ${
                isActive(href)
                  ? "bg-[#01B4E7]/10 text-[#01B4E7]"
                  : "text-white/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-400"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}