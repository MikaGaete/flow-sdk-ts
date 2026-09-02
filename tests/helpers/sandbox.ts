/**
 * Support for the optional live sandbox tests (`tests/sandbox.test.ts`).
 *
 * Credentials are read from `FLOW_API_KEY` / `FLOW_SECRET`. If they are not in
 * the environment this loader parses a `.env` file at the repo root (a minimal
 * `KEY=VALUE` parser — no dependency). When no credentials are found the sandbox
 * suite skips itself, so `yarn test` stays green offline.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Flow } from '../../src/clients/flow-client'
import { type Environments } from '../../src/clients/base-client/base'

const loadDotEnv = (): void => {
    try {
        const raw = readFileSync(resolve(__dirname, '../../.env'), 'utf8')
        for (const line of raw.split('\n')) {
            const trimmed = line.trim()
            if (trimmed === '' || trimmed.startsWith('#')) {
                continue
            }
            const eq = trimmed.indexOf('=')
            if (eq === -1) {
                continue
            }
            const key = trimmed.slice(0, eq).trim()
            let value = trimmed.slice(eq + 1).trim()
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1)
            }
            if (process.env[key] === undefined) {
                process.env[key] = value
            }
        }
    }
    catch {
        // no .env file — fine, credentials may still be in the real environment
    }
}

loadDotEnv()

const apiKey = process.env.FLOW_API_KEY
const secret = process.env.FLOW_SECRET
const env = (process.env.FLOW_ENV as Environments | undefined) ?? 'development'

/** Whether live sandbox credentials are available. */
export const hasSandboxCredentials = typeof apiKey === 'string' && apiKey !== '' && typeof secret === 'string' && secret !== ''

/**
 * `describe` when credentials are present, `describe.skip` otherwise. Use this
 * for every live block so the suite is a no-op without a `.env`.
 */
export const describeSandbox: jest.Describe = hasSandboxCredentials ? describe : describe.skip

/** Builds a `Flow` client from the sandbox credentials. Throws if they are missing. */
export const sandboxFlow = (): Flow => {
    if (!hasSandboxCredentials) {
        throw new Error('Sandbox credentials are not set')
    }
    return new Flow(apiKey as string, env, secret as string)
}
