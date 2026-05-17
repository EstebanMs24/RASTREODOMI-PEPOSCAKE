import { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import { AuditLog } from '@/types'
import { Filter } from 'lucide-react'

export default function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'deliverer' | 'order'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    fetchLogs()
  }, [filterType])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterType !== 'all') {
        query = query.eq('entity_type', filterType === 'deliverer' ? 'deliverer' : 'order')
      }

      const { data, error } = await query

      if (error) throw error
      setLogs((data || []) as AuditLog[])
      setCurrentPage(1)
    } catch (err) {
      console.error('Error fetching audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'delete_deliverer':
        return 'bg-red-100 text-red-800'
      case 'order_status_changed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      delete_deliverer: '🗑️ Eliminado',
      order_status_changed: '📦 Estado cambió',
    }
    return labels[action] || action
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO') + ' ' + date.toLocaleTimeString('es-CO')
  }

  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(logs.length / itemsPerPage)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📋 Historial de Auditoría</h2>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        <Filter className="w-5 h-5 text-gray-600" />
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterType('deliverer')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'deliverer'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          👥 Domiciliarios
        </button>
        <button
          onClick={() => setFilterType('order')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'order'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📦 Pedidos
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No hay registros de auditoría</p>
        </div>
      ) : (
        <>
          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Fecha/Hora</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Acción</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Entidad</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Cambio</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Hecho por</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {log.entity_name || log.entity_id}
                      <div className="text-xs text-gray-500">{log.entity_type}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {log.old_value && log.new_value ? (
                        <div>
                          <span className="bg-red-50 text-red-700 px-2 py-1 rounded">{log.old_value}</span>
                          <span className="mx-1">→</span>
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded">{log.new_value}</span>
                        </div>
                      ) : log.old_value ? (
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded">Eliminado: {log.old_value}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{log.performed_by_name || 'Sistema'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, logs.length)} de {logs.length} registros
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition text-sm"
                >
                  ← Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition text-sm"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
