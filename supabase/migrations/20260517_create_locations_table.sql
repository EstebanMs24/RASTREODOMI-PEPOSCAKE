-- Create locations table for deliverer location tracking
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Create indexes for better query performance
CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_created_at ON locations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can insert their own locations
CREATE POLICY locations_insert_self ON locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can view their own locations
CREATE POLICY locations_select_self ON locations
  FOR SELECT USING (auth.uid() = user_id);

-- Policy 3: Admins can view all locations
CREATE POLICY locations_select_admin ON locations
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON locations TO authenticated;
