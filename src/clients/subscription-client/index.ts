import { type ListResponse, type Filter } from '../../types'
import BaseClient from '../base-client/base'
import { type Subscription, type SubscriptionProps } from './types'

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
    async cancelSubscription ({ subscriptionId, atPeriodEnd }: { subscriptionId: string, atPeriodEnd: number }): Promise<Subscription> {
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
}
