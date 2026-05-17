import { useState } from 'react'
import { useOrdersStore } from '@/stores/orders'
import { Order } from '@/types'
import { Clock, MapPin, Phone, Edit, Plus } from 'lucide-react'

export default function OrdersPanel() {
  const { orders, loading, createOrder } = useOrdersStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    customer_lat: 0,
    customer_lng: 0,
    total_amount: 0,
    notes: '',
  })

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    await createOrder({
      ...formData,
      order_number: `PEP-${Date.now()}`,
      status: 'pending',
    } as any)
    setShowForm(false)
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      customer_lat: 0,
      customer_lng: 0,
      total_amount: 0,
      notes: '',
    })
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'badge-warning'
      case 'assigned':
      case 'in_route':
        return 'badge-warning'
      case 'delivered':
        return 'badge-success'
      case 'cancelled':
        return 'badge-danger'
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 btn-primary"
        >
          <Plus className="w-4 h-4" />
          Crear Pedido
        </button>
      </div>

      {/* Create Order Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-bold mb-4">Nuevo Pedido</h3>
          <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre cliente"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Dirección"
              value={formData.customer_address}
              onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
              className="input-field md:col-span-2"
              required
            />
            <input
              type="number"
              placeholder="Latitud"
              value={formData.customer_lat}
              onChange={(e) => setFormData({ ...formData, customer_lat: parseFloat(e.target.value) })}
              className="input-field"
              step="0.000001"
            />
            <input
              type="number"
              placeholder="Longitud"
              value={formData.customer_lng}
              onChange={(e) => setFormData({ ...formData, customer_lng: parseFloat(e.target.value) })}
              className="input-field"
              step="0.000001"
            />
            <input
              type="number"
              placeholder="Total"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })}
              className="input-field"
              step="0.01"
              required
            />
            <textarea
              placeholder="Notas"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field md:col-span-2"
              rows={2}
            />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex-1">
                Crear
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-3">
        {loading && <p className="text-gray-600">Cargando pedidos...</p>}
        {!loading && orders.length === 0 && (
          <p className="text-gray-600">No hay pedidos</p>
        )}

        {orders.map(order => (
          <div key={order.id} className="card hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">{order.order_number}</h3>
                <p className="text-sm text-gray-600">{order.customer_name}</p>
              </div>
              <span className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{order.customer_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{order.customer_address}</span>
              </div>
              {order.estimated_delivery_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Est. {new Date(order.estimated_delivery_time).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">
                ${order.total_amount.toFixed(2)}
              </span>
              {!order.assigned_to && order.status === 'pending' && (
                <button className="flex items-center gap-2 btn-secondary text-xs py-1 px-3">
                  <Edit className="w-3 h-3" />
                  Asignar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
