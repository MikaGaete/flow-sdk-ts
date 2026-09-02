> Implementación a cargo de un agente Sonnet o Haiku. Ningún agente Opus edita
> código en este change (ver la política de modelos en `openspec/config.yaml`).
> Estilo obligatorio: 4 espacios, comillas simples, sin punto y coma, llaves
> Stroustrup, JSDoc con `@param` / `@returns` en todo método público, todo
> identificador y mensaje en inglés.
>
> **Fuente de verdad: `openspec/reference/flow-openapi.yaml`.** Las referencias
> `L####` de abajo son líneas de ese archivo. Ante cualquier duda de ruta,
> verbo, obligatoriedad o tipo, se consulta ese archivo — nunca una lectura
> automatizada de `developers.flow.cl`, que es una SPA y devuelve rutas
> inventadas.

## 1. Base client: firma y serialización

- [x] 1.1 En `src/clients/base-client/base.ts`, definir un tipo de parámetros de
      petición compartido con valores `string | number | boolean` y usarlo como
      entrada de `signParams` y `generateSearchParams` (hoy `signParams` no
      acepta `boolean`).
- [x] 1.2 Añadir a `signParams` el descarte de entradas `undefined` / `null`
      antes de ordenar y concatenar, para que un campo opcional omitido no se
      firme como `"undefined"`.
- [x] 1.3 Añadir el mismo descarte a `generateSearchParams` antes de construir el
      `URLSearchParams`, eliminando el `as Record<string, string>` y convirtiendo
      cada valor con `String(...)`.
- [x] 1.4 Hacer que `parseParams` lance `FlowError` (importado de
      `../../error/FlowError`) en vez de `new Error('Invalid props')`,
      conservando el detalle de validación de zod en el mensaje. Sin petición de
      red, como hasta ahora.
- [x] 1.5 Añadir JSDoc a los cuatro métodos protegidos de `BaseClient`
      describiendo el contrato (qué se firma, qué se descarta).

## 2. Rutas incorrectas (el método llama hoy a un endpoint inexistente)

- [x] 2.1 `src/clients/customer-client/index.ts:172` — cambiar
      `/customer/getChargeAttempts` por **`/customer/getChargeAttemps`**
      (L2198). Añadir un comentario JSDoc advirtiendo que la grafía con una sola
      `p` es de la API de Flow y **no debe "corregirse"**.
- [x] 2.2 `src/clients/payment-client/index.ts:45` — cambiar
      `/payment/getStatusExtendedByFlowOrder` por
      **`/payment/getStatusByFlowOrderExtended`** (L876).
- [x] 2.3 `src/clients/invoice-client/index.ts:28` — cambiar `/invoice/overDue`
      por **`/invoice/getOverDue`** (L4080).
- [x] 2.4 `src/clients/invoice-client/index.ts:61` — cambiar `/invoice/retry` por
      **`/invoice/retryToCollect`** (L4143).
- [x] 2.5 `src/clients/settlement-client/index.ts:28` — cambiar
      `${baseURL}/settlement/${id}?${query}` por
      **`${baseURL}/settlement/getByIdv2?${query}`** con `id` dentro de la query
      (L4348). Conservar la firma pública `getSettlement(id)` y ensancharla a
      `string | number` (el spec declara `id` como `string`).
- [x] 2.6 Recorrer las 57 llamadas `this.request` de `src/clients/` y verificar
      cada ruta contra la lista de `paths` del spec. Anotar en el PR cualquier
      otra discrepancia encontrada y corregirla.

## 3. Verbo HTTP incorrecto

- [x] 3.1 `src/clients/refund-client/index.ts:23` — `cancelRefund` pasa a
      **POST** con cuerpo `apiKey`, `token`, `s` (L1248), en vez de GET.
- [x] 3.2 `src/clients/customer-client/index.ts:92` — `unRegisterCustomer` pasa a
      **POST** con cuerpo `apiKey`, `customerId`, `s` (L1703), en vez de GET.
- [x] 3.3 Verificar el verbo de las 57 llamadas contra el spec (`get:` / `post:`
      bajo cada path) y corregir cualquier otra discrepancia.

## 4. Parámetros obligatorios que no se envían

- [x] 4.1 `src/clients/merchant-client/index.ts` — añadir `apiKey: this.apiKey`
      al cuerpo de `generateAssociatedCommerce` (`POST /merchant/create`, L4392).
- [x] 4.2 Lo mismo en `editAssociatedCommerce` (`POST /merchant/edit`, L4444).
- [x] 4.3 Lo mismo en `deleteAssociatedCommerce` (`POST /merchant/delete`,
      L4496).
- [x] 4.4 `src/clients/refund-client/index.ts` — añadir `apiKey: this.apiKey` al
      cuerpo de `generateRefund` (`POST /refund/create`, L1184).
- [x] 4.5 `getCustomerCharges` pasa a `(customerId: string, props?: Filter & { fromDate?: string, status?: number })`
      y envía `customerId` (obligatorio, L2136).
- [x] 4.6 `getCustomerChargeAttempts` pasa a
      `(customerId: string, props?: Filter & { fromDate?: string, commerceOrder?: number })`
      y envía `customerId` (obligatorio, L2212). Nótese que `commerceOrder` es
      **opcional** y de tipo `integer` en el spec, no obligatorio ni `string`.
- [x] 4.7 `getCustomerSubscriptions` pasa a `(customerId: string, props?: Filter)`
      y envía `customerId` (obligatorio, L2288).
- [x] 4.8 `src/clients/payment-client/index.ts:33` —
      `getPaymentOrderStatusByFlowOrder` pasa a enviar **`flowOrder`** en vez de
      `token` (L744), renombrar su parámetro a `flowOrder`, y su tipo de retorno
      pasa de `ExtendedPaymentOrderStatus` a **`Payment`** (el spec responde
      `PaymentStatus`).
- [x] 4.9 Recorrer método a método la lista `required` de cada operación en el
      spec y verificar que el SDK envía todos los parámetros obligatorios.
      Anotar y corregir cualquier otro faltante.

## 5. Construcción de URLs codificadas

- [x] 5.1 `src/clients/payment-client/index.ts` — reescribir las cinco URLs
      interpoladas usando `this.generateSearchParams({ ... }).toString()`,
      manteniendo las rutas ya corregidas en las tareas 2.2 y 4.8.
- [x] 5.2 `src/clients/refund-client/index.ts` — hacer lo mismo en
      `getRefundStatus` (GET, L1293). `cancelRefund` ya pasa a POST en 3.1.
- [x] 5.3 `src/clients/plans-client/index.ts` — hacer lo mismo en
      `getPlanDetails` (`GET /plans/get`, L2428).
- [x] 5.4 En `src/clients/customer-client/index.ts`, sustituir los usos directos
      de `new URLSearchParams(...)` por `this.generateSearchParams(...)` para que
      pasen por el filtrado de la tarea 1.3.
- [x] 5.5 Revisar con `git diff` que ninguna ruta cambió salvo las de las tareas
      2.1–2.5.

## 6. Esquemas y tipos alineados con el spec

- [x] 6.1 `payment-client/types.ts` — eliminar `.default(10)` de `timeout`,
      dejándolo `z.number().optional()` (L1047: segundos; omitirlo = sin
      expiración).
- [x] 6.2 `payment-client/index.ts` — corregir el JSDoc de `generatePaymentOrder`:
      `timeout` en **segundos** y, si se omite, la orden no expira. Eliminar la
      mención a "10 minutos" y al valor por defecto.
- [x] 6.3 `payment-client/types.ts` — `paymentMethod` pasa de
      `z.string().optional()` a `z.number().optional()` (L1029, `type: integer`).
- [x] 6.4 `payment-client/types.ts` — añadir `checkout_timeout: z.number().optional()`
      (L1050) y documentarlo en el JSDoc de `generatePaymentOrder`.
- [x] 6.5 `payment-client/types.ts` — añadir `cardNumber: string | null` a
      `ExtendedPaymentData` (L4900; es distinto de `cardLast4Numbers`, que se
      mantiene).
- [x] 6.6 `payment-client/types.ts` — añadir a `ExtendedPaymentOrderStatus` el
      campo `lastError` con `code`, `message` y `medioCode`, los tres
      `string | null` (L4924). Va en el nivel superior, no dentro de
      `paymentData`.
- [x] 6.7 `refund-client/types.ts` — `commerceTrxId` y `flowTrxId` pasan a
      `z.string().optional()` **los dos** (L1231-1236). **No añadir ningún
      `.refine()`**: el spec no declara la restricción "al menos uno" (ver
      `design.md`, decisión 4).
- [x] 6.8 `plans-client/types.ts` — `urlCallback` pasa a `.optional()` (L2337:
      `required` es sólo `apiKey`, `planId`, `name`, `amount`, `interval`, `s`).
- [x] 6.9 `plans-client/types.ts` — `ListPlansResponse.data` pasa de `unknown[]`
      a `PlansResponse[]`.
- [x] 6.10 `settlement-client/types.ts` — conciliar `SettlementDetail` campo a
      campo contra `SettlementV2` y `SettlementBaseV2` (L6111-6217), añadiendo
      `enterprise: string`. Anotar en el PR cualquier otra diferencia.
- [x] 6.11 `customer-client/index.ts` — `reverseCharge` pasa a
      `{ commerceOrder?: string, flowOrder?: number }`: el spec declara ambos
      opcionales y `flowOrder` como `number` (L2074).
- [x] 6.12 `subscription-client/index.ts` — `atPeriodEnd` pasa a opcional en
      `cancelSubscription` (L2928: sólo `apiKey`, `subscriptionId` y `s` son
      obligatorios).
- [x] 6.13 `getCustomerSubscriptions` pasa a devolver `ListResponse<Subscription>`
      importando `Subscription` de `../subscription-client/types`.
- [x] 6.14 `chargeCustomer`, `getCustomerCharges` y `getCustomerChargeAttempts`
      **conservan `unknown`**: el spec declara su respuesta como el esquema
      genérico `List`, cuyo `data` es `array of object` sin estructura (L5012).
      Dejar un comentario JSDoc citando esa línea para que no se invente un tipo
      (ver `design.md`, decisión 9).

## 7. Superficie pública y dependencias

- [x] 7.1 Añadir `export * from './error/FlowError'` a `src/index.ts` para
      exponer `FlowError` y `FlowHTTPError`.
- [x] 7.2 Sanear `src/index.ts`: eliminar la línea duplicada
      `export * from './clients/invoice-client/types'` (aparece dos veces) y
      añadir `export * from './types'`, que hoy falta pese a que `ListResponse` y
      `Filter` aparecen en la firma pública de varios métodos. Verificar que cada
      cliente y su `types` quedan reexportados exactamente una vez.
- [x] 7.3 Sustituir en `payment-client/types.ts` el import
      `import { type PendingInfo } from '../..'` por
      `'../invoice-client/types'`, donde `PendingInfo` está declarado: hoy un
      módulo interno importa desde el barrel raíz.
- [x] 7.4 Eliminar `@types/crypto-js` de `devDependencies` en `package.json` y
      regenerar `yarn.lock`. Comprobar antes con `grep -rn "crypto-js" src tests`
      que no queda ninguna referencia.
- [x] 7.5 Ejecutar `yarn build` y comprobar que los `.d.ts` exponen `FlowError`,
      `FlowHTTPError`, `ListResponse`, `Filter` y los tipos modificados.

## 8. Tests

- [x] 8.1 Crear un helper que sustituya `globalThis.fetch` por un doble que
      capture **URL, método y cuerpo** y devuelva una respuesta JSON fija, con
      restauración en `afterEach`.
- [x] 8.2 `tests/base-client.test.ts` — probar `signParams` con vectores fijos
      (secreto y parámetros conocidos → digest hexadecimal esperado):
      independencia del orden de declaración, exclusión de `s`, inclusión de
      `apiKey` y omisión de un parámetro `undefined`.
- [x] 8.3 Probar `generateSearchParams`: descarte de `undefined` / `null`,
      aceptación de `boolean` y codificación de un valor con `&`, `=` y espacio.
- [x] 8.4 **Un test de ruta por cada método de los diez clientes**, afirmando el
      pathname exacto contra el spec. Es la red que detecta los cinco defectos de
      ruta de la tarea 2; una aserción de payload no los detecta.
- [x] 8.5 Un test de verbo para `cancelRefund` y `unRegisterCustomer` que afirme
      `method === 'POST'` y que los parámetros van en el cuerpo, no en la query.
- [x] 8.6 Un test por método de `merchant-client` y `refund-client` que afirme
      que el cuerpo contiene `apiKey`.
- [x] 8.7 Tests de los tres listados de `customer` que afirmen que la query
      contiene `customerId`.
- [x] 8.8 Un test de `getPaymentOrderStatusByFlowOrder` que afirme que la query
      lleva `flowOrder` y **no** `token`.
- [x] 8.9 Un test que cree una orden de pago sin `timeout` y afirme que el cuerpo
      **no** contiene esa clave, y otro que la pase explícitamente y afirme que
      sí viaja.
- [x] 8.10 Un test que cree un reembolso sin `commerceTrxId` ni `flowTrxId` y
      afirme que la petición **se envía igualmente** sin esos parámetros (el spec
      no los exige).
- [x] 8.11 Un test de `getSettlement` que afirme el pathname
      `/api/settlement/getByIdv2` y que `id` viaja en la query.
- [x] 8.12 Completar con al menos una aserción de cuerpo o query por método
      público en los clientes restantes (`subscription`, `coupon`, `invoice`,
      `plans`).
- [x] 8.13 Ejecutar `yarn test` y `yarn lint`; ambos en verde.

## 9. Documentación

- [x] 9.1 `README.md` — reemplazar el enlace `https://www.flow.cl/docs/api.html`
      por `https://developers.flow.cl/`.
- [x] 9.2 `README.md` — corregir la descripción de `getSubscriptions()` a su
      firma real `getSubscriptions(planId, filter?)`, con `planId` obligatorio
      (L2806 confirma que Flow lo exige).
- [x] 9.3 `README.md` — documentar `timeout` en segundos y que omitirlo significa
      que la orden no expira, con la nota de migración del comportamiento
      anterior.
- [x] 9.4 `README.md` — añadir una sección sobre el webhook `urlConfirmation`:
      Flow envía por POST únicamente `token`, sin firma (L1071-1087), y espera
      HTTP 200; el endpoint del comercio debe tratar ese POST como un disparador
      y confirmar el estado real llamando a `getPaymentOrderStatus` (o
      `getRefundStatus` para `urlCallBack`).
- [x] 9.5 `README.md` — añadir el aviso de que el SDK usa el módulo `crypto` de
      Node y está pensado sólo para servidor: no debe empaquetarse para el
      navegador, donde además expondría el secreto del comercio.
- [x] 9.6 `README.md` — corregir la descripción del payment client, que hoy
      promete "regular payments or email payments" cuando `payment/createEmail`
      no está implementado (llega en `add-missing-flow-endpoints`).
- [x] 9.7 `README.md` — documentar las firmas nuevas de los tres listados de
      `customer` y de `getPaymentOrderStatusByFlowOrder`.

## 10. Entrega

- [x] 10.1 Crear un changeset (`yarn changeset`) con bump **minor** listando:
      las cinco rutas corregidas, los dos verbos, `apiKey` en cuatro cuerpos, y
      las cinco firmas públicas que cambian, con su nota de migración.
- [x] 10.2 (Opcional, no bloqueante) Si aparecen credenciales del sandbox de
      Flow, ejecutar un smoke test contra `sandbox.flow.cl` de los métodos
      corregidos en las tareas 2, 3 y 4, y anotar el resultado en el PR.
- [x] 10.3 Commits en estilo convencional por área
      (`Fix(clients/customer-client): ...`, `Fix(base-client): ...`,
      `Test(...)`, `Docs(readme): ...`), **sin ningún trailer de coautoría,
      atribución ni enlace de sesión**.
- [x] 10.4 **Revisión Opus de contexto limpio (obligatoria antes de archivar):**
      entregar a un agente Opus nuevo, sin ningún contexto previo de esta
      planificación ni de la implementación, únicamente `proposal.md`, las specs
      de `openspec/changes/fix-flow-request-integrity/specs/`,
      `openspec/reference/flow-openapi.yaml` y el diff resultante. El revisor
      debe verificar **cada ruta, verbo y parámetro contra el spec**. El agente
      que planificó o implementó este change no puede ser el revisor.
- [x] 10.5 Corregir con un agente Sonnet o Haiku todo hallazgo de esa revisión y
      volver a ejecutar `yarn lint` y `yarn test`. El change no se archiva hasta
      que la revisión pase.
