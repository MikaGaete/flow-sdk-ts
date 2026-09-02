/**
 * Black-box contract test suite for flow-sdk-v2.
 *
 * Every assertion here is derived ONLY from Flow's OpenAPI specification
 * (openspec/reference/flow-openapi.yaml) -- never from the SDK's request-building
 * code. For each spec operation the SDK exposes this suite checks:
 *
 *   1. Path   -- new URL(req.url).pathname === '/api' + <spec path>
 *   2. Verb   -- req.method === the spec's get:/post: for that path
 *   3. Required params -- every name in the operation's `required:` list is sent
 *   4. Location -- POST => params in the body and empty query string;
 *                  GET  => params in the query string, no body
 *
 * The spec spellings are copied verbatim, including the `getChargeAttemps` typo.
 * If the SDK drifts from the spec, these tests fail.
 *
 * Method argument shapes are taken from README.md plus the existing
 * tests/routes.test.ts / tests/request-params.test.ts (only to make the calls
 * compile -- not as a source of truth for what a request must contain).
 */

import { Flow } from '../src/clients/flow-client'
import { installFetchMock, restoreFetch, setResponse, lastRequest } from './helpers/fetch-mock'

const flow = new Flow('APIKEY', 'development', 'SECRET')

/** [name, expectedValue] -- expectedValue null means "present, value not checked" (used for `s`). */
type RequiredParam = [string, string | null]

interface SpecCase {
    name: string
    path: string
    verb: 'GET' | 'POST'
    call: () => Promise<unknown>
    required: RequiredParam[]
}

const paymentOrder = {
    commerceOrder: 'order-9',
    subject: 'Contract test order',
    amount: 1990,
    email: 'payer@example.com',
    urlConfirmation: 'https://example.com/confirm',
    urlReturn: 'https://example.com/return'
}

const groups: Record<string, SpecCase[]> = {
    payment: [
        {
            name: 'getPaymentOrderStatus -> GET /payment/getStatus',
            path: '/api/payment/getStatus',
            verb: 'GET',
            call: async () => await flow.payments.getPaymentOrderStatus('tok-status'),
            required: [['apiKey', 'APIKEY'], ['token', 'tok-status'], ['s', null]]
        },
        {
            name: 'getExtendedPaymentOrderStatus -> GET /payment/getStatusExtended',
            path: '/api/payment/getStatusExtended',
            verb: 'GET',
            call: async () => await flow.payments.getExtendedPaymentOrderStatus('tok-ext'),
            required: [['apiKey', 'APIKEY'], ['token', 'tok-ext'], ['s', null]]
        },
        {
            name: 'getPaymentOrderStatusByFlowOrder -> GET /payment/getStatusByFlowOrder',
            path: '/api/payment/getStatusByFlowOrder',
            verb: 'GET',
            call: async () => await flow.payments.getPaymentOrderStatusByFlowOrder(111),
            required: [['apiKey', 'APIKEY'], ['flowOrder', '111'], ['s', null]]
        },
        {
            name: 'getExtendedPaymentOrderStatusByFlowOrder -> GET /payment/getStatusByFlowOrderExtended',
            path: '/api/payment/getStatusByFlowOrderExtended',
            verb: 'GET',
            call: async () => await flow.payments.getExtendedPaymentOrderStatusByFlowOrder(222),
            required: [['apiKey', 'APIKEY'], ['flowOrder', '222'], ['s', null]]
        },
        {
            name: 'getPaymentOrderStatusByCommerceId -> GET /payment/getStatusByCommerceId',
            path: '/api/payment/getStatusByCommerceId',
            verb: 'GET',
            call: async () => await flow.payments.getPaymentOrderStatusByCommerceId('com-1'),
            required: [['apiKey', 'APIKEY'], ['commerceId', 'com-1'], ['s', null]]
        },
        {
            name: 'generatePaymentOrder -> POST /payment/create',
            path: '/api/payment/create',
            verb: 'POST',
            call: async () => await flow.payments.generatePaymentOrder(paymentOrder),
            required: [
                ['apiKey', 'APIKEY'],
                ['commerceOrder', 'order-9'],
                ['subject', 'Contract test order'],
                ['amount', '1990'],
                ['email', 'payer@example.com'],
                ['urlConfirmation', 'https://example.com/confirm'],
                ['urlReturn', 'https://example.com/return'],
                ['s', null]
            ]
        }
    ],

    refund: [
        {
            name: 'generateRefund -> POST /refund/create',
            path: '/api/refund/create',
            verb: 'POST',
            call: async () => await flow.refunds.generateRefund({
                refundCommerceOrder: 'refund-1',
                receiverEmail: 'payer@example.com',
                amount: 500,
                urlCallBack: 'https://example.com/refund',
                commerceTrxId: 'ctx-1',
                flowTrxId: 'ftx-1'
            }),
            required: [
                ['apiKey', 'APIKEY'],
                ['refundCommerceOrder', 'refund-1'],
                ['receiverEmail', 'payer@example.com'],
                ['amount', '500'],
                ['urlCallBack', 'https://example.com/refund'],
                ['s', null]
            ]
        },
        {
            name: 'cancelRefund -> POST /refund/cancel',
            path: '/api/refund/cancel',
            verb: 'POST',
            call: async () => await flow.refunds.cancelRefund('rtok-1'),
            required: [['apiKey', 'APIKEY'], ['token', 'rtok-1'], ['s', null]]
        },
        {
            name: 'getRefundStatus -> GET /refund/getStatus',
            path: '/api/refund/getStatus',
            verb: 'GET',
            call: async () => await flow.refunds.getRefundStatus('rtok-2'),
            required: [['apiKey', 'APIKEY'], ['token', 'rtok-2'], ['s', null]]
        }
    ],

    customer: [
        {
            name: 'generateCustomer -> POST /customer/create',
            path: '/api/customer/create',
            verb: 'POST',
            call: async () => await flow.customers.generateCustomer({ name: 'Ada', email: 'ada@example.com', externalId: 'ext-1' }),
            required: [
                ['apiKey', 'APIKEY'],
                ['name', 'Ada'],
                ['email', 'ada@example.com'],
                ['externalId', 'ext-1'],
                ['s', null]
            ]
        },
        {
            name: 'editCustomer -> POST /customer/edit',
            path: '/api/customer/edit',
            verb: 'POST',
            call: async () => await flow.customers.editCustomer({ customerId: 'cus_1', name: 'Ada', email: 'ada@example.com', externalId: 'ext-1' }),
            required: [['apiKey', 'APIKEY'], ['customerId', 'cus_1'], ['s', null]]
        },
        {
            name: 'deleteCustomer -> POST /customer/delete',
            path: '/api/customer/delete',
            verb: 'POST',
            call: async () => await flow.customers.deleteCustomer('cus_2'),
            required: [['apiKey', 'APIKEY'], ['customerId', 'cus_2'], ['s', null]]
        },
        {
            name: 'getClient -> GET /customer/get',
            path: '/api/customer/get',
            verb: 'GET',
            call: async () => await flow.customers.getClient('cus_3'),
            required: [['apiKey', 'APIKEY'], ['customerId', 'cus_3'], ['s', null]]
        },
        {
            name: 'getCustomersList -> GET /customer/list',
            path: '/api/customer/list',
            verb: 'GET',
            call: async () => await flow.customers.getCustomersList({ start: 0, limit: 10 }),
            required: [['apiKey', 'APIKEY'], ['s', null]]
        },
        {
            name: 'generateRegisterLink -> POST /customer/register',
            path: '/api/customer/register',
            verb: 'POST',
            call: async () => await flow.customers.generateRegisterLink({ customerId: 'cus_4', url_return: 'https://example.com/r' }),
            required: [
                ['apiKey', 'APIKEY'],
                ['customerId', 'cus_4'],
                ['url_return', 'https://example.com/r'],
                ['s', null]
            ]
        },
        {
            name: 'getRegisterStatus -> GET /customer/getRegisterStatus',
            path: '/api/customer/getRegisterStatus',
            verb: 'GET',
            call: async () => await flow.customers.getRegisterStatus('rtok-c'),
            required: [['apiKey', 'APIKEY'], ['token', 'rtok-c'], ['s', null]]
        },
        {
            name: 'unRegisterCustomer -> POST /customer/unRegister',
            path: '/api/customer/unRegister',
            verb: 'POST',
            call: async () => await flow.customers.unRegisterCustomer('cus_5'),
            required: [['apiKey', 'APIKEY'], ['customerId', 'cus_5'], ['s', null]]
        },
        {
            name: 'chargeCustomersCreditCard -> POST /customer/charge',
            path: '/api/customer/charge',
            verb: 'POST',
            call: async () => await flow.customers.chargeCustomersCreditCard({ customerId: 'cus_6', amount: 100, commerceOrder: 'co-1', subject: 'Charge' }),
            required: [
                ['apiKey', 'APIKEY'],
                ['customerId', 'cus_6'],
                ['amount', '100'],
                ['subject', 'Charge'],
                ['commerceOrder', 'co-1'],
                ['s', null]
            ]
        },
        {
            name: 'chargeCustomer -> POST /customer/collect',
            path: '/api/customer/collect',
            verb: 'POST',
            call: async () => await flow.customers.chargeCustomer({
                customerId: 'cus_7',
                amount: 200,
                commerceOrder: 'co-2',
                subject: 'Collect',
                urlConfirmation: 'https://example.com/c',
                urlReturn: 'https://example.com/r'
            }),
            required: [
                ['apiKey', 'APIKEY'],
                ['customerId', 'cus_7'],
                ['amount', '200'],
                ['subject', 'Collect'],
                ['commerceOrder', 'co-2'],
                ['urlConfirmation', 'https://example.com/c'],
                ['urlReturn', 'https://example.com/r'],
                ['s', null]
            ]
        },
        {
            // Spec `required` for this operation also lists `commerceBatchId`,
            // handled in the SPEC FINDING block below: it is not a real parameter
            // of the operation and the SDK exposes no argument for it.
            name: 'batchChargeCustomers -> POST /customer/batchCollect',
            path: '/api/customer/batchCollect',
            verb: 'POST',
            call: async () => await flow.customers.batchChargeCustomers({
                urlCallBack: 'https://example.com/cb',
                urlConfirmation: 'https://example.com/confirm',
                urlReturn: 'https://example.com/return',
                batchRows: []
            }),
            required: [
                ['apiKey', 'APIKEY'],
                ['urlCallBack', 'https://example.com/cb'],
                ['urlConfirmation', 'https://example.com/confirm'],
                ['urlReturn', 'https://example.com/return'],
                ['batchRows', null],
                ['s', null]
            ]
        },
        {
            name: 'getBatchChargeStatus -> GET /customer/getBatchCollectStatus',
            path: '/api/customer/getBatchCollectStatus',
            verb: 'GET',
            call: async () => await flow.customers.getBatchChargeStatus('btok-1'),
            required: [['apiKey', 'APIKEY'], ['token', 'btok-1'], ['s', null]]
        },
        {
            name: 'reverseCharge -> POST /customer/reverseCharge',
            path: '/api/customer/reverseCharge',
            verb: 'POST',
            call: async () => await flow.customers.reverseCharge({ commerceOrder: 'co-3' }),
            required: [['apiKey', 'APIKEY'], ['s', null]]
        },
        {
            name: 'getCustomerCharges -> GET /customer/getCharges',
            path: '/api/customer/getCharges',
            verb: 'GET',
            call: async () => await flow.customers.getCustomerCharges('cus_8'),
            required: [['apiKey', 'APIKEY'], ['customerId', 'cus_8'], ['s', null]]
        },
        {
            name: 'getCustomerChargeAttempts -> GET /customer/getChargeAttemps',
            path: '/api/customer/getChargeAttemps',
            verb: 'GET',
            call: async () => await flow.customers.getCustomerChargeAttempts('cus_9'),
            required: [['apiKey', 'APIKEY'], ['customerId', 'cus_9'], ['s', null]]
        },
        {
            name: 'getCustomerSubscriptions -> GET /customer/getSubscriptions',
            path: '/api/customer/getSubscriptions',
            verb: 'GET',
            call: async () => await flow.customers.getCustomerSubscriptions('cus_10'),
            required: [['apiKey', 'APIKEY'], ['customerId', 'cus_10'], ['s', null]]
        }
    ],

    plans: [
        {
            name: 'generatePlan -> POST /plans/create',
            path: '/api/plans/create',
            verb: 'POST',
            call: async () => await flow.plans.generatePlan({ planId: 'plan-1', name: 'Plan', amount: 1000, interval: '3' }),
            required: [
                ['apiKey', 'APIKEY'],
                ['planId', 'plan-1'],
                ['name', 'Plan'],
                ['amount', '1000'],
                ['interval', '3'],
                ['s', null]
            ]
        },
        {
            name: 'getPlanDetails -> GET /plans/get',
            path: '/api/plans/get',
            verb: 'GET',
            call: async () => await flow.plans.getPlanDetails('plan-2'),
            required: [['apiKey', 'APIKEY'], ['planId', 'plan-2'], ['s', null]]
        },
        {
            // Spec `required` for /plans/edit is only [apiKey, planId] -- `s` is
            // NOT in the list, so it is not asserted here.
            name: 'editPlanDetails -> POST /plans/edit',
            path: '/api/plans/edit',
            verb: 'POST',
            call: async () => await flow.plans.editPlanDetails({ planId: 'plan-3', name: 'Plan', amount: 1000, interval: '3' }),
            required: [['apiKey', 'APIKEY'], ['planId', 'plan-3']]
        },
        {
            // Spec `required` for /plans/delete is only [apiKey, planId].
            name: 'deletePlan -> POST /plans/delete',
            path: '/api/plans/delete',
            verb: 'POST',
            call: async () => await flow.plans.deletePlan('plan-4'),
            required: [['apiKey', 'APIKEY'], ['planId', 'plan-4']]
        },
        {
            name: 'listPlans -> GET /plans/list',
            path: '/api/plans/list',
            verb: 'GET',
            call: async () => await flow.plans.listPlans({ start: 0, limit: 10 }),
            required: [['apiKey', 'APIKEY'], ['s', null]]
        }
    ],

    subscription: [
        {
            name: 'generateSubscription -> POST /subscription/create',
            path: '/api/subscription/create',
            verb: 'POST',
            call: async () => await flow.subscriptions.generateSubscription({ planId: 'plan-1', customerId: 'cus_1', periods_number: 12 }),
            required: [
                ['apiKey', 'APIKEY'],
                ['planId', 'plan-1'],
                ['customerId', 'cus_1'],
                ['s', null]
            ]
        },
        {
            name: 'getSubscription -> GET /subscription/get',
            path: '/api/subscription/get',
            verb: 'GET',
            call: async () => await flow.subscriptions.getSubscription('sub-1'),
            required: [['apiKey', 'APIKEY'], ['subscriptionId', 'sub-1'], ['s', null]]
        },
        {
            name: 'getSubscriptions -> GET /subscription/list',
            path: '/api/subscription/list',
            verb: 'GET',
            call: async () => await flow.subscriptions.getSubscriptions('plan-9'),
            required: [['apiKey', 'APIKEY'], ['planId', 'plan-9'], ['s', null]]
        },
        {
            name: 'changeTrialDays -> POST /subscription/changeTrial',
            path: '/api/subscription/changeTrial',
            verb: 'POST',
            call: async () => await flow.subscriptions.changeTrialDays({ subscriptionId: 'sub-2', trialPeriodDays: 7 }),
            required: [
                ['apiKey', 'APIKEY'],
                ['subscriptionId', 'sub-2'],
                ['trial_period_days', '7'],
                ['s', null]
            ]
        },
        {
            name: 'cancelSubscription -> POST /subscription/cancel',
            path: '/api/subscription/cancel',
            verb: 'POST',
            call: async () => await flow.subscriptions.cancelSubscription({ subscriptionId: 'sub-3' }),
            required: [['apiKey', 'APIKEY'], ['subscriptionId', 'sub-3'], ['s', null]]
        },
        {
            name: 'addDiscountCoupon -> POST /subscription/addCoupon',
            path: '/api/subscription/addCoupon',
            verb: 'POST',
            call: async () => await flow.subscriptions.addDiscountCoupon({ subscriptionId: 'sub-4', couponId: 1 }),
            required: [
                ['apiKey', 'APIKEY'],
                ['subscriptionId', 'sub-4'],
                ['couponId', '1'],
                ['s', null]
            ]
        },
        {
            name: 'deleteDiscountCoupon -> POST /subscription/deleteCoupon',
            path: '/api/subscription/deleteCoupon',
            verb: 'POST',
            call: async () => await flow.subscriptions.deleteDiscountCoupon('sub-5'),
            required: [['apiKey', 'APIKEY'], ['subscriptionId', 'sub-5'], ['s', null]]
        }
    ],

    coupon: [
        {
            name: 'generateDiscountCoupon -> POST /coupon/create',
            path: '/api/coupon/create',
            verb: 'POST',
            call: async () => await flow.coupons.generateDiscountCoupon({ name: 'CUP10' }),
            required: [['apiKey', 'APIKEY'], ['name', 'CUP10'], ['s', null]]
        },
        {
            name: 'editDiscountCoupon -> POST /coupon/edit',
            path: '/api/coupon/edit',
            verb: 'POST',
            call: async () => await flow.coupons.editDiscountCoupon({ couponId: 'cup-1', name: 'CUP20' }),
            required: [
                ['apiKey', 'APIKEY'],
                ['couponId', 'cup-1'],
                ['name', 'CUP20'],
                ['s', null]
            ]
        },
        {
            name: 'deleteDiscountCoupon -> POST /coupon/delete',
            path: '/api/coupon/delete',
            verb: 'POST',
            call: async () => await flow.coupons.deleteDiscountCoupon('cup-2'),
            required: [['apiKey', 'APIKEY'], ['couponId', 'cup-2'], ['s', null]]
        },
        {
            name: 'getDiscountCoupon -> GET /coupon/get',
            path: '/api/coupon/get',
            verb: 'GET',
            call: async () => await flow.coupons.getDiscountCoupon('cup-3'),
            required: [['apiKey', 'APIKEY'], ['couponId', 'cup-3'], ['s', null]]
        },
        {
            name: 'getListOfDiscountCoupons -> GET /coupon/list',
            path: '/api/coupon/list',
            verb: 'GET',
            call: async () => await flow.coupons.getListOfDiscountCoupons({ start: 0, limit: 10 }),
            required: [['apiKey', 'APIKEY'], ['s', null]]
        }
    ],

    invoice: [
        {
            name: 'getInvoice -> GET /invoice/get',
            path: '/api/invoice/get',
            verb: 'GET',
            call: async () => await flow.invoices.getInvoice('1001'),
            required: [['apiKey', 'APIKEY'], ['invoiceId', '1001'], ['s', null]]
        },
        {
            name: 'getOverDueInvoices -> GET /invoice/getOverDue',
            path: '/api/invoice/getOverDue',
            verb: 'GET',
            call: async () => await flow.invoices.getOverDueInvoices({ planId: 'plan-1' }),
            required: [['apiKey', 'APIKEY'], ['s', null]]
        },
        {
            name: 'cancelInvoice -> POST /invoice/cancel',
            path: '/api/invoice/cancel',
            verb: 'POST',
            call: async () => await flow.invoices.cancelInvoice('1002'),
            required: [['apiKey', 'APIKEY'], ['invoiceId', '1002'], ['s', null]]
        },
        {
            name: 'outsidePayment -> POST /invoice/outsidePayment',
            path: '/api/invoice/outsidePayment',
            verb: 'POST',
            call: async () => await flow.invoices.outsidePayment({ invoiceId: '1003', date: '2026-01-01' }),
            required: [
                ['apiKey', 'APIKEY'],
                ['invoiceId', '1003'],
                ['date', '2026-01-01'],
                ['s', null]
            ]
        },
        {
            name: 'retryToCollectInvoice -> POST /invoice/retryToCollect',
            path: '/api/invoice/retryToCollect',
            verb: 'POST',
            call: async () => await flow.invoices.retryToCollectInvoice('1004'),
            required: [['apiKey', 'APIKEY'], ['invoiceId', '1004'], ['s', null]]
        }
    ],

    settlement: [
        {
            name: 'getSettlements -> GET /settlement/search',
            path: '/api/settlement/search',
            verb: 'GET',
            call: async () => await flow.settlement.getSettlements({ startDate: '2026-01-01', endDate: '2026-01-31' }),
            required: [
                ['apiKey', 'APIKEY'],
                ['startDate', '2026-01-01'],
                ['endDate', '2026-01-31'],
                ['s', null]
            ]
        },
        {
            name: 'getSettlement -> GET /settlement/getByIdv2',
            path: '/api/settlement/getByIdv2',
            verb: 'GET',
            call: async () => await flow.settlement.getSettlement('2001'),
            required: [['apiKey', 'APIKEY'], ['id', '2001'], ['s', null]]
        }
    ],

    merchant: [
        {
            name: 'generateAssociatedCommerce -> POST /merchant/create',
            path: '/api/merchant/create',
            verb: 'POST',
            call: async () => await flow.merchants.generateAssociatedCommerce({ id: 'm-1', name: 'Merch', url: 'https://merch.example.com' }),
            required: [
                ['apiKey', 'APIKEY'],
                ['id', 'm-1'],
                ['name', 'Merch'],
                ['url', 'https://merch.example.com'],
                ['s', null]
            ]
        },
        {
            name: 'editAssociatedCommerce -> POST /merchant/edit',
            path: '/api/merchant/edit',
            verb: 'POST',
            call: async () => await flow.merchants.editAssociatedCommerce({ id: 'm-2', name: 'Merch', url: 'https://merch.example.com' }),
            required: [
                ['apiKey', 'APIKEY'],
                ['id', 'm-2'],
                ['name', 'Merch'],
                ['url', 'https://merch.example.com'],
                ['s', null]
            ]
        },
        {
            name: 'deleteAssociatedCommerce -> POST /merchant/delete',
            path: '/api/merchant/delete',
            verb: 'POST',
            call: async () => await flow.merchants.deleteAssociatedCommerce('m-3'),
            required: [['apiKey', 'APIKEY'], ['id', 'm-3'], ['s', null]]
        },
        {
            name: 'getAssociatedCommerce -> GET /merchant/get',
            path: '/api/merchant/get',
            verb: 'GET',
            call: async () => await flow.merchants.getAssociatedCommerce('m-4'),
            required: [['apiKey', 'APIKEY'], ['id', 'm-4'], ['s', null]]
        },
        {
            name: 'getListOfAssociatedCommerces -> GET /merchant/list',
            path: '/api/merchant/list',
            verb: 'GET',
            call: async () => await flow.merchants.getListOfAssociatedCommerces({ start: 0, limit: 10 }),
            required: [['apiKey', 'APIKEY'], ['s', null]]
        }
    ],

    'payment (added)': [
        {
            name: 'generateEmailPayment -> POST /payment/createEmail',
            path: '/api/payment/createEmail',
            verb: 'POST',
            call: async () => await flow.payments.generateEmailPayment({
                commerceOrder: 'ce-1',
                subject: 'Email charge',
                amount: 1500,
                email: 'payer@example.com',
                urlConfirmation: 'https://example.com/confirm',
                urlReturn: 'https://example.com/return'
            }),
            required: [
                ['apiKey', 'APIKEY'],
                ['commerceOrder', 'ce-1'],
                ['subject', 'Email charge'],
                ['amount', '1500'],
                ['email', 'payer@example.com'],
                ['urlConfirmation', 'https://example.com/confirm'],
                ['urlReturn', 'https://example.com/return'],
                ['s', null]
            ]
        },
        {
            name: 'getPayments -> GET /payment/getPayments',
            path: '/api/payment/getPayments',
            verb: 'GET',
            call: async () => await flow.payments.getPayments({ date: '2026-01-15' }),
            required: [['apiKey', 'APIKEY'], ['date', '2026-01-15'], ['s', null]]
        },
        {
            name: 'getTransactions -> GET /payment/getTransactions',
            path: '/api/payment/getTransactions',
            verb: 'GET',
            call: async () => await flow.payments.getTransactions({ date: '2026-01-15' }),
            required: [['apiKey', 'APIKEY'], ['date', '2026-01-15'], ['s', null]]
        }
    ],

    'subscription (added)': [
        {
            name: 'addItem -> POST /subscription/addItem',
            path: '/api/subscription/addItem',
            verb: 'POST',
            call: async () => await flow.subscriptions.addItem({ subscriptionId: 'sus_1', itemId: 7 }),
            required: [['apiKey', 'APIKEY'], ['subscriptionId', 'sus_1'], ['itemId', '7'], ['s', null]]
        },
        {
            name: 'updateItem -> POST /subscription/updateItem',
            path: '/api/subscription/updateItem',
            verb: 'POST',
            call: async () => await flow.subscriptions.updateItem({ subscriptionId: 'sus_1', itemId: 7, quantity: 3 }),
            required: [['apiKey', 'APIKEY'], ['subscriptionId', 'sus_1'], ['itemId', '7'], ['quantity', '3'], ['s', null]]
        },
        {
            name: 'deleteItem -> POST /subscription/deleteItem',
            path: '/api/subscription/deleteItem',
            verb: 'POST',
            call: async () => await flow.subscriptions.deleteItem({ subscriptionId: 'sus_1', itemId: 7 }),
            required: [['apiKey', 'APIKEY'], ['subscriptionId', 'sus_1'], ['itemId', '7'], ['s', null]]
        },
        {
            name: 'changePlan -> POST /subscription/changePlan',
            path: '/api/subscription/changePlan',
            verb: 'POST',
            call: async () => await flow.subscriptions.changePlan({ subscriptionId: 'sus_1', newPlanId: 'plan-2' }),
            required: [['apiKey', 'APIKEY'], ['subscriptionId', 'sus_1'], ['newPlanId', 'plan-2'], ['s', null]]
        },
        {
            name: 'previewPlanChange -> POST /subscription/changePlanPreview',
            path: '/api/subscription/changePlanPreview',
            verb: 'POST',
            call: async () => await flow.subscriptions.previewPlanChange({ subscriptionId: 'sus_1', newPlanId: 'plan-2' }),
            required: [['apiKey', 'APIKEY'], ['subscriptionId', 'sus_1'], ['newPlanId', 'plan-2'], ['s', null]]
        },
        {
            name: 'cancelPlanChange -> POST /subscription/changePlanCancel',
            path: '/api/subscription/changePlanCancel',
            verb: 'POST',
            call: async () => await flow.subscriptions.cancelPlanChange('sus_1'),
            required: [['apiKey', 'APIKEY'], ['subscriptionId', 'sus_1'], ['s', null]]
        }
    ],

    subscription_item: [
        {
            name: 'createItem -> POST /subscription_item/create',
            path: '/api/subscription_item/create',
            verb: 'POST',
            call: async () => await flow.subscriptionItems.createItem({ name: 'Extra', currency: 'CLP', amount: 500 }),
            required: [['apiKey', 'APIKEY'], ['name', 'Extra'], ['currency', 'CLP'], ['amount', '500'], ['s', null]]
        },
        {
            name: 'getItem -> GET /subscription_item/get',
            path: '/api/subscription_item/get',
            verb: 'GET',
            call: async () => await flow.subscriptionItems.getItem('item-1'),
            required: [['apiKey', 'APIKEY'], ['itemId', 'item-1'], ['s', null]]
        },
        {
            name: 'editItem -> POST /subscription_item/edit',
            path: '/api/subscription_item/edit',
            verb: 'POST',
            call: async () => await flow.subscriptionItems.editItem({ itemId: 'item-1', amount: 600, changeType: 'all' }),
            required: [['apiKey', 'APIKEY'], ['itemId', 'item-1'], ['s', null]]
        },
        {
            name: 'deleteItem -> POST /subscription_item/delete',
            path: '/api/subscription_item/delete',
            verb: 'POST',
            call: async () => await flow.subscriptionItems.deleteItem({ itemId: 'item-1', changeType: 'to_future' }),
            required: [['apiKey', 'APIKEY'], ['itemId', 'item-1'], ['changeType', 'to_future'], ['s', null]]
        },
        {
            name: 'listItems -> GET /subscription_item/list',
            path: '/api/subscription_item/list',
            verb: 'GET',
            call: async () => await flow.subscriptionItems.listItems({ limit: 10 }),
            required: [['apiKey', 'APIKEY'], ['s', null]]
        }
    ]
}

beforeEach(() => {
    installFetchMock()
    // Some methods post-process the response (e.g. build a redirect URL); give
    // them a shape that won't throw.
    setResponse({ url: 'https://sandbox.flow.cl/pay', token: 'tok' })
})

afterEach(() => {
    restoreFetch()
})

for (const [resource, cases] of Object.entries(groups)) {
    describe(`${resource} requests match the Flow OpenAPI spec`, () => {
        test.each(cases)('$name', async ({ path, verb, call, required }) => {
            await call()
            const req = lastRequest()

            // 1. Path -- '/api' + the spec path, verbatim spelling.
            expect(new URL(req.url).pathname).toBe(path)

            // 2. Verb.
            expect(req.method).toBe(verb)

            // 3. Every spec-required parameter is sent.
            for (const [param, expected] of required) {
                if (expected === null) {
                    expect(req.params.get(param)).not.toBeNull()
                }
                else {
                    expect(req.params.get(param)).toBe(expected)
                }
            }

            // 4. Param location: POST => body + empty query; GET => query + no body.
            if (verb === 'POST') {
                expect(new URL(req.url).search).toBe('')
                expect(req.bodyText).toBeDefined()
            }
            else {
                expect(new URL(req.url).search).not.toBe('')
                expect(req.bodyText).toBeUndefined()
            }
        })
    })
}

describe('optional spec parameters can be omitted without a client-side rejection', () => {
    test('refund/create without commerceTrxId or flowTrxId is still sent', async () => {
        await flow.refunds.generateRefund({
            refundCommerceOrder: 'refund-opt',
            receiverEmail: 'payer@example.com',
            amount: 500,
            urlCallBack: 'https://example.com/refund'
        })
        const req = lastRequest()
        expect(new URL(req.url).pathname).toBe('/api/refund/create')
        expect(req.params.get('refundCommerceOrder')).toBe('refund-opt')
        expect(req.params.has('commerceTrxId')).toBe(false)
        expect(req.params.has('flowTrxId')).toBe(false)
    })

    test('payment/create without timeout omits it entirely (not timeout=undefined)', async () => {
        await flow.payments.generatePaymentOrder(paymentOrder)
        const req = lastRequest()
        expect(req.params.has('timeout')).toBe(false)
        expect(req.bodyText ?? '').not.toContain('timeout')
        expect(req.bodyText ?? '').not.toContain('undefined')
    })

    test('plans/create without urlCallback is still sent', async () => {
        await flow.plans.generatePlan({ planId: 'plan-opt', name: 'Plan', amount: 1000, interval: '3' })
        const req = lastRequest()
        expect(new URL(req.url).pathname).toBe('/api/plans/create')
        expect(req.params.get('planId')).toBe('plan-opt')
        expect(req.params.has('urlCallback')).toBe(false)
    })

    test('subscription/cancel without at_period_end is still sent', async () => {
        await flow.subscriptions.cancelSubscription({ subscriptionId: 'sub-opt' })
        const req = lastRequest()
        expect(new URL(req.url).pathname).toBe('/api/subscription/cancel')
        expect(req.params.get('subscriptionId')).toBe('sub-opt')
        expect(req.params.has('at_period_end')).toBe(false)
    })
})

describe('SPEC FINDING: POST /customer/batchCollect required list', () => {
    /**
     * The spec's `requestBody.required` for POST /customer/batchCollect is:
     *   [apiKey, commerceBatchId, urlCallBack, urlConfirmation, urlReturn, batchRows, s]
     *
     * `commerceBatchId` is not one of the operation's declared `properties`
     * (apiKey, urlCallBack, urlConfirmation, urlReturn, batchRows, byEmail,
     * forward_days_after, forward_times, timeout, s), and the SDK's
     * batchChargeCustomers() exposes no argument for it -- so a request built by
     * the SDK can never carry it. This is almost certainly a spec typo, but per
     * the contract-test brief it is recorded here as a deliberately failing test
     * so the drift stays visible.
     */
    test.failing('sends the spec-required commerceBatchId parameter', async () => {
        await flow.customers.batchChargeCustomers({
            urlCallBack: 'https://example.com/cb',
            urlConfirmation: 'https://example.com/confirm',
            urlReturn: 'https://example.com/return',
            batchRows: []
        })
        expect(lastRequest().params.get('commerceBatchId')).not.toBeNull()
    })
})
