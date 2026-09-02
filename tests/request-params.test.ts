import { Flow } from '../src/clients/flow-client'
import { installFetchMock, restoreFetch, setResponse, lastRequest } from './helpers/fetch-mock'

const flow = new Flow('APIKEY', 'development', 'SECRET')

const paymentOrder = {
    commerceOrder: 'order-1',
    subject: 'Test order',
    amount: 1000,
    email: 'payer@example.com',
    urlConfirmation: 'https://example.com/confirm',
    urlReturn: 'https://example.com/return'
}

beforeEach(() => {
    installFetchMock()
    setResponse({ url: 'https://sandbox.flow.cl/pay', token: 'tok' })
})

afterEach(() => {
    restoreFetch()
})

describe('apiKey travels in the body of the merchant and refund write operations', () => {
    const merchant = { id: 'm1', name: 'M', url: 'https://m.example.com' }
    const refund = { refundCommerceOrder: 'r1', receiverEmail: 'p@example.com', amount: 100, urlCallBack: 'https://example.com/cb' }

    test('merchant/create', async () => {
        await flow.merchants.generateAssociatedCommerce(merchant)
        expect(lastRequest().params.get('apiKey')).toBe('APIKEY')
        expect(lastRequest().params.get('s')).toBeTruthy()
    })

    test('merchant/edit', async () => {
        await flow.merchants.editAssociatedCommerce(merchant)
        expect(lastRequest().params.get('apiKey')).toBe('APIKEY')
    })

    test('merchant/delete', async () => {
        await flow.merchants.deleteAssociatedCommerce('m1')
        expect(lastRequest().params.get('apiKey')).toBe('APIKEY')
    })

    test('refund/create', async () => {
        await flow.refunds.generateRefund(refund)
        expect(lastRequest().params.get('apiKey')).toBe('APIKEY')
    })
})

describe('POST operations send their parameters in the body, not the query string', () => {
    test('refund/cancel', async () => {
        await flow.refunds.cancelRefund('the-token')
        const req = lastRequest()
        expect(req.method).toBe('POST')
        expect(new URL(req.url).search).toBe('')
        expect(req.params.get('token')).toBe('the-token')
        expect(req.params.get('apiKey')).toBe('APIKEY')
    })

    test('customer/unRegister', async () => {
        await flow.customers.unRegisterCustomer('cus_1')
        const req = lastRequest()
        expect(req.method).toBe('POST')
        expect(new URL(req.url).search).toBe('')
        expect(req.params.get('customerId')).toBe('cus_1')
        expect(req.params.get('apiKey')).toBe('APIKEY')
    })
})

describe('customer listings carry the customerId Flow requires', () => {
    test('customer/getCharges', async () => {
        await flow.customers.getCustomerCharges('cus_42')
        const params = lastRequest().params
        expect(params.get('customerId')).toBe('cus_42')
        expect(params.get('apiKey')).toBe('APIKEY')
        expect(params.get('s')).toBeTruthy()
    })

    test('customer/getChargeAttemps', async () => {
        await flow.customers.getCustomerChargeAttempts('cus_42')
        expect(lastRequest().params.get('customerId')).toBe('cus_42')
    })

    test('customer/getSubscriptions', async () => {
        await flow.customers.getCustomerSubscriptions('cus_42')
        expect(lastRequest().params.get('customerId')).toBe('cus_42')
    })
})

describe('payment status by Flow order sends flowOrder, not token', () => {
    test('getPaymentOrderStatusByFlowOrder', async () => {
        await flow.payments.getPaymentOrderStatusByFlowOrder(987654)
        const params = lastRequest().params
        expect(params.get('flowOrder')).toBe('987654')
        expect(params.get('token')).toBeNull()
    })
})

describe('payment order timeout is only sent when explicitly provided', () => {
    test('omitted timeout does not reach Flow', async () => {
        await flow.payments.generatePaymentOrder(paymentOrder)
        const params = lastRequest().params
        expect(params.has('timeout')).toBe(false)
        expect(params.toString()).not.toContain('undefined')
    })

    test('explicit timeout travels in the body', async () => {
        await flow.payments.generatePaymentOrder({ ...paymentOrder, timeout: 600 })
        expect(lastRequest().params.get('timeout')).toBe('600')
    })
})

describe('refund creation without transaction identifiers is still sent', () => {
    test('no commerceTrxId nor flowTrxId', async () => {
        await flow.refunds.generateRefund({ refundCommerceOrder: 'r1', receiverEmail: 'p@example.com', amount: 100, urlCallBack: 'https://example.com/cb' })
        const params = lastRequest().params
        expect(params.has('commerceTrxId')).toBe(false)
        expect(params.has('flowTrxId')).toBe(false)
        expect(params.get('refundCommerceOrder')).toBe('r1')
    })

    test('only flowTrxId provided', async () => {
        await flow.refunds.generateRefund({ refundCommerceOrder: 'r1', receiverEmail: 'p@example.com', amount: 100, urlCallBack: 'https://example.com/cb', flowTrxId: '55' })
        const params = lastRequest().params
        expect(params.get('flowTrxId')).toBe('55')
        expect(params.has('commerceTrxId')).toBe(false)
    })
})

describe('settlement detail lookup uses getByIdv2 with id in the query', () => {
    test('getSettlement', async () => {
        await flow.settlement.getSettlement('1001')
        const req = lastRequest()
        expect(new URL(req.url).pathname).toBe('/api/settlement/getByIdv2')
        expect(req.params.get('id')).toBe('1001')
        expect(req.params.get('apiKey')).toBe('APIKEY')
    })
})

describe('a body or query assertion for the remaining clients', () => {
    test('subscription/list carries planId', async () => {
        await flow.subscriptions.getSubscriptions('plan-9')
        expect(lastRequest().params.get('planId')).toBe('plan-9')
    })

    test('subscription/cancel omits at_period_end when not given', async () => {
        await flow.subscriptions.cancelSubscription({ subscriptionId: 'sus_1' })
        expect(lastRequest().params.has('at_period_end')).toBe(false)
    })

    test('coupon/create sends name, apiKey and s', async () => {
        await flow.coupons.generateDiscountCoupon({ name: 'CUP10' })
        const params = lastRequest().params
        expect(params.get('name')).toBe('CUP10')
        expect(params.get('apiKey')).toBe('APIKEY')
        expect(params.get('s')).toBeTruthy()
    })

    test('invoice/get carries the invoice id and s', async () => {
        await flow.invoices.getInvoice('1234')
        const params = lastRequest().params
        expect(params.get('invoiceId')).toBe('1234')
        expect(params.get('s')).toBeTruthy()
    })

    test('plans/get carries planId and s in the query', async () => {
        await flow.plans.getPlanDetails('plan-1')
        const params = lastRequest().params
        expect(params.get('planId')).toBe('plan-1')
        expect(params.get('s')).toBeTruthy()
    })

    test('plans/get encodes a planId with reserved characters', async () => {
        await flow.plans.getPlanDetails('plan a&b')
        expect(lastRequest().params.get('planId')).toBe('plan a&b')
    })
})
