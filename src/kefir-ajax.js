import Kefir from 'kefir'

/**
 * Parses the headers string into a Headers object.
 * Borrowed from whatwg-fetch.
 *
 * @param {string} rawHeaders
 */
function parseHeaders(rawHeaders = '') {
  const headers = new Headers()
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  const preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ')
  preProcessedHeaders.split(/\r?\n/).forEach(line => {
    const parts = line.split(':')
    const part = parts.shift()
    if (!part) return
    const key = part.trim()
    if (key) {
      const value = parts.join(':').trim()
      headers.append(key, value)
    }
  })
  return headers
}

/**
 * Options provided when creating an ObsResponse.
 *
 * @typedef {Object} ObsResponseOptions
 * @property {number} [status]
 * @property {string} [statusText]
 * @property {HeadersInit} [headers]
 * @property {string | null} [url]
 */

/**
 * Represents an Ajax response, wrapped in an Observable.
 */
export class ObsResponse {
  /**
   * Create a new ObsResponse.
   *
   * @param {string} body
   * @param {ObsResponseOptions} options
   */
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status === undefined ? 200 : options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = 'statusText' in options ? options.statusText : 'OK'
    this.headers = new Headers(options.headers)
    this.url = options.url || ''
  }

  /**
   * Parse the response body as JSON.
   *
   * @returns {import('kefir').Property<unknown, TypeError>}
   */
  json() {
    try {
      return Kefir.constant(JSON.parse(this.body))
    } catch (e) {
      return Kefir.constantError(new TypeError(`Error parsing JSON response: ${e.message}`))
    }
  }
}

/**
 * Created when a network error occurred.
 *
 * Includes the type of error, either a generic "error",
 * from the `onerror` event, or a `timeout`.
 *
 * The provided type is mapped to a message property,
 * similar to normal error objects, but it does not contain
 * a stack trace.
 */
export class NetworkError {
  /**
   * Create a new NetworkError.
   *
   * @param {'error' | 'timeout'} type
   */
  constructor(type) {
    this.type = type
  }

  get message() {
    switch (this.type) {
      case 'error':
        return 'A network error occurred'
      case 'timeout':
        return 'The request timed out'
    }
  }
}

/**
 * Options provided when making an Ajax call.
 *
 * @typedef {Object} AjaxOptions
 * @property {string} [method]
 * @property {HeadersInit} [headers]
 * @property {'include' | 'omit' | 'same-origin'} [credentials]
 * @property {string} [body]
 */

/**
 * Create an ajax request wrapped in an Observable.
 *
 * @param {string} url
 * @param {AjaxOptions} [options]
 * @returns {import("kefir").Observable<ObsResponse, NetworkError>}
 */
export const ajax$ = (url, {method = 'GET', headers = {}, credentials = 'same-origin', body = ''} = {}) =>
  Kefir.stream(emitter => {
    const xhr = new XMLHttpRequest()

    xhr.onload = () => {
      const headers = parseHeaders(xhr.getAllResponseHeaders())
      /** @type {ObsResponseOptions} */
      const options = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: headers,
      }

      options.url = xhr.responseURL || headers.get('X-Request-URL')
      const body = xhr.response ?? xhr.responseText
      return emitter.value(new ObsResponse(body, options))
    }

    xhr.onerror = () => emitter.error(new NetworkError('error'))
    xhr.ontimeout = () => emitter.error(new NetworkError('timeout'))

    xhr.open(method, url, true)

    if (credentials === 'include') {
      xhr.withCredentials = true
    } else if (credentials === 'omit') {
      xhr.withCredentials = false
    }

    if (headers) {
      headers = new Headers(headers)
    }

    headers.forEach((value, name) => {
      xhr.setRequestHeader(name, value)
    })

    xhr.send(body !== void 0 ? body : null)

    return () => xhr.abort()
  })
    .take(1)
    .takeErrors(1)
    .setName('ajax$')
