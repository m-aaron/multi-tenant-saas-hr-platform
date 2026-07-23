import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.util.js';

import type { ProfileDetails, ProfileRow } from '#modules/profile/types/profile.type.js';
import type { UpdateProfileInput } from '#modules/profile/schemas/profile.schema.js';


// This function creates a new profile in the database for a given user.
export async function createProfile(
    client: PoolClient, 
    userId: string
): Promise<void> {
    
    const profileId = generateUuid();

    const query = `
        INSERT INTO profiles (
            id, 
            user_id
        ) 
        VALUES ($1, $2)
    `;

    const values = [
        profileId,
        userId
    ];

    await client.query(query, values);
}


// This function retrieves the full profile details for a user by joining profiles, users, organizations, roles, employees, and departments.
export async function findProfileByUserId(
    client: PoolClient,
    userId: string
): Promise<ProfileDetails | null> {

    const query = `
        SELECT
            p.id                    AS profile_id,
            p.avatar_url            AS profile_avatar_url,
            p.created_at            AS profile_created_at,
            p.updated_at            AS profile_updated_at,

            o.id                    AS organization_id,
            o.name                  AS organization_name,
            o.slug                  AS organization_slug,
            o.created_at            AS organization_created_at,
            o.updated_at            AS organization_updated_at,

            r.id                    AS role_id,
            r.name                  AS role_name,

            u.id                    AS user_id,
            u.email                 AS user_email,
            u.status                AS user_status,
            u.created_at            AS user_created_at,
            u.updated_at            AS user_updated_at,

            d.id                    AS department_id,
            d.name                  AS department_name,

            e.id                    AS employee_id,
            e.employee_number       AS employee_number,
            e.first_name            AS employee_first_name,
            e.middle_name           AS employee_middle_name,
            e.last_name             AS employee_last_name,
            e.name_extension        AS employee_name_extension,
            e.job_title             AS employee_job_title,
            e.employment_status     AS employee_employment_status,
            e.hire_date             AS employee_hire_date,
            e.created_at            AS employee_created_at,
            e.updated_at            AS employee_updated_at
        FROM profiles p
        INNER JOIN users u
            ON u.id = p.user_id
        INNER JOIN organizations o
            ON o.id = u.organization_id
        INNER JOIN roles r
            ON r.id = u.role_id
        INNER JOIN employees e
            ON e.id = u.employee_id
            AND e.deleted_at IS NULL
        LEFT JOIN departments d
            ON d.id = e.department_id
            AND d.deleted_at IS NULL
        WHERE
            p.user_id = $1
        LIMIT 1
    `;

    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        profile: {
            profileId: row.profile_id,
            avatarUrl: row.profile_avatar_url,
            createdAt: row.profile_created_at,
            updatedAt: row.profile_updated_at
        },
        organization: {
            organizationId: row.organization_id,
            organizationName: row.organization_name,
            organizationSlug: row.organization_slug,
            createdAt: row.organization_created_at,
            updatedAt: row.organization_updated_at
        },
        role: {
            roleId: row.role_id,
            roleName: row.role_name
        },
        user: {
            userId: row.user_id,
            email: row.user_email,
            status: row.user_status,
            createdAt: row.user_created_at,
            updatedAt: row.user_updated_at
        },
        department: row.department_id
            ? {
                departmentId: row.department_id,
                departmentName: row.department_name
            }
            : null,
        employee: {
            employeeId: row.employee_id,
            employeeNumber: row.employee_number,
            firstName: row.employee_first_name,
            middleName: row.employee_middle_name,
            lastName: row.employee_last_name,
            nameExtension: row.employee_name_extension,
            jobTitle: row.employee_job_title,
            employmentStatus: row.employee_employment_status,
            hireDate: row.employee_hire_date,
            createdAt: row.employee_created_at,
            updatedAt: row.employee_updated_at
        }
    };
}


// This function updates a profile in the database with non-undefined input fields and returns the updated row.
export async function updateProfile(
    client: PoolClient,
    userId: string,
    input: UpdateProfileInput
): Promise<ProfileRow | null> {

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.avatarUrl !== undefined) {
        setClauses.push(`avatar_url = $${paramIndex++}`);
        values.push(input.avatarUrl);
    }

    if (setClauses.length === 0) {
        const query = `
            SELECT
                id,
                user_id,
                avatar_url,
                created_at,
                updated_at
            FROM profiles
            WHERE user_id = $1
            LIMIT 1
        `;

        const result = await client.query(query, [userId]);

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        return {
            id: row.id,
            userId: row.user_id,
            avatarUrl: row.avatar_url,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    setClauses.push(`updated_at = NOW()`);

    const userIdParamIndex = paramIndex++;

    values.push(userId);

    const query = `
        UPDATE profiles
        SET ${setClauses.join(', ')}
        WHERE user_id = $${userIdParamIndex}
        RETURNING
            id,
            user_id,
            avatar_url,
            created_at,
            updated_at
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        userId: row.user_id,
        avatarUrl: row.avatar_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
