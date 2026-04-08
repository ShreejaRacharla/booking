import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import DashboardGrid from '../components/dashboard/DashboardGrid'
// import DashboardHeader from '../components/dashboard/DashboardHeader'
import Header from '../components/layout/Header'
import Cookies from 'js-cookie'
import { useRouter } from 'next/router'

import { fetchLocations } from '../store/slices/locationSlice'
import { fetchTimeslots } from '../store/slices/timeslotSlice'
import { fetchBookings } from '../store/slices/bookingSlice'
import { fetchAvailability } from '../store/slices/slotSlice'

export default function DashboardPage() {
  const dispatch = useDispatch()
  const router = useRouter()

  const locations = useSelector((s: RootState) => s.locations.items)
  const timeSlots = useSelector((s: RootState) => s.timeslots.items)
  const bookings = useSelector((s: RootState) => s.bookings.items)
  const slots = useSelector((s: RootState) => s.slot.entries)

  useEffect(() => {
    const token = Cookies.get("accessToken")

    if (!token) {
      router.replace('/login')
      return
    }

    dispatch(fetchLocations() as any)
    dispatch(fetchTimeslots() as any)
    dispatch(fetchBookings() as any)
    dispatch(fetchAvailability() as any)

  }, [dispatch])

  const dashboardData = {
    locations: locations.length,
    facilities: 0,
    timeSlots: timeSlots.length,
    totalBookings: bookings.length,
    pendingApprovals: bookings.filter((b: any) => b.status === 'PENDING').length,
    availableSlots: slots.filter((s: any) => s.status === 'AVAILABLE').length,
    recentBookings: bookings.slice(0, 5),
  }

  return (
    <div className="animate-fade-in">
      <Header />
      <DashboardGrid initialData={dashboardData} />
    </div>
  )
}