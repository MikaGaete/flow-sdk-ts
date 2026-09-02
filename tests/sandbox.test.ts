/**
 * Live checks against Flow's sandbox. Skipped automatically unless
 * `FLOW_API_KEY` / `FLOW_SECRET` are set (in the environment or a repo-root
 * `.env`). These exercise the routes, verbs and signatures the offline suite can
 * only assert against the spec — here Flow itself accepts or rejects them.
 *
 * Read-only: every call is a GET or a status lookup. Nothing is created,
 * charged or refunded.
 */

import { type Flow } from '../src/clients/flow-client'
import { FlowHTTPError } from '../src/error/FlowError'
import { describeSandbox, sandboxFlow } from './helpers/sandbox'

jest.setTimeout(30000)

const ymd = (date: Date): string => date.toISOString().slice(0, 10)

/** A `[startDate, endDate]` window `days` wide ending `offsetDays` ago. Flow rejects ranges >= 30 days. */
const window = (days: number, offsetDays = 0): { startDate: string, endDate: string } => {
    const end = new Date()
    end.setDate(end.getDate() - offsetDays)
    const start = new Date(end)
    start.setDate(start.getDate() - days)
    return { startDate: ymd(start), endDate: ymd(end) }
}

describeSandbox('sandbox (live): routes, verbs and signatures Flow accepts', () => {
    let flow: Flow
    let customerId: string | undefined
    let planId: string | undefined
    let settlementId: string | number | undefined

    beforeAll(async () => {
        flow = sandboxFlow()

        try {
            const customers = await flow.customers.getCustomersList({ limit: 5 })
            customerId = customers.data?.[0]?.customerId
        }
        catch { /* individual tests report the failure */ }

        try {
            const plans = await flow.plans.listPlans({ limit: 5 })
            planId = plans.data?.[0]?.planId
        }
        catch { /* individual tests report the failure */ }

        // Walk back a year in 29-day windows looking for a settlement to detail-check.
        for (let month = 0; month < 13 && settlementId === undefined; month++) {
            try {
                const settlements = await flow.settlement.getSettlements(window(29, month * 29))
                settlementId = settlements?.[0]?.id
            }
            catch { /* keep looking */ }
        }
    })

    test('customer/list returns a paginated envelope', async () => {
        const res = await flow.customers.getCustomersList({ limit: 3 })
        expect(Array.isArray(res.data)).toBe(true)
        expect(typeof res.total).toBe('number')
    })

    test('plans/list returns typed plan rows', async () => {
        const res = await flow.plans.listPlans({ limit: 3 })
        expect(Array.isArray(res.data)).toBe(true)
        if (res.data.length > 0) {
            expect(typeof res.data[0].planId).toBe('string')
        }
    })

    test('coupon/list returns a paginated envelope', async () => {
        const res = await flow.coupons.getListOfDiscountCoupons({ limit: 3 })
        expect(Array.isArray(res.data)).toBe(true)
    })

    test('invoice/getOverDue works without planId (now optional)', async () => {
        const res = await flow.invoices.getOverDueInvoices({ limit: 3 })
        expect(Array.isArray(res.data)).toBe(true)
    })

    test('settlement/search returns an array for a valid (< 30 day) window', async () => {
        const res = await flow.settlement.getSettlements(window(29))
        expect(Array.isArray(res)).toBe(true)
        if (res.length > 0) {
            expect(res[0]).toHaveProperty('enterprise')
        }
    })

    test('payment/getStatus on a bogus token still reaches the endpoint', async () => {
        try {
            const res = await flow.payments.getPaymentOrderStatus('bogus-token-000')
            expect(res).toBeDefined()
        }
        catch (error) {
            expect(error).toBeInstanceOf(FlowHTTPError)
        }
    })

    test('settlement/getByIdv2 — the corrected detail route', async () => {
        if (settlementId === undefined) {
            console.warn('sandbox: no settlement in the two-year window; skipping getByIdv2 assertion')
            return
        }
        const detail = await flow.settlement.getSettlement(settlementId)
        expect(detail).toHaveProperty('summary')
        expect(detail).toHaveProperty('detail')
    })

    test('customer listings with a real customerId (getChargeAttemps, getCharges, getSubscriptions)', async () => {
        if (customerId === undefined) {
            console.warn('sandbox: no customer in the account; skipping customer-listing assertions')
            return
        }
        const charges = await flow.customers.getCustomerCharges(customerId, { limit: 3 })
        expect(Array.isArray(charges.data)).toBe(true)

        const attempts = await flow.customers.getCustomerChargeAttempts(customerId, { limit: 3 })
        expect(Array.isArray(attempts.data)).toBe(true)

        const subscriptions = await flow.customers.getCustomerSubscriptions(customerId, { limit: 3 })
        expect(Array.isArray(subscriptions.data)).toBe(true)
    })

    test('plans/get and subscription/list with a real planId', async () => {
        if (planId === undefined) {
            console.warn('sandbox: no plan in the account; skipping plan assertions')
            return
        }
        const plan = await flow.plans.getPlanDetails(planId)
        expect(plan).toHaveProperty('planId', planId)

        const subscriptions = await flow.subscriptions.getSubscriptions(planId, { limit: 3 })
        expect(Array.isArray(subscriptions.data)).toBe(true)
    })

    // --- endpoints added by add-missing-flow-endpoints (read-only checks) ---

    test('payment/getPayments and payment/getTransactions return the List envelope', async () => {
        const day = ymd(new Date())
        const payments = await flow.payments.getPayments({ date: day, limit: 3 })
        expect(Array.isArray(payments.data)).toBe(true)
        expect(typeof payments.total).toBe('number')

        const transactions = await flow.payments.getTransactions({ date: day, limit: 3 })
        expect(Array.isArray(transactions.data)).toBe(true)
    })

    test('subscription_item/list returns a paginated envelope', async () => {
        const res = await flow.subscriptionItems.listItems({ limit: 3 })
        expect(Array.isArray(res.data)).toBe(true)
    })

    test('subscription_item/get on a bogus id reaches the endpoint', async () => {
        try {
            const res = await flow.subscriptionItems.getItem('bogus-item-000')
            expect(res).toBeDefined()
        }
        catch (error) {
            expect(error).toBeInstanceOf(FlowHTTPError)
        }
    })

    test('subscription/changePlanPreview on bogus ids reaches the endpoint', async () => {
        try {
            const res = await flow.subscriptions.previewPlanChange({ subscriptionId: 'bogus', newPlanId: 'bogus' })
            expect(res).toBeDefined()
        }
        catch (error) {
            expect(error).toBeInstanceOf(FlowHTTPError)
        }
    })
})
