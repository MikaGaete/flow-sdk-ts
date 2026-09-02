# Flow SDK v2

Welcome to the new version of the 'flow-sdk', designed to simplify your experience
of accepting payments, generating plans, enrolling subscribers and more. In the
next image you can see a short example of how to use the 'flow-sdk-v2' package: 

![alt text](./flow-sdk-v2.png)

## Installation

The 'flow-sdk-v2' package can be installed via npm and yarn, executing one of the
following commands:

```bash
  npm install flow-sdk-ts
  # or
  yarn add flow-sdk-ts
```

## Clients and methods

Before we list all the clients and their respective methods methods you can read
the official flow documentation in the following [link](https://developers.flow.cl/)
to get more information.

> **Server-side only.** This SDK signs requests with your merchant secret key
> using Node's built-in `crypto` module, so it is meant to run on a server and
> must not be bundled for the browser — doing so would also expose your secret.

### Payment client

Allows the management of regular payments and email payments: creating payment
orders, sending charges by email, checking their status, and listing a day's
payments and transactions.

#### Available methods

- *getPaymentOrderStatus(token)*: Retrieves the status of a payment order by its token.
- *getExtendedPaymentOrderStatus(token)*: Retrieves the extended status of a payment order by its token.
- *getPaymentOrderStatusByFlowOrder(flowOrder)*: Retrieves the (simple) status of a payment order by its Flow order number. Takes the numeric Flow order, not a token, and returns the simple `Payment` status.
- *getExtendedPaymentOrderStatusByFlowOrder(flowOrder)*: Retrieves the extended status of a payment order by its Flow order number.
- *getPaymentOrderStatusByCommerceId(commerceId)*: Retrieves the status of a payment order by commerce ID.
- *generatePaymentOrder(props)*: Generates a new payment order. `props.timeout` is **seconds** until the order expires; when omitted the order does not expire.
- *generateEmailPayment(props)*: Generates a charge sent to the payer by email; Flow emails the order details and a payment link. `props.timeout` is in seconds, same as above.
- *getPayments({ date, start?, limit? })*: Retrieves the paginated list of payments received on a day (`date` in `yyyy-mm-dd`).
- *getTransactions({ date, start?, limit? })*: Retrieves the paginated list of transactions performed on a day — a distinct operation from `getPayments`.

### Refund client

Allows the management of refund orders.

#### Available methods

- *generateRefund()*: Generates a refund for a payment based on the provided properties.
- *cancelRefund()*: Cancels a refund with the given token.
- *getRefundStatus()*: Retrieves the status of a refund with the given token.

#### Example

```javascript
  const response = flow.refunds.desiredMethod(props);
```

### Customer client

Allows the creation of clients to make recurring charges or subscribe them to
subscription plans.

#### Available methods

- *generateCustomer()*: Creates a new customer.
- *editCustomer()*: Edits an existing customer's information.
- *deleteCustomer()*: Deletes a customer.
- *getClient()*: Retrieves a customer's information.
- *getCustomersList()*: Retrieves a list of customers based on filters.
- *generateRegisterLink()*: Generates a registration card link for a customer.
- *getRegisterStatus()*: Retrieves the registration card status of a customer.
- *unRegisterCustomer()*: Unregisters a customer's card.
- *chargeCustomersCreditCard()*: Charges a customer's credit card.
- *chargeCustomer()*: Charges a customer.
- *batchChargeCustomers()*: Batch charges multiple customers.
- *getBatchChargeStatus()*: Retrieves the status of a batch charge.
- *reverseCharge()*: Reverses a customer charge.
- *getCustomerCharges(customerId, filter?)*: Retrieves a list of charges for a customer. `customerId` is required.
- *getCustomerChargeAttempts(customerId, filter?)*: Retrieves a list of failed charge attempts for a customer. `customerId` is required.
- *getCustomerSubscriptions(customerId, filter?)*: Retrieves a list of subscriptions for a customer. `customerId` is required.

#### Example

```javascript
  const response = flow.customers.desiredMethod(props);
```

### Plan client

Management of subscription plans.

#### Available methods

- *generatePlan()*: Generates a subscription plan.
- *getPlanDetails()*: Retrieves details of a subscription plan.
- *editPlanDetails()*: Edits details of a subscription plan.
- *deletePlan()*: Deletes a subscription plan.
- *listPlans()*: Lists plans based on provided properties.

#### Example

```javascript
  const response = flow.plans.desiredMethod(props);
```

### Subscription client

Allows the subscription of clients to plans.

#### Available methods

- *generateSubscription()*: Creates a new subscription.
- *getSubscription()*: Retrieves a subscription by its ID.
- *getSubscriptions(planId, filter?)*: Retrieves the list of subscriptions of a plan. `planId` is required by Flow; it cannot be called with filters alone.
- *changeTrialDays()*: Changes the trial period days of a subscription.
- *cancelSubscription()*: Cancels a subscription.
- *addDiscountCoupon()*: Adds a discount coupon to a subscription.
- *deleteDiscountCoupon()*: Deletes a discount coupon from a subscription.
- *addItem({ subscriptionId, itemId, quantity? })*: Adds an additional item to a subscription. Omitting `quantity` lets Flow apply its default of 1.
- *updateItem({ subscriptionId, itemId, quantity })*: Updates the quantity of an additional item on a subscription.
- *deleteItem({ subscriptionId, itemId })*: Removes an additional item from a subscription.
- *changePlan({ subscriptionId, newPlanId, startDateOfNewPlan? })*: Changes the plan of a subscription.
- *previewPlanChange({ subscriptionId, newPlanId, startDateOfNewPlan? })*: Previews the effect of a plan change without applying it.
- *cancelPlanChange(subscriptionId)*: Cancels a scheduled plan change.

#### Example

```javascript
  const response = flow.subscriptions.desiredMethod(props);
```

### Subscription items client

Manages the catalogue of additional items that can be charged on top of a
subscription's base plan. Exposed as `flow.subscriptionItems`.

#### Available methods

- *createItem({ name, currency, amount })*: Creates an additional item (`amount` negative for a discount, positive for a surcharge).
- *getItem(itemId)*: Retrieves an additional item by its ID.
- *editItem({ itemId, name?, amount?, changeType? })*: Edits an additional item.
- *deleteItem({ itemId, changeType })*: Deletes an additional item (`changeType` is `to_future` or `all`).
- *listItems(filter?)*: Lists the additional items of the commerce.

#### Example

```javascript
  const response = flow.subscriptionItems.desiredMethod(props);
```

### Coupon client

Allows the creation of discount coupons to be applied on subscriptions or costumers.

#### Available methods

- *generateDiscountCoupon()*: Generates a new discount coupon.
- *editDiscountCoupon()*: Edits an existing discount coupon.
- *deleteDiscountCoupon()*: Deletes a discount coupon by its ID.
- *getDiscountCoupon()*: Retrieves a discount coupon by its ID.
- *getListOfDiscountCoupons()*: Retrieves a list of discount coupons based on filters.

#### Example

```javascript
  const response = flow.coupons.desiredMethod(props);
```

### Invoice client

Allows the retrieval of the payments generated through subscriptions.

#### Available methods

- *getInvoice()*: Retrieves an invoice by its ID.
- *getOverDueInvoices()*: Retrieves a list of overdue invoices based on provided filters.
- *cancelInvoice()*: Cancels an invoice by its ID.
- *outsidePayment()*: Records an outside payment for an invoice.
- *retryToCollectInvoice()*: Retries to collect payment for an invoice.

#### Example

```javascript
  const response = flow.invoices.desiredMethod(props);
```

### Settlement client

Allows to retrieve the liquidations of payments made by Flow.

#### Available methods

- *getSettlements()*: Retrieves a list of settlements based on the provided filters.
- *getSettlement()*: Retrieves details of a specific settlement by its ID.

#### Example

```javascript
  const response = flow.settlements.desiredMethod(props);
```

### Merchant client

Allows the management of associated businesses.

#### Available methods

- *generateAssociatedCommerce()*: Creates a new associated commerce.
- *editAssociatedCommerce()*: Edits an existing associated commerce.
- *deleteAssociatedCommerce()*: Deletes an associated commerce by its ID.
- *getAssociatedCommerce()*: Retrieves an associated commerce by its ID.
- *getListOfAssociatedCommerces()*: Retrieves a list of associated commerces based on filters.

#### Example

```javascript
  const response = flow.merchants.desiredMethod(props);
```

## Webhooks

When you create a payment order, Flow sends a `POST` to your `urlConfirmation`
once the payer acts on it (and to `urlCallBack` for refunds and batch charges).
That callback carries **only** a `token` field, it is **not signed**, and Flow
expects an HTTP `200` back quickly. Because the callback is unsigned and its body
says nothing about the outcome, treat it as a trigger only: on receipt, call
`getPaymentOrderStatus(token)` (or `getRefundStatus(token)`) to read the verified
state before updating your records.

## Migrating to this version

- `generatePaymentOrder`: `timeout` is now sent to Flow only when you pass it,
  and it is measured in **seconds**. Previously the SDK defaulted it to `10`,
  which Flow read as 10 seconds and expired the order almost immediately. If you
  relied on an order expiring, pass `timeout` explicitly (in seconds); otherwise
  the order now stays valid indefinitely, matching Flow's default.
- `getCustomerCharges`, `getCustomerChargeAttempts` and `getCustomerSubscriptions`
  now take `customerId` as their first argument, which Flow requires.
- `getPaymentOrderStatusByFlowOrder` now takes the numeric Flow order number
  (not a token) and returns the simple `Payment` status.
- `paymentMethod` (in `generatePaymentOrder`) is now a `number`, and
  `reverseCharge`'s `flowOrder` is now a `number`.

## Author

- [@MikaGaete](https://github.com/MikaGaete)
