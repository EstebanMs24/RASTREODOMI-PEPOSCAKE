import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
import { useMapStore } from '@/stores/map'
import Sidebar from '@/components/Sidebar'
import MapView from '@/components/MapView'
import OrdersPanel from '@/components/OrdersPanel'
import DashboardStats from '@/components/DashboardStats'
import { LogOut, Menu } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { fetchOrders, fetchStats, subscribeToOrders, orders, stats } = useOrdersStore()
  const { fetchLocations, subscribeToLocations } = useMapStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'orders' | 'stats'>('map')

  useEffect(() => {
    fetchOrders()
    fetchStats()
    fetchLocations()

    const unsubscribeOrders = subscribeToOrders(() => {
      fetchOrders()
      fetchStats()
    })

    const unsubscribeLocations = subscribeToLocations(() => {
      fetchLocations()
    })

    const statsInterval = setInterval(() => {
      fetchStats()
    }, 30000)

    return () => {
      unsubscribeOrders()
      unsubscribeLocations()
      clearInterval(statsInterval)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">PEPOS CAKE - Admin</h1>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-600">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 px-6 border-t border-gray-200">
            {(['map', 'orders', 'stats'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 border-b-2 font-medium text-sm transition ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'map' && 'Mapa en Vivo'}
                {tab === 'orders' && 'Pedidos'}
                {tab === 'stats' && 'Estadísticas'}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'map' && <MapView />}
          {activeTab === 'orders' && <OrdersPanel />}
          {activeTab === 'stats' && <DashboardStats stats={stats} />}
        </div>
      </div>
    </div>
  )
}
