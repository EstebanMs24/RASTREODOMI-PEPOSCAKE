import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useOrdersStore } from '@/stores/orders'
import { useMapStore } from '@/stores/map'
import Sidebar from '@/components/Sidebar'
import MapView from '@/components/MapView'
import OrdersPanel from '@/components/OrdersPanel'
import DashboardStats from '@/components/DashboardStats'
import AddDelivererForm from '@/components/AddDelivererForm'
import DeliverersList from '@/components/DeliverersList'
import PerformanceReports from '@/components/PerformanceReports'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import { LogOut, Menu } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { fetchOrders, fetchStats, subscribeToOrders, orders, stats } = useOrdersStore()
  const { fetchLocations, subscribeToLocations } = useMapStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'orders' | 'stats' | 'deliverers' | 'reports' | 'analytics'>('map')

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
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-primary-700 rounded-lg transition text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">🍰 PEPOS CAKE</h1>
                <p className="text-primary-100 text-xs">Centro de Control de Domiciliarios</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                <p className="text-xs text-primary-100">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 hover:bg-primary-700 rounded-lg transition text-white"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 border-t border-primary-500 overflow-x-auto bg-primary-600/50">
            {(['map', 'orders', 'stats', 'reports', 'analytics', 'deliverers'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 font-medium text-sm transition whitespace-nowrap border-b-2 ${
                  activeTab === tab
                    ? 'border-white text-white bg-primary-700/50'
                    : 'border-transparent text-primary-100 hover:text-white hover:bg-primary-700/30'
                }`}
              >
                {tab === 'map' && '🗺️ Mapa'}
                {tab === 'orders' && '📦 Pedidos'}
                {tab === 'stats' && '📊 Estadísticas'}
                {tab === 'reports' && '📈 Reportes'}
                {tab === 'analytics' && '📉 Analytics'}
                {tab === 'deliverers' && '👥 Domiciliarios'}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'map' && <MapView />}
          {activeTab === 'orders' && <OrdersPanel />}
          {activeTab === 'stats' && <DashboardStats stats={stats} />}
          {activeTab === 'reports' && <PerformanceReports />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'deliverers' && (
            <div className="space-y-6 max-w-6xl">
              <AddDelivererForm onDelivererAdded={() => fetchOrders()} />
              <DeliverersList />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
