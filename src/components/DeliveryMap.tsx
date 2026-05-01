import { useEffect, useRef } from 'react'
import { useMapStore } from '@/stores/map'
import { useAuthStore } from '@/stores/auth'
import { AlertCircle, MapPin } from 'lucide-react'

declare global {
  interface Window {
    google: any
  }
}

export default function DeliveryMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const { trackingActive, error } = useMapStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: { lat: 4.7110, lng: -74.0721 },
      mapTypeId: 'roadmap',
      streetViewControl: false,
      fullscreenControl: true,
    })

    mapInstanceRef.current = mapInstance

    return () => {
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !('geolocation' in navigator)) return

    // Get current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const location = { lat: latitude, lng: longitude }

        if (userMarkerRef.current) {
          userMarkerRef.current.setPosition(location)
        } else {
          userMarkerRef.current = new window.google.maps.Marker({
            position: location,
            map: mapInstanceRef.current,
            title: user?.full_name || 'Mi ubicación',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#0284c7',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 3,
            },
          })
        }

        mapInstanceRef.current.setCenter(location)
        mapInstanceRef.current.setZoom(16)
      },
      (error) => {
        console.error('Geolocation error:', error)
      }
    )
  }, [user])

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Info */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                trackingActive ? 'bg-success-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {trackingActive ? 'Rastreando tu ubicación' : 'Rastreo inactivo'}
              </p>
              <p className="text-xs text-gray-600">
                Se actualiza automáticamente cada 10-15 segundos
              </p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="h-96 md:h-[600px]" ref={mapRef}>
          {error && (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-danger-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">{error}</p>
                <p className="text-xs text-gray-500">
                  Habilita la localización en tu navegador
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>Tu ubicación se sincroniza en tiempo real con el panel de admin</span>
          </div>
        </div>
      </div>
    </div>
  )
}
