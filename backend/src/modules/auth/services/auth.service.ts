import { withTransaction } from '#database/transaction.js';
import type { RegisterOrganizationInput } from '../types/auth.type.js';


export async function registerOrganization(input: RegisterOrganizationInput): Promise<void> {
    
    await withTransaction(async () => {
        console.log('Organization registered successfully', input);
    });
}