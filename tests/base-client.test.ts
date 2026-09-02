import * as z from 'zod'
import BaseClient, { type RequestParams } from '../src/clients/base-client/base'
import { FlowError } from '../src/error/FlowError'
import { FlowRefundClient } from '../src/clients/refund-client'

class TestClient extends BaseClient {
    sign (params: RequestParams): string {
        return this.signParams(params)
    }

    search (params: RequestParams): URLSearchParams {
        return this.generateSearchParams(params)
    }

    parse<T> (params: T, schema: z.ZodType<T>): T {
        return this.parseParams(params, schema)
    }
}

const client = new TestClient('APIKEY', 'development', 'SECRET')

describe('BaseClient.signParams', () => {
    test('produces the expected HMAC-SHA256 hex digest for a known input', () => {
        expect(client.sign({ token: 'abc' })).toBe('cab205316e980c2ca8f082287efa260e357263c26c58b6ffc664c8bea75f9bc5')
    })

    test('injects apiKey into the signed text', () => {
        const withApiKey = client.sign({})
        const explicit = client.sign({ apiKey: 'APIKEY' })
        expect(withApiKey).toBe(explicit)
    })

    test('does not depend on the order the parameters were declared in', () => {
        expect(client.sign({ a: '1', b: '2' })).toBe(client.sign({ b: '2', a: '1' }))
    })

    test('excludes an existing `s` key from the signed text', () => {
        expect(client.sign({ token: 'abc', s: 'IGNORED' })).toBe(client.sign({ token: 'abc' }))
    })

    test('ignores parameters whose value is undefined or null', () => {
        expect(client.sign({ token: 'abc', limit: undefined, filter: null })).toBe(client.sign({ token: 'abc' }))
    })
})

describe('BaseClient.generateSearchParams', () => {
    test('drops undefined and null values', () => {
        expect(client.search({ a: '1', b: undefined, c: null }).toString()).toBe('a=1')
    })

    test('accepts boolean values', () => {
        expect(client.search({ flag: true }).get('flag')).toBe('true')
    })

    test('encodes reserved characters so the value survives intact', () => {
        const params = client.search({ x: 'a b&c=d' })
        expect(params.get('x')).toBe('a b&c=d')
        expect(params.toString()).toBe('x=a+b%26c%3Dd')
    })
})

describe('BaseClient.parseParams', () => {
    test('throws a FlowError, not a bare Error, when validation fails', () => {
        const schema = z.object({ amount: z.number().positive() })
        expect(() => client.parse({ amount: -1 } as unknown as { amount: number }, schema)).toThrow(FlowError)
    })
})

describe('error propagation', () => {
    const refunds = new FlowRefundClient('APIKEY', 'development', 'SECRET')
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
        originalFetch = globalThis.fetch
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    test('a validation failure throws FlowError before any network call', async () => {
        let called = false
        globalThis.fetch = (async () => {
            called = true
            return {} as unknown as Response
        }) as typeof globalThis.fetch
        await expect(refunds.generateRefund({ refundCommerceOrder: 'r', receiverEmail: 'not-an-email', amount: 10, urlCallBack: 'https://x.example.com' })).rejects.toBeInstanceOf(FlowError)
        expect(called).toBe(false)
    })

    test('a non-2xx Flow response throws FlowHTTPError carrying the code, message and url', async () => {
        globalThis.fetch = (async (input: RequestInfo | URL) => ({
            ok: false,
            url: typeof input === 'string' ? input : input.toString(),
            json: async () => ({ message: 'Invalid API key', code: '1101' })
        })) as unknown as typeof globalThis.fetch
        await expect(refunds.getRefundStatus('tok')).rejects.toMatchObject({ code: '1101', message: 'Invalid API key' })
    })
})
