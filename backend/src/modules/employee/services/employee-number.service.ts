import type { PoolClient } from 'pg';


export async function generateEmployeeNumber(client: PoolClient, organizationId: string): Promise<string> {
    
    const result = await client.query<{count: string;}>(
        `SELECT COUNT(*) AS count
        FROM employees
        WHERE organization_id = $1`,
        [organizationId],
    );

    if (result.rows.length === 0 || !result.rows[0]) {
        throw new Error(`Failed to generate employee number for organization ${organizationId}.`);
    }

    const nextNumber = Number(result.rows[0].count) + 1;

    return `EMP-${nextNumber.toString().padStart(6, '0')}`;
}