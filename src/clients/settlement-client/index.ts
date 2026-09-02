import BaseClient from '../base-client/base'
import { type Settlement, type GetSettlementsProps, type SettlementDetail } from './types'

/**
 * FlowSettlementClient provides methods to manage settlements through the API.
 */
export class FlowSettlementClient extends BaseClient {
    /**
     * Retrieves a list of settlements in a date range.
     * @param props - Filters to apply when searching for settlements.
     * @returns A promise resolving to the settlement headers in the range.
     */
    async getSettlements (props: GetSettlementsProps): Promise<Settlement[]> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const query = this.generateSearchParams({ ...props, apiKey: this.apiKey, s: signature }).toString()
        const url = `${this.baseURL}/settlement/search?${query}`
        return await this.request(url)
    }

    /**
     * Retrieves details of a specific settlement by its ID.
     *
     * Uses `settlement/getByIdv2`, the current detail operation. `id` travels as a
     * query parameter — Flow does not expose a `settlement/{id}` path, and the
     * `settlement/getById` operation is deprecated.
     * @param id - The ID of the settlement to fetch.
     * @returns A promise resolving to the settlement details.
     */
    async getSettlement (id: string | number): Promise<SettlementDetail> {
        const signature = this.signParams({ apiKey: this.apiKey, id })
        const query = this.generateSearchParams({ apiKey: this.apiKey, id, s: signature }).toString()
        return await this.request(`${this.baseURL}/settlement/getByIdv2?${query}`)
    }
}
