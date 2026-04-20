import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import customAxios from '../../utils/customAxios'
import DashboardGrid from '../../components/dashboard/DashboardGrid'
import Header from '../../components/layout/Header'
import Loader from '../../components/loader'
import Cookies from 'js-cookie'

interface DecodedToken {
  id?: string;
  userId?: string;
  sub?: string;
  user_id?: string;
  role?: string;
}

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
  createdAt?: number | string | number[];
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
  createdAt: string;
}

function decodeJWT(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

function getUserIdFromToken(): string | null {
  try {
    const token = Cookies.get("accessToken");
    if (!token) return null;

    const decoded = decodeJWT(token);
    if (!decoded) return null;

    return decoded.id || decoded.userId || decoded.sub || decoded.user_id || null;
  } catch (error) {
    console.error("Error extracting user ID:", error);
    return null;
  }
}

function formatDateYYYYMMDD(dateArray: number[] | string | undefined): string {
  try {
    if (!dateArray) return 'N/A';
    
    if (Array.isArray(dateArray) && dateArray.length >= 3) {
      const [year, month, day] = dateArray;
      return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    }
    if (typeof dateArray === 'string') {
      const date = new Date(dateArray);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    }
    return 'N/A';
  } catch {
    return 'N/A';
  }
}

function formatCreatedAt(createdAt: number | string | number[] | undefined): string {
  try {
    if (!createdAt) return 'N/A';
    
    let date: Date;
    
    if (Array.isArray(createdAt)) {
      if (createdAt.length >= 6) {
        const [year, month, day, hour, minute, second] = createdAt;
        date = new Date(year, month - 1, day, hour, minute, second);
      } else if (createdAt.length >= 3) {
        const [year, month, day] = createdAt;
        date = new Date(year, month - 1, day);
      } else {
        return 'N/A';
      }
    } else if (typeof createdAt === 'number') {
      date = new Date(createdAt);
    } else if (typeof createdAt === 'string') {
      date = new Date(createdAt);
    } else {
      return 'N/A';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  } catch {
    return 'N/A';
  }
}

function normalizeArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const user = useSelector((s: RootState) => s.auth.user)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const userId = getUserIdFromToken()

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
        
        const myBookings = userId 
          ? bookings.filter((b: Booking) => b.userId === userId)
          : []

        const pendingApprovals = bookings.filter((b: Booking) => 
          b.status === 'PENDING_APPROVAL'
        ).length

        const myPendingBookings = myBookings.filter((b: Booking) => 
          ['PENDING_APPROVAL', 'DRAFT'].includes(b.status)
        ).length

        const myApprovedBookings = myBookings.filter((b: Booking) => 
          ['CONFIRMED_FULL', 'APPROVED_PENDING_PAYMENT', 'APPROVED'].includes(b.status)
        ).length

        const myTotalSpent = myBookings
          .filter((b: Booking) => b.status === 'CONFIRMED_FULL')
          .reduce((sum: number, b: Booking) => sum + (b.totalAmount || 0), 0)

        const totalRevenue = bookings
          .filter((b: Booking) => b.status === 'CONFIRMED_FULL')
          .reduce((sum: number, b: Booking) => sum + (b.totalAmount || 0), 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const upcomingBookings: ProcessedBooking[] = myBookings
          .filter((b: Booking) => {
            if (!['CONFIRMED_FULL', 'APPROVED_PENDING_PAYMENT', 'APPROVED'].includes(b.status)) {
              return false
            }
            
            const eventDate = b.items?.[0]?.eventDate
            if (!eventDate) return false
            
            try {
              let bookingDate: Date
              
              if (Array.isArray(eventDate) && eventDate.length >= 3) {
                const [year, month, day] = eventDate
                bookingDate = new Date(year, month - 1, day)
              } else if (typeof eventDate === 'string') {
                bookingDate = new Date(eventDate)
              } else {
                return false
              }
              
              bookingDate.setHours(0, 0, 0, 0)
              return bookingDate >= today
            } catch {
              return false
            }
          })
          .sort((a: Booking, b: Booking) => {
            const dateA = a.items?.[0]?.eventDate
            const dateB = b.items?.[0]?.eventDate
            if (!dateA || !dateB) return 0
            
            try {
              let timeA: number, timeB: number
              
              if (Array.isArray(dateA) && dateA.length >= 3) {
                const [yearA, monthA, dayA] = dateA
                timeA = new Date(yearA, monthA - 1, dayA).getTime()
              } else if (typeof dateA === 'string') {
                timeA = new Date(dateA).getTime()
              } else {
                return 0
              }
              
              if (Array.isArray(dateB) && dateB.length >= 3) {
                const [yearB, monthB, dayB] = dateB
                timeB = new Date(yearB, monthB - 1, dayB).getTime()
              } else if (typeof dateB === 'string') {
                timeB = new Date(dateB).getTime()
              } else {
                return 0
              }
              
              return timeA - timeB
            } catch {
              return 0
            }
          })
          .slice(0, 5)
          .map((booking: Booking) => {
            const facilityIds = booking.items?.map((item: BookingItem) => item.facilityId) || []
            const uniqueFacilityIds = [...new Set(facilityIds)]
            const facilityNames = uniqueFacilityIds
              .map((id: string) => facilities.find((f: Facility) => f.id === id)?.name)
              .filter((name): name is string => Boolean(name))
            
            const firstItem = booking.items?.[0]
            const eventDate = firstItem?.eventDate

            return {
              id: booking.bookingCode || booking.id,
              bookingCode: booking.bookingCode,
              facilityName: facilityNames.join(', ') || 'Unknown Facility',
              date: formatDateYYYYMMDD(eventDate),
              status: booking.status,
              totalAmount: booking.totalAmount || 0,
              slots: booking.items || [],
              slotCount: booking.items?.length || 0,
              createdAt: formatCreatedAt(booking.createdAt)
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
          recentBookings: [],
          myBookings: myBookings.length,
          myPendingBookings,
          myApprovedBookings,
          myTotalSpent,
          upcomingBookings,
        })

      } catch (err) {
        console.error("Dashboard fetch error:", err)
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
          myBookings: 0,
          myPendingBookings: 0,
          myApprovedBookings: 0,
          myTotalSpent: 0,
          upcomingBookings: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DashboardGrid initialData={dashboardData} />
    </div>
  )
}