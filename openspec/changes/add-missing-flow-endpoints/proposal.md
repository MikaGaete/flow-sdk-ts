## Why

El spec OpenAPI autoritativo de Flow (`openspec/reference/flow-openapi.yaml`)
lista nueve operaciones que el SDK no implementa, más un recurso completo sin
cliente. Dos brechas destacan:

- El README del SDK promete que el cliente de pagos "allows the management of
  regular payments **or email payments**", pero `payment/createEmail` no existe
  en el código.
- `FlowPaymentClient` es el único cliente del SDK sin ningún método de listado,
  pese a que Flow expone dos.

Todo lo demás gira en torno a suscripciones: los ítems adicionales que se cobran
por encima del plan base y los cambios de plan, que hoy no se pueden gestionar
desde el SDK en absoluto.

Este change se planificó originalmente como bloqueado, porque las rutas no
estaban confirmadas y la documentación web de Flow es una SPA que, leída con
herramientas automatizadas, devuelve rutas inventadas. **Ese bloqueo ya no
existe**: el spec OpenAPI da cada ruta, verbo, parámetro y esquema de respuesta
de forma literal, y las citas aparecen abajo.

## What Changes

Referencia de línea entre paréntesis: `openspec/reference/flow-openapi.yaml`.

### Pagos (`FlowPaymentClient`)

- **`POST /payment/createEmail`** (L1090) — genera un cobro por email; Flow envía
  al pagador el enlace de pago. Obligatorios: `apiKey`, `commerceOrder`,
  `subject`, `amount`, `email`, `urlConfirmation`, `urlReturn`, `s`. Opcionales:
  `currency`, `forward_days_after`, `forward_times`, `optional`, `timeout`,
  `checkout_timeout`, `merchantId`, `payment_currency`. Devuelve `PayResponse`
  (`url`, `token`, `flowOrder`), igual que `payment/create`.
- **`GET /payment/getPayments`** (L776) — listado paginado de pagos recibidos en
  un día. Obligatorios: `apiKey`, `date` (`yyyy-mm-dd`), `s`; opcionales `start`
  y `limit` (máximo 100).
- **`GET /payment/getTransactions`** (L921) — listado paginado de transacciones
  de un día, mismos parámetros.

### Suscripciones (`FlowSubscriptionClient`)

Seis operaciones nuevas sobre el recurso `subscription`, todas POST:

- **`/subscription/addItem`** (L3074) — `subscriptionId`, `itemId` obligatorios;
  `quantity` opcional (1-999, por omisión 1). Devuelve
  `SubscriptionItemQuantityResponse`.
- **`/subscription/updateItem`** (L3132) — `subscriptionId`, `itemId`,
  `quantity` (1-999) obligatorios. Devuelve `SubscriptionItemQuantityResponse`.
- **`/subscription/deleteItem`** (L3189) — `subscriptionId`, `itemId`
  obligatorios. Devuelve `SubscriptionItemChangeResponse`.
- **`/subscription/changePlan`** (L3238) — `subscriptionId`, `newPlanId`
  obligatorios; `startDateOfNewPlan` opcional. Devuelve
  `SubscriptionChangePlanResponse`.
- **`/subscription/changePlanPreview`** (L3293) — mismos parámetros; devuelve
  `SubscriptionChangePlanPreviewResponse` sin modificar la suscripción.
- **`/subscription/changePlanCancel`** (L3348) — `subscriptionId` obligatorio.
  Devuelve `SubscriptionChangePlanCancelResponse`.

### Ítems adicionales como recurso propio (cliente nuevo)

`FlowSubscriptionItemsClient` sobre las rutas **`/subscription_item/*`**
(**singular**, no `subscription_items`):

- **`POST /subscription_item/create`** (L3393) — `name`, `currency`, `amount`
  obligatorios. Devuelve `ItemAdditional`.
- **`GET /subscription_item/get`** (L3445) — `itemId`.
- **`POST /subscription_item/edit`** (L3489) — `itemId` obligatorio; `name`,
  `amount`, `changeType` opcionales.
- **`POST /subscription_item/delete`** (L3547) — `itemId` y `changeType`
  obligatorios.
- **`GET /subscription_item/list`** (L3598) — `start`, `limit`, `filter`,
  `status` opcionales. Devuelve `List`.

### Retirado del alcance

La "consulta de liquidación por fecha única" que la auditoría previa proponía
añadir corresponde a **`/settlement/getByDate`, que el spec marca
`deprecated: true`** (L4187). No se implementa. La corrección de
`getSettlement` pasó a `fix-flow-request-integrity`, donde está el resto del
trabajo sobre liquidaciones.

## Capabilities

### New Capabilities
- `flow-subscription-items`: ítems adicionales de suscripción como recurso
  propio y su gestión sobre una suscripción concreta, incluidos los cambios de
  plan.

### Modified Capabilities
- `flow-payments`: se añaden el cobro por email y los listados diarios de pagos
  y de transacciones.
- `flow-subscriptions`: se añaden los ítems adicionales y las operaciones de
  cambio de plan sobre una suscripción.

## Impact

**Código afectado**
- `src/clients/payment-client/index.ts` y `types.ts`
- `src/clients/subscription-client/index.ts` y `types.ts`
- `src/clients/subscription-items-client/` (directorio nuevo)
- `src/clients/flow-client/index.ts` (propiedad nueva en la fachada)
- `src/index.ts` (exports), `README.md`, `tests/`

**Dependencia**
Depende de que **`fix-flow-request-integrity` esté archivado**. Los métodos
nuevos deben nacer sobre el `BaseClient` ya endurecido (descarte de parámetros
omitidos, `generateSearchParams` en toda URL) y con la infraestructura de tests
ya disponible; implementar antes duplicaría el trabajo y arrastraría los
defectos que ese change corrige. Además, la spec `flow-payments` que este change
modifica la crea aquél al archivarse.

**Compatibilidad**
Sólo se añaden métodos, un cliente y tipos. Ninguna firma existente cambia:
bump **minor**. Las rutas de suscripción que el SDK ya usa
(`/subscription/list`, `/changeTrial`, `/addCoupon`, `/deleteCoupon`,
`/cancel`) son **correctas según el spec** y ninguna tarea las toca.
