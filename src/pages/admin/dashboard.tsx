import { useEffect, useState } from 'react'
import customAxios from '../../utils/customAxios'
import DashboardGrid from '../../components/dashboard/DashboardGrid'
import Header from '../../components/layout/Header'

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          locationsRes,
          facilitiesRes,
          timeSlotsRes,
          bookingsRes
        ] = await Promise.all([
          customAxios.get('/v1/locations'),
          customAxios.get('/v1/facility'),
          customAxios.get('/v1/time-slots'),
          customAxios.get('/v1/booking')
        ])

        const locations = locationsRes.data || []
        const facilities = facilitiesRes.data || []
        const timeSlots = timeSlotsRes.data || []
        const bookings = bookingsRes.data || []

        setDashboardData({
          locations: locations.length,
          facilities: facilities.length,
          timeSlots: timeSlots.length,
          totalBookings: bookings.length,
          pendingApprovals: bookings.filter((b: any) => b.status === 'PENDING').length,
          availableSlots: 0,
          recentBookings: bookings.slice(0, 5),
        })

      } catch (err) {
        console.error("Dashboard fetch error:", err)
      }
    }

    fetchData()
  }, [])

  if (!dashboardData) return <div>Loading...</div>

  return (
    <div className="animate-fade-in">
      <Header />
      <DashboardGrid initialData={dashboardData} />
    </div>
  )
}