export interface IRilogRequestItem {
    _id: string;
    request: IRilogRequestTimed;
    response: IRilogResponseTimed;
    duration?: null | string;
}

export interface IRilogRequest {
    url: string;
    method: string;
    headers: any;
    data?: any;
    locationOrigin: string | null;
    locationHref: string | null;
    localStorage: string | null;
}

export interface IRilogResponse {
    data?: any;
    status?: string | null;
}

export interface IRilogRequestTimed extends IRilogRequest {
    timestamp: number;
}

export interface IRilogResponseTimed extends IRilogResponse {
    timestamp: number;
}

export type TInitResponse = {
    // for additional requests (example: save())
    access_token: string;
    // for encoding push data
    salt: string;
    // recording requests
    recording: boolean;
};

export type TRilogPushRequest = any;
export type TRilogPushResponse = any;
