import { createHmac } from 'crypto'
import { Flow } from '../src/clients/flow-client'
import { FlowSubscriptionItemsClient } from '../src/clients/subscription-items-client'
import { installFetchMock, restoreFetch, setResponse, lastRequest } from './helpers/fetch-mock'

const flow = new Flow('APIKEY', 'development', 'SECRET')

/** Recomputes the Flow signature from the params a request carried. */
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

type Case = [string, () => Promise<unknown>, string, string]

const emailPayment = {
    commerceOrder: 'order-e1',
    subject: 'Email charge',
    amount: 1500,
    email: 'payer@example.com',
    urlConfirmation: 'https://example.com/confirm',
    urlReturn: 'https://example.com/return'
}

const cases: Case[] = [
    ['payments.generateEmailPayment', async () => await flow.payments.generateEmailPayment(emailPayment), '/api/payment/createEmail', 'POST'],
    ['payments.getPayments', async () => await flow.payments.getPayments({ date: '2026-01-15' }), '/api/payment/getPayments', 'GET'],
    ['payments.getTransactions', async () => await flow.payments.getTransactions({ date: '2026-01-15' }), '/api/payment/getTransactions', 'GET'],

    ['subscriptions.addItem', async () => await flow.subscriptions.addItem({ subscriptionId: 'sus_1', itemId: 7 }), '/api/subscription/addItem', 'POST'],
    ['subscriptions.updateItem', async () => await flow.subscriptions.updateItem({ subscriptionId: 'sus_1', itemId: 7, quantity: 3 }), '/api/subscription/updateItem', 'POST'],
    ['subscriptions.deleteItem', async () => await flow.subscriptions.deleteItem({ subscriptionId: 'sus_1', itemId: 7 }), '/api/subscription/deleteItem', 'POST'],
    ['subscriptions.changePlan', async () => await flow.subscriptions.changePlan({ subscriptionId: 'sus_1', newPlanId: 'plan-2' }), '/api/subscription/changePlan', 'POST'],
    ['subscriptions.previewPlanChange', async () => await flow.subscriptions.previewPlanChange({ subscriptionId: 'sus_1', newPlanId: 'plan-2' }), '/api/subscription/changePlanPreview', 'POST'],
    ['subscriptions.cancelPlanChange', async () => await flow.subscriptions.cancelPlanChange('sus_1'), '/api/subscription/changePlanCancel', 'POST'],

    ['subscriptionItems.createItem', async () => await flow.subscriptionItems.createItem({ name: 'Extra', currency: 'CLP', amount: 500 }), '/api/subscription_item/create', 'POST'],
    ['subscriptionItems.getItem', async () => await flow.subscriptionItems.getItem('item-1'), '/api/subscription_item/get', 'GET'],
    ['subscriptionItems.editItem', async () => await flow.subscriptionItems.editItem({ itemId: 'item-1', amount: 600, changeType: 'all' }), '/api/subscription_item/edit', 'POST'],
    ['subscriptionItems.deleteItem', async () => await flow.subscriptionItems.deleteItem({ itemId: 'item-1', changeType: 'to_future' }), '/api/subscription_item/delete', 'POST'],
    ['subscriptionItems.listItems', async () => await flow.subscriptionItems.listItems({ limit: 10 }), '/api/subscription_item/list', 'GET']
]

describe('new endpoints: route, verb and signature', () => {
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

describe('new endpoints: payload details', () => {
    beforeEach(() => {
        installFetchMock()
        setResponse({ url: 'https://sandbox.flow.cl/pay', token: 'tok' })
    })

    afterEach(() => {
        restoreFetch()
    })

    test('createEmail sends every required parameter in the body', async () => {
        await flow.payments.generateEmailPayment(emailPayment)
        const p = lastRequest().params
        for (const key of ['commerceOrder', 'subject', 'amount', 'email', 'urlConfirmation', 'urlReturn', 's', 'apiKey']) {
            expect(p.get(key)).not.toBeNull()
        }
        expect(new URL(lastRequest().url).search).toBe('')
    })

    test('createEmail forwards persistence parameters when given', async () => {
        await flow.payments.generateEmailPayment({ ...emailPayment, forward_days_after: 2, forward_times: 3 })
        const p = lastRequest().params
        expect(p.get('forward_days_after')).toBe('2')
        expect(p.get('forward_times')).toBe('3')
    })

    test('getPayments puts date and pagination on the query string', async () => {
        await flow.payments.getPayments({ date: '2026-02-01', start: 20, limit: 50 })
        const p = lastRequest().params
        expect(p.get('date')).toBe('2026-02-01')
        expect(p.get('start')).toBe('20')
        expect(p.get('limit')).toBe('50')
        expect(lastRequest().bodyText).toBeUndefined()
    })

    test('addItem omits quantity when it is not provided', async () => {
        await flow.subscriptions.addItem({ subscriptionId: 'sus_1', itemId: 7 })
        expect(lastRequest().params.has('quantity')).toBe(false)
    })

    test('addItem sends quantity when provided', async () => {
        await flow.subscriptions.addItem({ subscriptionId: 'sus_1', itemId: 7, quantity: 5 })
        expect(lastRequest().params.get('quantity')).toBe('5')
    })

    test('changePlan sends startDateOfNewPlan only when given', async () => {
        await flow.subscriptions.changePlan({ subscriptionId: 'sus_1', newPlanId: 'plan-2' })
        expect(lastRequest().params.has('startDateOfNewPlan')).toBe(false)

        await flow.subscriptions.changePlan({ subscriptionId: 'sus_1', newPlanId: 'plan-2', startDateOfNewPlan: '2026-03-01' })
        expect(lastRequest().params.get('startDateOfNewPlan')).toBe('2026-03-01')
    })

    test('subscription_item routes are singular', async () => {
        await flow.subscriptionItems.createItem({ name: 'X', currency: 'CLP', amount: 100 })
        expect(new URL(lastRequest().url).pathname).toBe('/api/subscription_item/create')
    })
})

describe('FlowSubscriptionItemsClient is on the facade', () => {
    test('flow.subscriptionItems is a FlowSubscriptionItemsClient', () => {
        expect(flow.subscriptionItems).toBeInstanceOf(FlowSubscriptionItemsClient)
    })
})
