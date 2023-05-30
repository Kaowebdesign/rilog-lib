import { saveRequest } from '../api';
import { REQUESTS_ARRAY_LIMIT, RIL_REQUESTS } from '../constants';
import { updatePartState } from '../state';
import { IRilogRequestItem } from '../types';
import { encrypt } from './encrypt';
import { startLongTimer } from './timers';

/**
 * Set/Update requests in localStorage
 * @param data
 */
const pushRequests = (data: IRilogRequestItem) => {
    const requests: string | null = localStorage.getItem(RIL_REQUESTS);
    const requestArray: IRilogRequestItem[] = requests ? JSON.parse(requests) : [];

    if (requestArray) {
        requestArray.push(data);

        if (requestArray.length > REQUESTS_ARRAY_LIMIT) {
            saveRequests(requestArray);
        } else {
            localStorage.removeItem(RIL_REQUESTS);
            localStorage.setItem(RIL_REQUESTS, JSON.stringify(requestArray));

            startLongTimer(requestArray);
        }
    } else {
        localStorage.setItem(RIL_REQUESTS, JSON.stringify([data]));
    }

    updatePartState({ request: null });
};

/**
 * Save requests (to back)
 */
const saveRequests = async (data: IRilogRequestItem[]) => {
    const encryptedRequests = encrypt(data);

    const result = await saveRequest(encryptedRequests);

    if (result.result.toLowerCase() === 'success') {
        localStorage.removeItem(RIL_REQUESTS);
    }
};

export { pushRequests, saveRequests };
