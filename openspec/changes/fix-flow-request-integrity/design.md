## Context

Ver `proposal.md — Why` para la motivación. Lo relevante para el diseño:

- La fuente de verdad es `openspec/reference/flow-openapi.yaml`, el spec OpenAPI
  3.0 autoritativo de Flow. **Toda decisión de ruta, verbo, obligatoriedad y tipo
  se contrasta contra ese archivo, citando la línea.** No se usa ninguna lectura
  automatizada de `developers.flow.cl`: es una SPA que se renderiza en cliente y
  produce rutas inventadas.
- `BaseClient.signParams(params: Record<string | number, string | number>)`
  inyecta `apiKey` en la entrada de la firma;
  `generateSearchParams(params: Record<string, string | number | boolean>)` hace
  `new URLSearchParams(params as Record<string, string>)`. Aceptan formas
  distintas del mismo objeto y ninguno filtra `undefined`.
- Cada cliente arma su petición a mano. Ocho sitios interpolan la query en un
  template literal en vez de usar `generateSearchParams`.
- `plans-client` importa `PlansPropsSchema` sólo como fuente del tipo
  `PlansProps`: **no llama a `parseParams`**, así que ese esquema no valida nada
  en tiempo de ejecución. Igual en `settlement-client`, `customer-client` e
  `invoice-client` (sin esquema zod alguno). Sólo `payment` y `refund` validan.
- `FlowError` existe, nunca se construye, y `src/error/FlowError.ts` no se
  reexporta desde `src/index.ts`: hoy no forma parte de la superficie pública.
- `tests/flow-client.test.ts` sólo comprueba `instanceof` de tres clases.

## Goals / Non-Goals

**Goals**

- Que cada método existente llame a la ruta, con el verbo y con los parámetros
  que el spec declara.
- Que la construcción de la petición tenga un único camino en `BaseClient`.
- Que la suite de tests cierre la clase de defectos que ya reincidió: parámetro
  o ruta equivocados en lo que se envía.

**Non-Goals**

- No se añade ningún endpoint que el SDK no implemente hoy: eso es
  `add-missing-flow-endpoints`.
- No se introduce validación zod donde hoy no existe (`plans`, `customer`,
  `settlement`, `invoice`). Las correcciones de obligatoriedad en esos clientes
  son de tipos TypeScript.
- No se rediseña la API pública más allá de lo que el proposal declara como
  BREAKING.
- No se introducen dependencias nuevas: los tests usan Jest y un doble de
  `globalThis.fetch`.

## Decisions

### 1. Un único tipo de parámetro y un único punto de filtrado en `BaseClient`

Se introduce un tipo compartido de parámetros (`string | number | boolean`)
aceptado por `signParams` y `generateSearchParams`, y el descarte de `undefined`
/ `null` se hace en los dos, no en los llamadores.

*Por qué:* el bug de `timeout` no es sólo el `.default(10)`. Al quitarlo, un
`{ timeout: undefined }` explícito sobrevive al `parse` de zod y viajaría como
`timeout=undefined`, firmándose además como `"timeoutundefined"` — firma
inválida. Filtrar en el llamador significaría repetirlo en ~40 métodos.

*Alternativa descartada:* un helper `buildRequest()` que firme y serialice de una
vez. Más limpio, pero reescribe los 40 métodos y multiplica el diff justo donde
hay que verificar caso a caso que la ruta y los parámetros son los del spec.

### 2. `apiKey` se sigue pasando explícitamente en cada llamada

No se hace que `generateSearchParams` inyecte `apiKey` automáticamente, aunque
eliminaría de raíz el defecto de los cuatro cuerpos sin `apiKey`.

*Por qué:* es un serializador de propósito general; hacerlo inyectar credenciales
lo convierte en otra cosa de la que su nombre dice, y el día que se serialice
algo que no sea una petición a Flow, la credencial se filtra. La red de seguridad
correcta es el test por método, no un efecto implícito.

### 3. `timeout` pierde su valor por defecto, sin sustituirlo

Se elimina `.default(10)` y no se pone otro. El spec (L1047) define el campo en
segundos y define la omisión como "la orden no expirará y estará vigente para
pago por tiempo indefinido". Cualquier default es una política que el SDK no
debe imponer, y el actual contradice su propio JSDoc ("10 minutos").

*Trade-off:* cambio de comportamiento observable → changeset menor con nota de
migración explícita.

### 4. En `refund/create` no se añade la regla "al menos uno"

`commerceTrxId` y `flowTrxId` quedan **ambos opcionales y ambos `string`**
(L1231-1236), sin `.refine()`.

*Corrección respecto de la versión anterior de este plan*, que los tipaba
`string` + `number` y añadía un refine "al menos uno de los dos". El spec no
declara esa restricción ni ese tipo: `required` en `/refund/create` es
`[apiKey, refundCommerceOrder, receiverEmail, amount, urlCallBack, s]`.

*Por qué no conservar el refine como decisión de UX:* rechazar en el cliente una
llamada que la API acepta convierte al SDK en una fuente de verdad paralela que
nadie mantiene, y deja al integrador sin forma de hacer algo legal. Si Flow
rechaza el caso, lo hará con un mensaje suyo, más informativo que un error
inventado por el SDK. La regla de este change es: el SDK modela lo que el spec
declara, ni más estricto ni más laxo.

### 5. Las rutas y los verbos se corrigen citando el spec, no el nombre del método

`/customer/getChargeAttemps` (una `p`, L2198) es una errata de Flow, no del SDK.
Se usa la grafía de Flow y se deja un comentario JSDoc que lo explique, para que
nadie la "corrija" en una revisión futura. Lo mismo para
`/payment/getStatusByFlowOrderExtended` (L876), cuyo orden de palabras no es el
que sugiere el nombre del método del SDK.

*Por qué no renombrar los métodos para que coincidan con la ruta:* los nombres
públicos actuales son legibles y renombrarlos rompería a los consumidores sin
ganancia. La ruta es un detalle interno.

### 6. `getSettlement` cambia de ruta conservando su firma pública

Pasa a `GET /settlement/getByIdv2?id=...` (L4348) manteniendo
`getSettlement(id)` y el tipo `SettlementDetail`, reconciliado campo a campo
contra `SettlementV2` / `SettlementBaseV2` (L6111-6217) — la diferencia visible
es el campo `enterprise`.

*Corrección respecto de la versión anterior de este plan*, que difería este
cambio por riesgo de regresión. Ese riesgo ya no existe: el spec tiene cuatro
rutas de liquidación (`getByDate`, `getById`, `search`, `getByIdv2`) y
`/settlement/{id}` no es ninguna, así que el método está roto hoy. `getById` y
`getByDate` están `deprecated: true`, de modo que `getByIdv2` es la única
destino razonable.

`id` se declara `type: string` en el spec mientras el SDK lo tipa `number`. Se
acepta `string | number` en la entrada del método para no romper a nadie, y viaja
tal cual.

### 7. Los tres listados de `customer` reciben `customerId` como primer argumento

`getCustomerCharges`, `getCustomerChargeAttempts` y `getCustomerSubscriptions`
pasan a `(customerId, props?)`, siguiendo el patrón que ya usa
`getSubscriptions(planId, filter?)` en `subscription-client`.

*Por qué romper la firma:* Flow declara `customerId` obligatorio en los tres
(L2136, L2212, L2288) y hoy no se envía en ninguno, así que los tres devuelven
error. No hay integraciones correctas que romper; sí las hay que arreglar.

### 8. `getPaymentOrderStatusByFlowOrder` corrige parámetro y tipo de retorno

Pasa a enviar `flowOrder` (L744) en vez de `token`, y a devolver el estado simple
`Payment`, no `ExtendedPaymentOrderStatus`: el spec de esa operación responde
`PaymentStatus`. El parámetro del método se renombra de `transactionToken` a
`flowOrder`, que es lo que realmente recibe.

### 9. Los tipos sin resolver se reemplazan sólo con evidencia del spec

`getCustomerSubscriptions` → `ListResponse<Subscription>` y
`ListPlansResponse.data` → `PlansResponse[]`: seguros, ambos tipos ya modelados.

Para `chargeCustomer` (`/customer/collect`), `getCustomerCharges` y
`getCustomerChargeAttempts`, **el spec declara la respuesta como el esquema
genérico `List`, cuyo `data` es `array of object` sin estructura** (L5012). No
hay evidencia que permita tiparlos, así que **se quedan en `unknown` y se anota
el motivo con la línea del spec**. Un tipo inventado es peor: `unknown` obliga a
comprobar, un tipo equivocado da confianza falsa.

*Nota:* existe un esquema `ChargeAttemps` (L6420) que ninguna operación
referencia. No se usa para tipar la respuesta mientras el spec no lo enlace.

### 10. `FlowError` se pone en uso en vez de borrarse

`parseParams` lanza `FlowError` conservando el detalle de zod, y ambos errores se
exportan desde `src/index.ts`.

*Por qué no borrarlo:* la auditoría lo propuso por muerto, pero el hueco real es
el opuesto — hoy un fallo de validación llega como `Error('Invalid props')`,
indistinguible de cualquier otro y sin decir qué campo falló.

### 11. Los tests interceptan `fetch` y afirman ruta, verbo y payload

Un helper sustituye `globalThis.fetch` por un doble que captura URL, método y
cuerpo. Cada método de cliente tiene al menos una aserción sobre la **ruta**
(no sólo el payload), porque cinco de los doce defectos de este change son de
ruta o de verbo y una aserción de payload no los habría detectado.

La firma se prueba aparte con vectores fijos (secreto y parámetros conocidos →
digest esperado), incluyendo un caso con parámetro omitido y otro con carácter
reservado.

## Risks / Trade-offs

- **Quitar el default de `timeout` cambia el comportamiento de integraciones
  existentes** → Bump menor con changeset y nota de migración; el cambio va en la
  dirección segura (órdenes que dejan de expirar prematuramente).
- **Cinco firmas públicas cambian** (tres listados de `customer`,
  `getPaymentOrderStatusByFlowOrder`, `paymentMethod`, `reverseCharge.flowOrder`)
  → Todas ellas pertenecen a métodos que hoy no funcionan; la migración se
  documenta en el changeset. `timeout` es el único cambio que afecta a un camino
  que hoy funciona.
- **Ninguna corrección está confirmada con una llamada al sandbox** (no hay
  credenciales en este entorno) → Cada una cita la línea del spec autoritativo,
  que es evidencia cualitativamente distinta de las inferencias de la auditoría
  previa. Aun así, la tarea de entrega incluye un smoke test opcional en sandbox
  si aparecen credenciales.
- **Cambiar la construcción de las ocho URLs altera el orden de los parámetros**
  → La firma se calcula sobre parámetros ordenados alfabéticamente, así que el
  orden de emisión es irrelevante. Los tests afirman sobre parámetros
  individuales (`URLSearchParams.get`), nunca sobre la cadena literal.
- **`plans`, `customer`, `invoice` y `settlement` no validan en tiempo de
  ejecución** → Las correcciones de obligatoriedad ahí son sólo de tipos.
  Introducir `parseParams` en esos clientes sería un cambio de comportamiento no
  pedido y queda fuera.

## Migration Plan

1. Las correcciones de ruta, verbo, `apiKey` y codificación no requieren acción
   del integrador: arreglan métodos que hoy fallan.
2. `timeout` requiere nota de migración: quien creaba órdenes sin `timeout` y
   esperaba una expiración debe pasarlo explícitamente, **en segundos**.
3. Los tres listados de `customer` requieren pasar `customerId` como primer
   argumento; `getPaymentOrderStatusByFlowOrder` requiere pasar el número de
   orden de Flow y devuelve el estado simple.
4. `paymentMethod` pasa de `string` a `number` y `reverseCharge.flowOrder` de
   `string` a `number`.
5. Rollback: cada corrección es independiente y revertible por separado.
