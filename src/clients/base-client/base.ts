import z from 'zod'
import { FlowError, FlowHTTPError } from '../../error/FlowError'
import { createHmac } from 'crypto'
export type Environments = 'development' | 'production'

/**
 * Shape of the parameters accepted by both `signParams` and `generateSearchParams`.
 * `undefined` and `null` values are allowed so an omitted optional field can be
 * passed through without a conversion at the call site; both are dropped before
 * the parameters are signed or serialized.
 */
export type RequestParams = Record<string, string | number | boolean | undefined | null>

export default abstract class BaseClient {
    protected apiKey: string
    protected env: Environments
    protected baseURL: string
    protected secret: string

    constructor (apiKey: string, env: Environments, secret: string) {
        this.apiKey = apiKey
        this.env = env
        this.baseURL = env === 'development' ? 'https://sandbox.flow.cl/api' : 'https://www.flow.cl/api'
        this.secret = secret
    }

    /**
     * Sends a request to Flow and returns the parsed JSON body.
     * @param endpoint - The absolute URL to request.
     * @param options - Optional `fetch` init (method, body, ...).
     * @returns A promise resolving to the parsed response body.
     * @throws {FlowHTTPError} When Flow responds with a status outside the 2xx range.
     */
    protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        const config: RequestInit = {
            ...options,
            headers
        }

        try {
            const response = await fetch(endpoint, config)
            const responseData = await response.json()
            if (!response.ok) {
                throw new FlowHTTPError(responseData?.message as string ?? 'Unknown HTTP error', responseData?.code as string ?? 'Unknown', response.url)
            }
            return responseData
        }
        catch (error) {
            if (error instanceof FlowHTTPError) {
                error.log()
                throw error
            }
            else {
                throw new Error(`Unexpected error: \n${error as string}`)
            }
        }
    }

    /**
     * Drops `undefined` / `null` entries and stringifies the rest, so an omitted
     * optional parameter never reaches Flow as the literal string `"undefined"`.
     * @param params - The raw parameter object.
     * @returns A record with only the present parameters, each as a string.
     */
    private cleanParams (params: RequestParams): Record<string, string> {
        const clean: Record<string, string> = {}
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                clean[key] = String(value)
            }
        }
        return clean
    }

    /**
     * Computes the Flow request signature: an HMAC-SHA256 hex digest over the
     * alphabetically-sorted `key + value` concatenation of every present
     * parameter, with `apiKey` injected and `s` excluded.
     * @param params - The parameters to sign (`undefined` / `null` entries are ignored).
     * @returns The hex-encoded signature.
     */
    protected signParams (params: RequestParams): string {
        const clean = this.cleanParams({ ...params, apiKey: this.apiKey })
        const keys = Object.keys(clean).sort()
        const concatenatedParams = keys.reduce((acc, key) => {
            if (key !== 's') {
                return `${acc}${key}${clean[key]}`
            }
            return acc
        }, '')
        const hmac = createHmac('sha256', this.secret)
        return hmac.update(concatenatedParams).digest('hex')
    }

    /**
     * Validates `params` against `schema`.
     * @param params - The value to validate.
     * @param schema - The zod schema to validate against.
     * @returns The parsed value.
     * @throws {FlowError} When validation fails; the message lists the offending fields.
     */
    protected parseParams<T>(params: T, schema: z.ZodType<T>): T {
        try {
            return schema.parse(params)
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const detail = error.issues.map((issue) => `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`).join('; ')
                throw new FlowError(detail, 'Invalid props')
            }
            throw new FlowError('Unexpected error while validating parameters', 'Validation error')
        }
    }

    /**
     * Builds a URL-encoded parameter set for a query string or request body.
     * @param params - The parameters to serialize (`undefined` / `null` entries are dropped).
     * @returns A `URLSearchParams` with every present value encoded.
     */
    protected generateSearchParams (params: RequestParams): URLSearchParams {
        return new URLSearchParams(this.cleanParams(params))
    }
}
