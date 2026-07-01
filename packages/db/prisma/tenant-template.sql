-- Template applied to each prefecture schema (MVP scope).
CREATE TABLE secretariats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL,
  registration text, position text, license text,
  status text NOT NULL DEFAULT 'active'
);
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL UNIQUE, model text,
  status text NOT NULL DEFAULT 'available',
  current_mileage integer NOT NULL DEFAULT 0
);
CREATE TABLE usage_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  driver_id uuid NOT NULL REFERENCES users(id),
  destination text, purpose text,
  start_mileage integer, end_mileage integer,
  departed_at timestamptz, returned_at timestamptz
);
CREATE TABLE refuelings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  driver_id uuid NOT NULL REFERENCES users(id),
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
