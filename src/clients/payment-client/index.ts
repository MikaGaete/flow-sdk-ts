import { type ListResponse } from '../../types'
import BaseClient from '../base-client/base'
import { type EmailPaymentProps, type ExtendedPaymentOrderStatus, type NewPaymentOrderResponse, type PaymentOrderProps, type Payment, type PaymentsListProps, type RawNewPaymentOrderResponse, emailPaymentPropsSchema, paymentOrderPropsSchema, paymentsListPropsSchema } from './types'

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

    /**
     * Generates a payment collection sent to the payer by email. Flow emails the
     * order details and a payment link built as `url + "?token=" + token`.
     * @param {EmailPaymentProps} props - The email-payment properties.
     * @param {string} props.commerceOrder - The commerce order identifier.
     * @param {string} props.subject - Description of the order.
     * @param {number} props.amount - Amount of the order.
     * @param {string} props.email - Email of the payer.
     * @param {string} props.urlConfirmation - Callback URL where Flow confirms the payment.
     * @param {string} props.urlReturn - Return URL where Flow redirects the payer.
     * @param {string} [props.currency] - Currency of the order. (Optional)
     * @param {number} [props.forward_days_after] - Days after which a reminder email is sent if the order is still unpaid. (Optional)
     * @param {number} [props.forward_times] - Number of reminder emails to send. (Optional)
     * @param {string} [props.optional] - Optional data as a JSON string. (Optional)
     * @param {number} [props.timeout] - Seconds until the order expires. When omitted the order never expires. (Optional)
     * @param {number} [props.checkout_timeout] - Seconds the payer has to pick a payment method in the checkout. (Optional)
     * @param {string} [props.merchantId] - Associated merchant id. Only for integrator commerces. (Optional)
     * @param {string} [props.payment_currency] - Currency in which the order is expected to be paid. (Optional)
     * @returns {Promise<RawNewPaymentOrderResponse>} The url, token and flowOrder of the created order.
     */
    async generateEmailPayment (props: EmailPaymentProps): Promise<RawNewPaymentOrderResponse> {
        const params = this.parseParams(props, emailPaymentPropsSchema)
        const signature = this.signParams({ ...params, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...params, apiKey: this.apiKey, s: signature })
        return await this.request<RawNewPaymentOrderResponse>(`${this.baseURL}/payment/createEmail`, { method: 'POST', body })
    }

    /**
     * Retrieves the paginated list of payments received on a given day.
     * @param {PaymentsListProps} props - Query properties.
     * @param {string} props.date - The day to query, in `yyyy-mm-dd` format.
     * @param {number} [props.start] - Start record of the page (default 0). (Optional)
     * @param {number} [props.limit] - Records per page (default 10, Flow caps it at 100). (Optional)
     * @returns {Promise<ListResponse<Payment>>} A paginated list of payments.
     * The elements are typed as `Payment`: Flow's spec states the list objects
     * "tienen la misma estructura de los retornados en los servicios
     * payment/getStatus" (openapi L781).
     */
    async getPayments (props: PaymentsListProps): Promise<ListResponse<Payment>> {
        const params = this.parseParams(props, paymentsListPropsSchema)
        const signature = this.signParams({ ...params, apiKey: this.apiKey })
        const query = this.generateSearchParams({ ...params, apiKey: this.apiKey, s: signature }).toString()
        return await this.request<ListResponse<Payment>>(`${this.baseURL}/payment/getPayments?${query}`)
    }

    /**
     * Retrieves the paginated list of transactions performed on a given day, a
     * distinct operation from {@link getPayments}.
     * @param {PaymentsListProps} props - Query properties.
     * @param {string} props.date - The day to query, in `yyyy-mm-dd` format.
     * @param {number} [props.start] - Start record of the page (default 0). (Optional)
     * @param {number} [props.limit] - Records per page (default 10, Flow caps it at 100). (Optional)
     * @returns {Promise<ListResponse<Payment>>} A paginated list of transactions.
     * The elements are typed as `Payment` on the same basis as `getPayments`
     * (openapi L926).
     */
    async getTransactions (props: PaymentsListProps): Promise<ListResponse<Payment>> {
        const params = this.parseParams(props, paymentsListPropsSchema)
        const signature = this.signParams({ ...params, apiKey: this.apiKey })
        const query = this.generateSearchParams({ ...params, apiKey: this.apiKey, s: signature }).toString()
        return await this.request<ListResponse<Payment>>(`${this.baseURL}/payment/getTransactions?${query}`)
    }
}
