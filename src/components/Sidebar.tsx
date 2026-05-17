import { X, Map, Package, BarChart3, Users } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  activeTab: 'map' | 'orders' | 'stats' | 'deliverers' | 'reports' | 'analytics'
  onTabChange: (tab: 'map' | 'orders' | 'stats' | 'deliverers' | 'reports' | 'analytics') => void
}

export default function Sidebar({ isOpen, onClose, activeTab, onTabChange }: SidebarProps) {
  const menuItems = [
    { icon: Map, label: 'Mapa en Vivo', tab: 'map' as const, emoji: '🗺️' },
    { icon: Package, label: 'Pedidos', tab: 'orders' as const, emoji: '📦' },
    { icon: BarChart3, label: 'Estadísticas', tab: 'stats' as const, emoji: '📊' },
    { icon: BarChart3, label: 'Reportes', tab: 'reports' as const, emoji: '📈' },
    { icon: BarChart3, label: 'Analytics', tab: 'analytics' as const, emoji: '📉' },
    { icon: Users, label: 'Domiciliarios', tab: 'deliverers' as const, emoji: '👥' },
  ]

  const handleTabClick = (tab: 'map' | 'orders' | 'stats' | 'deliverers' | 'reports' | 'analytics') => {
    onTabChange(tab)
    onClose()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-pepos-navy to-gray-900 border-r border-gray-800 shadow-2xl transform transition duration-300 lg:relative lg:translate-x-0 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-pepos-navy to-gray-900">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-circular.jpeg"
              alt="Pepos Cake"
              className="w-12 h-12 rounded-full shadow-lg border-2 border-primary-400 object-cover"
            />
            <div>
              <h2 className="text-sm font-bold text-white">PEPOS</h2>
              <p className="text-xs text-primary-300">Entregas</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-800 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleTabClick(item.tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                activeTab === item.tab
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
              {activeTab === item.tab && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gradient-to-t from-pepos-navy to-transparent">
          <p className="text-xs text-gray-400 text-center font-medium">
            ✨ Gestión de Entregas<br/>en Tiempo Real
          </p>
        </div>
      </aside>
    </>
  )
}
