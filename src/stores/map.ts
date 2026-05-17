import { create } from 'zustand'
import { supabase } from '@/config/supabase'
import { Location, DeliveryMarker } from '@/types'

interface MapState {
  locations: Map<string, Location>
  markers: DeliveryMarker[]
  loading: boolean
  error: string | null
  trackingActive: boolean
  sendLocation: (userId: string, latitude: number, longitude: number) => Promise<void>
  fetchLocations: () => Promise<void>
  subscribeToLocations: (callback: (location: Location) => void) => () => void
  startTracking: (userId: string) => void
  stopTracking: () => void
}

export const useMapStore = create<MapState>((set) => {
  let watchPositionId: number | null = null
  let trackingUserId: string | null = null

  return {
    locations: new Map(),
    markers: [],
    loading: false,
    error: null,
    trackingActive: false,

    sendLocation: async (userId: string, latitude: number, longitude: number) => {
      try {
        const { error } = await supabase
          .from('locations')
          .insert([
            {
              user_id: userId,
              latitude,
              longitude,
            },
          ])

        if (error) throw error
      } catch (error: any) {
        set({ error: error.message })
      }
    },

    fetchLocations: async () => {
      set({ loading: true, error: null })
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000)

        if (error) throw error

        const locationsMap = new Map<string, Location>()
        const markers: DeliveryMarker[] = []
        const userOrdersMap = new Map<string, number>()

        data.forEach(loc => {
          locationsMap.set(loc.id, loc)
          if (!userOrdersMap.has(loc.user_id)) {
            userOrdersMap.set(loc.user_id, 0)
          }
        })

        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name, is_active')
          .eq('role', 'deliverer')

        usersData?.forEach(user => {
          const lastLoc = data.find(l => l.user_id === user.id)
          if (lastLoc) {
            markers.push({
              id: user.id,
              user_id: user.id,
              user_name: user.full_name,
              latitude: lastLoc.latitude,
              longitude: lastLoc.longitude,
              orders_count: userOrdersMap.get(user.id) || 0,
              status: user.is_active ? 'active' : 'inactive',
              last_update: lastLoc.created_at,
            })
          }
        })

        set({ locations: locationsMap, markers, loading: false })
      } catch (error: any) {
        set({ error: error.message, loading: false })
      }
    },

    subscribeToLocations: (callback) => {
      const subscription = supabase
        .channel('locations_channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
        }, (payload) => {
          callback(payload.new)
          set(state => {
            const newLocations = new Map(state.locations)
            newLocations.set(payload.new.id, payload.new)
            return { locations: newLocations }
          })
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    },

    startTracking: (userId: string) => {
      if (!('geolocation' in navigator)) {
        set({ error: 'Geolocation not supported' })
        return
      }

      set({ trackingActive: true, error: null })
      trackingUserId = userId

      const options = {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 0,
      }

      watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const store = useMapStore.getState()
          store.sendLocation(userId, latitude, longitude)
        },
        (error) => {
          set({ error: `Geolocation error: ${error.message}` })
        },
        options
      )
    },

    stopTracking: () => {
      if (watchPositionId !== null) {
        navigator.geolocation.clearWatch(watchPositionId)
        watchPositionId = null
      }
      set({ trackingActive: false })
    },
  }
})
