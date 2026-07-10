CREATE TABLE actors (
  id uuid PRIMARY KEY,
  site_id uuid NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  status text NOT NULL
);
