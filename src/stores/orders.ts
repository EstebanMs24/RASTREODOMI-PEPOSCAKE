import { create } from 'zustand'
import { supabase } from '@/config/supabase'
import { Order, DashboardStats } from '@/types'

interface OrdersState {
  orders: Order[]
  loading: boolean
  error: string | null
  stats: DashboardStats | null
  fetchOrders: () => Promise<void>
  fetchOrdersForDeliverer: (userId: string) => Promise<void>
  fetchStats: () => Promise<void>
  createOrder: (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
  assignOrder: (orderId: string, userId: string) => Promise<void>
  subscribeToOrders: (callback: (order: Order) => void) => () => void
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  stats: null,

  fetchOrders: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ orders: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchOrdersForDeliverer: async (userId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('assigned_to', userId)
        .in('status', ['assigned', 'in_route'])
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ orders: data || [], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchStats: async () => {
    set({ loading: true, error: null })
    try {
      const today = new Date().toISOString().split('T')[0]

      const [ordersRes, deliverersRes, incidentsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('status')
          .gte('created_at', `${today}T00:00:00`),
        supabase
          .from('users')
          .select('id')
          .eq('role', 'deliverer')
          .eq('is_active', true),
        supabase
          .from('incidents')
          .select('id')
          .gte('created_at', `${today}T00:00:00`),
      ])

      const stats: DashboardStats = {
        total_orders_today: ordersRes.data?.length || 0,
        completed_orders: ordersRes.data?.filter(o => o.status === 'delivered').length || 0,
        pending_orders: ordersRes.data?.filter(o => o.status === 'pending').length || 0,
        active_deliverers: deliverersRes.data?.length || 0,
        average_delivery_time: 0,
        delayed_orders: 0,
        incidents_today: incidentsRes.data?.length || 0,
      }

      set({ stats, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createOrder: async (order) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single()

      if (error) throw error

      set(state => ({
        orders: [data, ...state.orders],
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          ...(status === 'delivered' && { delivered_at: new Date().toISOString() }),
        })
        .eq('id', orderId)

      if (error) throw error

      set(state => ({
        orders: state.orders.map(o =>
          o.id === orderId
            ? { ...o, status, ...(status === 'delivered' && { delivered_at: new Date().toISOString() }) }
            : o
        ),
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  assignOrder: async (orderId: string, userId: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          assigned_to: userId,
          status: 'assigned',
        })
        .eq('id', orderId)

      if (error) throw error

      set(state => ({
        orders: state.orders.map(o =>
          o.id === orderId
            ? { ...o, assigned_to: userId, status: 'assigned' }
            : o
        ),
        loading: false,
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  subscribeToOrders: (callback) => {
    const subscription = supabase
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        callback(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  },
}))
