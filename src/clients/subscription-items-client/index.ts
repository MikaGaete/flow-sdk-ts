import { type Filter, type ListResponse } from '../../types'
import BaseClient from '../base-client/base'
import { type CreateItemProps, type DeleteItemProps, type EditItemProps, type ItemAdditional, createItemPropsSchema, deleteItemPropsSchema, editItemPropsSchema } from './types'

/**
 * FlowSubscriptionItemsClient manages the catalogue of additional items that can
 * be charged on top of a subscription's base plan.
 *
 * NOTE: Flow declares these routes in the SINGULAR (`/subscription_item/...`),
 * even though the resource is plural everywhere else in this SDK. Do not "fix"
 * the path to `/subscription_items/...`.
 */
export class FlowSubscriptionItemsClient extends BaseClient {
    /**
     * Creates a new additional item.
     * @param props - The item name, currency and amount.
     * @returns A promise resolving to the created item.
     */
    async createItem (props: CreateItemProps): Promise<ItemAdditional> {
        const params = this.parseParams(props, createItemPropsSchema)
        const signature = this.signParams({ ...params, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...params, apiKey: this.apiKey, s: signature })
        return await this.request(`${this.baseURL}/subscription_item/create`, { method: 'POST', body })
    }

    /**
     * Retrieves an additional item by its identifier.
     * @param itemId - The additional item identifier.
     * @returns A promise resolving to the item.
     */
    async getItem (itemId: string): Promise<ItemAdditional> {
        const signature = this.signParams({ itemId, apiKey: this.apiKey })
        const query = this.generateSearchParams({ itemId, apiKey: this.apiKey, s: signature }).toString()
        return await this.request(`${this.baseURL}/subscription_item/get?${query}`)
    }

    /**
     * Edits an additional item.
     * @param props - The item id plus the fields to update (`name`, `amount`, `changeType`).
     * @returns A promise resolving to the updated item.
     */
    async editItem (props: EditItemProps): Promise<ItemAdditional> {
        const params = this.parseParams(props, editItemPropsSchema)
        const signature = this.signParams({ ...params, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...params, apiKey: this.apiKey, s: signature })
        return await this.request(`${this.baseURL}/subscription_item/edit`, { method: 'POST', body })
    }

    /**
     * Deletes an additional item.
     * @param props - The item id and the change type (`to_future` or `all`).
     * @returns A promise resolving to the item.
     */
    async deleteItem (props: DeleteItemProps): Promise<ItemAdditional> {
        const params = this.parseParams(props, deleteItemPropsSchema)
        const signature = this.signParams({ ...params, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...params, apiKey: this.apiKey, s: signature })
        return await this.request(`${this.baseURL}/subscription_item/delete`, { method: 'POST', body })
    }

    /**
     * Lists the additional items of the commerce.
     * @param props - Optional pagination, text filter and status filter.
     * @returns A promise resolving to a paginated list of items.
     */
    async listItems (props?: Filter): Promise<ListResponse<ItemAdditional>> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const query = this.generateSearchParams({ ...props, apiKey: this.apiKey, s: signature }).toString()
        return await this.request(`${this.baseURL}/subscription_item/list?${query}`)
    }
}
