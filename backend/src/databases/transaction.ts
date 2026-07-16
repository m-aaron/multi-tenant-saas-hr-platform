import type { PoolClient } from 'pg';

import { db } from '#databases/index.js';


// This function executes a callback function within a database transaction. 
// It begins a transaction, executes the callback with the provided database client, and commits the transaction if successful.
// If an error occurs, it rolls back the transaction and rethrows the error. Finally, it releases the database client back to the pool.
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client: PoolClient = await db.connect();
    try {
        await client.query('BEGIN');

        const result = await callback(client);
        
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        
        throw error;
    } finally {
        client.release();
    }
}