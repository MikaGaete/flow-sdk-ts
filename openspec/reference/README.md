# Referencia — API de Flow

## `flow-openapi.yaml`

Spec OpenAPI 3.0 **autoritativo** de Flow, descargado el 2026-09-02 desde
<https://developers.flow.cl/es-openApiFlow.yaml> (enlazado como "Download
OpenAPI specification" en <https://developers.flow.cl/api>).

Es la fuente de verdad para rutas de endpoint, parámetros
requeridos/opcionales y esquemas de respuesta. El sitio `developers.flow.cl`
es una SPA que se renderiza en el cliente; extraerla con herramientas de fetch
produce rutas inventadas (`/subscription/modifyTrialDays`,
`/subscription/getPlanSubscriptions`, `s_item_id`, `previewPlanChange` — ninguna
real). Este archivo evita ese problema.

Gotchas confirmados aquí que afectan al SDK:

- `/customer/getChargeAttemps` se escribe con **una sola `p`**.
- La consulta de detalle de liquidación es `GET /settlement/getByIdv2?id=...`
  (parámetro de query), nunca `/settlement/{id}` como segmento de ruta.
  `/settlement/getById` y `/settlement/getByDate` existen pero están
  `deprecated: true`.
- El recurso de ítems adicionales usa rutas `/subscription_item/*` (**singular**).
- En `payment/create`, `timeout` está en **segundos**; omitirlo = la orden nunca
  expira. `paymentMethod` es `integer`.
- `refund/create`: `commerceTrxId` y `flowTrxId` son ambos opcionales y ambos
  `string`.
