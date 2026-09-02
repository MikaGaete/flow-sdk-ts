> Implementación a cargo de un agente Sonnet o Haiku. Ningún agente Opus edita
> código en este change (ver la política de modelos en `openspec/config.yaml`).
> Estilo obligatorio: 4 espacios, comillas simples, sin punto y coma, llaves
> Stroustrup, JSDoc con `@param` / `@returns` en todo método público, todo
> identificador y mensaje en inglés.
>
> **Fuente de verdad: `openspec/reference/flow-openapi.yaml`.** Las referencias
> `L####` son líneas de ese archivo. Nunca usar una lectura automatizada de
> `developers.flow.cl`: es una SPA y devuelve rutas inventadas.
>
> **Ninguna tarea modifica un método existente.** Las rutas de suscripción que
> el SDK ya usa (`/subscription/list`, `/changeTrial`, `/addCoupon`,
> `/deleteCoupon`, `/cancel`) son correctas según el spec.

## 1. Requisito previo

- [x] 1.1 Comprobar que `fix-flow-request-integrity` está archivado
      (`openspec/specs/flow-payments/spec.md` y
      `openspec/specs/flow-subscriptions/spec.md` deben existir). Si no lo está,
      detenerse y avisar: los métodos nuevos deben nacer sobre el `BaseClient` ya
      corregido y este change modifica esas dos specs.

## 2. Pagos: cobro por email (`POST /payment/createEmail`, L1090)

- [x] 2.1 En `src/clients/payment-client/types.ts`, declarar el esquema zod de
      entrada con los obligatorios `commerceOrder`, `subject`, `amount`, `email`,
      `urlConfirmation`, `urlReturn` y los opcionales `currency`,
      `forward_days_after`, `forward_times`, `optional`, `timeout`,
      `checkout_timeout`, `merchantId`, `payment_currency`. **Sin `.default()` en
      ningún campo.**
- [x] 2.2 Añadir a `FlowPaymentClient` el método del cobro por email siguiendo el
      patrón de `generatePaymentOrder`: `parseParams`, firma,
      `generateSearchParams` con `apiKey`, `this.request` con `method: 'POST'`.
      Devuelve `PayResponse` (`url`, `token`, `flowOrder`) — reutilizar el tipo
      `RawNewPaymentOrderResponse` ya existente si coincide.
- [x] 2.3 JSDoc con `@param` por cada parámetro y `@returns`, señalando que
      `timeout` va en segundos y que omitirlo significa que la orden no expira.
- [x] 2.4 Test: ruta `/api/payment/createEmail`, `method === 'POST'`, y cuerpo
      con `apiKey`, `s` y los parámetros obligatorios.

## 3. Pagos: listados diarios (L776 y L921)

- [x] 3.1 En `payment-client/types.ts`, declarar el tipo de entrada de ambos
      listados: `date` obligatorio (`yyyy-mm-dd`), `start` y `limit` opcionales
      (`limit` máximo 100).
- [x] 3.2 Añadir a `FlowPaymentClient` el listado de pagos de un día
      (`GET /payment/getPayments`), con la query construida por
      `generateSearchParams`. Tipo de retorno `ListResponse<Payment>`, con un
      comentario JSDoc citando L781 ("los objetos pagos de la lista tienen la
      misma estructura de los retornados en los servicios payment/getStatus"),
      que es lo que justifica el tipo (ver `design.md`, decisión 3).
- [x] 3.3 Añadir el listado de transacciones de un día
      (`GET /payment/getTransactions`) del mismo modo, citando L926.
- [x] 3.4 Tests: ruta exacta de cada uno, y query con `apiKey`, `s`, `date` y la
      paginación cuando se informa.

## 4. Suscripciones: ítems adicionales (L3074, L3132, L3189)

- [x] 4.1 En `src/clients/subscription-client/types.ts`, declarar
      `SubscriptionItemQuantityResponse` (`sub_id: string`, `item_id: number`,
      `quantity: number`, `success: boolean`, L6564) y
      `SubscriptionItemChangeResponse` (`sub_id`, `item_id`, `success`, L6548).
      **Respetar el snake_case: son campos de Flow.**
- [x] 4.2 Añadir `POST /subscription/addItem`: `subscriptionId` e `itemId`
      obligatorios, `quantity` opcional (1-999). **No poner un default de 1 en el
      SDK**: si se omite, el parámetro no viaja y Flow aplica el suyo (ver
      `design.md`, decisión 4). Devuelve `SubscriptionItemQuantityResponse`.
- [x] 4.3 Añadir `POST /subscription/updateItem`: `subscriptionId`, `itemId` y
      `quantity` (1-999) los tres obligatorios. Devuelve
      `SubscriptionItemQuantityResponse`.
- [x] 4.4 Añadir `POST /subscription/deleteItem`: `subscriptionId` e `itemId`
      obligatorios. Devuelve `SubscriptionItemChangeResponse`.
- [x] 4.5 Tests: ruta, `method === 'POST'` y cuerpo de cada uno; más un test que
      afirme que al omitir `quantity` en `addItem` la clave **no** aparece en el
      cuerpo.

## 5. Suscripciones: cambio de plan (L3238, L3293, L3348)

- [x] 5.1 Declarar en `subscription-client/types.ts`
      `SubscriptionChangePlanResponse` (L6504 — ojo: `new_amount` y `old_amount`
      son **`string`**, `balance` es `number`),
      `SubscriptionChangePlanPreviewResponse` (L6584) y
      `SubscriptionChangePlanCancelResponse` (`success: boolean`, L6540).
- [x] 5.2 Añadir `POST /subscription/changePlan`: `subscriptionId` y `newPlanId`
      obligatorios, `startDateOfNewPlan` opcional.
- [x] 5.3 Añadir `POST /subscription/changePlanPreview` con los mismos
      parámetros. JSDoc que deje claro que **no modifica la suscripción**.
- [x] 5.4 Añadir `POST /subscription/changePlanCancel`: `subscriptionId`
      obligatorio.
- [x] 5.5 Tests: ruta, verbo y cuerpo de los tres.

## 6. Cliente nuevo: ítems adicionales (`/subscription_item/*`, L3393-3663)

- [x] 6.1 Crear `src/clients/subscription-items-client/types.ts` con
      `ItemAdditional` (`id: number`, `name: string`, `amount: number`,
      `currency: string`, cantidad de suscripciones asociadas, `status: number`,
      `created: string`, L5637) y los tipos de entrada de las cinco operaciones.
- [x] 6.2 Crear `src/clients/subscription-items-client/index.ts` con
      `FlowSubscriptionItemsClient extends BaseClient`. **Las rutas van en
      singular (`/subscription_item/...`)**; dejar un comentario advirtiéndolo
      para que no se "corrija" a plural en una revisión futura.
- [x] 6.3 Implementar `POST /subscription_item/create` (`name`, `currency`,
      `amount` obligatorios) → `ItemAdditional`.
- [x] 6.4 Implementar `GET /subscription_item/get` (`itemId`) → `ItemAdditional`.
- [x] 6.5 Implementar `POST /subscription_item/edit` (`itemId` obligatorio;
      `name`, `amount`, `changeType` opcionales) → `ItemAdditional`.
- [x] 6.6 Implementar `POST /subscription_item/delete` (`itemId` y `changeType`
      obligatorios) → `ItemAdditional`.
- [x] 6.7 Implementar `GET /subscription_item/list` (`start`, `limit`, `filter`,
      `status` opcionales) → `ListResponse<ItemAdditional>`.
- [x] 6.8 Exponer el cliente como propiedad de la fachada `Flow` en
      `src/clients/flow-client/index.ts`, construido igual que el resto.
- [x] 6.9 **Actualizar `src/index.ts`**: reexportar
      `./clients/subscription-items-client` y
      `./clients/subscription-items-client/types`.
- [x] 6.10 Tests: instanciación desde la fachada, y ruta + verbo + payload por
      cada una de las cinco operaciones.

## 7. Cierre

- [x] 7.1 **Actualizar `src/index.ts`** con los tipos públicos nuevos añadidos en
      los grupos 2 a 5, no sólo los del cliente nuevo.
- [x] 7.2 README: documentar los nueve métodos nuevos y el cliente nuevo, y
      corregir la descripción del payment client sobre los cobros por email, que
      ahora sí existen.
- [x] 7.3 Ejecutar `yarn lint`, `yarn test` y `yarn build`; los tres en verde.
- [x] 7.4 (Opcional, no bloqueante) Si hay credenciales del sandbox de Flow,
      ejecutar un smoke test contra `sandbox.flow.cl` de los métodos nuevos y
      anotar el resultado en el PR. Única incertidumbre residual: si el spec
      publicado va al día con el despliegue real.
- [x] 7.5 Crear un changeset con bump **minor** enumerando los métodos y el
      cliente añadidos.
- [x] 7.6 Commits en estilo convencional por área
      (`Feature(clients/payment-client): ...`,
      `Feature(clients/subscription-items-client): ...`), **sin ningún trailer de
      coautoría, atribución ni enlace de sesión**.
- [x] 7.7 **Revisión Opus de contexto limpio (obligatoria antes de archivar):**
      entregar a un agente Opus nuevo, sin ningún contexto previo de esta
      planificación ni de la implementación, únicamente `proposal.md`, las specs
      de `openspec/changes/add-missing-flow-endpoints/specs/`,
      `openspec/reference/flow-openapi.yaml` y el diff resultante. El revisor
      debe verificar **cada ruta, verbo, parámetro y esquema de respuesta contra
      el spec**, y que ningún método existente fue modificado. El agente que
      planificó o implementó este change no puede ser el revisor.
- [x] 7.8 Corregir con un agente Sonnet o Haiku todo hallazgo de esa revisión y
      volver a ejecutar `yarn lint` y `yarn test`. El change no se archiva hasta
      que la revisión pase.
