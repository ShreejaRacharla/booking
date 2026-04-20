import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { useRouter } from 'next/router'
import {
  Clock, MapPin, Building2, CalendarDays,
  CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  Users, DollarSign, Shield, Calendar, CreditCard,
  History, Plus, Eye
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

interface StatConfig {
  bg: string
  text: string
  lightBg: string
  icon: React.ComponentType<{ className?: string }>
}

const ADMIN_STAT_COLORS: Record<string, StatConfig> = {
  timeslots: { bg: 'bg-sky-500', text: 'text-sky-600', lightBg: 'bg-sky-50', icon: Clock },
  locations: { bg: 'bg-blue-600', text: 'text-blue-600', lightBg: 'bg-blue-50', icon: MapPin },
  facilities: { bg: 'bg-amber-500', text: 'text-amber-600', lightBg: 'bg-amber-50', icon: Building2 },
  bookings: { bg: 'bg-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-50', icon: CalendarDays },
  available: { bg: 'bg-emerald-500', text: 'text-emerald-600', lightBg: 'bg-emerald-50', icon: CheckCircle2 },
  pending: { bg: 'bg-orange-500', text: 'text-orange-600', lightBg: 'bg-orange-50', icon: AlertCircle },
  users: { bg: 'bg-violet-500', text: 'text-violet-600', lightBg: 'bg-violet-50', icon: Users },
  revenue: { bg: 'bg-teal-500', text: 'text-teal-600', lightBg: 'bg-teal-50', icon: DollarSign },
}

const USER_STAT_COLORS: Record<string, StatConfig> = {
  myBookings: { bg: 'bg-sky-500', text: 'text-sky-600', lightBg: 'bg-sky-50', icon: Calendar },
  pending: { bg: 'bg-orange-500', text: 'text-orange-600', lightBg: 'bg-orange-50', icon: Clock },
  approved: { bg: 'bg-emerald-500', text: 'text-emerald-600', lightBg: 'bg-emerald-50', icon: CheckCircle2 },
  spent: { bg: 'bg-violet-500', text: 'text-violet-600', lightBg: 'bg-violet-50', icon: CreditCard },
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
    bg: 'bg-slate-500', text: 'text-slate-600', lightBg: 'bg-slate-50', icon: CalendarDays,
  }
  const { text, lightBg, icon: Icon } = cfg
  const isPositive = deltaPositive ?? true

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${lightBg}`}>
          <Icon className={`w-6 h-6 ${text}`} />
        </div>
        {delta && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{delta}</span>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
      </div>
    </div>
  )
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  APPROVED_PENDING_PAYMENT: 'bg-blue-50 text-blue-700 border-blue-200',
  CONFIRMED_FULL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  PAID: 'bg-sky-50 text-sky-700 border-sky-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
}

function BookingsTile({ bookings, isAdmin, title }: { bookings: any[]; isAdmin: boolean; title: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {isAdmin && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              <Shield className="w-3.5 h-3.5" /> Admin View
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CalendarDays className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No bookings yet</p>
            </div>
          ) : (
            bookings.map((b) => {
              const statusStyle = STATUS_BADGE[b.status] ?? STATUS_BADGE.PENDING

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate mb-1">
                        {b.facilityName || 'Unknown Facility'}
                      </p>
                      {isAdmin && b.userName && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {b.userName}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${statusStyle}`}>
                      {b.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium">{b.date || 'N/A'}</span>
                    </div>

                    {b.timeRanges && b.timeRanges !== 'N/A' && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-medium">{b.timeRanges}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                      <span className="font-semibold text-gray-900">{b.slotCount || 0}</span>
                      <span>slot{b.slotCount !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto font-semibold text-gray-900">
                      <DollarSign className="w-3.5 h-3.5" />
                      ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  {b.bookingCode && (
                    <div className="mt-2 text-xs text-gray-400 font-mono">
                      #{b.bookingCode}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function QuickActionsTile({ onAction }: { onAction: (a: string) => void }) {
  const actions = [
    {
      label: 'New Booking',
      description: 'Reserve a facility slot',
      icon: Plus,
      action: 'book',
      className: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg shadow-sky-500/30',
    },
    {
      label: 'View History',
      description: 'See all past bookings',
      icon: History,
      action: 'history',
      className: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200',
    },
    {
      label: 'Booking Status',
      description: 'Track your requests',
      icon: Eye,
      action: 'status',
      className: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200',
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>
      
      <div className="p-6 space-y-3">
        {actions.map(({ label, description, icon: Icon, action, className }) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98] ${className}`}
          >
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-semibold text-sm leading-tight">{label}</p>
              <p className="text-xs opacity-80 mt-0.5">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function DashboardGrid({ initialData }: { initialData: DashboardData }) {
  const router = useRouter()
  const user = useSelector((s: RootState) => s.auth.user)
  const isAdmin = user?.role === 'admin'

  const handleQuickAction = (action: string) => {
    if (action === 'book') router.push('/user/booking')
    if (action === 'history') router.push('/user/booking-history')
    if (action === 'status') router.push('/user/booking-status')
  }

  return (
    <div className="w-full pb-8">
      <div className="px-6 pt-4 pb-6">
        <PageHeader
          title={isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
          subtitle={
            isAdmin
              ? 'Manage bookings, facilities and users'
              : `Welcome back, ${user?.name || 'User'}!`
          }
        />
      </div>

      <div className="px-6">
        {isAdmin ? (
          // Admin Dashboard Layout
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard label="Time Slots" value={initialData.timeSlots || 0} delta="+12%" colorKey="timeslots" isAdmin />
              <StatCard label="Locations" value={initialData.locations || 0} delta="Active" colorKey="locations" isAdmin />
              <StatCard label="Facilities" value={initialData.facilities || 0} delta="Operational" colorKey="facilities" isAdmin />
              <StatCard label="Total Bookings" value={initialData.totalBookings || 0} delta="All time" colorKey="bookings" isAdmin />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard label="Available Slots" value={initialData.availableSlots || 0} delta="Ready" colorKey="available" isAdmin />
              <StatCard label="Pending Approvals" value={initialData.pendingApprovals || 0} delta="Action needed" deltaPositive={false} colorKey="pending" isAdmin />
              <StatCard label="Total Users" value={initialData.totalUsers || 0} delta="Active" colorKey="users" isAdmin />
              <StatCard label="Total Revenue" value={`₹${(initialData.totalRevenue || 0).toLocaleString('en-IN')}`} delta="+8%" colorKey="revenue" isAdmin />
            </div>

            {/* Recent Bookings */}
            <BookingsTile bookings={initialData.recentBookings || []} isAdmin={true} title="Recent Bookings" />
          </>
        ) : (
          // User Dashboard Layout
          <>
            {/* User Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard label="My Bookings" value={initialData.myBookings || 0} delta="Total" colorKey="myBookings" isAdmin={false} />
              <StatCard label="Pending" value={initialData.myPendingBookings || 0} delta="Awaiting" deltaPositive={false} colorKey="pending" isAdmin={false} />
              <StatCard label="Approved" value={initialData.myApprovedBookings || 0} delta="Ready" colorKey="approved" isAdmin={false} />
              <StatCard label="Total Spent" value={`₹${(initialData.myTotalSpent || 0).toLocaleString('en-IN')}`} delta="This year" colorKey="spent" isAdmin={false} />
            </div>

            {/* Upcoming Bookings & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BookingsTile bookings={initialData.upcomingBookings || []} isAdmin={false} title="My Bookings" />
              </div>
              <div>
                <QuickActionsTile onAction={handleQuickAction} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}