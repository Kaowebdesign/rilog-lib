const CryptoJS = require('crypto-js');
const TokenGenerator = require('token-generator')({
  salt: 'rilog by kaowebdev',
  timestampMap: '3456745647', // 10 chars array for obfuscation proposes
});

/**
 * RILOG Types
 */

type TRilogInit = {
  key: string;
  config?: TRilogInitConfig;
};

type TRilogInitConfig = {
  sensetiveRequsts?: string[]; // this request will not be written,
  sensetiveDataRequests?: string[]; // will not be written data to requests (example: card data),
  headers?: string[]; // write only this headers,
  localStorage?: string[]; //only this params will be stored
  timeout?: number; // in ms, when user didn't get response from server.
};

interface IRilogRequestItem {
  _id: string;
  request: IRilogRequestTimed;
  response: IRilogResponseTimed;
  duration?: null | string;
}

interface IRilogRequest {
  url: string;
  method: string;
  headers: any;
  data?: any;
  locationOrigin: string | null;
  locationHref: string | null;
  localStorage: string | null;
}

interface IRilogResponse {
  data?: any;
  status?: string | null;
}

interface IRilogRequestTimed extends IRilogRequest {
  timestamp: number;
}

interface IRilogResponseTimed extends IRilogResponse {
  timestamp: number;
}

type TRilogPushRequest = any;
type TRilogPushResponse = any;

/**
 * RILOG consts
 */

const BASE_URL = 'http://localhost:3000';
const RIL_TOKEN = 'riltoken';
const RIL_REQUESTS = 'rilrequests';
const REQUESTS_ARRAY_LIMIT = 10; // max availble requests data for saving in localStorage
const SHORT_TIMER_LIMIT = 60000; // use it for check saving request data (for limit)
const LONG_TIMER_LIMIT = 12000; // use it for check saving request data (without request during long time)
const SUCCESS_RESPONSE_STATUS_START_CODE = '2';

/**
 * Additional functions
 */

const axiosAdapterRequest = (data: TRilogPushRequest): IRilogRequest | null => {
  let requestFull: IRilogRequest = {
    url: '',
    method: '',
    headers: {},
    data: {},
    locationOrigin: null,
    locationHref: null,
    localStorage: null,
  };

  const checkEmptyRequest = (request: IRilogRequest): boolean => {
    let empty = false;

    !request.url && (empty = true);
    !request.method && (empty = true);
    !request.headers && (empty = true);

    return empty;
  };
  // Fill Request data
  data?.url && (requestFull = { ...requestFull, url: data.url });
  data?.method && (requestFull = { ...requestFull, method: data.method });
  data?.headers && (requestFull = { ...requestFull, headers: data.headers });
  data?.data && (requestFull = { ...requestFull, data: data.data });

  return checkEmptyRequest(requestFull) ? null : requestFull;
};

const axiosAdapterResponse = (data: TRilogPushResponse): IRilogResponse | null => {
  let responseFull: IRilogResponse = {
    data: {},
    status: null,
  };

  if (Object.keys(data).length === 0) {
    return null;
  }

  const checkEmptyRequest = (response: IRilogResponse): boolean => {
    let empty = false;

    Object.keys(response.data).length === 0 && (empty = true);

    return empty;
  };

  if (data?.status?.toString()[0] !== SUCCESS_RESPONSE_STATUS_START_CODE) {
    return { data: data.response.data, status: data.status?.toString() };
  }

  // if (data?.response?.status?.toString()[0] !== SUCCESS_RESPONSE_STATUS_START_CODE) {
  // 	return { data: data.response.data, status: data.response.status?.toString() }
  // }

  if (data?.data) {
    responseFull = {
      ...responseFull,
      data: data.data,
      status: data?.response?.status?.toString() || data?.status?.toString() || null,
    };
  }

  return checkEmptyRequest(responseFull) ? null : responseFull;
};

/**
 * RILOG state
 */
type TRilogState = {
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

    setAppKey(key);

    const externalInfo = getExternalInfo();

    const data = await initRequest({ uToken: token, appId: key, externalInfo });

    state = {
      ...state,
      token: data.access_token,
      salt: data.salt,
      recording: data.recording,
      init: true,
      config: config || null,
    };
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
          locationOrigin: window.location['origin'] || null,
          locationHref: window.location.href || null,
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

      state.request = filteredRequest || null;
    }
  },
  pushResponse: (data: TRilogPushResponse) => {
    // exit if recording is stopped
    if (!state.recording) {
      return;
    }

    const preparedResponse = axiosAdapterResponse(data);

    const timedResponse: IRilogResponseTimed | null = preparedResponse
      ? { ...preparedResponse, timestamp: Date.now() }
      : null;

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

/**
 * RILOG additional methods
 */

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

/**
 * Save appId (app key) to the state
 * @param key {string}
 */

const setAppKey = (key: string) => {
  state = { ...state, key };
};

type TInitRequest = {
  uToken: string;
  appId: string;
  externalInfo?: object;
};

type TInitResponse = {
  // for additional requests (example: save())
  access_token: string;
  // for encoding push data
  salt: string;
  // recording requests
  recording: boolean;
};

const getExternalInfo = () => {
  return {
    userAgent: navigator.userAgent,
  };
};

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
      console.error('[Connection init] get error ', error);
    });
};

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

  state.request = null;
};

/**
 * Start/Clear timers
 */
const startShortTimer = () => {
  state = {
    ...state,
    shortTimer: setTimeout(() => {
      // push empty response
      Rilog.pushResponse({});
    }, state.config?.timeout || SHORT_TIMER_LIMIT),
  };
};

const clearShortTimer = () => {
  clearTimeout(state.shortTimer);
  state.shortTimer = null;
};

const startLongTimer = (data: IRilogRequestItem[]) => {
  state = {
    ...state,
    longTimer: setTimeout(() => {
      saveRequests(data);
    }, LONG_TIMER_LIMIT),
  };
};

const clearLongTimer = () => {
  clearTimeout(state.longTimer);
  state.longTimer = null;
};

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

/**
 * Encryt request data for save request array
 * @param data
 */
const encrypt = (data: IRilogRequestItem[]): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), state.salt).toString();
};

/**
 * Do save request to back
 * @param data - encrypted requests data(array)
 * @returns
 */
type TSaveRequestResp = {
  result: 'SUCCESS' | 'ERROR';
};
const saveRequest = (data: string): Promise<TSaveRequestResp> => {
  return fetch(`${BASE_URL}/connection/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
    },
    body: JSON.stringify({ requestData: data }),
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error('[Connection send] get error ', error);
    });
};

export { Rilog };
