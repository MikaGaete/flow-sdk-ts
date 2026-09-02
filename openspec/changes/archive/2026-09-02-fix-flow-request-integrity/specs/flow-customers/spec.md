## Purpose

Cubre las operaciones del recurso `customer` de Flow, con las que un comercio
registra clientes, guarda su medio de pago y les realiza cobros, individuales o
por lote, además de consultar el historial de esos cobros.

## ADDED Requirements

### Requirement: Los listados de un cliente identifican al cliente

El SDK SHALL exigir y enviar el identificador del cliente en el listado de
cargos, en el de intentos de cargo fallidos y en el de suscripciones, ya que Flow
lo declara obligatorio en las tres operaciones.

#### Scenario: Listado de cargos de un cliente

- **WHEN** se listan los cargos de un cliente
- **THEN** la query enviada contiene `customerId` junto a `apiKey` y `s`

#### Scenario: Listado de intentos de cargo de un cliente

- **WHEN** se listan los intentos de cargo fallidos de un cliente
- **THEN** la query enviada contiene `customerId` junto a `apiKey` y `s`

#### Scenario: Listado de suscripciones de un cliente

- **WHEN** se listan las suscripciones de un cliente
- **THEN** la query enviada contiene `customerId` junto a `apiKey` y `s`

### Requirement: El listado de intentos de cargo usa la ruta declarada por Flow

El SDK SHALL invocar el listado de intentos de cargo fallidos contra la ruta que
Flow declara, aunque su grafía contenga una errata respecto del nombre esperable
de la operación.

#### Scenario: Listado de intentos de cargo

- **WHEN** se listan los intentos de cargo fallidos de un cliente
- **THEN** la petición alcanza la operación de Flow y devuelve la lista paginada,
  no un error de recurso inexistente

### Requirement: Los filtros de los listados son opcionales

El SDK SHALL tratar como opcionales los filtros que Flow declara opcionales en
estos listados —entre ellos la fecha de inicio y el número de orden del
comercio— y no SHALL exigirlos al llamador.

#### Scenario: Listado de cargos sin fecha de inicio

- **WHEN** se listan los cargos de un cliente sin indicar fecha de inicio
- **THEN** la petición se envía sin ese filtro y sin error de validación

#### Scenario: Listado de intentos sin número de orden

- **WHEN** se listan los intentos de cargo sin indicar el número de orden del
  comercio
- **THEN** la petición se envía sin ese filtro y sin error de validación

### Requirement: La baja de registro de un cliente se envía como POST

El SDK SHALL invocar la baja del registro de la tarjeta de un cliente con el
método POST y los parámetros `apiKey`, `customerId` y `s` en el cuerpo, tal como
Flow declara la operación.

#### Scenario: Dar de baja el registro de un cliente

- **WHEN** se da de baja el registro de un cliente
- **THEN** la petición se envía con método POST
- **AND** el cuerpo contiene `apiKey`, `customerId` y `s`

### Requirement: La reversa de un cargo no exige identificadores

El SDK SHALL tratar como opcionales el número de orden del comercio y el número
de orden de Flow en la reversa de un cargo, y SHALL modelar el número de orden de
Flow como valor numérico, siguiendo lo que Flow declara.

#### Scenario: Reversa indicando sólo la orden del comercio

- **WHEN** se reversa un cargo indicando únicamente la orden del comercio
- **THEN** la petición se envía con ese parámetro y sin el número de orden de
  Flow

### Requirement: Las respuestas de los listados y del cobro se tipan con evidencia

El SDK SHALL tipar las respuestas de estas operaciones a partir de los esquemas
que Flow declara. Cuando Flow declare la respuesta como una lista de objetos sin
estructura definida, el SDK SHALL conservar un tipo sin resolver antes que
publicar una forma inventada, salvo que el recurso listado ya esté modelado en
el SDK a partir de otra operación (caso del listado de suscripciones de un
cliente, cuyos elementos son suscripciones ya tipadas).

#### Scenario: Respuesta con esquema declarado

- **WHEN** Flow declara la estructura de los elementos devueltos
- **THEN** el consumidor accede a sus campos con verificación de tipos

#### Scenario: Respuesta sin esquema declarado y sin modelo previo

- **WHEN** Flow declara la respuesta como una lista de objetos genéricos y el
  recurso listado no está modelado en otra parte del SDK
- **THEN** el tipo permanece sin resolver y la razón queda registrada, en lugar
  de sustituirse por una forma supuesta

#### Scenario: Listado de un recurso ya modelado

- **WHEN** Flow declara la respuesta como una lista genérica pero sus elementos
  son de un recurso que el SDK ya tipa a partir de otra operación
- **THEN** el listado reutiliza ese tipo

### Requirement: Las peticiones del cliente incluyen `apiKey` y firma

El SDK SHALL enviar `apiKey` y la firma `s` en toda operación del recurso
`customer`, en el cuerpo para las de escritura y en la query string codificada
para las de lectura.

#### Scenario: Operación de lectura del recurso `customer`

- **WHEN** se consulta un cliente, su estado de registro o cualquiera de sus
  listados
- **THEN** la query enviada contiene `apiKey`, `s` y los parámetros de la
  operación, con sus valores codificados
