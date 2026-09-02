import { type Filter, type ListResponse } from '../../types'
import BaseClient from '../base-client/base'
import { type Payment } from '../payment-client/types'
import { type Subscription } from '../subscription-client/types'
import { type BatchChargeCustomersProps, type BatchResponse, type BatchStatus, type ChargeCustomerBaseProps, type ChargeCustomerProps, type Customer, type CustomerProps, type EditCustomerProps, type RegisterProps, type RegisterResponse, type RegisterStatus } from './types'

/**
 * FlowCustomerClient provides methods to interact with customer-related API endpoints.
 */
export class FlowCustomerClient extends BaseClient {
    /**
     * Creates a new customer.
     * @param props - Properties of the customer to be created.
     * @returns A promise resolving to the created customer.
     */
    async generateCustomer (props: CustomerProps): Promise<Customer> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/customer/create`, { method: 'POST', body })
    }

    /**
     * Edits an existing customer's information.
     * @param props - Properties to update for the customer.
     * @returns A promise resolving to the updated customer.
     */
    async editCustomer (props: EditCustomerProps): Promise<Customer> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/customer/edit`, { method: 'POST', body })
    }

    /**
     * Deletes a customer.
     * @param customerId - ID of the customer to delete.
     * @returns A promise resolving to the deleted customer's data.
     */
    async deleteCustomer (customerId: string): Promise<Customer> {
        const signature = this.signParams({ customerId, apiKey: this.apiKey })
        const body = this.generateSearchParams({ customerId, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/customer/delete`, { method: 'POST', body })
    }

    /**
     * Retrieves a customer's information.
     * @param customerId - ID of the customer to fetch.
     * @returns A promise resolving to the customer's data.
     */
    async getClient (customerId: string): Promise<Customer> {
        const signature = this.signParams({ customerId, apiKey: this.apiKey })
        const params = this.generateSearchParams({ customerId, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/customer/get?${params}`)
    }

    /**
     * Retrieves a list of customers based on filters.
     * @param props - Filters to apply when fetching the customer list.
     * @returns A promise resolving to a list of customers.
     */
    async getCustomersList (props: Filter): Promise<ListResponse<Customer>> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const params = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/customer/list?${params}`)
    }

    /**
     * Generates a registration link for a customer.
     * @param props - Properties for generating the registration link.
     * @returns A promise resolving to the registration response.
     */
    async generateRegisterLink (props: RegisterProps): Promise<RegisterResponse> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/customer/register`, { method: 'POST', body })
    }

    /**
     * Retrieves the registration status of a customer.
     * @param token - Token identifying the registration request.
     * @returns A promise resolving to the registration status.
     */
    async getRegisterStatus (token: string): Promise<RegisterStatus> {
        const signature = this.signParams({ token, apiKey: this.apiKey })
        const params = this.generateSearchParams({ token, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/customer/getRegisterStatus?${params}`)
    }

    /**
     * Unregisters a customer's card.
     * @param customerId - ID of the customer to unregister.
     * @returns A promise resolving to the unregistered customer's data.
     */
    async unRegisterCustomer (customerId: string): Promise<Customer> {
        const signature = this.signParams({ customerId, apiKey: this.apiKey })
        const body = this.generateSearchParams({ customerId, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/customer/unRegister`, { method: 'POST', body })
    }

    /**
     * Charges a customer's credit card.
     * @param props - Properties for charging the customer.
     * @returns A promise resolving to the payment details.
     */
    async chargeCustomersCreditCard (props: ChargeCustomerBaseProps): Promise<Payment> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/customer/charge`, { method: 'POST', body })
    }

    /**
     * Charges a customer (collect).
     * @param props - Properties for charging the customer.
     * @returns A promise resolving to the charge response. Typed as `unknown`:
     * Flow declares this response as the generic `List`-style envelope with no
     * documented item shape, so a concrete type would be invented, not verified.
     */
    async chargeCustomer (props: ChargeCustomerProps): Promise<unknown> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/customer/collect`, { method: 'POST', body })
    }

    /**
     * Batch charges multiple customers.
     * @param props - Properties for the batch charge.
     * @returns A promise resolving to the batch response.
     */
    async batchChargeCustomers (props: BatchChargeCustomersProps): Promise<BatchResponse> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey, batchRows: JSON.stringify(props.batchRows) })
        const body = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey, batchRows: JSON.stringify(props.batchRows) })
        return await this.request(`${this.baseURL}/customer/batchCollect`, { method: 'POST', body })
    }

    /**
     * Retrieves the status of a batch charge.
     * @param token - Token identifying the batch charge request.
     * @returns A promise resolving to the batch charge status.
     */
    async getBatchChargeStatus (token: string): Promise<BatchStatus> {
        const signature = this.signParams({ token, apiKey: this.apiKey })
        const params = this.generateSearchParams({ token, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/customer/getBatchCollectStatus?${params}`)
    }

    /**
     * Reverses a customer charge. Either `commerceOrder` or `flowOrder` identifies
     * the charge; Flow declares both optional.
     * @param props - The commerce order and/or Flow order of the charge to reverse.
     * @returns A promise resolving to the status and message of the reversal.
     */
    async reverseCharge (props: { commerceOrder?: string, flowOrder?: number }): Promise<{ status: string, message: string }> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/customer/reverseCharge`, { method: 'POST', body })
    }

    /**
     * Retrieves a paginated list of charges for a customer.
     * @param customerId - ID of the customer (required by Flow).
     * @param props - Optional pagination filters plus `fromDate`.
     * @returns A promise resolving to a list of charges. The element type is
     * `unknown`: Flow declares this response as the generic `List` envelope whose
     * `data` is an untyped array of objects, so a concrete type is not available.
     */
    async getCustomerCharges (customerId: string, props?: Filter & { fromDate?: string }): Promise<ListResponse<unknown>> {
        const signature = this.signParams({ ...props, customerId, apiKey: this.apiKey })
        const params = this.generateSearchParams({ ...props, customerId, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/customer/getCharges?${params}`)
    }

    /**
     * Retrieves a paginated list of failed charge attempts for a customer.
     *
     * The path `customer/getChargeAttemps` is spelled with a single `p` on
     * purpose — that is how Flow declares the operation. Do not "fix" it.
     * @param customerId - ID of the customer (required by Flow).
     * @param props - Optional pagination filters plus `fromDate` and `commerceOrder`.
     * @returns A promise resolving to a list of charge attempts. The element type
     * is `unknown`: Flow declares this response as the generic `List` envelope
     * whose `data` is an untyped array of objects.
     */
    async getCustomerChargeAttempts (customerId: string, props?: Filter & { fromDate?: string, commerceOrder?: number }): Promise<ListResponse<unknown>> {
        const signature = this.signParams({ ...props, customerId, apiKey: this.apiKey })
        const params = this.generateSearchParams({ ...props, customerId, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/customer/getChargeAttemps?${params}`)
    }

    /**
     * Retrieves a paginated list of subscriptions for a customer.
     * @param customerId - ID of the customer (required by Flow).
     * @param props - Optional pagination filters.
     * @returns A promise resolving to a list of subscriptions.
     */
    async getCustomerSubscriptions (customerId: string, props?: Filter): Promise<ListResponse<Subscription>> {
        const signature = this.signParams({ ...props, customerId, apiKey: this.apiKey })
        const params = this.generateSearchParams({ ...props, customerId, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/customer/getSubscriptions?${params}`)
    }
}
