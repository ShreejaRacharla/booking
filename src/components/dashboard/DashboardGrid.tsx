'use client'
import { useState, useCallback, useEffect } from 'react'
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
} from 'lucide-react'

interface DashboardData {
  locations: number
  facilities: number
  timeSlots: number
  totalBookings: number
  pendingApprovals: number
  availableSlots: number
  recentBookings: any[]
}

// v2: Layout = readonly LayoutItem[], use a helper to satisfy the readonly constraint
const makeLayout = (items: LayoutItem[]): Layout => items as unknown as Layout

const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: makeLayout([
    { i: 'stats-timeslots', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-locations', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-facilities', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-bookings', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-available', x: 0, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'stats-pending', x: 3, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
    { i: 'recent-bookings', x: 0, y: 4, w: 12, h: 6, minW: 6, minH: 4 },
  ]),
  md: makeLayout([
    { i: 'stats-timeslots', x: 0, y: 0, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-locations', x: 5, y: 0, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-facilities', x: 0, y: 2, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-bookings', x: 5, y: 2, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-available', x: 0, y: 4, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'stats-pending', x: 5, y: 4, w: 5, h: 2, minW: 3, minH: 2 },
    { i: 'recent-bookings', x: 0, y: 6, w: 10, h: 6, minW: 5, minH: 4 },
  ]),
  sm: makeLayout([
    { i: 'stats-timeslots', x: 0, y: 0, w: 3, h: 2 },
    { i: 'stats-locations', x: 3, y: 0, w: 3, h: 2 },
    { i: 'stats-facilities', x: 0, y: 2, w: 3, h: 2 },
    { i: 'stats-bookings', x: 3, y: 2, w: 3, h: 2 },
    { i: 'stats-available', x: 0, y: 4, w: 3, h: 2 },
    { i: 'stats-pending', x: 3, y: 4, w: 3, h: 2 },
    { i: 'recent-bookings', x: 0, y: 6, w: 6, h: 6 },
  ]),
  xs: makeLayout([
    { i: 'stats-timeslots', x: 0, y: 0, w: 4, h: 2 },
    { i: 'stats-locations', x: 0, y: 2, w: 4, h: 2 },
    { i: 'stats-facilities', x: 0, y: 4, w: 4, h: 2 },
    { i: 'stats-bookings', x: 0, y: 6, w: 4, h: 2 },
    { i: 'stats-available', x: 0, y: 8, w: 4, h: 2 },
    { i: 'stats-pending', x: 0, y: 10, w: 4, h: 2 },
    { i: 'recent-bookings', x: 0, y: 12, w: 4, h: 6 },
  ]),
}

const STAT_COLORS = {
  timeslots: { bg: 'bg-[#01B4E7]', text: 'text-[#01B4E7]', icon: Clock },
  locations: { bg: 'bg-[#005DAA]', text: 'text-[#005DAA]', icon: MapPin },
  facilities: { bg: 'bg-[#F7A81B]', text: 'text-[#F7A81B]', icon: Building2 },
  bookings: { bg: 'bg-[#00246C]', text: 'text-[#00246C]', icon: CalendarDays },
  available: { bg: 'bg-emerald-500', text: 'text-emerald-500', icon: CheckCircle2 },
  pending: { bg: 'bg-amber-500', text: 'text-amber-500', icon: AlertCircle },
}

function StatCard({
  label,
  value,
  delta,
  colorKey,
}: {
  label: string
  value: number
  delta?: string
  colorKey: keyof typeof STAT_COLORS
}) {
  const { bg, text, icon: Icon } = STAT_COLORS[colorKey]

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

function RecentBookingsTile({ bookings }: { bookings: any[] }) {
  const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
    PAID: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }

  return (
    <div className="tile h-full flex flex-col p-5 gap-4 overflow-hidden">
      <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/50">
        Recent Bookings
      </h2>
      <div className="overflow-auto flex-1 space-y-2 pr-1">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-foreground/30">
            <CalendarDays className="w-12 h-12 mb-2" />
            <p className="text-sm">No bookings yet</p>
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
                    {b.id} — {b.userName || 'Unknown User'}
                  </p>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    {bookingDate} · {slotsCount} slot(s) · ₹{totalAmount}
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${
                    STATUS_STYLES[b.status] || STATUS_STYLES.PENDING
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

export default function DashboardGrid({ initialData }: { initialData: DashboardData }) {
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(DEFAULT_LAYOUTS)
  const [isDragging, setIsDragging] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Exact v2 signature from ResponsiveGridLayoutProps:
  // onLayoutChange?: (layout: Layout, layouts: ResponsiveLayouts) => void
  const handleLayoutChange = useCallback(
    (_layout: Layout, allLayouts: ResponsiveLayouts) => {
      setLayouts(allLayouts)
    },
    []
  )

  if (!isMounted) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#01B4E7]/20 border-t-[#01B4E7] animate-spin" />
      </div>
    )
  }

  const TILES: Record<string, React.ReactNode> = {
    'stats-timeslots': (
      <StatCard
        label="Time Slots"
        value={initialData.timeSlots}
        delta="↑ 12% this month"
        colorKey="timeslots"
      />
    ),
    'stats-locations': (
      <StatCard
        label="Locations"
        value={initialData.locations}
        delta="2 active clubs"
        colorKey="locations"
      />
    ),
    'stats-facilities': (
      <StatCard
        label="Facilities"
        value={initialData.facilities}
        delta="All operational"
        colorKey="facilities"
      />
    ),
    'stats-bookings': (
      <StatCard
        label="Total Bookings"
        value={initialData.totalBookings}
        delta="↑ 8% from last week"
        colorKey="bookings"
      />
    ),
    'stats-available': (
      <StatCard
        label="Available Slots"
        value={initialData.availableSlots}
        delta="Ready to book"
        colorKey="available"
      />
    ),
    'stats-pending': (
      <StatCard
        label="Pending Approvals"
        value={initialData.pendingApprovals}
        delta="Requires action"
        colorKey="pending"
      />
    ),
    'recent-bookings': <RecentBookingsTile bookings={initialData.recentBookings} />,
  }

  return (
    <div className="select-none w-full">
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
            className={`group relative rounded-2xl overflow-hidden transition-shadow duration-200 ${
              isDragging ? 'shadow-none' : 'shadow-lg shadow-black/20'
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