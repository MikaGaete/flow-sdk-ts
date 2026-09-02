import * as z from 'zod'

export const refundPropsSchema = z.object({
    refundCommerceOrder: z.string(),
    receiverEmail: z.string().email(),
    amount: z.number().positive('The amount must be a positive number'),
    urlCallBack: z.string().url(),
    /**
     * Identifier of the original transaction on the commerce side. Optional:
     * Flow declares neither `commerceTrxId` nor `flowTrxId` as required.
     */
    commerceTrxId: z.string().optional(),
    /**
     * Flow identifier of the original transaction. Optional, and a string —
     * Flow declares this field as `type: string`.
     */
    flowTrxId: z.string().optional()
})

export type RefundProps = z.infer<typeof refundPropsSchema>

export interface RefundResponse {
    token: string
    flowRefundOrder: string
    date: string
    status: string
    amount: string
    fee: string
}
