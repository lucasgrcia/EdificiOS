CREATE TABLE notifications (
  id uuid PRIMARY KEY,
  recipient_id uuid NOT NULL,
  type text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL
);
