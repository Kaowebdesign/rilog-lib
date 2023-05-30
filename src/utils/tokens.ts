import { RIL_TOKEN, TOKEN_GENERATION_SALT, TOKEN_GENERATION_TIMESTAMP } from '../constants';

/* tslint:disable:no-var-requires */
const TokenGenerator = require('token-generator')({
    salt: TOKEN_GENERATION_SALT,
    timestampMap: TOKEN_GENERATION_TIMESTAMP, // 10 chars array for obfuscation proposes
});
/**
 * Set token for each not auth user for unique user registration
 * (here unique user mean open app in browser,
 * also user can enter self unique token is spec input for auth in another browser/device )
 */
const getUserUniqToken = (): string => {
    const savedToken = localStorage.getItem(RIL_TOKEN);

    if (savedToken) {
        return savedToken;
    } else {
        const token = TokenGenerator.generate();
        localStorage.setItem(RIL_TOKEN, token);

        return token;
    }
};

export { getUserUniqToken };
