import { type ListResponse, type Filter } from '../../types'
import BaseClient from '../base-client/base'
import { type Subscription, type SubscriptionChangePlanCancelResponse, type SubscriptionChangePlanPreviewResponse, type SubscriptionChangePlanResponse, type SubscriptionItemChangeResponse, type SubscriptionItemQuantityResponse, type SubscriptionProps } from './types'

/**
 * FlowSubscriptionClient provides methods to manage subscriptions through the API.
 */
export class FlowSubscriptionClient extends BaseClient {
    /**
     * Creates a new subscription.
     * @param props - Properties of the subscription to create.
     * @returns A promise resolving to the created subscription.
     */
    async generateSubscription (props: SubscriptionProps): Promise<Subscription> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/create`, { method: 'POST', body })
    }

    /**
     * Retrieves a subscription by its ID.
     * @param subscriptionId - The ID of the subscription to fetch.
     * @returns A promise resolving to the subscription.
     */
    async getSubscription (subscriptionId: string): Promise<Subscription> {
        const signature = this.signParams({ subscriptionId, apiKey: this.apiKey })
        const params = this.generateSearchParams({ subscriptionId, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/subscription/get?${params}`)
    }

    /**
     * Retrieves the subscription list of a given plan based on filters.
     * @param planId - The ID of the plan to fetch subscriptions for.
     * @param filter - Filters to apply when fetching subscriptions.
     * @returns A promise resolving to the list of subscriptions.
     */
    async getSubscriptions (planId: string, filter?: Filter): Promise<ListResponse<Subscription>> {
        const signature = this.signParams({ ...filter, planId: planId, apiKey: this.apiKey })
        const params = this.generateSearchParams({ ...filter, planId: planId, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/subscription/list?${params}`)
    }

    /**
     * Changes the trial period days of a subscription.
     * @param params - Parameters including the subscription ID and new trial period days.
     * @returns A promise resolving to the updated subscription.
     */
    async changeTrialDays ({ subscriptionId, trialPeriodDays }: { subscriptionId: string, trialPeriodDays: number }): Promise<Subscription> {
        const signature = this.signParams({ subscriptionId, trial_period_days: trialPeriodDays, apiKey: this.apiKey })
        const body = this.generateSearchParams({ subscriptionId, trial_period_days: trialPeriodDays, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/changeTrial`, { method: 'POST', body })
    }

    /**
     * Cancels a subscription.
     * @param params - Parameters including the subscription ID and whether to cancel at the period end.
     * @returns A promise resolving to the canceled subscription.
     */
    async cancelSubscription ({ subscriptionId, atPeriodEnd }: { subscriptionId: string, atPeriodEnd?: number }): Promise<Subscription> {
        const signature = this.signParams({ subscriptionId, at_period_end: atPeriodEnd, apiKey: this.apiKey })
        const body = this.generateSearchParams({ subscriptionId, at_period_end: atPeriodEnd, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/cancel`, { method: 'POST', body })
    }

    /**
     * Adds a discount coupon to a subscription.
     * @param params - Parameters including the subscription ID and coupon ID.
     * @returns A promise resolving to the updated subscription.
     */
    async addDiscountCoupon ({ subscriptionId, couponId }: { subscriptionId: string, couponId: number }): Promise<Subscription> {
        const signature = this.signParams({ subscriptionId, couponId, apiKey: this.apiKey })
        const body = this.generateSearchParams({ subscriptionId, couponId, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/addCoupon`, { method: 'POST', body })
    }

    /**
     * Deletes a discount coupon from a subscription.
     * @param subscriptionId - The ID of the subscription to remove the discount coupon from.
     * @returns A promise resolving to the updated subscription.
     */
    async deleteDiscountCoupon (subscriptionId: string): Promise<Subscription> {
        const signature = this.signParams({ subscriptionId, apiKey: this.apiKey })
        const body = this.generateSearchParams({ subscriptionId, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/deleteCoupon`, { method: 'POST', body })
    }

    /**
     * Adds an additional item to a subscription.
     * @param params - The subscription id, the item id and, optionally, the quantity.
     * @param params.subscriptionId - The subscription to add the item to.
     * @param params.itemId - The additional item identifier.
     * @param params.quantity - Units to add, from 1 to 999. When omitted no value is sent and Flow applies its default of 1.
     * @returns A promise resolving to the item/quantity result.
     */
    async addItem ({ subscriptionId, itemId, quantity }: { subscriptionId: string, itemId: number, quantity?: number }): Promise<SubscriptionItemQuantityResponse> {
        const signature = this.signParams({ subscriptionId, itemId, quantity, apiKey: this.apiKey })
        const body = this.generateSearchParams({ subscriptionId, itemId, quantity, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/addItem`, { method: 'POST', body })
    }

    /**
     * Updates the quantity of an additional item already on a subscription.
     * @param params - The subscription id, the item id and the new quantity.
     * @param params.subscriptionId - The subscription that holds the item.
     * @param params.itemId - The additional item identifier.
     * @param params.quantity - The new quantity, from 1 to 999.
     * @returns A promise resolving to the item/quantity result.
     */
    async updateItem ({ subscriptionId, itemId, quantity }: { subscriptionId: string, itemId: number, quantity: number }): Promise<SubscriptionItemQuantityResponse> {
        const signature = this.signParams({ subscriptionId, itemId, quantity, apiKey: this.apiKey })
        const body = this.generateSearchParams({ subscriptionId, itemId, quantity, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/updateItem`, { method: 'POST', body })
    }

    /**
     * Removes an additional item from a subscription.
     * @param params - The subscription id and the item id.
     * @param params.subscriptionId - The subscription that holds the item.
     * @param params.itemId - The additional item identifier.
     * @returns A promise resolving to the removal result.
     */
    async deleteItem ({ subscriptionId, itemId }: { subscriptionId: string, itemId: number }): Promise<SubscriptionItemChangeResponse> {
        const signature = this.signParams({ subscriptionId, itemId, apiKey: this.apiKey })
        const body = this.generateSearchParams({ subscriptionId, itemId, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/deleteItem`, { method: 'POST', body })
    }

    /**
     * Changes the plan associated with a subscription.
     * @param params - The subscription id, the new plan id and, optionally, the change date.
     * @param params.subscriptionId - The subscription to change.
     * @param params.newPlanId - The identifier of the new plan.
     * @param params.startDateOfNewPlan - Date (`yyyy-mm-dd`) the change takes effect, within the current billing cycle. When omitted the change is immediate.
     * @returns A promise resolving to the plan-change result.
     */
    async changePlan ({ subscriptionId, newPlanId, startDateOfNewPlan }: { subscriptionId: string, newPlanId: string, startDateOfNewPlan?: string }): Promise<SubscriptionChangePlanResponse> {
        const signature = this.signParams({ subscriptionId, newPlanId, startDateOfNewPlan, apiKey: this.apiKey })
        const body = this.generateSearchParams({ subscriptionId, newPlanId, startDateOfNewPlan, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/changePlan`, { method: 'POST', body })
    }

    /**
     * Previews the effect of changing a subscription's plan without applying it.
     * @param params - The subscription id, the candidate plan id and, optionally, the change date.
     * @param params.subscriptionId - The subscription to preview.
     * @param params.newPlanId - The identifier of the candidate plan.
     * @param params.startDateOfNewPlan - Date (`yyyy-mm-dd`) to preview the change for. (Optional)
     * @returns A promise resolving to the estimated effect. The subscription is not modified.
     */
    async previewPlanChange ({ subscriptionId, newPlanId, startDateOfNewPlan }: { subscriptionId: string, newPlanId: string, startDateOfNewPlan?: string }): Promise<SubscriptionChangePlanPreviewResponse> {
        const signature = this.signParams({ subscriptionId, newPlanId, startDateOfNewPlan, apiKey: this.apiKey })
        const body = this.generateSearchParams({ subscriptionId, newPlanId, startDateOfNewPlan, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/changePlanPreview`, { method: 'POST', body })
    }

    /**
     * Cancels a scheduled plan change that has not been applied yet.
     * @param subscriptionId - The subscription whose scheduled plan change is cancelled.
     * @returns A promise resolving to the cancellation result.
     */
    async cancelPlanChange (subscriptionId: string): Promise<SubscriptionChangePlanCancelResponse> {
        const signature = this.signParams({ subscriptionId, apiKey: this.apiKey })
        const body = this.generateSearchParams({ subscriptionId, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/subscription/changePlanCancel`, { method: 'POST', body })
    }
}
