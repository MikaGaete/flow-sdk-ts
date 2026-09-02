## Context

Ver `proposal.md — Why`. Lo relevante para el diseño:

- La fuente de verdad es `openspec/reference/flow-openapi.yaml`. Toda ruta,
  verbo, obligatoriedad y esquema de respuesta de este change está citado ahí con
  su línea. **No se usa ninguna lectura automatizada de `developers.flow.cl`**:
  es una SPA y produce rutas inventadas (`/subscription/modifyTrialDays`,
  `previewPlanChange`, `s_item_id` — ninguna real).
- El SDK ya tiene diez clientes con un patrón fijo: un directorio por recurso con
  `index.ts` y `types.ts`, una clase que extiende `BaseClient`, y una propiedad
  en la fachada `Flow`.
- `fix-flow-request-integrity` corrige `BaseClient` (descarte de parámetros
  omitidos, tipo de parámetros unificado), corrige doce métodos rotos y añade la
  infraestructura de tests con doble de `fetch`.

## Goals / Non-Goals

**Goals**

- Cubrir las nueve operaciones que faltan y el recurso sin cliente, con sus
  tipos de respuesta modelados desde los esquemas del spec.
- Que cada método nuevo nazca con su test de ruta, verbo y payload.

**Non-Goals**

- No se toca ningún método existente. En particular, las rutas de suscripción
  que el SDK ya usa son correctas según el spec y ninguna tarea las modifica.
- No se implementa `/settlement/getByDate`: está `deprecated: true` (L4187).
- No se introducen dependencias nuevas.

## Decisions

### 1. El recurso de ítems va en un cliente propio, con la ruta en singular

Se crea `src/clients/subscription-items-client/` con
`FlowSubscriptionItemsClient`, sobre rutas **`/subscription_item/*`**
(L3393-3663). El nombre del directorio y de la clase van en plural, en línea con
el resto del SDK; **las rutas van en singular**, porque así las declara Flow.

*Por qué separar del cliente de suscripciones:* Flow lo lista como recurso
propio, y la regla de organización del SDK es un cliente por recurso. Nótese la
distinción que hace el spec y que el diseño respeta: las operaciones **sobre una
suscripción concreta** (`/subscription/addItem`, `updateItem`, `deleteItem`) son
del recurso `subscription` y van en `FlowSubscriptionClient`; las del **catálogo
de ítems** (`/subscription_item/*`) van en el cliente nuevo.

*Riesgo que esto evita:* dejar un comentario en el código advirtiendo del
singular, para que una revisión futura no lo "corrija" a `subscription_items`.

### 2. Los tipos de respuesta se copian de los esquemas del spec, no se infieren

Cada operación nueva tipa su respuesta desde el esquema que el spec le asigna:
`PayResponse` para el cobro por email, `List` para los dos listados diarios,
`SubscriptionItemQuantityResponse` (L6564), `SubscriptionItemChangeResponse`
(L6548), `SubscriptionChangePlanResponse` (L6504),
`SubscriptionChangePlanPreviewResponse` (L6584),
`SubscriptionChangePlanCancelResponse` (L6540) e `ItemAdditional` (L5637).

Atención a dos detalles del spec que es fácil "arreglar" por error:

- Los campos de las respuestas de suscripción usan **snake_case** (`sub_id`,
  `item_id`, `new_plan_id`, `old_amount`, `start_date_of_new_plan`). Se modelan
  tal cual: son la respuesta de Flow, no una API del SDK.
- En `SubscriptionChangePlanResponse`, `new_amount` y `old_amount` son
  **`string`**, mientras que `balance` es `number`. Se respeta.

### 3. Los dos listados diarios devuelven `List` sin tipar sus elementos

`/payment/getPayments` y `/payment/getTransactions` devuelven el esquema genérico
`List` (L5012), cuyo `data` es `array of object` sin estructura. La descripción
de ambos endpoints dice que los objetos "tienen la misma estructura de los
retornados en los servicios payment/getStatus" (L781, L926).

Decisión: **tiparlos como `ListResponse<Payment>`**, apoyándose en esa frase de
la descripción, y anotarlo en un comentario JSDoc citando la línea. Es la misma
regla de evidencia que en `fix-flow-request-integrity`, aplicada a un caso donde
el spec sí dice qué contiene la lista, aunque no lo enlace con un `$ref`.

*Alternativa descartada:* `ListResponse<unknown>`. Aquí sí hay una afirmación
explícita del spec sobre el contenido; ignorarla sería tan arbitrario como
inventar una forma cuando no la hay.

### 4. La cantidad de `addItem` no lleva default en el SDK

El spec declara `quantity` opcional con `default: 1` en `/subscription/addItem`
(L3074). El SDK la deja opcional **sin default propio**: si el llamador la omite,
el parámetro no viaja y Flow aplica su propio default.

*Por qué:* es exactamente la lección del defecto de `timeout` que corrige el
otro change. Un default duplicado en el cliente es una política que se
desincroniza en silencio el día que Flow cambie la suya.

### 5. Sin gate de verificación; smoke test opcional

La versión anterior de este plan abría con un grupo de tareas de verificación de
rutas que bloqueaba todo lo demás. Se elimina: el spec autoritativo hace ese
trabajo, y cada tarea cita su línea.

Queda un smoke test **opcional y no bloqueante** contra el sandbox, para cuando
haya credenciales. La única incertidumbre que subsiste es si el spec publicado va
al día con el despliegue de Flow, y eso no se resuelve leyendo más documentación.

## Risks / Trade-offs

- **El spec publicado podría ir por detrás del despliegue real** → Es la
  incertidumbre residual de todo el trabajo. Se mitiga con el smoke test opcional
  y con el hecho de que el spec es la fuente que la propia Flow publica para
  integradores.
- **Los nombres snake_case de las respuestas ensucian la API pública del SDK** →
  Se acepta: el resto del SDK ya expone campos snake_case de Flow
  (`trial_period_days`, `pending_info`, `interval_count`). Traducirlos sólo en
  estos tipos sería incoherente.
- **`ListResponse<Payment>` en los listados diarios se apoya en una frase de la
  descripción, no en un `$ref`** → Documentado con la cita en el JSDoc; si un
  smoke test lo desmiente, el ajuste es de una línea.
- **Implementar antes de que `fix-flow-request-integrity` esté archivado**
  duplicaría trabajo → La tarea 1.1 lo comprueba y detiene la implementación si
  no se cumple.
