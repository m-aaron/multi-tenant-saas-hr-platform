import {
    signAccessToken,
    verifyAccessToken,
} from '#modules/auth/jwt.service.js';

const token =
    signAccessToken({
        sub: '1',
        organizationId: 'org',
        roleId: 'admin',
    });

console.log(token);

const payload =
    verifyAccessToken(token);

console.log(payload);