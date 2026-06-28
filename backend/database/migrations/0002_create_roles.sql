CREATE TABLE roles (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_roles_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_roles_organization ON roles (organization_id);

CREATE UNIQUE INDEX uq_roles_organization_name ON roles (organization_id, name);