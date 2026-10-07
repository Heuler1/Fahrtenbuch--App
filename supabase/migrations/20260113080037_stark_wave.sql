/*
  # Create Oldtimer Fahrtenbuch Database Schema

  1. New Tables
    - `vehicles` - Fahrzeugdaten mit Besitzerinformationen
    - `fuel_entries` - Tankstopps mit Verbrauchsdaten
    - `trips` - Fahrtenbuch-Einträge
    - `maintenance_entries` - Wartungs- und Reparatureinträge
    - `reminders` - Erinnerungen für TÜV, Wartung etc.
    - `user_profiles` - Erweiterte Benutzerprofile

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data

  3. Features
    - UUID primary keys for all tables
    - Automatic timestamps
    - Foreign key relationships
    - Proper indexing for performance
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  year integer DEFAULT 0,
  license_plate text DEFAULT '',
  vin text DEFAULT '',
  mileage integer DEFAULT 0,
  fuel_level integer DEFAULT 50,
  next_inspection text DEFAULT '',
  purchase_date text DEFAULT '',
  purchase_price numeric DEFAULT 0,
  engine text DEFAULT '',
  power text DEFAULT '',
  displacement text DEFAULT '',
  transmission text DEFAULT '',
  color text DEFAULT '',
  interior text DEFAULT '',
  insurance_company text DEFAULT '',
  insurance_policy_number text DEFAULT '',
  insurance_expiry_date text DEFAULT '',
  insurance_cost numeric DEFAULT 0,
  image_url text DEFAULT '',
  additional_images jsonb DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  documents jsonb DEFAULT '[]'::jsonb,
  history jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_seasonal boolean DEFAULT false,
  season_start text DEFAULT '01.04',
  season_end text DEFAULT '31.10',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fuel entries table
CREATE TABLE IF NOT EXISTS fuel_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  date text NOT NULL,
  station text NOT NULL,
  location text DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  mileage integer NOT NULL DEFAULT 0,
  consumption numeric DEFAULT 0,
  receipt_image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  date text NOT NULL,
  start_location text NOT NULL,
  destination text NOT NULL,
  distance numeric DEFAULT 0,
  category text DEFAULT 'Freizeit',
  start_mileage integer DEFAULT 0,
  end_mileage integer DEFAULT 0,
  notes text DEFAULT '',
  weather text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Maintenance entries table
CREATE TABLE IF NOT EXISTS maintenance_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  date text NOT NULL,
  type text DEFAULT 'Wartung',
  title text NOT NULL,
  workshop text DEFAULT '',
  cost numeric DEFAULT 0,
  mileage integer DEFAULT 0,
  description text DEFAULT '',
  parts jsonb DEFAULT '[]'::jsonb,
  receipt_image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  title text NOT NULL,
  date text NOT NULL,
  type text DEFAULT 'inspection',
  description text DEFAULT '',
  notify_days integer DEFAULT 14,
  active boolean DEFAULT true,
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for vehicles
CREATE POLICY "Users can read own vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for fuel_entries
CREATE POLICY "Users can read own fuel entries"
  ON fuel_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fuel entries"
  ON fuel_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fuel entries"
  ON fuel_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fuel entries"
  ON fuel_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for trips
CREATE POLICY "Users can read own trips"
  ON trips
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON trips
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON trips
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON trips
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for maintenance_entries
CREATE POLICY "Users can read own maintenance entries"
  ON maintenance_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own maintenance entries"
  ON maintenance_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own maintenance entries"
  ON maintenance_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own maintenance entries"
  ON maintenance_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for reminders
CREATE POLICY "Users can read own reminders"
  ON reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_user_id ON fuel_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_vehicle_id ON fuel_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_entries_user_id ON maintenance_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_entries_vehicle_id ON maintenance_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_id ON reminders(vehicle_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fuel_entries_updated_at BEFORE UPDATE ON fuel_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_entries_updated_at BEFORE UPDATE ON maintenance_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();