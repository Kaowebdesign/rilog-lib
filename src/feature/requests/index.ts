import { IRilogRequest, IRilogRequestItem, IRilogRequestTimed, IRilogResponse, IRilogResponseTimed } from '../../types';
import { state, updatePartState } from '../../state';
import { clearLongTimer, clearShortTimer, startShortTimer } from '../../utils/timers';
import { createRequestFilter } from '../../filters';
import { pushRequests } from '../../utils/requests';

const pushRequest = (request: IRilogRequest) => {
    // exit if recording is stopped
    if (!state.recording) {
        return;
    }

    const timedRequest: IRilogRequestTimed | null = request
        ? {
            ...request,
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
};

const pushResponse = (response: IRilogResponse) => {
    // exit if recording is stopped
    if (!state.recording) {
        return;
    }

    const timedResponse: IRilogResponseTimed | null = response ? { ...response, timestamp: Date.now() } : null;

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
};

export { pushRequest, pushResponse };
