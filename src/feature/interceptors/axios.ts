import { TRilogPushRequest, TRilogPushResponse } from '../../types';
import { axiosAdapterRequest, axiosAdapterResponse } from '../../adapters';
import { pushRequest, pushResponse } from '../requests';

const axiosInterceptor = {
    onRequest: (data: TRilogPushRequest) => {
        const preparedRequest = axiosAdapterRequest(data);

        if (!preparedRequest) return;

        pushRequest(preparedRequest);
    },
    onResponse: (data: TRilogPushResponse) => {
        const preparedResponse = axiosAdapterResponse(data);

        if(!preparedResponse) return;

        pushResponse(preparedResponse);
    },
}

export { axiosInterceptor };
