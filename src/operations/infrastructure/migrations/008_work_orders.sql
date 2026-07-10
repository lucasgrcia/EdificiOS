CREATE TABLE work_orders (
  id uuid PRIMARY KEY,
  incident_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  status text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL
);
