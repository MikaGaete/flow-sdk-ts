## Purpose

Cubre las operaciones del recurso `plans` de Flow, con las que un comercio
define, consulta y administra los planes de cobro recurrente a los que luego se
suscriben sus clientes.

## ADDED Requirements

### Requirement: `urlCallback` es opcional al crear o editar un plan

El SDK SHALL tratar `urlCallback` como un parámetro opcional de
`POST /plans/create` y `POST /plans/edit`, tal como lo documenta Flow, y no
SHALL rechazar la creación de un plan que lo omita.

#### Scenario: Plan creado sin URL de notificación

- **WHEN** se crea un plan sin informar `urlCallback`
- **THEN** la petición se envía sin ese parámetro y sin error de validación

#### Scenario: Plan creado con URL de notificación

- **WHEN** se crea un plan informando `urlCallback`
- **THEN** el valor viaja en el cuerpo y participa de la firma

### Requirement: La consulta de un plan usa una query codificada

El SDK SHALL construir la query string de `GET /plans/get` con codificación de
valores, incluyendo `apiKey`, `planId` y la firma `s`.

#### Scenario: Consulta de un plan

- **WHEN** se consultan los detalles de un plan por su identificador
- **THEN** la query enviada contiene `apiKey`, `planId` codificado y `s`

#### Scenario: Identificador de plan con caracteres reservados

- **WHEN** el `planId` contiene caracteres que requieren codificación en una URL
- **THEN** el valor viaja codificado y la estructura de la URL no se altera

### Requirement: El listado de planes devuelve planes tipados

El SDK SHALL tipar los elementos devueltos por `GET /plans/list` como planes, de
modo que el consumidor acceda a sus campos con verificación de tipos en lugar de
un valor sin tipo.

#### Scenario: Listado de planes

- **WHEN** se listan los planes del comercio
- **THEN** cada elemento de la lista expone los campos del plan con su tipo
