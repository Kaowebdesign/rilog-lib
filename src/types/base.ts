import { IRilogRequestTimed } from './requests';

export type TRilogInit = {
    key: string;
    config?: TRilogInitConfig;
};

export type TRilogInitConfig = {
    sensetiveRequsts?: string[]; // this request will not be written,
    sensetiveDataRequests?: string[]; // will not be written data to requests (example: card data),
    headers?: string[]; // write only this headers,
    localStorage?: string[]; // only this params will be stored
    timeout?: number; // in ms, when user didn't get response from server.
};

export type TInitRequest = {
    uToken: string;
    appId: string;
    externalInfo?: object;
};

export type TRilogState = {
    init: boolean;
    request: null | IRilogRequestTimed;
    token: null | string;
    salt: null | string;
    recording: boolean;
    key: null | string;
    config: null | TRilogInitConfig;
    shouldSave: boolean;
    shortTimer: any;
    longTimer: any;
    shortTimerDuration: null | number;
};
