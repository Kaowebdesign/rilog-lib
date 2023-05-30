import { IRilogRequestTimed, TRilogInitConfig } from '../types';

/**
 * Filter request (sensetive, sensetive data)
 */

const createRequestFilter = (config: TRilogInitConfig | null) => ({
    sensetive: (data: IRilogRequestTimed): IRilogRequestTimed => {
        return config?.sensetiveRequsts?.includes(data.url) ? { ...data, headers: 'sensetive', data: 'sensetive' } : data;
    },
    sensetiveData: (data: IRilogRequestTimed): IRilogRequestTimed => {
        return config?.sensetiveDataRequests?.includes(data.url) ? { ...data, data: 'sensetive' } : data;
    },
    headers: (data: IRilogRequestTimed): IRilogRequestTimed => {
        let headers = {};

        if (data.headers === 'sensetive') {
            return data;
        }

        config?.headers?.map((header: string) => {
            headers = { ...headers, [header]: data.headers[header] };
        });

        return { ...data, headers: config?.headers ? headers : data.headers };
    },
    storage: (data: IRilogRequestTimed): IRilogRequestTimed => {
        const localStorageConfig: string[] | null = config?.localStorage || null;

        if (localStorageConfig) {
            let resultLocalStorage: {} | null = null;

            const localStorageData = data.localStorage ? JSON.parse(data.localStorage) : null;

            if (!localStorageData) {
                return { ...data, localStorage: '' };
            }

            localStorageConfig.forEach((item) => {
                if (localStorageData[item]) {
                    if (resultLocalStorage) {
                        resultLocalStorage = { ...resultLocalStorage, [item]: localStorageData[item] };
                    } else {
                        resultLocalStorage = { [item]: localStorageData[item] };
                    }
                }
            });

            return { ...data, localStorage: resultLocalStorage || '' };
        } else {
            return { ...data, localStorage: '' };
        }
    },
});

export { createRequestFilter };
