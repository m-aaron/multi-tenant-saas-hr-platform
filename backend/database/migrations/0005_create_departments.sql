CREATE TABLE departments (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_departments_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_departments_organization ON departments (organization_id);

CREATE UNIQUE INDEX uq_departments_organization_name 
ON departments (organization_id, name);