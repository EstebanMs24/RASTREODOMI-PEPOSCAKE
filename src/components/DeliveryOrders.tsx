import { useOrdersStore } from '@/stores/orders'
import { useAuthStore } from '@/stores/auth'
import { Order } from '@/types'
import { MapPin, Phone, Clock, CheckCircle, Camera } from 'lucide-react'
import { useState } from 'react'

export default function DeliveryOrders() {
  const { orders, loading, updateOrderStatus } = useOrdersStore()
  const { user } = useAuthStore()
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const handleMarkDelivered = async (orderId: string) => {
    await updateOrderStatus(orderId, 'delivered')
    setSelectedOrder(null)
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'in_route':
        return 'badge-warning'
      case 'delivered':
        return 'badge-success'
      default:
        return 'badge-warning'
    }
  }

  const getStatusLabel = (status: Order['status']) => {
    const labels: Record<Order['status'], string> = {
      pending: 'Pendiente',
      assigned: 'Asignado',
      in_route: 'En ruta',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    }
    return labels[status]
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mis Pedidos</h2>
        <p className="text-gray-600 text-sm">
          {orders.length} pedido{orders.length !== 1 ? 's' : ''} asignado{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando pedidos...</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="card text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay pedidos asignados</p>
          </div>
        )}

        {orders.map(order => (
          <div
            key={order.id}
            className={`card cursor-pointer transition ${
              selectedOrder === order.id ? 'ring-2 ring-primary-500' : ''
            }`}
            onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{order.order_number}</h3>
                <p className="text-gray-600 text-sm">{order.customer_name}</p>
              </div>
              <span className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{order.customer_phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Dirección</p>
                  <p className="font-medium text-gray-900">{order.customer_address}</p>
                </div>
              </div>

              {order.estimated_delivery_time && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Entrega estimada</p>
                    <p className="font-medium text-gray-900">
                      {new Date(order.estimated_delivery_time).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}

              {order.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedOrder === order.id && (
              <div className="pt-4 border-t border-gray-200 flex gap-3">
                {order.status === 'assigned' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      updateOrderStatus(order.id, 'in_route')
                    }}
                    className="flex-1 btn-primary py-2 text-sm"
                  >
                    Iniciar Entrega
                  </button>
                )}

                {order.status === 'in_route' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkDelivered(order.id)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 btn-primary py-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar Entregado
                  </button>
                )}

                {order.status === 'in_route' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    className="flex-1 flex items-center justify-center gap-2 btn-secondary py-2 text-sm"
                  >
                    <Camera className="w-4 h-4" />
                    Foto
                  </button>
                )}
              </div>
            )}

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-gray-600">Total a cobrar:</span>
              <span className="text-xl font-bold text-gray-900">
                ${order.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Placeholder icon
function Package({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9-4v4m0 0v4" />
    </svg>
  )
}
