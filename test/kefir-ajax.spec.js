/* eslint-env jest */
import 'jest-kefir/extend-expect'
import {fakeServer} from 'nise'
import {ajax$, NetworkError, ObsResponse} from '../src/kefir-ajax'

const url = 'http://example.test/api/user'

describe('kefir-ajax', () => {
  /**
   * @type {import('nise').FakeServer}
   */
  let server

  beforeEach(() => {
    server = fakeServer.create()
  })

  afterEach(() => {
    server.restore()
  })

  describe('ajax$', () => {
    it('should default to GET request', () => {
      expect(ajax$(url)).toEmit([], () => {
        const [request] = server.requests

        expect(request.method).toBe('GET')
      })
    })

    it('should set method on request', () => {
      expect(
        ajax$(url, {
          method: 'POST',
        })
      ).toEmit([], () => {
        const [request] = server.requests

        expect(request.method).toBe('POST')
      })
    })

    it('should set headers on request', () => {
      expect(
        ajax$(url, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ).toEmit([], () => {
        const [request] = server.requests

        expect(request.requestHeaders).toEqual({
          'content-type': 'application/json;charset=utf-8',
        })
      })
    })

    it('should set include credentials on request', () => {
      expect(
        ajax$(url, {
          credentials: 'include',
        })
      ).toEmit([], () => {
        const [request] = server.requests

        expect(request.withCredentials).toBe(true)
      })
    })

    it('should set omit credentials on request', () => {
      expect(
        ajax$(url, {
          credentials: 'omit',
        })
      ).toEmit([], () => {
        const [request] = server.requests

        expect(request.withCredentials).toBe(false)
      })
    })

    it('should emit a network error on error', () => {
      expect(ajax$(url)).toEmit([KTU.error(new NetworkError('error')), KTU.end()], () => {
        server.requests[0].error()
      })
    })

    it('should emit a network error on error', () => {
      expect(ajax$(url)).toEmit([KTU.error(new NetworkError('timeout')), KTU.end()], () => {
        server.requests[0].triggerTimeout()
      })
    })

    it('should emit an ObsResponse on success', () => {
      const body = JSON.stringify({name: 'Kefir '})
      server.respondWith('GET', url, [200, {'Content-Type': 'application/json'}, body])

      expect(ajax$(url)).toEmit(
        [
          KTU.value(
            new ObsResponse(body, {
              status: 200,
              // TODO(mAAdhaTTah) should be the variable
              url: '',
              headers: {
                'Content-Type': 'application/json',
              },
            })
          ),
          KTU.end(),
        ],
        () => {
          server.respond()
        }
      )
    })
  })

  describe('ObsResponse', () => {
    it('should emit parsed JSON body', () => {
      const body = {
        name: 'Kefir',
      }
      const response = new ObsResponse(JSON.stringify(body))

      expect(response.json()).toEmit([KTU.value(body, {current: true}), KTU.end({current: true})])
    })

    it('should emit TypeError on JSON body parse failure', () => {
      const body = {
        name: 'Kefir',
      }
      const response = new ObsResponse('{')

      expect(response.json()).toEmit([
        KTU.error(new TypeError('Error parsing JSON response: Unexpected end of JSON input'), {current: true}),
        KTU.end({current: true}),
      ])
    })
  })
})
