import { type ListResponse } from '../../types'
import BaseClient from '../base-client/base'
import { type OutsidePaymentProps, type Invoice, type OverdueInvoicesProps } from './types'

/**
 * FlowInvoiceClient provides methods to manage invoices through the API.
 */
export class FlowInvoiceClient extends BaseClient {
    /**
     * Retrieves an invoice by its ID.
     * @param invoiceId - The ID of the invoice to fetch.
     * @returns A promise resolving to the invoice.
     */
    async getInvoice (invoiceId: string): Promise<Invoice> {
        const signature = this.signParams({ invoiceId, apiKey: this.apiKey })
        const params = this.generateSearchParams({ invoiceId, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/invoice/get?${params}`)
    }

    /**
     * Retrieves a list of overdue invoices based on provided filters.
     * @param props - Filters to apply when fetching overdue invoices.
     * @returns A promise resolving to the list of overdue invoices.
     */
    async getOverDueInvoices (props: OverdueInvoicesProps): Promise<ListResponse<Invoice>> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const params = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey }).toString()
        return await this.request(`${this.baseURL}/invoice/overDue?${params}`)
    }

    /**
     * Cancels an invoice by its ID.
     * @param invoiceId - The ID of the invoice to cancel.
     * @returns A promise resolving to the canceled invoice.
     */
    async cancelInvoice (invoiceId: string): Promise<Invoice> {
        const signature = this.signParams({ invoiceId, apiKey: this.apiKey })
        const body = this.generateSearchParams({ invoiceId, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/invoice/cancel`, { method: 'POST', body })
    }

    /**
     * Records an outside payment for an invoice.
     * @param props - Properties specifying the outside payment details.
     * @returns A promise resolving to the updated invoice.
     */
    async outsidePayment (props: OutsidePaymentProps): Promise<Invoice> {
        const signature = this.signParams({ ...props, apiKey: this.apiKey })
        const body = this.generateSearchParams({ ...props, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/invoice/outsidePayment`, { method: 'POST', body })
    }

    /**
     * Retries to collect payment for an invoice.
     * @param invoiceId - The ID of the invoice to retry collection for.
     * @returns A promise resolving to the updated invoice.
     */
    async retryToCollectInvoice (invoiceId: string): Promise<Invoice> {
        const signature = this.signParams({ invoiceId, apiKey: this.apiKey })
        const body = this.generateSearchParams({ invoiceId, s: signature, apiKey: this.apiKey })
        return await this.request(`${this.baseURL}/invoice/retry`, { method: 'POST', body })
    }
}
