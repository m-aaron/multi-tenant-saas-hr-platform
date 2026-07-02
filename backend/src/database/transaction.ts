export async function transaction <T> (callback: () => Promise<T>): Promise<T> {
    try {
        return await callback();
    } catch (
        error
    ) {
        throw error;
    }
}