import { useEffect, useState } from 'react'
import { supabase } from '@/config/supabase'
import { Trash2 } from 'lucide-react'

interface Deliverer {
  id: string
  email: string
  full_name: string
  phone: string
  is_active: boolean
  created_at: string
}

export default function DeliverersList() {
  const [deliverers, setDeliverers] = useState<Deliverer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDeliverers()

    // Subscribe to changes
    const subscription = supabase
      .channel('deliverers_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: "role=eq.deliverer",
        },
        () => {
          fetchDeliverers()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchDeliverers = async () => {
    setLoading(true)
    setError(null)
    try {
      // Ensure we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) throw new Error('No hay sesión activa')
      if (!session) throw new Error('Debes iniciar sesión para ver domiciliarios')

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, email, full_name, phone, is_active, created_at')
        .eq('role', 'deliverer')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Fetch error:', fetchError)
        throw new Error(`Error al cargar domiciliarios: ${fetchError.message}`)
      }

      setDeliverers(data || [])
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error al cargar domiciliarios. Intenta recargar.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDeliverer = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error('No hay sesión activa')

      // Call Edge Function with proper service role permissions
      const supabaseUrl = 'https://pyhujdmsicwvgftodatk.supabase.co'
      const response = await fetch(
        `${supabaseUrl}/functions/v1/delete-deliverer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: id }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar domiciliario')
      }

      setDeliverers((prev) => prev.filter((d) => d.id !== id))
    } catch (err: any) {
      setError(err.message || 'Error al eliminar domiciliario')
    }
  }


  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Cargando domiciliarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <h2 className="text-white font-bold text-lg">
            Domiciliarios Registrados ({deliverers.length})
          </h2>
        </div>

        {error && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {deliverers.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <p>No hay domiciliarios registrados aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Nombre</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Email</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Teléfono</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Estado</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deliverers.map((deliverer) => (
                  <tr key={deliverer.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{deliverer.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{deliverer.email}</td>
                    <td className="px-6 py-4 text-gray-600">{deliverer.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          deliverer.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {deliverer.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteDeliverer(deliverer.id, deliverer.full_name)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
