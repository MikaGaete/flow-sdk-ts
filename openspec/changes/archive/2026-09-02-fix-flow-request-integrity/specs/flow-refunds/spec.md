## Purpose

Cubre las operaciones del recurso `refund` de Flow, con las que un comercio crea,
cancela y consulta órdenes de reembolso sobre pagos ya recibidos.

## ADDED Requirements

### Requirement: La creación de un reembolso incluye `apiKey`

El SDK SHALL enviar `apiKey` en el cuerpo de la creación de un reembolso, además
de la firma `s` y los parámetros del reembolso.

#### Scenario: Crear una orden de reembolso

- **WHEN** se crea una orden de reembolso
- **THEN** el cuerpo enviado contiene `apiKey`, `s`, `refundCommerceOrder`,
  `receiverEmail`, `amount` y `urlCallBack`

### Requirement: Los identificadores de la transacción original son opcionales

El SDK SHALL tratar `commerceTrxId` y `flowTrxId` como parámetros opcionales de
tipo cadena que identifican la transacción original, sin exigir ninguno de los
dos ni imponer restricciones que Flow no declara.

#### Scenario: Sólo se informa el identificador del comercio

- **WHEN** se crea un reembolso indicando `commerceTrxId` y omitiendo `flowTrxId`
- **THEN** la petición se envía con `commerceTrxId` y sin `flowTrxId`

#### Scenario: Sólo se informa el identificador de Flow

- **WHEN** se crea un reembolso indicando `flowTrxId` y omitiendo `commerceTrxId`
- **THEN** la petición se envía con `flowTrxId` y sin `commerceTrxId`

#### Scenario: No se informa ningún identificador

- **WHEN** se crea un reembolso sin `commerceTrxId` ni `flowTrxId`
- **THEN** la petición se envía igualmente, sin ninguno de los dos parámetros, y
  es Flow quien decide si la acepta

### Requirement: La cancelación de un reembolso se envía como POST

El SDK SHALL invocar la cancelación de un reembolso con el método POST y los
parámetros `apiKey`, `token` y `s` en el cuerpo, tal como Flow declara la
operación.

#### Scenario: Cancelar un reembolso pendiente

- **WHEN** se cancela una orden de reembolso por su token
- **THEN** la petición se envía con método POST
- **AND** el cuerpo contiene `apiKey`, `token` y `s`

### Requirement: La consulta de estado usa una query codificada

El SDK SHALL invocar la consulta de estado de un reembolso como GET, con una
query string construida con codificación de valores e incluyendo `apiKey`,
`token` y la firma `s`.

#### Scenario: Consultar el estado de un reembolso

- **WHEN** se consulta el estado de un reembolso por su token
- **THEN** la query enviada contiene `apiKey`, `token` codificado y `s`

#### Scenario: Token con caracteres reservados

- **WHEN** el token contiene caracteres que requieren codificación en una URL
- **THEN** el token viaja codificado y Flow lo recibe íntegro
