# flow-sdk-v2

## 2.1.0

### Minor Changes

- Align every existing client request with Flow's OpenAPI spec.

  Fixes twelve methods that could not work before:

  - **Wrong route (404):** `getCustomerChargeAttempts` (`/customer/getChargeAttemps`),
    `getExtendedPaymentOrderStatusByFlowOrder` (`/payment/getStatusByFlowOrderExtended`),
    `getOverDueInvoices` (`/invoice/getOverDue`), `retryToCollectInvoice`
    (`/invoice/retryToCollect`), `getSettlement` (`/settlement/getByIdv2` with `id`
    as a query parameter).
  - **Wrong HTTP verb:** `cancelRefund` and `unRegisterCustomer` are now `POST`.
  - **Missing required params:** `apiKey` now travels in the body of
    `merchant/create`, `merchant/edit`, `merchant/delete` and `refund/create`;
    `getCustomerCharges`, `getCustomerChargeAttempts` and `getCustomerSubscriptions`
    now send `customerId`; `getPaymentOrderStatusByFlowOrder` now sends `flowOrder`.

  Request building is unified: `signParams` / `generateSearchParams` drop
  `undefined` / `null` values and share one parameter shape, and every GET query is
  URL-encoded. Validation failures now throw `FlowError` (exported alongside
  `FlowHTTPError`).

  **Breaking changes** (all but the first affect methods that did not work before):

  - `generatePaymentOrder`: `timeout` is no longer defaulted to `10`. It is sent
    only when provided, in **seconds**; omitting it leaves the order without
    expiry, matching Flow's default.
  - `getCustomerCharges`, `getCustomerChargeAttempts`, `getCustomerSubscriptions`
    take `customerId` as their first argument.
  - `getPaymentOrderStatusByFlowOrder` takes the numeric Flow order number and
    returns the simple `Payment` status.
  - `getExtendedPaymentOrderStatusByFlowOrder` takes the numeric Flow order number
    (previously typed `string`), matching its sibling.
  - `paymentMethod` and `reverseCharge`'s `flowOrder` are now `number`.
  - `refund/create`: `commerceTrxId` and `flowTrxId` are optional and both `string`.
  - `getSettlements` now returns `Settlement[]` (the shape `settlement/search`
    actually returns), not `SettlementPayment[]`.
  - Settlement `Debit2.trxId` / `Credit2.trxId` are now `string | null` (per the
    spec), not `number`.
  - `getOverDueInvoices`' `planId` and `editPlanDetails`' non-`planId` fields are
    now optional, matching what Flow declares.
