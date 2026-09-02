import { type Discount } from '../coupon-client/types'
import { type Invoice } from '../invoice-client/types'

export interface SubscriptionProps {
    planId: string
    customerId: string
    subscription_start?: string
    couponId?: number
    trial_period_days?: number
    periods_number: number
}

export interface Subscription {
    subscriptionId: string
    planId: string
    plan_name: string
    customerId: string
    created: string
    subscription_start: string
    subscription_end: string
    period_start: string
    period_end: string
    next_invoice_date: string
    trial_period_days: number
    trial_start: string
    trial_end: string
    cancel_at_period_end: number
    cancel_at: any
    periods_number: number
    days_until_due: number
    status: number
    morose: number
    discount: SubscriptionDiscount
    invoices: Invoice[]
}

export interface SubscriptionDiscount {
    id: number
    type: string
    created: string
    start: string
    end: string
    deleted: string
    status: number
    coupon: Discount
}

/**
 * Response of `subscription/addItem` and `subscription/updateItem`. Field names
 * are snake_case because they come straight from Flow.
 */
export interface SubscriptionItemQuantityResponse {
    sub_id: string
    item_id: number
    quantity: number
    success: boolean
}

/** Response of `subscription/deleteItem`. */
export interface SubscriptionItemChangeResponse {
    sub_id: string
    item_id: number
    success: boolean
}

/**
 * Response of `subscription/changePlan`. Note `new_amount` and `old_amount` are
 * strings while `balance` is a number — that is how Flow returns them.
 */
export interface SubscriptionChangePlanResponse {
    start_date_of_new_plan: string
    new_amount: string
    new_currency: string
    new_plan_id: string
    balance: number
    old_amount: string
    old_currency: string
    old_plan_id: string
}

export interface SubscriptionChangePlanPreviewPlan {
    name: string
    currency: string
    amount: string
    interval: number
    interval_count: number
    periods_number: number | null
}

/** Response of `subscription/changePlanPreview` — the estimated effect, nothing applied. */
export interface SubscriptionChangePlanPreviewResponse {
    balance: {
        amount: number
        credit_expiration_date: string | null
        credit_expiration_amount: number | null
        credit_expiration_warning: string | null
    }
    balance2: number
    next_invoice_date: string
    old_plan: SubscriptionChangePlanPreviewPlan
    new_plan: SubscriptionChangePlanPreviewPlan
}

/** Response of `subscription/changePlanCancel`. */
export interface SubscriptionChangePlanCancelResponse {
    success: boolean
}
