import * as z from 'zod'

/** An additional-item catalogue entry, as Flow returns it. */
export interface ItemAdditional {
    id: number
    name: string
    amount: number
    currency: string
    associatedSubscriptionsCount: number
    status: number
    created: string
}

export const createItemPropsSchema = z.object({
    name: z.string(),
    currency: z.string(),
    /** Negative is a discount, positive is a surcharge. */
    amount: z.number()
})

export type CreateItemProps = z.infer<typeof createItemPropsSchema>

export const editItemPropsSchema = z.object({
    itemId: z.string(),
    name: z.string().optional(),
    amount: z.number().optional(),
    /** Required by Flow when `name` or `amount` is sent: `to_future` or `all`. */
    changeType: z.enum(['to_future', 'all']).optional()
}).refine(
    (props) => (props.name === undefined && props.amount === undefined) || props.changeType !== undefined,
    { message: 'changeType is required when name or amount is sent', path: ['changeType'] }
)

export type EditItemProps = z.infer<typeof editItemPropsSchema>

export const deleteItemPropsSchema = z.object({
    itemId: z.string(),
    changeType: z.enum(['to_future', 'all'])
})

export type DeleteItemProps = z.infer<typeof deleteItemPropsSchema>
