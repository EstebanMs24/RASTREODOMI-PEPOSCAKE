import { DashboardStats as DashboardStatsType } from '@/types'
import { Package, TrendingUp, Truck, AlertCircle, Clock, CheckCircle } from 'lucide-react'

interface DashboardStatsProps {
  stats: DashboardStatsType | null
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = stats
    ? [
        {
          icon: Package,
          label: 'Pedidos del Día',
          value: stats.total_orders_today,
          color: 'primary',
        },
        {
          icon: CheckCircle,
          label: 'Completados',
          value: stats.completed_orders,
          color: 'success',
        },
        {
          icon: TrendingUp,
          label: 'Pendientes',
          value: stats.pending_orders,
          color: 'warning',
        },
        {
          icon: Truck,
          label: 'Domiciliarios Activos',
          value: stats.active_deliverers,
          color: 'primary',
        },
        {
          icon: Clock,
          label: 'Tiempo Promedio (min)',
          value: Math.round(stats.average_delivery_time || 0),
          color: 'primary',
        },
        {
          icon: AlertCircle,
          label: 'Incidencias',
          value: stats.incidents_today,
          color: 'danger',
        },
      ]
    : []

  const getColorClass = (color: string) => {
    switch (color) {
      case 'success':
        return 'bg-success-50 text-success-600'
      case 'warning':
        return 'bg-warning-50 text-warning-600'
      case 'danger':
        return 'bg-danger-50 text-danger-600'
      default:
        return 'bg-primary-50 text-primary-600'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas del Día</h2>
        <p className="text-gray-600 text-sm">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${getColorClass(card.color)}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 font-medium">{card.label}</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-2">
              Actualizado: {new Date().toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card mt-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900">Entregas por Domiciliario</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">
              Integración de gráficos con recharts en próxima versión
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
