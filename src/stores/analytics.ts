import { create } from 'zustand'
import { supabase } from '@/config/supabase'
import { Location } from '@/types'

interface Analytics {
  totalDistance: number
  activeTime: number
  topZones: { lat: number; lng: number; count: number }[]
  hourlyActivity: { hour: number; count: number }[]
}

interface AnalyticsState {
  delivererAnalytics: Map<string, Analytics>
  loading: boolean
  error: string | null
  fetchDelivererAnalytics: (userId: string, days?: number) => Promise<void>
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
  calculateTotalDistance: (locations: Location[]) => number
  calculateActiveTime: (locations: Location[]) => number
  groupLocationsByHour: (locations: Location[]) => { hour: number; count: number }[]
  getTopZones: (locations: Location[]) => { lat: number; lng: number; count: number }[]
}

export const useAnalyticsStore = create<AnalyticsState>((set) => {
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const calculateTotalDistance = (locations: Location[]): number => {
    if (locations.length < 2) return 0

    const sorted = [...locations].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    let totalDistance = 0
    for (let i = 0; i < sorted.length - 1; i++) {
      totalDistance += calculateDistance(
        sorted[i].latitude,
        sorted[i].longitude,
        sorted[i + 1].latitude,
        sorted[i + 1].longitude
      )
    }

    return Math.round(totalDistance * 100) / 100
  }

  const calculateActiveTime = (locations: Location[]): number => {
    if (locations.length < 1) return 0

    const sorted = [...locations].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const firstTime = new Date(sorted[0].created_at)
    const lastTime = new Date(sorted[sorted.length - 1].created_at)

    return Math.round((lastTime.getTime() - firstTime.getTime()) / (1000 * 60)) // minutos
  }

  const groupLocationsByHour = (locations: Location[]): { hour: number; count: number }[] => {
    const hourCounts: { [key: number]: number } = {}

    locations.forEach(loc => {
      const date = new Date(loc.created_at)
      const hour = date.getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourCounts[i] || 0,
    }))
  }

  const getTopZones = (locations: Location[]): { lat: number; lng: number; count: number }[] => {
    const zones: { [key: string]: { lat: number; lng: number; count: number } } = {}

    locations.forEach(loc => {
      // Redondear a 2 decimales para agrupar por zonas aproximadas
      const lat = Math.round(loc.latitude * 100) / 100
      const lng = Math.round(loc.longitude * 100) / 100
      const key = `${lat},${lng}`

      if (!zones[key]) {
        zones[key] = { lat, lng, count: 0 }
      }
      zones[key].count++
    })

    return Object.values(zones)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  return {
    delivererAnalytics: new Map(),
    loading: false,
    error: null,

    calculateDistance,

    calculateTotalDistance,

    calculateActiveTime,

    groupLocationsByHour,

    getTopZones,

    fetchDelivererAnalytics: async (userId: string, days = 7) => {
      set({ loading: true, error: null })
      try {
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)

        const { data, error: fetchError } = await supabase
          .from('locations')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', fromDate.toISOString())
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError

        const locations = data as Location[]

        const analytics: Analytics = {
          totalDistance: calculateTotalDistance(locations),
          activeTime: calculateActiveTime(locations),
          topZones: getTopZones(locations),
          hourlyActivity: groupLocationsByHour(locations),
        }

        set(state => {
          const newAnalytics = new Map(state.delivererAnalytics)
          newAnalytics.set(userId, analytics)
          return { delivererAnalytics: newAnalytics, loading: false }
        })
      } catch (error: any) {
        set({ error: error.message || 'Error fetching analytics', loading: false })
      }
    },
  }
})
