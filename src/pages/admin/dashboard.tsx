import { useEffect, useState } from 'react'
import customAxios from '../../utils/customAxios'
import DashboardGrid from '../../components/dashboard/DashboardGrid'
import Header from '../../components/layout/Header'
import Loader from '../../components/loader'

interface SlotDetail {
  name: string;
  startTime: string;
  endTime: string;
  date?: string;
}

interface BookingItem {
  facilityId: string;
  eventDate: number[] | string;
  slotId: string;
  price: number;
}

interface Booking {
  id: string;
  bookingCode?: string;
  userId: string;
  status: string;
  totalAmount: number;
  items?: BookingItem[];
  createdAt?: number;
}

interface User {
  id: string;
  name?: string;
  username?: string;
}

interface Facility {
  id: string;
  name: string;
}

interface TimeSlot {
  id: string;
  name?: string;
  startTime?: string;
  endTime?: string;
}

interface ProcessedBooking {
  id: string;
  bookingCode?: string;
  userId?: string;
  userName?: string;
  facilityName: string;
  date: string;
  status: string;
  totalAmount: number;
  slots: BookingItem[];
  slotCount: number;
  timeRanges: string;
}

function formatDate(dateArray: number[] | string | undefined): string {
  try {
    if (!dateArray) return 'N/A';
    
    if (Array.isArray(dateArray) && dateArray.length >= 3) {
      const [year, month, day] = dateArray;
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
    if (typeof dateArray === 'string') {
      const date = new Date(dateArray);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return 'N/A';
  } catch {
    return 'N/A';
  }
}

function formatTime(timeString: string): string {
  try {
    if (!timeString) return 'N/A';
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      const hour = parseInt(parts[0]);
      const minute = parts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minute} ${ampm}`;
    }
    return timeString;
  } catch {
    return timeString;
  }
}

function normalizeArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          locationsRes,
          facilitiesRes,
          timeSlotsRes,
          bookingsRes,
          usersRes
        ] = await Promise.all([
          customAxios.get('/v1/locations').catch(() => ({ data: [] })),
          customAxios.get('/v1/facility').catch(() => ({ data: [] })),
          customAxios.get('/v1/time-slots').catch(() => ({ data: [] })),
          customAxios.get('/v1/booking').catch(() => ({ data: [] })),
          customAxios.get('/users').catch(() => ({ data: [] }))
        ])

        const locations = normalizeArray(locationsRes.data)
        const facilities: Facility[] = normalizeArray(facilitiesRes.data)
        const timeSlots: TimeSlot[] = normalizeArray(timeSlotsRes.data)
        const bookings: Booking[] = normalizeArray(bookingsRes.data)
        const users: User[] = normalizeArray(usersRes.data)
        const pendingApprovals = bookings.filter((b: Booking) => 
          b.status === 'PENDING_APPROVAL'
        ).length

        const totalRevenue = bookings
          .filter((b: Booking) => b.status === 'CONFIRMED_FULL')
          .reduce((sum: number, b: Booking) => sum + (b.totalAmount || 0), 0)

        const getSlotDetails = (slotId: string): SlotDetail => {
          const slot = timeSlots.find((ts: TimeSlot) => ts.id === slotId)
          return slot ? {
            name: slot.name || 'Unknown Slot',
            startTime: slot.startTime || '00:00:00',
            endTime: slot.endTime || '23:59:59'
          } : {
            name: 'Unknown Slot',
            startTime: '00:00:00',
            endTime: '23:59:59'
          }
        }

        const recentBookings: ProcessedBooking[] = [...bookings]
          .filter((b: Booking) => b.status !== 'DRAFT')
          .sort((a: Booking, b: Booking) => (b.createdAt || 0) - (a.createdAt || 0))
          .slice(0, 10)
          .map((booking: Booking) => {
            const facilityIds = booking.items?.map((item: BookingItem) => item.facilityId) || []
            const uniqueFacilityIds = [...new Set(facilityIds)]
            const facilityNames = uniqueFacilityIds
              .map((id: string) => facilities.find((f: Facility) => f.id === id)?.name)
              .filter((name): name is string => Boolean(name))
            
            const firstItem = booking.items?.[0]
            const eventDate = firstItem?.eventDate
            
            const bookingUser = users.find((u: User) => u.id === booking.userId)
            
            const slotDetails: SlotDetail[] = booking.items?.map((item: BookingItem) => {
              const slot = getSlotDetails(item.slotId)
              return {
                ...slot,
                date: formatDate(item.eventDate)
              }
            }) || []

            const timeRanges = [...new Set(slotDetails.map((s: SlotDetail) => 
              `${formatTime(s.startTime)}-${formatTime(s.endTime)}`
            ))].join(', ')

            return {
              id: booking.bookingCode || booking.id,
              bookingCode: booking.bookingCode,
              userId: booking.userId,
              userName: bookingUser?.name || bookingUser?.username || 'Unknown User',
              facilityName: facilityNames.join(', ') || 'Unknown Facility',
              date: formatDate(eventDate),
              status: booking.status,
              totalAmount: booking.totalAmount || 0,
              slots: booking.items || [],
              slotCount: booking.items?.length || 0,
              timeRanges: timeRanges || 'N/A'
            }
          })

        setDashboardData({
          locations: locations.length,
          facilities: facilities.length,
          timeSlots: timeSlots.length,
          totalBookings: bookings.length,
          pendingApprovals,
          availableSlots: 0,
          totalUsers: users.length,
          totalRevenue,
          recentBookings,
        })
      } catch (err) {
        console.error("[ADMIN] Dashboard fetch error:", err)
        setDashboardData({
          locations: 0,
          facilities: 0,
          timeSlots: 0,
          totalBookings: 0,
          pendingApprovals: 0,
          availableSlots: 0,
          totalUsers: 0,
          totalRevenue: 0,
          recentBookings: [],
        })
      }
    }

    fetchData()
  }, [])

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <Header />
      <DashboardGrid initialData={dashboardData} />
    </div>
  )
}