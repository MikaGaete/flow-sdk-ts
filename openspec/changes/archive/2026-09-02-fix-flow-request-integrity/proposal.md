## Why

Contrastando el SDK con el spec OpenAPI autoritativo de Flow
(`openspec/reference/flow-openapi.yaml`, descargado de
`https://developers.flow.cl/es-openApiFlow.yaml`) aparecen **doce métodos que
hoy no pueden funcionar**: unos apuntan a una ruta que no existe, otros usan el
verbo equivocado, otros omiten un parámetro que Flow declara obligatorio y
cuatro firman `apiKey` pero no lo envían.

No son sospechas: cada uno se contrasta contra una ruta, un verbo y una lista de
parámetros `required` del spec. La auditoría previa había detectado cuatro de
ellos e incluso dio por buenos los clientes `invoice` y `payment` salvo detalles;
el spec demuestra que también están rotos.

A esto se suman desalineaciones de tipos y de obligatoriedad —parámetros que el
SDK exige y Flow declara opcionales, tipos que no coinciden con el spec, campos
de respuesta sin modelar— y la ausencia total de tests sobre lo que se envía: la
suite actual sólo comprueba que las clases se instancien, así que ninguno de
estos doce defectos habría fallado en CI.

## What Changes

Referencia de línea entre paréntesis: `openspec/reference/flow-openapi.yaml`.

### Rutas incorrectas (el método llama a un endpoint inexistente → 404)

- `FlowCustomerClient.getCustomerChargeAttempts`: `/customer/getChargeAttempts`
  → **`/customer/getChargeAttemps`**, con una sola `p`. Es una errata de la
  propia API de Flow, no del SDK (L2198).
- `FlowPaymentClient.getExtendedPaymentOrderStatusByFlowOrder`:
  `/payment/getStatusExtendedByFlowOrder` →
  **`/payment/getStatusByFlowOrderExtended`** (L876).
- `FlowSettlementClient.getSettlement`: `/settlement/{id}` →
  **`GET /settlement/getByIdv2?id=...`**, con `id` como parámetro de query
  (L4348). El spec tiene cuatro rutas de liquidación y la actual no es ninguna:
  `/settlement/getById` y `/settlement/getByDate` existen pero están
  `deprecated: true`.
- `FlowInvoiceClient.getOverDueInvoices`: `/invoice/overDue` →
  **`/invoice/getOverDue`** (L4080).
- `FlowInvoiceClient.retryToCollectInvoice`: `/invoice/retry` →
  **`/invoice/retryToCollect`** (L4143).

### Verbo HTTP incorrecto (se envía GET donde Flow espera POST)

- `FlowRefundClient.cancelRefund`: `/refund/cancel` es **POST** con cuerpo
  `apiKey`, `token`, `s` (L1248).
- `FlowCustomerClient.unRegisterCustomer`: `/customer/unRegister` es **POST**
  con cuerpo `apiKey`, `customerId`, `s` (L1703).

### Parámetros obligatorios que no se envían

- `FlowCustomerClient.getCustomerCharges`, `getCustomerChargeAttempts` y
  `getCustomerSubscriptions` no envían **`customerId`**, que Flow declara
  `required: true` en los tres endpoints (L2136, L2212, L2288). Hoy aceptan
  únicamente filtros de paginación. **BREAKING**: los tres métodos pasan a
  recibir `customerId`.
- `FlowPaymentClient.getPaymentOrderStatusByFlowOrder` envía `token`, pero
  `/payment/getStatusByFlowOrder` espera **`flowOrder`** (L744). Además declara
  devolver el estado extendido cuando el spec devuelve `PaymentStatus`.
  **BREAKING**: cambia el nombre y el tipo de retorno del método.
- `apiKey` no viaja en el cuerpo de `POST /merchant/create`, `/merchant/edit`,
  `/merchant/delete` ni `/refund/create`, pese a ser `required` en los cuatro
  (L4392, L4444, L4496, L1184).

### Construcción de la petición

- `signParams` y `generateSearchParams` comparten forma de parámetros
  (`string | number | boolean`) y descartan `undefined` / `null` antes de firmar
  y de serializar, para que un campo opcional omitido no se firme ni viaje como
  la cadena literal `"undefined"`.
- Las ocho URLs que hoy se interpolan a mano sin codificar
  (`payment-client` ×5, `refund-client` ×2, `plans-client` ×1) pasan por
  `generateSearchParams`.
- `parseParams` lanza `FlowError` —hoy código muerto— en vez de un `Error`
  genérico; `FlowError` y `FlowHTTPError` se exportan desde `src/index.ts`.

### Esquemas y tipos alineados con el spec

- `payment/create`: se elimina `.default(10)` de `timeout` (es **segundos**, y
  omitirlo significa que la orden **no expira**, L1047). **BREAKING de
  comportamiento.** `paymentMethod` pasa de `string` a `number` (L1029) y se
  añade `checkout_timeout` opcional (L1050).
- `payment/getStatusExtended`: `ExtendedPaymentData` incorpora `cardNumber`
  (BIN + últimos 4, formato `"457630 **** **** 1234"`, L4900) y
  `ExtendedPaymentOrderStatus` incorpora `lastError` (`code`, `message`,
  `medioCode`, L4924).
- `refund/create`: `commerceTrxId` y `flowTrxId` pasan a opcionales y **ambos a
  `string`** (L1231-1236). El spec no exige ninguno de los dos.
- `plans/create`: `urlCallback` pasa a opcional; sólo `planId`, `name`, `amount`
  e `interval` son obligatorios (L2337).
- `ListPlansResponse.data` deja de ser `unknown[]` y usa `PlansResponse[]`.
- `settlement/getByIdv2` devuelve `SettlementV2` (L6162): se concilia
  `SettlementDetail` campo a campo, añadiendo `enterprise`.
- Parámetros que el SDK exige y el spec declara opcionales:
  `getCustomerCharges.fromDate`, `getCustomerChargeAttempts.commerceOrder`
  (además `integer`, no `string`), `reverseCharge.commerceOrder` y `.flowOrder`
  (`flowOrder` es `number`), `cancelSubscription.atPeriodEnd`.

### Calidad y documentación

- Tests unitarios de firma y serialización, y por cada método de cliente una
  aserción sobre la ruta, el verbo y el cuerpo o la query enviados.
- Se elimina la devDependency huérfana `@types/crypto-js`.
- README: portal de documentación vigente, firma real de `getSubscriptions`,
  `timeout` en segundos, aviso de que el SDK es sólo para Node, y guía del
  webhook `urlConfirmation` (Flow envía sólo `token`, sin firma; hay que
  confirmar el estado llamando a `getPaymentOrderStatus`).

Los endpoints que el SDK **no implementa** (`payment/createEmail`,
`payment/getPayments`, `payment/getTransactions`, ítems y cambio de plan de
suscripción, y el recurso `subscription_item`) quedan para
`add-missing-flow-endpoints`.

## Capabilities

### New Capabilities
- `flow-request-signing`: contrato compartido de `BaseClient` para firmar,
  serializar parámetros y propagar errores en toda petición a Flow.
- `flow-merchants`: operaciones del recurso `merchant` (comercios asociados).
- `flow-refunds`: operaciones del recurso `refund`.
- `flow-payments`: operaciones del recurso `payment`.
- `flow-plans`: operaciones del recurso `plans`.
- `flow-customers`: operaciones del recurso `customer`.
- `flow-invoices`: operaciones del recurso `invoice`.
- `flow-settlements`: operaciones del recurso `settlement`.
- `flow-subscriptions`: operaciones del recurso `subscription`.

### Modified Capabilities
<!-- Ninguna: es el primer change del repositorio y no existen specs previas. -->

## Impact

**Código afectado**
- `src/clients/base-client/base.ts`
- `src/clients/merchant-client/index.ts`
- `src/clients/refund-client/index.ts` y `types.ts`
- `src/clients/payment-client/index.ts` y `types.ts`
- `src/clients/plans-client/index.ts` y `types.ts`
- `src/clients/customer-client/index.ts` y `types.ts`
- `src/clients/invoice-client/index.ts`
- `src/clients/settlement-client/index.ts` y `types.ts`
- `src/clients/subscription-client/index.ts`
- `src/error/FlowError.ts` (uso) y `src/index.ts` (exports)
- `tests/`, `package.json`, `README.md`

**Compatibilidad**
Cambio de versión **menor** con changeset y nota de migración. Rompen la firma
o el comportamiento: los tres listados de `customer` (nuevo `customerId`),
`getPaymentOrderStatusByFlowOrder` (parámetro y tipo de retorno),
`generatePaymentOrder` (sin default de `timeout`), `paymentMethod`
(`string` → `number`) y `reverseCharge.flowOrder` (`string` → `number`). Todos
salvo `timeout` afectan a métodos que hoy no funcionan, así que no hay
integraciones correctas que romper.

**Fuera de alcance, anotado como seguimiento**
- `interval` y `currency_convert_option` de `plans` son `z.enum` de cadenas y el
  spec los declara `number`. Sobre el cable form-encoded la representación es
  idéntica y cambiarlo rompería a los consumidores sin ganancia funcional.
- `ListResponse.hasMore` es `number` en el SDK y `boolean` en el spec, cuya
  propia descripción dice "1 / 0". Ambigüedad del spec; no se toca sin observar
  una respuesta real.
