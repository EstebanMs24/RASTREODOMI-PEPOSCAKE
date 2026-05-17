export type UserRole = 'admin' | 'deliverer'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  is_active: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'assigned' | 'in_route' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_address: string
  customer_lat: number
  customer_lng: number
  assigned_to?: string
  status: OrderStatus
  total_amount: number
  notes?: string
  delivery_photo_url?: string
  created_at: string
  updated_at: string
  delivered_at?: string
  estimated_delivery_time?: string
}

export interface Location {
  id: string
  user_id: string
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  heading?: number
  altitude?: number
  created_at: string
}

export type IncidentType = 'customer_not_found' | 'address_wrong' | 'delivery_refused' | 'traffic_delay' | 'vehicle_issue' | 'other'
export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type IncidentSeverity = 'low' | 'medium' | 'high'

export interface Incident {
  id: string
  order_id?: string
  reported_by: string
  incident_type: IncidentType
  description: string
  photo_url?: string
  status: IncidentStatus
  severity: IncidentSeverity
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface PerformanceMetrics {
  id: string
  user_id: string
  date: string
  total_deliveries: number
  average_delivery_time?: number
  on_time_deliveries: number
  delayed_deliveries: number
  incidents_count: number
  rating?: number
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_orders_today: number
  completed_orders: number
  pending_orders: number
  active_deliverers: number
  average_delivery_time: number
  delayed_orders: number
  incidents_today: number
}

export interface DeliveryMarker {
  id: string
  user_id: string
  user_name: string
  latitude: number
  longitude: number
  orders_count: number
  status: 'active' | 'inactive'
  last_update: string
}

export interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id?: string
  entity_name?: string
  performed_by?: string
  performed_by_name?: string
  old_value?: string
  new_value?: string
  created_at: string
}
