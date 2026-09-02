## Purpose

Cubre las operaciones del recurso `invoice` de Flow, con las que un comercio
consulta las facturas de sus suscripciones, las anula, registra un pago fuera de
Flow y reintenta el cobro de las facturas impagas.

## ADDED Requirements

### Requirement: El listado de facturas impagas usa la ruta declarada por Flow

El SDK SHALL invocar el listado de facturas impagas contra la ruta que Flow
declara para esa operación, como GET y con `apiKey` y `s` en la query string.

#### Scenario: Listar facturas impagas

- **WHEN** se listan las facturas impagas
- **THEN** la petición alcanza la operación de Flow y devuelve la lista, no un
  error de recurso inexistente

### Requirement: El reintento de cobro usa la ruta declarada por Flow

El SDK SHALL invocar el reintento de cobro de una factura contra la ruta que Flow
declara para esa operación, como POST y con `apiKey`, el identificador de la
factura y `s` en el cuerpo.

#### Scenario: Reintentar el cobro de una factura

- **WHEN** se reintenta el cobro de una factura impaga
- **THEN** la petición alcanza la operación de Flow y devuelve la factura
  resultante, no un error de recurso inexistente

### Requirement: Consulta, anulación y pago fuera de Flow

El SDK SHALL permitir consultar una factura por su identificador, anularla y
registrar un pago recibido fuera de Flow, enviando en cada caso `apiKey` y la
firma `s`.

#### Scenario: Consultar una factura

- **WHEN** se consulta una factura por su identificador
- **THEN** la query enviada contiene `apiKey`, el identificador y `s`
