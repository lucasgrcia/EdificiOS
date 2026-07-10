CREATE TABLE shifts (
  id uuid PRIMARY KEY,
  site_id uuid NOT NULL,
  operator_id uuid NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz
);
