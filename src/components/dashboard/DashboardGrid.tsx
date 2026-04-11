import { useState, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
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
  CheckCircle2, AlertCircle, TrendingUp,
  Users, DollarSign, FileText, Shield,
  Calendar, CreditCard, History
} from 'lucide-react'
import PageHeader from '../layout/PageHeader'

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

const ADMIN_LAYOUTS: ResponsiveLayouts = {
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

const USER_LAYOUTS: ResponsiveLayouts = {
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

const ADMIN_STAT_COLORS = {
  timeslots: { bg: 'bg-[#01B4E7]', text: 'text-[#01B4E7]', icon: Clock },
  locations: { bg: 'bg-[#005DAA]', text: 'text-[#005DAA]', icon: MapPin },
  facilities: { bg: 'bg-[#F7A81B]', text: 'text-[#F7A81B]', icon: Building2 },
  bookings: { bg: 'bg-[#00246C]', text: 'text-[#00246C]', icon: CalendarDays },
  available: { bg: 'bg-emerald-500', text: 'text-emerald-500', icon: CheckCircle2 },
  pending: { bg: 'bg-amber-500', text: 'text-amber-500', icon: AlertCircle },
  users: { bg: 'bg-purple-500', text: 'text-purple-500', icon: Users },
  revenue: { bg: 'bg-green-500', text: 'text-green-500', icon: DollarSign },
}

const USER_STAT_COLORS = {
  myBookings: { bg: 'bg-[#01B4E7]', text: 'text-[#01B4E7]', icon: Calendar },
  pending: { bg: 'bg-amber-500', text: 'text-amber-500', icon: Clock },
  approved: { bg: 'bg-emerald-500', text: 'text-emerald-500', icon: CheckCircle2 },
  spent: { bg: 'bg-purple-500', text: 'text-purple-500', icon: CreditCard },
}

function StatCard({
  label,
  value,
  delta,
  colorKey,
  isAdmin = true,
}: {
  label: string
  value: number | string
  delta?: string
  colorKey: string
  isAdmin?: boolean
}) {
  const colors = isAdmin ? ADMIN_STAT_COLORS : USER_STAT_COLORS
  const colorConfig = colors[colorKey as keyof typeof colors] || { bg: 'bg-gray-500', text: 'text-gray-500', icon: FileText }
  const { bg, text, icon: Icon } = colorConfig

  return (
    <div className="tile h-full flex flex-col justify-between p-5 gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
          {label}
        </p>
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div>
        <p className="text-4xl font-extrabold text-foreground">{value}</p>
        {delta && (
          <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${text}`}>
            <TrendingUp className="w-3 h-3" />
            {delta}
          </p>
        )}
      </div>
    </div>
  )
}

function RecentBookingsTile({ bookings, isAdmin }: { bookings: any[], isAdmin: boolean }) {
  const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
    PAID: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    CANCELLED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  }

  return (
    <div className="tile h-full flex flex-col p-5 gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/50">
          {isAdmin ? 'Recent Bookings' : 'Upcoming Bookings'}
        </h2>
        {isAdmin && (
          <span className="text-xs text-foreground/30 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Admin View
          </span>
        )}
      </div>
      <div className="overflow-auto flex-1 space-y-2 pr-1">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-foreground/30">
            <CalendarDays className="w-12 h-12 mb-2" />
            <p className="text-sm">{isAdmin ? 'No bookings yet' : 'No upcoming bookings'}</p>
          </div>
        ) : (
          bookings.map((b) => {
            const slotsCount = Array.isArray(b.slots) ? b.slots.length : 0
            const totalAmount = b.totalAmount || 0
            const bookingDate = b.date || 'N/A'

            return (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors border border-border/30 gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {isAdmin ? `${b.id} — ${b.userName || 'Unknown User'}` : b.facilityName || 'Facility'}
                  </p>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    {bookingDate} · {slotsCount} slot(s) · ₹{totalAmount}
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${STATUS_STYLES[b.status] || STATUS_STYLES.PENDING
                    }`}
                >
                  {b.status}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function QuickActionsTile({ onAction }: { onAction: (action: string) => void }) {
  const actions = [
    { label: 'Book Now', icon: Calendar, action: 'book', color: 'bg-[#01B4E7] hover:bg-[#01B4E7]/90' },
    { label: 'View History', icon: History, action: 'history', color: 'bg-[#005DAA] hover:bg-[#005DAA]/90' },
    // { label: 'Make Payment', icon: CreditCard, action: 'payment', color: 'bg-emerald-500 hover:bg-emerald-500/90' },
  ]

  return (
    <div className="tile h-full flex flex-col p-5 gap-4">
      <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/50">
        Quick Actions
      </h2>
      <div className="flex flex-col gap-3 flex-1 justify-center">
        {actions.map(({ label, icon: Icon, action, color }) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white font-medium transition-all ${color}`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function DashboardGrid({ initialData }: { initialData: DashboardData }) {
  const user = useSelector((s: RootState) => s.auth.user)
  const isAdmin = user?.role === 'admin'

  const [layouts, setLayouts] = useState<ResponsiveLayouts>(isAdmin ? ADMIN_LAYOUTS : USER_LAYOUTS)
  const [isDragging, setIsDragging] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setLayouts(isAdmin ? ADMIN_LAYOUTS : USER_LAYOUTS)
  }, [isAdmin])

  const handleLayoutChange = useCallback(
    (_layout: Layout, allLayouts: ResponsiveLayouts) => {
      setLayouts(allLayouts)
    },
    []
  )

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action)
    switch (action) {
      case 'book':
        window.location.href = '/user/booking'
        break
      case 'history':
        window.location.href = '/user/booking-status'
        break
      // case 'payment':
      //   window.location.href = '/user/payment'
      //   break
    }
  }

  if (!isMounted) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#01B4E7]/20 border-t-[#01B4E7] animate-spin" />
      </div>
    )
  }

  const ADMIN_TILES: Record<string, React.ReactNode> = {
    'stats-timeslots': (
      <StatCard
        label="Time Slots"
        value={initialData.timeSlots}
        delta="↑ 12% this month"
        colorKey="timeslots"
        isAdmin={true}
      />
    ),
    'stats-locations': (
      <StatCard
        label="Locations"
        value={initialData.locations}
        delta="2 active clubs"
        colorKey="locations"
        isAdmin={true}
      />
    ),
    'stats-facilities': (
      <StatCard
        label="Facilities"
        value={initialData.facilities}
        delta="All operational"
        colorKey="facilities"
        isAdmin={true}
      />
    ),
    'stats-bookings': (
      <StatCard
        label="Total Bookings"
        value={initialData.totalBookings}
        delta="↑ 8% from last week"
        colorKey="bookings"
        isAdmin={true}
      />
    ),
    'stats-available': (
      <StatCard
        label="Available Slots"
        value={initialData.availableSlots}
        delta="Ready to book"
        colorKey="available"
        isAdmin={true}
      />
    ),
    'stats-pending': (
      <StatCard
        label="Pending Approvals"
        value={initialData.pendingApprovals}
        delta="Requires action"
        colorKey="pending"
        isAdmin={true}
      />
    ),
    'stats-users': (
      <StatCard
        label="Total Users"
        value={initialData.totalUsers || 0}
        delta="Active members"
        colorKey="users"
        isAdmin={true}
      />
    ),
    'stats-revenue': (
      <StatCard
        label="Total Revenue"
        value={`₹${initialData.totalRevenue || 0}`}
        delta="↑ 15% this month"
        colorKey="revenue"
        isAdmin={true}
      />
    ),
    'recent-bookings': <RecentBookingsTile bookings={initialData.recentBookings} isAdmin={true} />,
  }

  const USER_TILES: Record<string, React.ReactNode> = {
    'user-my-bookings': (
      <StatCard
        label="My Bookings"
        value={initialData.myBookings || 0}
        delta="Total bookings made"
        colorKey="myBookings"
        isAdmin={false}
      />
    ),
    'user-pending': (
      <StatCard
        label="Pending"
        value={initialData.myPendingBookings || 0}
        delta="Awaiting approval"
        colorKey="pending"
        isAdmin={false}
      />
    ),
    'user-approved': (
      <StatCard
        label="Approved"
        value={initialData.myApprovedBookings || 0}
        delta="Ready to use"
        colorKey="approved"
        isAdmin={false}
      />
    ),
    'user-spent': (
      <StatCard
        label="Total Spent"
        value={`₹${initialData.myTotalSpent || 0}`}
        delta="This year"
        colorKey="spent"
        isAdmin={false}
      />
    ),
    'upcoming-bookings': <RecentBookingsTile bookings={initialData.upcomingBookings || []} isAdmin={false} />,
    'quick-actions': <QuickActionsTile onAction={handleQuickAction} />,
  }

  const TILES = isAdmin ? ADMIN_TILES : USER_TILES

  return (
    <div className="select-none w-full p-4">
      <PageHeader
        title={isAdmin ? "Admin Dashboard" : "My Dashboard"}
        subtitle={isAdmin ? "Manage bookings, facilities and users" : `Welcome back, ${user?.name || 'User'}!`}
      />

      <div className={`mb-4 px-4 py-2 rounded-lg flex items-center gap-2 ${isAdmin
          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20'
          : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-cyan-500/20'
        }`}>
        {isAdmin ? (
          <>
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">Admin</span>
            {/* <span className="text-xs text-foreground/50 ml-2">You have full access to all features</span> */}
          </>
        ) : (
          <>
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">Member</span>
            {/* <span className="text-xs text-foreground/50 ml-2">View and manage your bookings</span> */}
          </>
        )}
      </div>

      <ResponsiveGridLayout
        className="layout"
        width={1200}
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={60}
        margin={[16, 16] as [number, number]}
        containerPadding={[0, 0] as [number, number]}
        onLayoutChange={handleLayoutChange}
        onDragStart={() => setIsDragging(true)}
        onDragStop={() => setIsDragging(false)}
      >
        {Object.entries(TILES).map(([key, node]) => (
          <div
            key={key}
            className={`group relative rounded-2xl overflow-hidden transition-shadow duration-200 ${isDragging ? 'shadow-none' : 'shadow-lg shadow-black/20'
              }`}
          >
            <div className="drag-handle absolute top-0 left-0 right-0 h-7 z-10 cursor-grab active:cursor-grabbing flex items-center px-3 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/30 to-transparent rounded-t-2xl">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="w-1 h-1 rounded-full bg-white/60" />
              ))}
            </div>
            {node}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  )
}