/**
 * Test double for `globalThis.fetch`. Captures the URL, method and body of every
 * request a client makes and returns a fixed JSON response, so tests can assert
 * exactly what the SDK sends to Flow without hitting the network.
 */

export interface CapturedRequest {
    url: string
    method: string
    params: URLSearchParams
    bodyText: string | undefined
}

let captured: CapturedRequest[] = []
let responseBody: unknown = {}
let originalFetch: typeof globalThis.fetch | undefined

/**
 * Installs the mock and clears any previously captured requests.
 */
export const installFetchMock = (): void => {
    captured = []
    responseBody = {}
    if (originalFetch === undefined) {
        originalFetch = globalThis.fetch
    }
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input.toString()
        const method = init?.method ?? 'GET'
        let bodyText: string | undefined
        if (init?.body !== undefined && init.body !== null) {
            bodyText = init.body instanceof URLSearchParams ? init.body.toString() : String(init.body)
        }
        const parsed = new URL(url)
        const params = new URLSearchParams(bodyText ?? parsed.search)
        captured.push({ url, method, params, bodyText })
        return {
            ok: true,
            url,
            json: async () => responseBody
        } as unknown as Response
    }) as typeof globalThis.fetch
}

/**
 * Restores the original `fetch`.
 */
export const restoreFetch = (): void => {
    if (originalFetch !== undefined) {
        globalThis.fetch = originalFetch
    }
}

/**
 * Sets the JSON body the mock returns for subsequent requests.
 */
export const setResponse = (body: unknown): void => {
    responseBody = body
}

/**
 * Returns the most recent captured request, or throws if none was made.
 */
export const lastRequest = (): CapturedRequest => {
    if (captured.length === 0) {
        throw new Error('No request was captured')
    }
    return captured[captured.length - 1]
}

/**
 * Returns every captured request in order.
 */
export const allRequests = (): CapturedRequest[] => captured

/**
 * Returns the pathname of the most recent request (e.g. `/api/payment/create`).
 */
export const lastPathname = (): string => new URL(lastRequest().url).pathname
