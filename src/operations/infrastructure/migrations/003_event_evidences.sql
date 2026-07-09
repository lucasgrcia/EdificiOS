CREATE TABLE event_evidences (
  event_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  PRIMARY KEY (event_id, evidence_id)
);
