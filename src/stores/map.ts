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
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, is_active')
          .eq('role', 'deliverer')

        if (usersError) throw usersError
        if (!usersData || usersData.length === 0) {
          set({ locations: new Map(), markers: [], loading: false })
          return
        }

        const userIds = usersData.map(u => u.id)
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .in('user_id', userIds)
          .order('created_at', { ascending: false })

        if (locationsError) throw locationsError

        const locationsMap = new Map<string, Location>()
        const latestPerUser = new Map<string, Location>()
        const markers: DeliveryMarker[] = []

        locationsData?.forEach(loc => {
          locationsMap.set(loc.id, loc)
          if (!latestPerUser.has(loc.user_id)) {
            latestPerUser.set(loc.user_id, loc)
          }
        })

        usersData.forEach(user => {
          const lastLoc = latestPerUser.get(user.id)
          if (lastLoc) {
            markers.push({
              id: user.id,
              user_id: user.id,
              user_name: user.full_name,
              latitude: lastLoc.latitude,
              longitude: lastLoc.longitude,
              orders_count: 0,
              status: user.is_active ? 'active' : 'inactive',
              last_update: lastLoc.created_at,
            })
          }
        })

        set({ locations: locationsMap, markers, loading: false })
      } catch (error: any) {
        console.error('fetchLocations error:', error)
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
        }, (payload: any) => {
          const newLocation = payload.new as Location
          callback(newLocation)

          set(state => {
            const newLocations = new Map(state.locations)
            newLocations.set(newLocation.id, newLocation)

            let newMarkers = [...state.markers]
            const existingMarkerIndex = newMarkers.findIndex(m => m.user_id === newLocation.user_id)

            if (existingMarkerIndex >= 0) {
              newMarkers[existingMarkerIndex] = {
                ...newMarkers[existingMarkerIndex],
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                last_update: newLocation.created_at,
              }
            } else {
              newMarkers.push({
                id: newLocation.user_id,
                user_id: newLocation.user_id,
                user_name: 'Domiciliario',
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                orders_count: 0,
                status: 'active',
                last_update: newLocation.created_at,
              })
            }

            return { locations: newLocations, markers: newMarkers }
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
