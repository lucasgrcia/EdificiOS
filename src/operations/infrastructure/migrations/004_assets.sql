CREATE TABLE assets (
  id uuid PRIMARY KEY,
  site_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  manufacturer text,
  model text,
  serial_number text,
  location text NOT NULL,
  criticality text NOT NULL
);
