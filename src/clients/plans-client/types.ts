import * as z from 'zod'

export const PlansPropsSchema = z.object({
    planId: z.string(),
    name: z.string(),
    currency: z.string().optional(),
    amount: z.number().positive(),
    interval: z.enum(['1', '2', '3', '4']),
    interval_count: z.number().positive().optional(),
    trial_period_days: z.number().optional(),
    days_until_due: z.number().optional(),
    periods_number: z.number().optional(),
    urlCallback: z.string().url(),
    charges_retries_number: z.number().optional(),
    currency_convert_option: z.enum(['1', '2']).optional()
})
export type PlansProps = z.infer<typeof PlansPropsSchema>

export interface PlansResponse {
    planId: string
    name: string
    currency: string
    amount: number
    interval: number
    interval_count: number
    created: string
    trial_period_days: number
    days_until_due: number
    periods_number: number
    urlCallback: string
    charges_retries_number: number
    currency_convert_option: number
    status: number
    public: number
}

export const ListPlansPropsSchema = z.object({
    start: z.number().optional(),
    limit: z.number().optional(),
    filter: z.string().optional(),
    status: z.enum(['0', '1', '2']).optional()
})

export type ListPlansProps = z.infer<typeof ListPlansPropsSchema>

export interface ListPlansResponse {
    total: number
    hasMore: boolean
    data: unknown[]
}
