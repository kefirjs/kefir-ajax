# kefir-ajax

`fetch`-like ajax library for making API calls with Kefir Observables.

---

## How to Use

The library's API should be very familiar, as it's based off the `fetch` API. To start, import the `ajax$` function:

```js
import {ajax$} from 'kefir-ajax'
```

Then create an Observable representing your desired ajax request:

```js
const request$ = ajax$('/url/to/my/api')
```

Then observe the result!

```js
request$.observe(
  response => console.log(response.status),
  error => console.error(error.message)
)
```

Note that, unlike `fetch`, the request does not start until you `observe` the `request$` object.

## API

### `ajax\$(url: string, options?: AjaxOptions): Observable<ObsResponse, NetworkError>`

A function that makes a URL & an optional options object and creates a new request Observable.

#### `url`

`url` should be a string representing the request target.

#### `options`

`options` can be an object with the values needed for the request. These include:

- method: `string` - Request method (`'GET'`, `'POST'`, etc.)
- headers: `HeadersInit` - A `Headers` object, or plain JavaScript object, with the headers to be included in the request.
- credentials: `'include' | 'omit' | 'same-origin'` - Whether and what kind of credentials to include with the request.
- body: `string` - The request body to include.

All of these values are optional.

### `NetworkError`

An object emitted by the request Observable if any issues occur with the network. These include generic network errors or timeouts as a result of the request taking too long. The `NetworkError` has a `type` property of either `error` or `timeout`, indicating which time of error occurred. It also has a read-only `message` property, containg a human-readable message of what happened.

### `ObsResponse`

An object emitted by the request Observable if the request completes successfully. This is emitted for all response codes.

#### Properties

- body: `string` - Response body.
- status: `number` - Response status code.
- ok: `boolean` - Whether the request was successful (2xx status code).
- statusText: `string` - Status message returned by the server.
- headers: `Headers` - Response headers.
- url: `string` - Response URL, following redirects.

#### Methods

- json(): `Property<unknown, TypeError>` - Returns a Property that contains either the parsed JSON or a TypeError if the JSON parsing failed.
