import BaseClient from '../base-client/base'
import { type ExtendedPaymentOrderStatus, type NewPaymentOrderResponse, type PaymentOrderProps, type Payment, type RawNewPaymentOrderResponse, paymentOrderPropsSchema } from './types'

export class FlowPaymentClient extends BaseClient {
    /**
     * Retrieves the status of a payment order.
     * @param {string} transactionToken - The token associated with the transaction.
     * @returns {Promise<Payment>} A Promise that resolves to the status of the payment order.
     * @throws {Error} If the request fails or if the response does not contain valid payment order status data.
     */
    async getPaymentOrderStatus (transactionToken: string): Promise<Payment> {
        const signature = this.signParams({ token: transactionToken, apiKey: this.apiKey })
        const params = this.generateSearchParams({ token: transactionToken, apiKey: this.apiKey, s: signature }).toString()
        return await this.request<Payment>(`${this.baseURL}/payment/getStatus?${params}`)
    }

    /**
     * Retrieves the extended status of a payment order.
     * @param {string} transactionToken - The token associated with the transaction.
     * @returns {Promise<ExtendedPaymentOrderStatus>} A Promise that resolves to the extended status of the payment order.
     * @throws {Error} If the request fails or if the response does not contain valid extended payment order status data.
     */
    async getExtendedPaymentOrderStatus (transactionToken: string): Promise<ExtendedPaymentOrderStatus> {
        const signature = this.signParams({ token: transactionToken, apiKey: this.apiKey })
        const params = this.generateSearchParams({ token: transactionToken, apiKey: this.apiKey, s: signature }).toString()
        return await this.request<ExtendedPaymentOrderStatus>(`${this.baseURL}/payment/getStatusExtended?${params}`)
    }

    /**
     * Retrieves the status of a payment order by its Flow order number.
     * @param {number} flowOrder - The Flow order number associated with the transaction.
     * @returns {Promise<Payment>} A Promise that resolves to the status of the payment order.
     * @throws {Error} If the request fails or if the response does not contain valid payment order status data.
     */
    async getPaymentOrderStatusByFlowOrder (flowOrder: number): Promise<Payment> {
        const signature = this.signParams({ flowOrder, apiKey: this.apiKey })
        const params = this.generateSearchParams({ flowOrder, apiKey: this.apiKey, s: signature }).toString()
        return await this.request<Payment>(`${this.baseURL}/payment/getStatusByFlowOrder?${params}`)
    }

    /**
     * Retrieves the extended status of a payment order by its Flow order number.
     * @param {number} flowOrder - The Flow order number associated with the transaction.
     * @returns {Promise<ExtendedPaymentOrderStatus>} A Promise that resolves to the extended status of the payment order.
     * @throws {Error} If the request fails or if the response does not contain valid extended payment order status data.
     */
    async getExtendedPaymentOrderStatusByFlowOrder (flowOrder: number): Promise<ExtendedPaymentOrderStatus> {
        const signature = this.signParams({ flowOrder, apiKey: this.apiKey })
        const params = this.generateSearchParams({ flowOrder, apiKey: this.apiKey, s: signature }).toString()
        return await this.request<ExtendedPaymentOrderStatus>(`${this.baseURL}/payment/getStatusByFlowOrderExtended?${params}`)
    }

    /**
     * Retrieves the status of a payment order by commerce ID.
     * @param {string} commerceId - The commerce ID associated with the transaction.
     * @returns {Promise<Payment>} A Promise that resolves to the status of the payment order.
     * @throws {Error} If the request fails or if the response does not contain valid payment order status data.
     */
    async getPaymentOrderStatusByCommerceId (commerceId: string): Promise<Payment> {
        const signature = this.signParams({ commerceId, apiKey: this.apiKey })
        const params = this.generateSearchParams({ commerceId, apiKey: this.apiKey, s: signature }).toString()
        return await this.request<Payment>(`${this.baseURL}/payment/getStatusByCommerceId?${params}`)
    }

    /**
     * Generates a new payment order based on the provided properties.
     * @param {PaymentOrderProps} props - An object containing the properties of the payment order to be generated.
     * @param {string} props.commerceOrder - The identifier or order number associated with the commerce transaction.
     * @param {string} props.subject - A description of the subject or purpose of the payment order.
     * @param {string} [props.currency] - The currency in which the payment is to be made. (Optional)
     * @param {number} props.amount - The amount of the payment.
     * @param {string} props.email - The email address associated with the payment.
     * @param {number} [props.paymentMethod] - The numeric identifier of the payment method to redirect the payer to. Use 9 for all methods. (Optional)
     * @param {string} props.urlConfirmation - The URL to which confirmation or notification of the payment should be sent.
     * @param {string} props.urlReturn - The URL to which the user should be redirected after completing the payment.
     * @param {string} [props.optional] - Additional optional information related to the payment order, as a JSON string. (Optional)
     * @param {number} [props.timeout] - Seconds until the order expires after creation. When omitted the order never expires. (Optional)
     * @param {number} [props.checkout_timeout] - Seconds the payer has to pick a payment method in the checkout before the order is voided. When omitted no limit applies. (Optional)
     * @param {string} [props.merchantId] - The identifier of the associated merchant. Only for integrator commerces. (Optional)
     * @param {string} [props.payment_currency] - The currency in which the order is expected to be paid. (Optional)
     * @returns {Promise<NewPaymentOrderResponse>} A Promise that resolves to the response containing the redirection URL and raw data of the new payment order.
     * @throws {Error} If the request fails or if the response does not contain valid data for generating a new payment order.
     */
    async generatePaymentOrder (props: PaymentOrderProps): Promise<NewPaymentOrderResponse> {
        const params = this.parseParams(props, paymentOrderPropsSchema)
        const signature = this.signParams({ ...params, apiKey: this.apiKey })

        const options = {
            method: 'POST',
            body: this.generateSearchParams({ ...params, apiKey: this.apiKey, s: signature })
        }
        const url = `${this.baseURL}/payment/create`
        const response = await this.request<RawNewPaymentOrderResponse>(url, options)
        return {
            redirectionUrl: `${response.url}?token=${response.token}`,
            raw: response
        }
    }
}
