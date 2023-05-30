import { BASE_URL } from '../constants';
import { TInitRequest, TInitResponse } from '../types';

const initRequest = async (data: TInitRequest): Promise<TInitResponse> => {
    /**
     * Generate Authorization header ('Basic '), includes:
     * { token, key, salt }
     */

    return fetch(`${BASE_URL}/connection/init`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .catch((error) => {
            console.error('[Rilog-lib] Got error in connection init request', error);
        });
};

export { initRequest };
