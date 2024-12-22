import BaseClient from '../base-client/base'
import { type SettlementPayment, type GetSettlementsProps, type SettlementDetail } from './types'

/**
 * FlowSettlementClient provides methods to manage settlements through the API.
 */
export class FlowSettlementClient extends BaseClient {
    /**
     * Retrieves a list of settlements based on the provided filters.
     * @param props - Filters to apply when searching for settlements.
     * @returns A promise resolving to a list of settlement payments.
     */
    async getSettlements (props: GetSettlementsProps): Promise<SettlementPayment[]> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const query = this.generateSearchParams({ ...props, apiKey: this.apiKey, s: signature }).toString()
        const url = `${this.baseURL}/settlement/search?${query}`
        return await this.request(url)
    }

    /**
     * Retrieves details of a specific settlement by its ID.
     * @param id - The ID of the settlement to fetch.
     * @returns A promise resolving to the settlement details.
     */
    async getSettlement (id: number): Promise<SettlementDetail> {
        const signature = this.signParams({ apiKey: this.apiKey, id })
        const query = this.generateSearchParams({ apiKey: this.apiKey, s: signature, id }).toString()
        const url = `${this.baseURL}/settlement/${id}?${query}`
        return await this.request(url)
    }
}
