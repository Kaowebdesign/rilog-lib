# Rilog lib

Simple way to logging and debugging your web apps.
Rilog lib collects requests, collects the local storage state,  and does some request analytics. Know, rilog-lib is adapted for [axios](https://www.npmjs.com/package/axios "axios"). But you can also use it with fetch soon.

## Installation and usage

### Installing
`yarn add rilog-lib`

or

`npm i rilog-lib`

### Usage (axios)

1. Import Rilog object from lib.

```javascript
import { Rilog } from 'rilog-lib'
```
2. Init Rilog

```javascript
Rilog.init({ 
    key: 'RILOG_APP_KEY',
    config: {} 
})
```
3. Set up config if you need:
```javascript
config: {
    headers: [] // Write the headers you want to store
    localStorage: [] // Write the params from Local Storage you want to store
    sensetiveRequsts: [] // Write the URL of request you want to exclude from storing
    sensetiveDataRequests: [] // Write the URL of the request you want to exclude from storing request data
}
```
4. Set up axios your axios [instance](https://www.npmjs.com/package/axios#creating-an-instance "instance") and [interceptors](https://www.npmjs.com/package/axios#interceptors "interceptors"). Add pushRequest and pushResponse functions.

```javascript
instance.interceptors.request.use(async function (request) { // Your axios instance

    Rilog.pushRequest(request);

    return Promise.resolve(request)
})
instance.interceptors.response.use(function(response) {

    Rilog.pushResponse(response);

    return Promise.resolve(response)
}, function(error) {

    Rilog.pushResponse(error);
    
    return Promise.reject(error);
})
```