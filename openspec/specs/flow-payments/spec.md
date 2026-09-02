## Purpose

Cubre las operaciones del recurso `payment` de Flow: la creación de órdenes de
pago que generan el enlace de checkout y la consulta de su estado, simple o
extendido.

## Requirements

### Requirement: Una orden de pago sin `timeout` no expira

El SDK SHALL enviar `timeout` a `POST /payment/create` únicamente cuando el
integrador lo informe explícitamente. Cuando se omita, el parámetro no viajará a
Flow y la orden conservará la vigencia indefinida que Flow aplica por defecto.
`timeout` se expresa en segundos.

#### Scenario: Orden creada sin `timeout`

- **WHEN** se crea una orden de pago sin indicar `timeout`
- **THEN** el cuerpo enviado a `POST /payment/create` no contiene el parámetro
  `timeout`
- **AND** `timeout` tampoco participa del cálculo de la firma

#### Scenario: Orden creada con `timeout` explícito

- **WHEN** se crea una orden de pago indicando `timeout` en segundos
- **THEN** ese valor viaja tal cual en el cuerpo y participa de la firma

#### Scenario: La unidad documentada es el segundo

- **WHEN** un integrador consulta la documentación del parámetro `timeout`
- **THEN** ésta indica que se expresa en segundos y que omitirlo significa que la
  orden no expira

### Requirement: Los parámetros de creación siguen los tipos de Flow

El SDK SHALL modelar `paymentMethod` como un identificador numérico del medio de
pago, y SHALL aceptar `checkout_timeout` —el tiempo máximo en segundos para
seleccionar un medio de pago en el checkout— como parámetro opcional.

#### Scenario: Medio de pago preseleccionado

- **WHEN** se crea una orden indicando el identificador numérico de un medio de
  pago
- **THEN** el valor viaja como número y Flow redirige directamente a ese medio

#### Scenario: Límite de tiempo en el checkout

- **WHEN** se crea una orden indicando `checkout_timeout`
- **THEN** el valor viaja en el cuerpo y participa de la firma

#### Scenario: `checkout_timeout` omitido

- **WHEN** se crea una orden sin indicar `checkout_timeout`
- **THEN** el parámetro no viaja y no se aplica límite de tiempo en el checkout

### Requirement: La creación de una orden de pago devuelve el enlace de checkout

El SDK SHALL devolver, junto a la respuesta cruda de Flow, la URL de redirección
al checkout formada por la URL y el token que Flow entrega.

#### Scenario: Orden creada correctamente

- **WHEN** Flow acepta la creación de la orden y devuelve `url` y `token`
- **THEN** el SDK devuelve la URL de redirección al checkout y la respuesta cruda

### Requirement: Consulta de estado por token, por orden Flow y por commerceId

El SDK SHALL ofrecer la consulta de estado de una orden por su token, por el
número de orden de Flow y por el identificador de comercio, enviando en cada caso
el parámetro que Flow declara para esa operación: `token`, `flowOrder` y
`commerceId` respectivamente.

#### Scenario: Consulta por número de orden de Flow

- **WHEN** se consulta el estado de una orden por su número de orden de Flow
- **THEN** la query enviada contiene el parámetro `flowOrder` con ese número
- **AND** se devuelve el estado simple del pago, no el extendido

#### Scenario: Consulta por token

- **WHEN** se consulta el estado de una orden por su token
- **THEN** la query enviada contiene `apiKey`, `token` codificado y `s`

#### Scenario: Consulta por identificador de comercio

- **WHEN** se consulta el estado de una orden por su `commerceId`
- **THEN** la query enviada contiene ese parámetro con su valor codificado

### Requirement: Las consultas de estado usan una query codificada

El SDK SHALL construir la query string de todas las consultas de estado con
codificación de valores, incluyendo `apiKey`, el identificador correspondiente y
la firma `s`.

#### Scenario: Identificador con caracteres reservados

- **WHEN** el token, el `flowOrder` o el `commerceId` contienen caracteres que
  requieren codificación en una URL
- **THEN** el valor viaja codificado y la estructura de la URL no se altera

### Requirement: El estado extendido expone los datos de la tarjeta y el último error

El SDK SHALL tipar la respuesta del estado extendido incluyendo, dentro de los
datos del pago, el campo `cardNumber` —el BIN y los últimos cuatro dígitos de la
tarjeta— y, en el nivel superior, el objeto `lastError` con el código, el mensaje
y el código del medio de pago del último intento fallido.

#### Scenario: Consulta de estado extendido de un pago con tarjeta

- **WHEN** se consulta el estado extendido de una orden pagada con tarjeta
- **THEN** el consumidor puede leer `cardNumber` desde el tipo devuelto, con
  autocompletado y verificación de tipos

#### Scenario: Consulta de estado extendido tras un intento fallido

- **WHEN** se consulta el estado extendido de una orden con un intento fallido
- **THEN** el consumidor puede leer el código, el mensaje y el código del medio
  de pago de ese último error desde el tipo devuelto

### Requirement: El estado extendido por orden Flow usa la ruta declarada

El SDK SHALL invocar la consulta de estado extendido por número de orden de Flow
contra la ruta que Flow declara para esa operación, enviando `flowOrder`.

#### Scenario: Consulta extendida por orden Flow

- **WHEN** se consulta el estado extendido de una orden por su número de orden
  de Flow
- **THEN** la petición alcanza la operación de Flow y devuelve el estado
  extendido, no un error de recurso inexistente
