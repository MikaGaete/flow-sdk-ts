import BaseClient from '../base-client/base'
import {
    type ListPlansProps,
    type PlansProps,
    type ListPlansResponse,
    type PlansResponse
} from './types'

export class FlowPlansClient extends BaseClient {
    /**
     * Generates a subscription plan.
     * @param {PlansProps} props - The properties for creating the subscription.
     * @returns {Promise<PlansResponse>} The response containing the subscription details.
     */
    async generatePlan (props: PlansProps): Promise<PlansResponse> {
        const url = `${this.baseURL}/plans/create`
        const body = this.generateSearchParams({ ...props, apiKey: this.apiKey, s: this.signParams({ ...props, apiKey: this.apiKey }) })
        return await this.request<PlansResponse>(url, { method: 'POST', body })
    }

    /**
     * Retrieves details of a subscription plan.
     * @param {string} planId - The ID of the plan to retrieve details for.
     * @returns {Promise<PlansResponse>} The response containing the plan details.
     */
    async getPlanDetails (planId: string): Promise<PlansResponse> {
        const url = `${this.baseURL}/plans/get?apiKey=${this.apiKey}&planId=${planId}&s=${this.signParams({ planId, apiKey: this.apiKey })}`
        return await this.request<PlansResponse>(url)
    }

    /**
     * Edits details of a subscription plan.
     * @param {SubscriptionProps} props - The properties for editing the subscription plan.
     * @returns {Promise<PlansResponse>} The response containing the updated plan details.
     */
    async editPlanDetails (props: PlansProps): Promise<PlansResponse> {
        const url = `${this.baseURL}/plans/edit`
        const body = this.generateSearchParams({ ...props, apiKey: this.apiKey, s: this.signParams({ ...props, apiKey: this.apiKey }) })
        return await this.request<PlansResponse>(url, { method: 'POST', body })
    }

    /**
     * Deletes a subscription plan.
     * @param {string} planId - The ID of the plan to delete.
     * @returns {Promise<PlansResponse>} The response indicating the success of the deletion.
     */
    async deletePlan (planId: string): Promise<PlansResponse> {
        const url = `${this.baseURL}/plans/delete`
        const body = this.generateSearchParams({ apiKey: this.apiKey, planId, s: this.signParams({ planId, apiKey: this.apiKey }) })
        return await this.request<PlansResponse>(url, { method: 'POST', body })
    }

    /**
     * Lists plans based on provided properties.
     * @param {ListPlansProps & Record<string, string | number>} props - Additional properties for listing plans.
     * @returns {Promise<ListPlansResponse>} The response containing the list of plans.
     */
    async listPlans (props: ListPlansProps): Promise<ListPlansResponse> {
        const params = this.generateSearchParams({ ...props, apiKey: this.apiKey }).toString()
        const url = `${this.baseURL}/plans/list?${params}&s=${this.signParams(props)}`
        return await this.request<ListPlansResponse>(url)
    }
}
