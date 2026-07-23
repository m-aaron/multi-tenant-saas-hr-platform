import argon2 from 'argon2';


export async function hashPassword(password: string,): Promise<string> {
    return argon2.hash(password, {
        type: argon2.argon2id,
    });
}

export async function verifyPassword(hash: string | null | undefined, password: string): Promise<boolean> {
    if (!hash) {
        return false;
    }

    return argon2.verify(
        hash,
        password
    );
}