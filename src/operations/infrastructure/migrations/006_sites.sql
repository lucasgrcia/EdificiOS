CREATE TABLE sites (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  timezone text NOT NULL,
  building_type text NOT NULL
);
