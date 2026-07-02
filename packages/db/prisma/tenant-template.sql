-- Template applied to each prefecture schema (MVP scope).
CREATE TABLE secretariats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  registration text, position text, license text,
  status text NOT NULL DEFAULT 'active'
);
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL UNIQUE, model text NOT NULL,
  year integer NOT NULL, type text NOT NULL,
  secretariat_id uuid NOT NULL REFERENCES secretariats(id),
  status text NOT NULL DEFAULT 'available',
  current_mileage integer NOT NULL DEFAULT 0
);
-- Drivers are tenant data, a first-class aggregate decoupled from login users
-- (ADR 0014). A driver may exist without an identity/login (registered by the
-- manager; the driver app is M0-F09).
CREATE TABLE drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnh_category text NOT NULL,
  cnh_expiry date NOT NULL,
  secretariat_id uuid NOT NULL
    CONSTRAINT drivers_secretariat_id_fkey REFERENCES secretariats(id),
  status text NOT NULL DEFAULT 'active'
);
-- Authorized vehicles a driver may operate (M:N). Named constraints so the
-- adapter can route a 23503 to the right aggregate (secretariat vs vehicle).
CREATE TABLE driver_authorized_vehicles (
  driver_id uuid NOT NULL
    CONSTRAINT dav_driver_id_fkey REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL
    CONSTRAINT dav_vehicle_id_fkey REFERENCES vehicles(id) ON DELETE CASCADE,
  PRIMARY KEY (driver_id, vehicle_id)
);
CREATE TABLE usage_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  driver_id uuid NOT NULL REFERENCES drivers(id),
  destination text, purpose text,
  start_mileage integer, end_mileage integer,
  departed_at timestamptz, returned_at timestamptz
);
CREATE TABLE refuelings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  driver_id uuid NOT NULL REFERENCES drivers(id),
  liters numeric(10,2), total_amount numeric(10,2), mileage integer,
  photo_key text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id),
  type text NOT NULL, description text, photo_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  actor_id uuid, action text NOT NULL, entity text, entity_id uuid,
  prev_hash text, hash text, created_at timestamptz NOT NULL DEFAULT now()
);
