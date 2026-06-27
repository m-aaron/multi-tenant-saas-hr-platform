-- Workforce records for employees of an organization

CREATE TABLE employees (
    id UUID PRIMARY KEY,

    organization_id UUID NOT NULL,

    department_id UUID,

    employee_number VARCHAR(50) NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    name_extension VARCHAR(20),

    job_title VARCHAR(150) NOT NULL,
    employment_status VARCHAR(30) NOT NULL,
    hire_date DATE NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_employees_organization FOREIGN 
        KEY (organization_id)
        REFERENCES organizations (id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_employees_department
        FOREIGN KEY (department_id)
        REFERENCES departments (id)
        ON DELETE SET NULL,

    CONSTRAINT chk_employees_status
        CHECK (
            employment_status IN (
                'regular', 
                'probationary', 
                'contract', 
                'resigned',
                'terminated'
            )
        )
);

CREATE INDEX idx_employees_organization ON employees (organization_id);
CREATE INDEX idx_employees_department ON employees (department_id);
CREATE INDEX idx_employees_job_title ON employees (job_title);
CREATE INDEX idx_employees_status ON employees (employment_status);

CREATE UNIQUE INDEX uq_employees_org_employee_number 
ON employees (organization_id, employee_number); 