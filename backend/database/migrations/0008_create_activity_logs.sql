-- Business activity timeline

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,
    actor_id UUID,

    event_type VARCHAR(100) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_activity_logs_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_activity_logs_actor
        FOREIGN KEY (actor_id)
        REFERENCES users (id)
        ON DELETE SET NULL
);

CREATE INDEX idx_activity_logs_organization ON activity_logs (organization_id);
CREATE INDEX idx_activity_logs_actor ON activity_logs (actor_id);
CREATE INDEX idx_activity_logs_event_type ON activity_logs (event_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at);