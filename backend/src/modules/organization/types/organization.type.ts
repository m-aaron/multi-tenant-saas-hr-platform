export interface OrganizationRow {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    revokedAt?: Date | null;
}