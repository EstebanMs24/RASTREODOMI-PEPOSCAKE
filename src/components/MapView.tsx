import { useEffect, useRef } from 'react'
import { useMapStore } from '@/stores/map'
import { MapPin, AlertCircle } from 'lucide-react'

declare global {
  interface Window {
    google: any
  }
}

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const { markers, error } = useMapStore()

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize Google Map
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: 4.7110, lng: -74.0721 }, // Bogotá, Colombia
      mapTypeId: 'roadmap',
      streetViewControl: false,
      fullscreenControl: false,
    })

    mapInstanceRef.current = mapInstance

    return () => {
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Update or create markers
    const currentMarkerIds = new Set<string>()

    markers.forEach(marker => {
      currentMarkerIds.add(marker.id)

      const position = { lat: marker.latitude, lng: marker.longitude }

      if (markersRef.current.has(marker.id)) {
        // Update existing marker position
        markersRef.current.get(marker.id).setPosition(position)
      } else {
        // Create new marker
        const newMarker = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: marker.user_name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: marker.status === 'active' ? '#22c55e' : '#ef4444',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-bold">${marker.user_name}</h3>
              <p class="text-sm">Pedidos: ${marker.orders_count}</p>
              <p class="text-xs text-gray-600">${new Date(marker.last_update).toLocaleTimeString()}</p>
            </div>
          `,
        })

        newMarker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, newMarker)
        })

        markersRef.current.set(marker.id, newMarker)
      }
    })

    // Remove markers not in current list
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.setMap(null)
        markersRef.current.delete(id)
      }
    })

    // Center map on markers
    if (markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      markers.forEach(m => {
        bounds.extend({ lat: m.latitude, lng: m.longitude })
      })
      mapInstanceRef.current.fitBounds(bounds, 50)
    }
  }, [markers])

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="h-96 md:h-[600px]" ref={mapRef}>
          {error && (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-danger-600 mx-auto mb-4" />
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success-500"></div>
              <span>Activos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-danger-500"></div>
              <span>Inactivos</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span>{markers.length} domiciliarios rastreados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
