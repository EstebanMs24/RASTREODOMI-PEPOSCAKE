import { useEffect, useRef, useState } from 'react'
import { useMapStore } from '@/stores/map'
import { MapPin, AlertCircle, Flame } from 'lucide-react'

declare global {
  interface Window {
    google: any
  }
}

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const heatmapRef = useRef<any>(null)
  const [heatmapActive, setHeatmapActive] = useState(false)
  const { markers, locations, error } = useMapStore()

  useEffect(() => {
    if (!mapRef.current) return

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: 6.2176, lng: -75.5453 },
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

    if (heatmapActive) {
      // Crear heatmap
      const heatmapData = Array.from(locations.values()).map(loc => ({
        location: new window.google.maps.LatLng(loc.latitude, loc.longitude),
        weight: 1,
      }))

      // Limpiar marcadores
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current.clear()

      // Eliminar heatmap anterior si existe
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null)
      }

      // Crear nuevo heatmap
      if (heatmapData.length > 0) {
        heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: mapInstanceRef.current,
          radius: 30,
          opacity: 0.8,
        })
      }
    } else {
      // Eliminar heatmap
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null)
        heatmapRef.current = null
      }

      // Mostrar marcadores (solo activos)
      const currentMarkerIds = new Set<string>()
      const activeMarkers = markers.filter(m => m.status === 'active')

      activeMarkers.forEach(marker => {
        currentMarkerIds.add(marker.id)

        const position = { lat: marker.latitude, lng: marker.longitude }

        if (markersRef.current.has(marker.id)) {
          const existingMarker = markersRef.current.get(marker.id)
          existingMarker.setPosition(position)
          existingMarker.setVisible(true)
        } else {
          const newMarker = new window.google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: marker.user_name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: marker.status === 'active' ? '#4ECDC4' : '#FF6B6B',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          })

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-3 text-sm">
                <h3 class="font-bold text-gray-900">${marker.user_name}</h3>
                <p class="text-gray-600">📦 Pedidos: ${marker.orders_count}</p>
                <p class="text-xs text-gray-500">⏰ ${new Date(marker.last_update).toLocaleTimeString()}</p>
              </div>
            `,
          })

          newMarker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, newMarker)
          })

          markersRef.current.set(marker.id, newMarker)
        }
      })

      markersRef.current.forEach((marker, id) => {
        if (!currentMarkerIds.has(id)) {
          marker.setVisible(false)
        }
      })
    }

    // Center map
    const displayMarkers = heatmapActive ? markers : markers.filter(m => m.status === 'active')
    if (displayMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      displayMarkers.forEach(m => {
        bounds.extend({ lat: m.latitude, lng: m.longitude })
      })
      mapInstanceRef.current.fitBounds(bounds, 50)
    }
  }, [markers, heatmapActive, locations])

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="relative h-96 md:h-[600px]" ref={mapRef}>
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-danger-600 mx-auto mb-4" />
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          )}

          {/* Heatmap Toggle Button */}
          <button
            onClick={() => setHeatmapActive(!heatmapActive)}
            className={`absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-lg transition duration-200 ${
              heatmapActive
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Flame className="w-5 h-5" />
            {heatmapActive ? 'Marcadores' : 'Mapa de Calor'}
          </button>
        </div>

        {/* Legend */}
        <div className="p-5 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-primary-50">
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
            {!heatmapActive && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#4ECDC4' }}></div>
                  <span className="text-gray-700">🟢 Activos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FF6B6B' }}></div>
                  <span className="text-gray-700">🔴 Inactivos</span>
                </div>
              </>
            )}
            {heatmapActive && (
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-gray-700">Densidad de Movimiento</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              <span className="text-primary-700 font-semibold">{markers.filter(m => m.status === 'active').length} domiciliarios activos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
