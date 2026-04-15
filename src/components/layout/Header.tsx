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
  Users,
  FileText,
  BarChart3,
  Shield,
} from "lucide-react"

const ADMIN_NAV_LINKS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Home },
  { label: "Management", href: "/management", icon: BarChart3 },
]

const USER_NAV_LINKS = [
  { label: "Dashboard", href: "/user/dashboard", icon: Home },
  { label: "Book Now", href: "/user/booking", icon: Calendar },
  { label: "My Bookings", href: "/user/booking-status", icon: FileText },
]

const AUTH_COOKIES = [
  "accessToken",
  "sessionId",
  "refreshToken",
  "user",
  "token",
  "auth",
  "session",
  "jwt",
  "authToken",
  "userToken",
  "loginToken",
  "rememberMe",
  "userId",
  "userRole",
  "isLoggedIn",
  "authSession",
  "dashboard-layout-admin",
  "dashboard-layout-user"
]

const clearAllCookies = () => {
  AUTH_COOKIES.forEach((cookieName) => {
    Cookies.remove(cookieName)
    Cookies.remove(cookieName, { path: "/" })

    const domain = window.location.hostname
    Cookies.remove(cookieName, { path: "/", domain })
    Cookies.remove(cookieName, { path: "/", domain: `.${domain}` })
    Cookies.remove(cookieName, { path: "", domain: "" })
  })

  const allCookies = Cookies.get()
  Object.keys(allCookies).forEach((cookieName) => {
    Cookies.remove(cookieName)
    Cookies.remove(cookieName, { path: "/" })

    const domain = window.location.hostname
    Cookies.remove(cookieName, { path: "/", domain })
    Cookies.remove(cookieName, { path: "/", domain: `.${domain}` })
  })

  document.cookie.split(";").forEach((cookie) => {
    const cookieName = cookie.split("=")[0].trim()
    if (cookieName) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`
    }
  })
}

export default function Header() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const pathname = router.pathname
  const user = useSelector((s: RootState) => s.auth.user)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = user?.role === "admin"
  const NAV_LINKS = isAdmin ? ADMIN_NAV_LINKS : USER_NAV_LINKS

  const handleLogout = async () => {
    try {      
      dispatch(logout())
      clearAllCookies()
      
      await new Promise(resolve => setTimeout(resolve, 100))
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/"
    }
  }

  const isActive = (href: string) => {
    if (href === "/" || href === "/user/dashboard" || href === "/admin/dashboard") {
      return pathname === href
    }
    
    if (pathname === href) {
      return true
    }
    return pathname.startsWith(href + '/')
  }

  const getRoleBadgeStyle = () => {
    if (isAdmin) {
      return "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30"
    }
    return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/30"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push(isAdmin ? '/admin/dashboard' : '/user/dashboard')}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isAdmin
              ? "bg-gradient-to-br from-amber-500 to-orange-600"
              : "bg-gradient-to-br from-[#01B4E7] to-[#005DAA]"
            }`}
          >
            {isAdmin ? (
              <Shield className="w-5 h-5 text-white" />
            ) : (
              <span className="text-white font-bold">R</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm">
              {isAdmin ? "Admin" : "Booking"}{" "}
              <span className="text-white/50">{isAdmin ? "Panel" : "Service"}</span>
            </span>
            {isAdmin && (
              <span className="text-[10px] text-amber-400/70 font-medium">
                Management Console
              </span>
            )}
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive(href)
                  ? isAdmin
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-[#01B4E7]/10 text-[#01B4E7]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">

          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeStyle()}`}>
            {isAdmin ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {isAdmin ? "Admin" : "Member"}
          </div>

          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-white">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-white/50">
              {user?.email || ""}
            </p>
          </div>

          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
            isAdmin
              ? "bg-gradient-to-br from-amber-500 to-orange-600"
              : "bg-gradient-to-br from-[#01B4E7] to-[#005DAA]"
            }`}
          >
            <span className="text-white text-sm font-bold">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-white/70 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 px-4 py-3 space-y-1 bg-[#0a0a0f]">
          
          <div className={`flex items-center gap-2 px-4 py-2 mb-2 rounded-lg ${getRoleBadgeStyle()}`}>
            {isAdmin ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            <span className="font-medium">{isAdmin ? "Admin Mode" : "Member Mode"}</span>
          </div>

          {NAV_LINKS.map(({ label, href, icon: Icon }) => (
            <button
              key={href}
              onClick={() => {
                router.push(href)
                setMobileOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive(href)
                  ? isAdmin
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-[#01B4E7]/10 text-[#01B4E7]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}

          <hr className="border-white/10 my-2" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}