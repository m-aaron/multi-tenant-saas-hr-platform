CREATE TABLE users (
    id UUID PRIMARY KEY,

    employee_id UUID NOT NULL UNIQUE,
    organization_id UUID NOT NULL,
    role_id UUID NOT NULL,

    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_users_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_users_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles (id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_users_status
        CHECK (
            status IN (
                'active',
                'inactive',
                'invited'
            )
        )
);

CREATE INDEX idx_users_organization ON users (organization_id);
CREATE INDEX idx_users_role ON users (role_id);
CREATE INDEX idx_users_status ON users (status);

CREATE UNIQUE INDEX uq_users_organization_email 
ON users (organization_id, email); 