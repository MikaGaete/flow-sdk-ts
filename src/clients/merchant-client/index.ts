import { type ListResponse } from '../../types'
import BaseClient from '../base-client/base'
import { type AssociatedCommerce, type AssociatedCommerceProps, type DeleteCommerceResponse, type AssociatedCommercesListProps } from './types'

/**
 * FlowMerchantClient provides methods to manage associated commerces through the API.
 */
export class FlowMerchantClient extends BaseClient {
    /**
     * Creates a new associated commerce.
     * @param props - Properties of the associated commerce to create.
     * @returns A promise resolving to the created associated commerce.
     */
    async generateAssociatedCommerce (props: AssociatedCommerceProps): Promise<AssociatedCommerce> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, s: signature })
        return await this.request(`${this.baseURL}/merchant/create`, { method: 'POST', body })
    }

    /**
     * Edits an existing associated commerce.
     * @param props - Properties to update for the associated commerce.
     * @returns A promise resolving to the updated associated commerce.
     */
    async editAssociatedCommerce (props: AssociatedCommerceProps): Promise<AssociatedCommerce> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, s: signature })
        return await this.request(`${this.baseURL}/merchant/edit`, { method: 'POST', body })
    }

    /**
     * Deletes an associated commerce by its ID.
     * @param commerceId - The ID of the associated commerce to delete.
     * @returns A promise resolving to the response of the deletion operation.
     */
    async deleteAssociatedCommerce (commerceId: string): Promise<DeleteCommerceResponse> {
        const signature = this.signParams({ id: commerceId, apiKey: this.apiKey })
        const body = this.generateSearchParams({ id: commerceId, s: signature })
        return await this.request(`${this.baseURL}/merchant/delete`, { method: 'POST', body })
    }

    /**
     * Retrieves an associated commerce by its ID.
     * @param commerceId - The ID of the associated commerce to fetch.
     * @returns A promise resolving to the associated commerce properties.
     */
    async getAssociatedCommerce (commerceId: string): Promise<AssociatedCommerceProps> {
        const signature = this.signParams({ id: commerceId, apiKey: this.apiKey })
        const params = this.generateSearchParams({ id: commerceId, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/merchant/get?${params}`)
    }

    /**
     * Retrieves a list of associated commerces based on filters.
     * @param props - Filters to apply when fetching the list of associated commerces.
     * @returns A promise resolving to the list of associated commerces.
     */
    async getListOfAssociatedCommerces (props: AssociatedCommercesListProps): Promise<ListResponse<AssociatedCommerce>> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const params = this.generateSearchParams({ ...props, apiKey: this.apiKey, s: signature }).toString()
        return await this.request(`${this.baseURL}/merchant/list?${params}`)
    }
}
