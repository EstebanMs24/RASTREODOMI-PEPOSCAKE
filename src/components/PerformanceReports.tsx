import { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import { useAnalyticsStore } from '@/stores/analytics'
import { MapPin, Clock, Navigation, TrendingUp, Download } from 'lucide-react'
import { exportPerformancePDF, exportPerformanceExcel } from '@/utils/exportReports'

interface Deliverer {
  id: string
  full_name: string
}

export default function PerformanceReports() {
  const [deliverers, setDeliverers] = useState<Deliverer[]>([])
  const [selectedDeliverer, setSelectedDeliverer] = useState<string>('')
  const [days, setDays] = useState<7 | 30 | 1>(1)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { delivererAnalytics, fetchDelivererAnalytics } = useAnalyticsStore()

  const handleExportPDF = async () => {
    if (!analytics) return
    setExporting(true)
    try {
      const deliverer = deliverers.find(d => d.id === selectedDeliverer)
      const periodLabel = days === 1 ? 'Hoy' : `Últimos ${days} días`
      const peakHour = analytics.hourlyActivity.length > 0
        ? `${analytics.hourlyActivity.reduce((max, h) => h.count > max.count ? h : max).hour}:00`
        : 'N/A'
      await exportPerformancePDF(
        deliverer?.full_name || 'Domiciliario',
        periodLabel,
        {
          kmTraveled: analytics.totalDistance,
          activeHours: Math.floor(analytics.activeTime / 60),
          activeMinutes: analytics.activeTime % 60,
          zonesVisited: analytics.topZones.length,
          peakHour: peakHour,
        },
        analytics.topZones.map(z => ({ latitude: z.lat, longitude: z.lng, visitCount: z.count }))
      )
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (!analytics) return
    setExporting(true)
    try {
      const deliverer = deliverers.find(d => d.id === selectedDeliverer)
      const periodLabel = days === 1 ? 'Hoy' : `Últimos ${days} días`
      const peakHour = analytics.hourlyActivity.length > 0
        ? `${analytics.hourlyActivity.reduce((max, h) => h.count > max.count ? h : max).hour}:00`
        : 'N/A'
      await exportPerformanceExcel(
        deliverer?.full_name || 'Domiciliario',
        periodLabel,
        {
          kmTraveled: analytics.totalDistance,
          activeHours: Math.floor(analytics.activeTime / 60),
          activeMinutes: analytics.activeTime % 60,
          zonesVisited: analytics.topZones.length,
          peakHour: peakHour,
        },
        analytics.topZones.map(z => ({ latitude: z.lat, longitude: z.lng, visitCount: z.count }))
      )
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    const fetchDeliverers = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'deliverer')

      if (data) {
        setDeliverers(data)
        if (data.length > 0) {
          setSelectedDeliverer(data[0].id)
        }
      }
    }

    fetchDeliverers()
  }, [])

  useEffect(() => {
    if (selectedDeliverer) {
      setLoading(true)
      fetchDelivererAnalytics(selectedDeliverer, days).finally(() => setLoading(false))
    }
  }, [selectedDeliverer, days, fetchDelivererAnalytics])

  const analytics = selectedDeliverer ? delivererAnalytics.get(selectedDeliverer) : null

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              👤 Seleccionar Domiciliario
            </label>
            <select
              value={selectedDeliverer}
              onChange={(e) => setSelectedDeliverer(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
            >
              {deliverers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              📅 Período
            </label>
            <div className="flex gap-2">
              {[1, 7, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d as 1 | 7 | 30)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    days === d
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d === 1 ? 'Hoy' : `${d}d`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Distance */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Distancia Recorrida</p>
                  <h3 className="text-3xl font-bold text-blue-700">{analytics.totalDistance}</h3>
                  <p className="text-xs text-gray-600 mt-2">km</p>
                </div>
                <Navigation className="w-12 h-12 text-blue-500 opacity-50" />
              </div>
            </div>

            {/* Active Time */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Tiempo Activo</p>
                  <h3 className="text-3xl font-bold text-green-700">
                    {Math.floor(analytics.activeTime / 60)}h {analytics.activeTime % 60}m
                  </h3>
                  <p className="text-xs text-gray-600 mt-2">horas y minutos</p>
                </div>
                <Clock className="w-12 h-12 text-green-500 opacity-50" />
              </div>
            </div>

            {/* Top Zones Count */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Zonas Visitadas</p>
                  <h3 className="text-3xl font-bold text-purple-700">{analytics.topZones.length}</h3>
                  <p className="text-xs text-gray-600 mt-2">áreas diferentes</p>
                </div>
                <MapPin className="w-12 h-12 text-purple-500 opacity-50" />
              </div>
            </div>

            {/* Peak Hour */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Hora Pico</p>
                  <div>
                    {analytics.hourlyActivity.length > 0 ? (
                      <>
                        <h3 className="text-3xl font-bold text-orange-700">
                          {analytics.hourlyActivity.reduce((max, h) =>
                            h.count > max.count ? h : max
                          ).hour}:00
                        </h3>
                        <p className="text-xs text-gray-600 mt-2">
                          {analytics.hourlyActivity.reduce((max, h) =>
                            h.count > max.count ? h : max
                          ).count} ubicaciones
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-600">Sin datos</p>
                    )}
                  </div>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Top Zones Table */}
          {analytics.topZones.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
                <h2 className="text-white font-bold text-lg">🗺️ Zonas Más Visitadas</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-gray-700 font-medium">Ubicación</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-medium">Latitud</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-medium">Longitud</th>
                      <th className="px-6 py-3 text-center text-gray-700 font-medium">Visitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topZones.map((zone, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          #{idx + 1}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono">{zone.lat.toFixed(4)}</td>
                        <td className="px-6 py-4 text-gray-600 font-mono">{zone.lng.toFixed(4)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-semibold">
                            {zone.count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Export Buttons */}
          {analytics.topZones.length > 0 && (
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition font-semibold"
              >
                <Download className="w-5 h-5" />
                {exporting ? 'Descargando PDF...' : '📄 Exportar PDF'}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition font-semibold"
              >
                <Download className="w-5 h-5" />
                {exporting ? 'Descargando Excel...' : '📊 Exportar Excel'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
