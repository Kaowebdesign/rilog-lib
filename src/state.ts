import { IRilogRequestTimed, TRilogState } from './types';

let state = {
    init: false, // app done init
    request: null as null | IRilogRequestTimed, // push requests data
    token: null, // token for user auth requests
    salt: null, // salt for encoding push data
    recording: false, // record requests
    key: null, // app key for connection to back (to your current app),
    config: null, // config for requests
    // shouldSave: false, // should save requests (to back storage)
    shortTimer: null, // Use it for saving request data (if request data equal to REQUESTS_ARRAY_LIMIT)
    longTimer: null, // Use it saving request data (if user did not do requests during a long time),
} as TRilogState;

/**
 * Functions for updatings state
 */

/**
 * Update some fields of state
 * @param updatedPartState
 */
const updatePartState = (updatedPartState: object) => {
    state = {
        ...state,
        ...updatedPartState,
    };
};

export { state, updatePartState };
