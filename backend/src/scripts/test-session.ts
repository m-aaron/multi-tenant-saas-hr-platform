import {
    createSession,
} from '#modules/auth/session.service.js';

async function run() {
    const result =
        await createSession({
            sub: '1',
            organizationId: 'org',
            roleId: 'admin',
        });

    console.log(result);
}

void run();