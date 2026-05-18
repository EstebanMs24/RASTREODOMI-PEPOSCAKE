import { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import { Download } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { exportAnalyticsExcel } from '@/utils/exportReports'

export default function AnalyticsDashboard() {
  const [hourlyData, setHourlyData] = useState<any[]>([])
  const [delivererData, setDelivererData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const handleExportAnalytics = async () => {
    setExporting(true)
    try {
      await exportAnalyticsExcel({
        hourly: hourlyData,
        status: statusData,
        deliverers: delivererData,
      })
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        // Obtener pedidos del último día para gráfica de actividad por hora
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, created_at, status')
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: true })

        // Agrupar por hora
        if (ordersData) {
          const hourCounts: { [key: number]: number } = {}
          ordersData.forEach(order => {
            const hour = new Date(order.created_at).getHours()
            hourCounts[hour] = (hourCounts[hour] || 0) + 1
          })

          const hourlyChartData = Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            pedidos: hourCounts[i] || 0,
          }))

          setHourlyData(hourlyChartData)

          // Estado de pedidos
          const statusCounts = {
            pending: 0,
            assigned: 0,
            in_route: 0,
            delivered: 0,
            cancelled: 0,
          }

          ordersData.forEach(order => {
            const status = order.status as keyof typeof statusCounts
            if (statusCounts[status] !== undefined) {
              statusCounts[status]++
            }
          })

          setStatusData([
            { name: 'Pendiente', value: statusCounts.pending, color: '#FFE66D' },
            { name: 'Asignado', value: statusCounts.assigned, color: '#4ECDC4' },
            { name: 'En Ruta', value: statusCounts.in_route, color: '#2BA09A' },
            { name: 'Entregado', value: statusCounts.delivered, color: '#22c55e' },
            { name: 'Cancelado', value: statusCounts.cancelled, color: '#FF6B6B' },
          ])
        }

        // Pedidos por domiciliario (últimos 7 días)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: deliverersOrders } = await supabase
          .from('orders')
          .select('assigned_to, id')
          .gte('created_at', sevenDaysAgo.toISOString())

        if (deliverersOrders) {
          const delivererCounts: { [key: string]: number } = {}

          deliverersOrders.forEach((order: any) => {
            if (order.assigned_to) {
              delivererCounts[order.assigned_to] = (delivererCounts[order.assigned_to] || 0) + 1
            }
          })

          // Obtener nombres de domiciliarios
          const delivererIds = Object.keys(delivererCounts)
          const { data: deliverers } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', delivererIds)

          const delivererChartData = (deliverers || []).map(d => ({
            name: d.full_name.split(' ')[0], // Solo primer nombre
            pedidos: delivererCounts[d.id],
          }))

          setDelivererData(delivererChartData)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-600 font-semibold">Cargando analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Analytics Avanzados</h1>
          <p className="text-gray-600">Visualiza métricas y patrones de desempeño</p>
        </div>
        <button
          onClick={handleExportAnalytics}
          disabled={exporting}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition font-semibold"
        >
          <Download className="w-5 h-5" />
          {exporting ? 'Descargando...' : '📊 Exportar Excel'}
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">⏰ Actividad Diaria (Últimas 24h)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12 }}
                interval={2}
                stroke="#9ca3af"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #4ECDC4',
                  borderRadius: '8px',
                }}
                cursor={{ stroke: '#4ECDC4' }}
              />
              <Line
                type="monotone"
                dataKey="pedidos"
                stroke="#4ECDC4"
                strokeWidth={3}
                dot={{ fill: '#2BA09A', r: 5 }}
                activeDot={{ r: 7 }}
                name="Pedidos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📦 Distribución de Estados</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData.filter(s => s.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Deliverers Performance */}
        <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🚴 Rendimiento por Domiciliario (Últimos 7 días)</h2>
          {delivererData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={delivererData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '2px solid #4ECDC4',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="pedidos"
                  fill="#4ECDC4"
                  radius={[8, 8, 0, 0]}
                  name="Pedidos Entregados"
                >
                  {delivererData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#4ECDC4', '#2BA09A', '#22c55e', '#FFE66D', '#FF6B6B'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-600">No hay datos de domiciliarios en los últimos 7 días</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border-l-4 border-primary-500">
          <p className="text-sm font-semibold text-gray-700">Total Pedidos Hoy</p>
          <p className="text-3xl font-bold text-primary-700 mt-2">
            {hourlyData.reduce((acc, h) => acc + h.pedidos, 0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-l-4 border-green-500">
          <p className="text-sm font-semibold text-gray-700">Entregados</p>
          <p className="text-3xl font-bold text-green-700 mt-2">
            {statusData.find(s => s.name === 'Entregado')?.value || 0}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-l-4 border-orange-500">
          <p className="text-sm font-semibold text-gray-700">Domiciliarios Activos</p>
          <p className="text-3xl font-bold text-orange-700 mt-2">
            {delivererData.length}
          </p>
        </div>
      </div>
    </div>
  )
}
