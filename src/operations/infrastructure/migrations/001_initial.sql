CREATE TABLE incidents (
  id uuid PRIMARY KEY,
  description text NOT NULL,
  current_projection_state jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE events (
  id uuid PRIMARY KEY,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  incident_id uuid NOT NULL,
  name text NOT NULL,
  schema_version integer NOT NULL,
  correlation_id uuid,
  causation_id uuid,
  actor_id uuid,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL
);

CREATE TABLE outbox (
  id uuid PRIMARY KEY,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_id uuid NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  processed_at timestamptz
);
