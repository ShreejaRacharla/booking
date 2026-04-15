import { useState, useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { useRouter } from 'next/router'
import {
  ResponsiveGridLayout,
  Layout,
  LayoutItem,
  ResponsiveLayouts,
} from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
  Clock, MapPin, Building2, CalendarDays,
  CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  Users, DollarSign, FileText, Shield,
  Calendar, CreditCard, History, GripVertical,
  RefreshCw
} from 'lucide-react'
import PageHeader from '../layout/PageHeader'
import Loader from '../loader'
import Cookies from 'js-cookie'

interface DashboardData {
  locations: number
  facilities: number
  timeSlots: number
  totalBookings: number
  pendingApprovals: number
  availableSlots: number
  totalUsers: number
  totalRevenue: number
  recentBookings: any[]
  myBookings: number
  myPendingBookings: number
  myApprovedBookings: number
  myTotalSpent: number
  upcomingBookings: any[]
}

const makeLayout = (items: LayoutItem[]): Layout => items as unknown as Layout

const ADMIN_DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: makeLayout([
    { i: 'stats-timeslots', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-locations', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-facilities', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-bookings', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-available', x: 0, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-pending', x: 3, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-users', x: 6, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-revenue', x: 9, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'recent-bookings', x: 0, y: 4, w: 12, h: 6, minW: 6, minH: 4 },
  ]),
  md: makeLayout([
    { i: 'stats-timeslots', x: 0, y: 0, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-locations', x: 5, y: 0, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-facilities', x: 0, y: 2, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-bookings', x: 5, y: 2, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-available', x: 0, y: 4, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-pending', x: 5, y: 4, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-users', x: 0, y: 6, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-revenue', x: 5, y: 6, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'recent-bookings', x: 0, y: 8, w: 10, h: 6, minW: 5, minH: 4 },
  ]),
  sm: makeLayout([
    { i: 'stats-timeslots', x: 0, y: 0, w: 3, h: 2 },
    { i: 'stats-locations', x: 3, y: 0, w: 3, h: 2 },
    { i: 'stats-facilities', x: 0, y: 2, w: 3, h: 2 },
    { i: 'stats-bookings', x: 3, y: 2, w: 3, h: 2 },
    { i: 'stats-available', x: 0, y: 4, w: 3, h: 2 },
    { i: 'stats-pending', x: 3, y: 4, w: 3, h: 2 },
    { i: 'stats-users', x: 0, y: 6, w: 3, h: 2 },
    { i: 'stats-revenue', x: 3, y: 6, w: 3, h: 2 },
    { i: 'recent-bookings', x: 0, y: 8, w: 6, h: 6 },
  ]),
  xs: makeLayout([
    { i: 'stats-timeslots', x: 0, y: 0, w: 4, h: 2 },
    { i: 'stats-locations', x: 0, y: 2, w: 4, h: 2 },
    { i: 'stats-facilities', x: 0, y: 4, w: 4, h: 2 },
    { i: 'stats-bookings', x: 0, y: 6, w: 4, h: 2 },
    { i: 'stats-available', x: 0, y: 8, w: 4, h: 2 },
    { i: 'stats-pending', x: 0, y: 10, w: 4, h: 2 },
    { i: 'stats-users', x: 0, y: 12, w: 4, h: 2 },
    { i: 'stats-revenue', x: 0, y: 14, w: 4, h: 2 },
    { i: 'recent-bookings', x: 0, y: 16, w: 4, h: 6 },
  ]),
}

const USER_DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: makeLayout([
    { i: 'user-my-bookings', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'user-pending', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'user-approved', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'user-spent', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'upcoming-bookings', x: 0, y: 2, w: 8, h: 6, minW: 6, minH: 4 },
    { i: 'quick-actions', x: 8, y: 2, w: 4, h: 6, minW: 3, minH: 4 },
  ]),
  md: makeLayout([
    { i: 'user-my-bookings', x: 0, y: 0, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'user-pending', x: 5, y: 0, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'user-approved', x: 0, y: 2, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'user-spent', x: 5, y: 2, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'upcoming-bookings', x: 0, y: 4, w: 10, h: 6, minW: 5, minH: 4 },
    { i: 'quick-actions', x: 0, y: 10, w: 10, h: 4, minW: 5, minH: 3 },
  ]),
  sm: makeLayout([
    { i: 'user-my-bookings', x: 0, y: 0, w: 3, h: 2 },
    { i: 'user-pending', x: 3, y: 0, w: 3, h: 2 },
    { i: 'user-approved', x: 0, y: 2, w: 3, h: 2 },
    { i: 'user-spent', x: 3, y: 2, w: 3, h: 2 },
    { i: 'upcoming-bookings', x: 0, y: 4, w: 6, h: 6 },
    { i: 'quick-actions', x: 0, y: 10, w: 6, h: 4 },
  ]),
  xs: makeLayout([
    { i: 'user-my-bookings', x: 0, y: 0, w: 4, h: 2 },
    { i: 'user-pending', x: 0, y: 2, w: 4, h: 2 },
    { i: 'user-approved', x: 0, y: 4, w: 4, h: 2 },
    { i: 'user-spent', x: 0, y: 6, w: 4, h: 2 },
    { i: 'upcoming-bookings', x: 0, y: 8, w: 4, h: 6 },
    { i: 'quick-actions', x: 0, y: 14, w: 4, h: 4 },
  ]),
}

interface StatConfig {
  bg: string
  text: string
  lightBg: string
  icon: React.ComponentType<{ className?: string }>
}

const ADMIN_STAT_COLORS: Record<string, StatConfig> = {
  timeslots: { bg: 'bg-sky-500', text: 'text-sky-500', lightBg: 'bg-sky-500/10', icon: Clock },
  locations: { bg: 'bg-blue-600', text: 'text-blue-500', lightBg: 'bg-blue-500/10', icon: MapPin },
  facilities: { bg: 'bg-amber-500', text: 'text-amber-500', lightBg: 'bg-amber-500/10', icon: Building2 },
  bookings: { bg: 'bg-indigo-600', text: 'text-indigo-500', lightBg: 'bg-indigo-500/10', icon: CalendarDays },
  available: { bg: 'bg-emerald-500', text: 'text-emerald-500', lightBg: 'bg-emerald-500/10', icon: CheckCircle2 },
  pending: { bg: 'bg-orange-500', text: 'text-orange-500', lightBg: 'bg-orange-500/10', icon: AlertCircle },
  users: { bg: 'bg-violet-500', text: 'text-violet-500', lightBg: 'bg-violet-500/10', icon: Users },
  revenue: { bg: 'bg-teal-500', text: 'text-teal-500', lightBg: 'bg-teal-500/10', icon: DollarSign },
}

const USER_STAT_COLORS: Record<string, StatConfig> = {
  myBookings: { bg: 'bg-sky-500', text: 'text-sky-500', lightBg: 'bg-sky-500/10', icon: Calendar },
  pending: { bg: 'bg-orange-500', text: 'text-orange-500', lightBg: 'bg-orange-500/10', icon: Clock },
  approved: { bg: 'bg-emerald-500', text: 'text-emerald-500', lightBg: 'bg-emerald-500/10', icon: CheckCircle2 },
  spent: { bg: 'bg-violet-500', text: 'text-violet-500', lightBg: 'bg-violet-500/10', icon: CreditCard },
}

function StatCard({
  label,
  value,
  delta,
  deltaPositive,
  colorKey,
  isAdmin = true,
}: {
  label: string
  value: number | string
  delta?: string
  deltaPositive?: boolean
  colorKey: string
  isAdmin?: boolean
}) {
  const colors = isAdmin ? ADMIN_STAT_COLORS : USER_STAT_COLORS
  const cfg = colors[colorKey as keyof typeof colors] ?? {
    bg: 'bg-slate-500', text: 'text-slate-500', lightBg: 'bg-slate-500/10', icon: FileText,
  }
  const { bg, text, lightBg, icon: Icon } = cfg
  const isPositive = deltaPositive ?? true

  return (
    <div className="h-full flex flex-col justify-between p-5 gap-2 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground leading-tight">
          {label}
        </span>
        <div className={`shrink-0 w-9 h-9 rounded-xl ${lightBg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${text}`} />
        </div>
      </div>

      <p className="text-[2.2rem] font-bold leading-none tracking-tight text-foreground tabular-nums">
        {value}
      </p>

      {delta && (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${isPositive ? 'text-emerald-500' : 'text-orange-500'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3 shrink-0" /> : <TrendingDown className="w-3 h-3 shrink-0" />}
          <span>{delta}</span>
        </div>
      )}
    </div>
  )
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-500/12 text-slate-500 border-slate-500/25',
  PENDING: 'bg-amber-500/12 text-amber-500 border-amber-500/25',
  PENDING_APPROVAL: 'bg-amber-500/12 text-amber-500 border-amber-500/25',
  APPROVED: 'bg-emerald-500/12 text-emerald-500 border-emerald-500/25',
  APPROVED_PENDING_PAYMENT: 'bg-blue-500/12 text-blue-500 border-blue-500/25',
  CONFIRMED_FULL: 'bg-emerald-500/12 text-emerald-500 border-emerald-500/25',
  REJECTED: 'bg-red-500/12 text-red-500 border-red-500/25',
  PAID: 'bg-sky-500/12 text-sky-500 border-sky-500/25',
  CANCELLED: 'bg-slate-500/12 text-slate-400 border-slate-500/25',
}

function BookingsTile({ bookings, isAdmin }: { bookings: any[]; isAdmin: boolean }) {
  return (
    <div className="h-full flex flex-col gap-3 bg-card rounded-2xl border border-border/50 shadow-sm p-5 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {isAdmin ? 'Recent Bookings' : 'My Bookings'}
        </h3>
        {isAdmin && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <Shield className="w-3 h-3" /> Admin
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto space-y-2 pr-0.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {bookings.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/40 py-8">
            <CalendarDays className="w-10 h-10" />
            <p className="text-sm">{isAdmin ? 'No bookings yet' : 'No upcoming bookings'}</p>
          </div>
        ) : (
          bookings.map((b) => {
            const statusStyle = STATUS_BADGE[b.status] ?? STATUS_BADGE.PENDING

            return (
              <div
                key={b.id}
                className="group flex flex-col gap-2 px-4 py-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all border border-transparent hover:border-border/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate leading-tight">
                      {b.facilityName || 'Unknown Facility'}
                    </p>
                    {isAdmin && b.userName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        👤 {b.userName}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${statusStyle}`}>
                    {b.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span className="font-medium">{b.date || 'N/A'}</span>
                  </div>

                  {b.timeRanges && b.timeRanges !== 'N/A' && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="font-medium">{b.timeRanges}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded">
                    <span className="font-semibold text-foreground">{b.slotCount || 0}</span>
                    <span>slot{b.slotCount !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    <DollarSign className="w-3 h-3 shrink-0" />
                    <span className="font-bold text-foreground">
                      ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {b.bookingCode && (
                  <div className="text-[10px] text-muted-foreground/60 font-mono">
                    #{b.bookingCode}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function QuickActionsTile({ onAction }: { onAction: (a: string) => void }) {
  const actions = [
    {
      label: 'Book a Slot',
      description: 'Reserve a facility',
      icon: Calendar,
      action: 'book',
      className: 'bg-sky-500 hover:bg-sky-600 text-white',
    },
    {
      label: 'View History',
      description: 'Past bookings',
      icon: History,
      action: 'history',
      className: 'bg-muted hover:bg-muted/80 text-foreground border border-border/50',
    },
  ]

  return (
    <div className="h-full flex flex-col gap-3 bg-card rounded-2xl border border-border/50 shadow-sm p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground shrink-0">
        Quick Actions
      </h3>
      <div className="flex flex-col gap-2.5 flex-1 justify-center">
        {actions.map(({ label, description, icon: Icon, action, className }) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all active:scale-[0.98] ${className}`}
          >
            <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-semibold text-sm leading-tight">{label}</p>
              <p className="text-[11px] opacity-70 mt-0.5">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

const STORAGE_KEY_PREFIX = 'dashboard-layout'

function getStorageKey(role: string) {
  return `${STORAGE_KEY_PREFIX}-${role}`
}

function loadSavedLayout(role: string): ResponsiveLayouts | null {
  try {
    if (typeof window === 'undefined') return null
    const cookieData = Cookies.get(getStorageKey(role))
    if (cookieData) {
      return JSON.parse(cookieData) as ResponsiveLayouts
    }
  } catch (err) {
    console.warn('Could not load dashboard layout from cookies:', err)
  }
  return null
}

function saveLayout(role: string, layouts: ResponsiveLayouts) {
  try {
    if (typeof window === 'undefined') return
    Cookies.set(getStorageKey(role), JSON.stringify(layouts), { 
      expires: 1,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    })
  } catch (err) {
    console.warn('Could not persist dashboard layout to cookies:', err)
  }
}

function clearSavedLayout(role: string) {
  try {
    if (typeof window === 'undefined') return
    Cookies.remove(getStorageKey(role))
  } catch (err) {
    console.warn('Could not clear dashboard layout from cookies:', err)
  }
}

export default function DashboardGrid({ initialData }: { initialData: DashboardData }) {
  const router = useRouter()
  const user = useSelector((s: RootState) => s.auth.user)
  
  const [authLoaded, setAuthLoaded] = useState(false)
  
  const isAdmin = user?.role === 'admin'
  const role = isAdmin ? 'admin' : 'user'

  const defaultLayouts = isAdmin ? ADMIN_DEFAULT_LAYOUTS : USER_DEFAULT_LAYOUTS

  const [layouts, setLayouts] = useState<ResponsiveLayouts>(defaultLayouts)
  const [isDragging, setIsDragging] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [layoutLoaded, setLayoutLoaded] = useState(false)
  const [containerWidth, setContainerWidth] = useState(1200)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setAuthLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    ro.observe(el)
    setContainerWidth(el.offsetWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    setIsMounted(true)
    const saved = loadSavedLayout(role)
    if (saved) setLayouts(saved)
    setLayoutLoaded(true)
  }, [role]) 

  useEffect(() => {
    setLayoutLoaded(false)
    const saved = loadSavedLayout(role)
    setLayouts(saved ?? defaultLayouts)
    setLayoutLoaded(true)
  }, [role, defaultLayouts]) 

  const handleLayoutChange = useCallback(
    (_layout: Layout, allLayouts: ResponsiveLayouts) => {
      setLayouts(allLayouts)
      saveLayout(role, allLayouts)
    },
    [role]
  )

  const resetLayout = useCallback(() => {
    clearSavedLayout(role)
    setLayouts(defaultLayouts)
  }, [role, defaultLayouts])

  const handleQuickAction = (action: string) => {
    if (action === 'book') router.push('/user/booking')
    if (action === 'history') router.push('/user/booking-status')
  }

  if (!isMounted || !layoutLoaded || !authLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  const ADMIN_TILES: Record<string, React.ReactNode> = {
    'stats-timeslots': (
      <StatCard label="Time Slots" value={initialData.timeSlots || 0} delta="12% this month" colorKey="timeslots" isAdmin />
    ),
    'stats-locations': (
      <StatCard label="Locations" value={initialData.locations || 0} delta="Active locations" colorKey="locations" isAdmin />
    ),
    'stats-facilities': (
      <StatCard label="Facilities" value={initialData.facilities || 0} delta="All operational" deltaPositive={true} colorKey="facilities" isAdmin />
    ),
    'stats-bookings': (
      <StatCard label="Total Bookings" value={initialData.totalBookings || 0} delta="All time" colorKey="bookings" isAdmin />
    ),
    'stats-available': (
      <StatCard label="Available Slots" value={initialData.availableSlots || 0} delta="Ready to book" colorKey="available" isAdmin />
    ),
    'stats-pending': (
      <StatCard label="Pending Approvals" value={initialData.pendingApprovals || 0} delta="Requires action" deltaPositive={false} colorKey="pending" isAdmin />
    ),
    'stats-users': (
      <StatCard label="Total Users" value={initialData.totalUsers || 0} delta="Active members" colorKey="users" isAdmin />
    ),
    'stats-revenue': (
      <StatCard label="Total Revenue" value={`₹${(initialData.totalRevenue || 0).toLocaleString('en-IN')}`} delta="All time" colorKey="revenue" isAdmin />
    ),
    'recent-bookings': <BookingsTile bookings={initialData.recentBookings || []} isAdmin={true} />,
  }

  const USER_TILES: Record<string, React.ReactNode> = {
    'user-my-bookings': (
      <StatCard label="My Bookings" value={initialData.myBookings || 0} delta="Total bookings" colorKey="myBookings" isAdmin={false} />
    ),
    'user-pending': (
      <StatCard label="Pending" value={initialData.myPendingBookings || 0} delta="Awaiting approval" deltaPositive={false} colorKey="pending" isAdmin={false} />
    ),
    'user-approved': (
      <StatCard label="Approved" value={initialData.myApprovedBookings || 0} delta="Ready to use" colorKey="approved" isAdmin={false} />
    ),
    'user-spent': (
      <StatCard label="Total Spent" value={`₹${(initialData.myTotalSpent || 0).toLocaleString('en-IN')}`} delta="This year" colorKey="spent" isAdmin={false} />
    ),
    'upcoming-bookings': <BookingsTile bookings={initialData.upcomingBookings || []} isAdmin={false} />,
    'quick-actions': <QuickActionsTile onAction={handleQuickAction} />,
  }

  const TILES = isAdmin ? ADMIN_TILES : USER_TILES

  return (
    <div className="select-none w-full pb-6">
      <div className="px-4 pt-2 pb-1">
        <PageHeader
          title={isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
          subtitle={
            isAdmin
              ? 'Manage bookings, facilities and users'
              : `Welcome back, ${user?.name || 'User'}!`
          }
        />
      </div>

      <div className="mx-4 mb-4 flex items-center justify-between gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${isAdmin
            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
            : 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
            }`}
        >
          {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
          {isAdmin ? 'Admin View' : 'Member View'}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
            <GripVertical className="w-3 h-3" /> Drag tiles to rearrange
          </span>
          <button
            onClick={resetLayout}
            title="Reset to default layout"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      <div className="px-4" ref={containerRef}>
        <ResponsiveGridLayout
          className="layout"
          width={containerWidth}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          rowHeight={62}
          margin={[12, 12]}
          containerPadding={[0, 0]}
          onLayoutChange={handleLayoutChange}
          onDragStart={() => setIsDragging(true)}
          onDragStop={() => setIsDragging(false)}
        >
          {Object.entries(TILES).map(([key, node]) => (
            <div
              key={key}
              className={`group relative rounded-2xl overflow-hidden transition-all duration-150 ${isDragging ? 'opacity-90 scale-[0.99]' : ''
                }`}
            >
              <div className="drag-handle absolute top-0 left-0 right-0 h-8 z-20 cursor-grab active:cursor-grabbing flex items-center px-3 gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/20 to-transparent rounded-t-2xl">
                <GripVertical className="w-3.5 h-3.5 text-white/70" />
                <div className="flex gap-0.5 ml-auto">
                  {[...Array(3)].map((_, i) => (
                    <span key={i} className="w-1 h-1 rounded-full bg-white/50" />
                  ))}
                </div>
              </div>
              {node}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}