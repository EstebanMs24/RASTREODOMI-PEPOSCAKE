-- PEPOS CAKE - Database Schema for Supabase
-- Create tables for user management, orders, locations, and incidents

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'deliverer')),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_lat DECIMAL(10, 8),
  customer_lng DECIMAL(11, 8),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_route', 'delivered', 'cancelled')),
  total_amount DECIMAL(10, 2),
  notes TEXT,
  delivery_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_assigned_to ON orders(assigned_to);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_location ON orders(customer_lat, customer_lng);

-- Locations table (real-time tracking)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading DECIMAL(6, 2),
  altitude DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_created_at ON locations(created_at DESC);
CREATE INDEX idx_locations_geospatial ON locations(latitude, longitude);

-- Incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN ('customer_not_found', 'address_wrong', 'delivery_refused', 'traffic_delay', 'vehicle_issue', 'other')),
  description TEXT NOT NULL,
  photo_url TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_incidents_order_id ON incidents(order_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);

-- Performance metrics (computed/cached for dashboard)
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_deliveries INT DEFAULT 0,
  average_delivery_time INT, -- in minutes
  on_time_deliveries INT DEFAULT 0,
  delayed_deliveries INT DEFAULT 0,
  incidents_count INT DEFAULT 0,
  rating DECIMAL(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_date ON performance_metrics(date DESC);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can update any user" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Orders policies
CREATE POLICY "Admin can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Deliverers can view their assigned orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'deliverer'
    )
    AND assigned_to = auth.uid()
  );

CREATE POLICY "Admin can create orders" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Deliverers can update their assigned orders status" ON orders
  FOR UPDATE USING (
    assigned_to = auth.uid()
  )
  WITH CHECK (
    assigned_to = auth.uid()
  );

-- Locations policies
CREATE POLICY "Users can insert their own locations" ON locations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all locations" ON locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own locations" ON locations
  FOR SELECT USING (user_id = auth.uid());

-- Incidents policies
CREATE POLICY "Users can create incidents for their orders" ON incidents
  FOR INSERT WITH CHECK (
    reported_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders WHERE id = order_id AND assigned_to = auth.uid()
    )
  );

CREATE POLICY "Admin can view all incidents" ON incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view incidents they reported" ON incidents
  FOR SELECT USING (reported_by = auth.uid());

-- Performance metrics policies
CREATE POLICY "Admin can view all metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own metrics" ON performance_metrics
  FOR SELECT USING (user_id = auth.uid());

-- Cleanup job: Delete locations older than 7 days
-- Run manually or via pg_cron extension
-- SELECT cron.schedule('cleanup_old_locations', '0 2 * * *', 'DELETE FROM locations WHERE created_at < NOW() - INTERVAL ''7 days''');
