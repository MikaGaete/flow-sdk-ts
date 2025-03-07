import { type ListResponse } from '../../types'
import BaseClient from '../base-client/base'
import { type EditCouponProps, type DiscountCouponProps, type Discount, type DiscountCouponsListProps } from './types'

/**
 * FlowCouponClient provides methods to manage discount coupons through the API.
 */
export class FlowCouponClient extends BaseClient {
    /**
     * Generates a new discount coupon.
     * @param props - Properties of the discount coupon to create.
     * @returns A promise resolving to the created discount coupon.
     */
    async generateDiscountCoupon (props: DiscountCouponProps): Promise<Discount> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, apiKey: this.apiKey, s: signature })
        return await this.request(`${this.baseURL}/coupon/create`, { method: 'POST', body })
    }

    /**
     * Edits an existing discount coupon.
     * @param props - Properties to update for the discount coupon.
     * @returns A promise resolving to the updated discount coupon.
     */
    async editDiscountCoupon (props: EditCouponProps): Promise<Discount> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, apiKey: this.apiKey, s: signature })
        return await this.request(`${this.baseURL}/coupon/edit`, { method: 'POST', body })
    }

    /**
     * Deletes a discount coupon by its ID.
     * @param couponId - The ID of the discount coupon to delete.
     * @returns A promise resolving to the deleted discount coupon's data.
     */
    async deleteDiscountCoupon (couponId: string): Promise<Discount> {
        const signature = this.signParams({ couponId, apiKey: this.apiKey })
        const body = this.generateSearchParams({ couponId, apiKey: this.apiKey, s: signature })
        return await this.request(`${this.baseURL}/coupon/delete`, { method: 'POST', body })
    }

    /**
     * Retrieves a discount coupon by its ID.
     * @param couponId - The ID of the discount coupon to fetch.
     * @returns A promise resolving to the discount coupon.
     */
    async getDiscountCoupon (couponId: string): Promise<Discount> {
        const signature = this.signParams({ couponId, apiKey: this.apiKey })
        const params = this.generateSearchParams({ couponId, apiKey: this.apiKey, s: signature }).toString()
        return await this.request(`${this.baseURL}/coupon/get?${params}`)
    }

    /**
     * Retrieves a list of discount coupons based on filters.
     * @param props - Properties to filter the discount coupons list.
     * @returns A promise resolving to the list of discount coupons.
     */
    async getListOfDiscountCoupons (props: DiscountCouponsListProps): Promise<ListResponse<Discount>> {
        const signature = this.signParams(props)
        const params = this.generateSearchParams({ ...props, apiKey: this.apiKey, s: signature }).toString()
        return await this.request(`${this.baseURL}/coupon/list?${params}`)
    }
}
