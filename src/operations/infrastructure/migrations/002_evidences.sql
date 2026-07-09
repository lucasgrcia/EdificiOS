CREATE TABLE evidences (
  id uuid PRIMARY KEY,
  storage_reference text NOT NULL,
  hash_sha256 char(64) NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  captured_at timestamptz NOT NULL
);
