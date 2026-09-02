## Purpose

Cubre las operaciones del recurso `settlement` de Flow, con las que un comercio
consulta las liquidaciones que Flow le ha efectuado: su búsqueda por rango de
fechas y su detalle movimiento a movimiento.

## ADDED Requirements

### Requirement: La consulta de detalle usa la operación vigente

El SDK SHALL obtener el detalle de una liquidación invocando la operación de
consulta por identificador vigente de Flow, pasando el identificador como
parámetro de query junto a `apiKey` y la firma `s`. El SDK no SHALL construir la
URL colocando el identificador como segmento de la ruta, ni usar las operaciones
que Flow marca como obsoletas.

#### Scenario: Detalle obtenido

- **WHEN** se consulta una liquidación por su identificador
- **THEN** la query enviada contiene `apiKey`, `id` y `s`
- **AND** la petición alcanza la operación de Flow, no un error de recurso
  inexistente

#### Scenario: El identificador no va en la ruta

- **WHEN** se construye la URL de la consulta de detalle
- **THEN** la ruta es fija y el identificador viaja como parámetro

### Requirement: El detalle de liquidación se tipa según el esquema vigente

El SDK SHALL modelar la respuesta del detalle según el esquema que Flow declara
para la operación vigente: los datos generales de la liquidación —incluido el
tipo de empresa—, el resumen por concepto y el detalle de pagos, retenciones y
devoluciones.

#### Scenario: Consumo del detalle

- **WHEN** un consumidor lee el detalle de una liquidación
- **THEN** accede con verificación de tipos a los datos generales, al resumen y
  al detalle de movimientos

### Requirement: Búsqueda de liquidaciones por rango de fechas

El SDK SHALL permitir buscar las liquidaciones comprendidas entre una fecha
inicial y una final, opcionalmente acotadas por moneda, enviando `apiKey` y la
firma `s` en la query string.

#### Scenario: Búsqueda por rango

- **WHEN** se buscan liquidaciones entre dos fechas
- **THEN** la query enviada contiene `apiKey`, `s`, la fecha inicial y la final
- **AND** se devuelve el conjunto de liquidaciones del rango
