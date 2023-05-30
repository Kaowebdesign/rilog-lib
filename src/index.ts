// adapters
import { axiosAdapterRequest, axiosAdapterResponse } from './adapters';
// types
import { TRilogInit, IRilogRequestTimed, TRilogPushRequest, TRilogPushResponse, IRilogResponseTimed, IRilogRequestItem } from './types';
// state
import { state, updatePartState } from './state';
// api
import { initRequest } from './api';
// filters
import { createRequestFilter } from './filters';
// tokens
import { getUserUniqToken } from './utils';
import { clearLongTimer, clearShortTimer, startShortTimer } from './utils/timers';
import { pushRequests } from './utils/requests';

/**
 * RILOG object/typed
 */

type TRilog = {
    init: (data: TRilogInit) => void;
    pushRequest: (data: TRilogPushRequest) => void;
    pushResponse: (data: TRilogPushResponse) => void;
};

const Rilog = {
    // methods
    init: async ({ key, config }: TRilogInit) => {
        const token = getUserUniqToken();

        /**
         * Save appId (app key) to the state
         * @param key {string}
         */
        updatePartState({ key });

        const externalInfo = getExternalInfo();

        const data = await initRequest({ uToken: token, appId: key, externalInfo });

        updatePartState({
            token: data.access_token,
            salt: data.salt,
            recording: data.recording,
            init: true,
            config: config || null,
        });
    },
    pushRequest: (data: TRilogPushRequest) => {
        // exit if recording is stopped
        if (!state.recording) {
            return;
        }

        const preparedRequest = axiosAdapterRequest(data);
        const timedRequest: IRilogRequestTimed | null = preparedRequest
            ? {
                  ...preparedRequest,
                  timestamp: Date.now(),
                  locationOrigin: window.location?.origin || null,
                  locationHref: window.location?.href || null,
                  localStorage: JSON.stringify(localStorage),
              }
            : null;

        startShortTimer();

        if (timedRequest) {
            let filteredRequest: IRilogRequestTimed | null = null;

            const requestFilter = createRequestFilter(state.config);

            filteredRequest = requestFilter.sensetive(timedRequest);
            filteredRequest = requestFilter.sensetiveData(filteredRequest);
            filteredRequest = requestFilter.headers(filteredRequest);
            filteredRequest = requestFilter.storage(filteredRequest);

            updatePartState({ request: filteredRequest || null });
        }
    },
    pushResponse: (data: TRilogPushResponse) => {
        // exit if recording is stopped
        if (!state.recording) {
            return;
        }

        const preparedResponse = axiosAdapterResponse(data);

        const timedResponse: IRilogResponseTimed | null = preparedResponse ? { ...preparedResponse, timestamp: Date.now() } : null;

        clearShortTimer();

        if (timedResponse && state.request) {
            const fullRequest: IRilogRequestItem = {
                _id: Date.now().toString(),
                request: state.request,
                response: timedResponse,
            };

            clearLongTimer();

            pushRequests(fullRequest);
        } else {
            if (state.request) {
                const fullRequest: IRilogRequestItem = {
                    _id: Date.now().toString(),
                    request: state.request,
                    response: {
                        data: 'No response from server. Timeout.',
                        status: '',
                        timestamp: Date.now(),
                    },
                };

                clearLongTimer();

                pushRequests(fullRequest);
            }
        }
    },
} as TRilog;

const getExternalInfo = () => {
    return {
        userAgent: navigator.userAgent,
    };
};

export { Rilog };
