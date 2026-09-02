import { createHmac } from 'crypto'
import { Flow } from '../src/clients/flow-client'
import { installFetchMock, restoreFetch, setResponse, lastRequest } from './helpers/fetch-mock'

const flow = new Flow('APIKEY', 'development', 'SECRET')

/**
 * Recomputes the Flow signature from the parameters a request actually carried,
 * so a method that signs one set and sends another is caught.
 */
const expectedSignature = (params: URLSearchParams): string => {
    const entries: Array<[string, string]> = []
    params.forEach((value, key) => {
        if (key !== 's') {
            entries.push([key, value])
        }
    })
    entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    const text = entries.reduce((acc, [key, value]) => `${acc}${key}${value}`, '')
    return createHmac('sha256', 'SECRET').update(text).digest('hex')
}

const paymentOrder = {
    commerceOrder: 'order-1',
    subject: 'Test order',
    amount: 1000,
    email: 'payer@example.com',
    urlConfirmation: 'https://example.com/confirm',
    urlReturn: 'https://example.com/return'
}

const refund = {
    refundCommerceOrder: 'refund-1',
    receiverEmail: 'payer@example.com',
    amount: 500,
    urlCallBack: 'https://example.com/refund'
}

const plan = { planId: 'plan-1', name: 'Plan', amount: 1000, interval: '3' as const }
const merchant = { id: 'merch-1', name: 'Merch', url: 'https://merch.example.com' }
const coupon = { name: 'CUP10' }
const listFilter = { start: 0, limit: 10 }

/**
 * Each entry: a human label, the call, the expected pathname and HTTP method.
 * The mock server answers everything with `{}`.
 */
type Case = [string, () => Promise<unknown>, string, string]

const cases: Case[] = [
    // payment
    ['payments.getPaymentOrderStatus', async () => await flow.payments.getPaymentOrderStatus('tok'), '/api/payment/getStatus', 'GET'],
    ['payments.getExtendedPaymentOrderStatus', async () => await flow.payments.getExtendedPaymentOrderStatus('tok'), '/api/payment/getStatusExtended', 'GET'],
    ['payments.getPaymentOrderStatusByFlowOrder', async () => await flow.payments.getPaymentOrderStatusByFlowOrder(123), '/api/payment/getStatusByFlowOrder', 'GET'],
    ['payments.getExtendedPaymentOrderStatusByFlowOrder', async () => await flow.payments.getExtendedPaymentOrderStatusByFlowOrder(123), '/api/payment/getStatusByFlowOrderExtended', 'GET'],
    ['payments.getPaymentOrderStatusByCommerceId', async () => await flow.payments.getPaymentOrderStatusByCommerceId('c1'), '/api/payment/getStatusByCommerceId', 'GET'],
    ['payments.generatePaymentOrder', async () => await flow.payments.generatePaymentOrder(paymentOrder), '/api/payment/create', 'POST'],

    // refund
    ['refunds.generateRefund', async () => await flow.refunds.generateRefund(refund), '/api/refund/create', 'POST'],
    ['refunds.cancelRefund', async () => await flow.refunds.cancelRefund('tok'), '/api/refund/cancel', 'POST'],
    ['refunds.getRefundStatus', async () => await flow.refunds.getRefundStatus('tok'), '/api/refund/getStatus', 'GET'],

    // plans
    ['plans.generatePlan', async () => await flow.plans.generatePlan(plan), '/api/plans/create', 'POST'],
    ['plans.getPlanDetails', async () => await flow.plans.getPlanDetails('plan-1'), '/api/plans/get', 'GET'],
    ['plans.editPlanDetails', async () => await flow.plans.editPlanDetails(plan), '/api/plans/edit', 'POST'],
    ['plans.deletePlan', async () => await flow.plans.deletePlan('plan-1'), '/api/plans/delete', 'POST'],
    ['plans.listPlans', async () => await flow.plans.listPlans(listFilter), '/api/plans/list', 'GET'],

    // merchants
    ['merchants.generateAssociatedCommerce', async () => await flow.merchants.generateAssociatedCommerce(merchant), '/api/merchant/create', 'POST'],
    ['merchants.editAssociatedCommerce', async () => await flow.merchants.editAssociatedCommerce(merchant), '/api/merchant/edit', 'POST'],
    ['merchants.deleteAssociatedCommerce', async () => await flow.merchants.deleteAssociatedCommerce('merch-1'), '/api/merchant/delete', 'POST'],
    ['merchants.getAssociatedCommerce', async () => await flow.merchants.getAssociatedCommerce('merch-1'), '/api/merchant/get', 'GET'],
    ['merchants.getListOfAssociatedCommerces', async () => await flow.merchants.getListOfAssociatedCommerces(listFilter), '/api/merchant/list', 'GET'],

    // coupons
    ['coupons.generateDiscountCoupon', async () => await flow.coupons.generateDiscountCoupon(coupon), '/api/coupon/create', 'POST'],
    ['coupons.editDiscountCoupon', async () => await flow.coupons.editDiscountCoupon({ couponId: '1', name: 'CUP' }), '/api/coupon/edit', 'POST'],
    ['coupons.deleteDiscountCoupon', async () => await flow.coupons.deleteDiscountCoupon('1'), '/api/coupon/delete', 'POST'],
    ['coupons.getDiscountCoupon', async () => await flow.coupons.getDiscountCoupon('1'), '/api/coupon/get', 'GET'],
    ['coupons.getListOfDiscountCoupons', async () => await flow.coupons.getListOfDiscountCoupons(listFilter), '/api/coupon/list', 'GET'],

    // invoices
    ['invoices.getInvoice', async () => await flow.invoices.getInvoice('1'), '/api/invoice/get', 'GET'],
    ['invoices.getOverDueInvoices', async () => await flow.invoices.getOverDueInvoices({ planId: 'plan-1' }), '/api/invoice/getOverDue', 'GET'],
    ['invoices.cancelInvoice', async () => await flow.invoices.cancelInvoice('1'), '/api/invoice/cancel', 'POST'],
    ['invoices.outsidePayment', async () => await flow.invoices.outsidePayment({ invoiceId: '1', date: '2026-01-01' }), '/api/invoice/outsidePayment', 'POST'],
    ['invoices.retryToCollectInvoice', async () => await flow.invoices.retryToCollectInvoice('1'), '/api/invoice/retryToCollect', 'POST'],

    // settlement
    ['settlement.getSettlements', async () => await flow.settlement.getSettlements({ startDate: '2026-01-01', endDate: '2026-01-31' }), '/api/settlement/search', 'GET'],
    ['settlement.getSettlement', async () => await flow.settlement.getSettlement('1001'), '/api/settlement/getByIdv2', 'GET'],

    // customers
    ['customers.generateCustomer', async () => await flow.customers.generateCustomer({ email: 'c@example.com', name: 'C', externalId: 'x1' }), '/api/customer/create', 'POST'],
    ['customers.editCustomer', async () => await flow.customers.editCustomer({ customerId: 'cus_1', email: 'c@example.com', name: 'C', externalId: 'x1' }), '/api/customer/edit', 'POST'],
    ['customers.deleteCustomer', async () => await flow.customers.deleteCustomer('cus_1'), '/api/customer/delete', 'POST'],
    ['customers.getClient', async () => await flow.customers.getClient('cus_1'), '/api/customer/get', 'GET'],
    ['customers.getCustomersList', async () => await flow.customers.getCustomersList(listFilter), '/api/customer/list', 'GET'],
    ['customers.generateRegisterLink', async () => await flow.customers.generateRegisterLink({ customerId: 'cus_1', url_return: 'https://example.com/r' }), '/api/customer/register', 'POST'],
    ['customers.getRegisterStatus', async () => await flow.customers.getRegisterStatus('tok'), '/api/customer/getRegisterStatus', 'GET'],
    ['customers.unRegisterCustomer', async () => await flow.customers.unRegisterCustomer('cus_1'), '/api/customer/unRegister', 'POST'],
    ['customers.chargeCustomersCreditCard', async () => await flow.customers.chargeCustomersCreditCard({ customerId: 'cus_1', amount: 100, commerceOrder: 'o1', subject: 's' }), '/api/customer/charge', 'POST'],
    ['customers.chargeCustomer', async () => await flow.customers.chargeCustomer({ customerId: 'cus_1', amount: 100, commerceOrder: 'o1', subject: 's', urlConfirmation: 'https://example.com/c', urlReturn: 'https://example.com/r' }), '/api/customer/collect', 'POST'],
    ['customers.batchChargeCustomers', async () => await flow.customers.batchChargeCustomers({ urlCallBack: 'https://example.com/cb', urlConfirmation: 'https://example.com/c', urlReturn: 'https://example.com/r', batchRows: [] }), '/api/customer/batchCollect', 'POST'],
    ['customers.getBatchChargeStatus', async () => await flow.customers.getBatchChargeStatus('tok'), '/api/customer/getBatchCollectStatus', 'GET'],
    ['customers.reverseCharge', async () => await flow.customers.reverseCharge({ commerceOrder: 'o1' }), '/api/customer/reverseCharge', 'POST'],
    ['customers.getCustomerCharges', async () => await flow.customers.getCustomerCharges('cus_1'), '/api/customer/getCharges', 'GET'],
    ['customers.getCustomerChargeAttempts', async () => await flow.customers.getCustomerChargeAttempts('cus_1'), '/api/customer/getChargeAttemps', 'GET'],
    ['customers.getCustomerSubscriptions', async () => await flow.customers.getCustomerSubscriptions('cus_1'), '/api/customer/getSubscriptions', 'GET'],

    // subscriptions
    ['subscriptions.generateSubscription', async () => await flow.subscriptions.generateSubscription({ planId: 'plan-1', customerId: 'cus_1', periods_number: 12 }), '/api/subscription/create', 'POST'],
    ['subscriptions.getSubscription', async () => await flow.subscriptions.getSubscription('sus_1'), '/api/subscription/get', 'GET'],
    ['subscriptions.getSubscriptions', async () => await flow.subscriptions.getSubscriptions('plan-1'), '/api/subscription/list', 'GET'],
    ['subscriptions.changeTrialDays', async () => await flow.subscriptions.changeTrialDays({ subscriptionId: 'sus_1', trialPeriodDays: 5 }), '/api/subscription/changeTrial', 'POST'],
    ['subscriptions.cancelSubscription', async () => await flow.subscriptions.cancelSubscription({ subscriptionId: 'sus_1' }), '/api/subscription/cancel', 'POST'],
    ['subscriptions.addDiscountCoupon', async () => await flow.subscriptions.addDiscountCoupon({ subscriptionId: 'sus_1', couponId: 1 }), '/api/subscription/addCoupon', 'POST'],
    ['subscriptions.deleteDiscountCoupon', async () => await flow.subscriptions.deleteDiscountCoupon('sus_1'), '/api/subscription/deleteCoupon', 'POST']
]

describe('client routes and verbs match the Flow OpenAPI spec', () => {
    beforeEach(() => {
        installFetchMock()
        setResponse({ url: 'https://sandbox.flow.cl/pay', token: 'tok' })
    })

    afterEach(() => {
        restoreFetch()
    })

    test.each(cases)('%s', async (_label, call, pathname, method) => {
        await call()
        const req = lastRequest()
        expect(new URL(req.url).pathname).toBe(pathname)
        expect(req.method).toBe(method)
        expect(req.params.get('apiKey')).toBe('APIKEY')
        expect(req.params.get('s')).toBe(expectedSignature(req.params))
    })
})
