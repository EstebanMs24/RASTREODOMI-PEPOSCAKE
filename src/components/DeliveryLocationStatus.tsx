import { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/stores/auth'
import { MapPin, Clock, Eye } from 'lucide-react'

interface LocationRecord {
  id: string
  latitude: number
  longitude: number
  created_at: string
}

export default function DeliveryLocationStatus() {
  const { user } = useAuthStore()
  const [currentLocation, setCurrentLocation] = useState<LocationRecord | null>(null)
  const [locationHistory, setLocationHistory] = useState<LocationRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    const fetchLocations = async () => {
      setLoading(true)
      try {
        // Get today's locations (desde las 00:00 de hoy)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
          .from('locations')
          .select('id, latitude, longitude, created_at')
          .eq('user_id', user.id)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data && data.length > 0) {
          setCurrentLocation(data[0])
          setLocationHistory(data)
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`locations_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCurrentLocation(payload.new as LocationRecord)
          setLocationHistory((prev) => [payload.new as LocationRecord, ...prev])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Cargando ubicación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Ubicación Actual */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Tu Ubicación Actual
          </h2>
        </div>

        {currentLocation ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Latitud</p>
                <p className="text-lg font-mono font-bold text-blue-600">
                  {currentLocation.latitude.toFixed(6)}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Longitud</p>
                <p className="text-lg font-mono font-bold text-blue-600">
                  {currentLocation.longitude.toFixed(6)}
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Última actualización</p>
                <p className="text-lg font-bold text-green-600">
                  {formatTime(currentLocation.created_at)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg flex items-start gap-3">
              <Eye className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Tu ubicación se actualiza automáticamente cada 10-15 segundos cuando está activo el rastreo. El administrador puede verla en tiempo real en el mapa.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-600">
            <p>Aún no hay registro de ubicación</p>
            <p className="text-sm text-gray-500 mt-2">
              Activa el rastreo para comenzar a registrar tu ubicación
            </p>
          </div>
        )}
      </div>

      {/* Historial del Día */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historial de Ubicaciones de Hoy
          </h2>
        </div>

        {locationHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Hora</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Latitud</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Longitud</th>
                </tr>
              </thead>
              <tbody>
                {locationHistory.map((loc, index) => (
                  <tr
                    key={loc.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                      index === 0 ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-3 text-gray-900 font-medium">
                      {formatTime(loc.created_at)}
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-600">
                      {loc.latitude.toFixed(6)}
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-600">
                      {loc.longitude.toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-600">
            <p>No hay registro de ubicaciones para hoy</p>
          </div>
        )}

        {locationHistory.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
            Total de registros: {locationHistory.length}
          </div>
        )}
      </div>
    </div>
  )
}
