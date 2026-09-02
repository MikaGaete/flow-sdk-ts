## Purpose

Cubre el recurso de ítems adicionales de suscripción de Flow: el catálogo de
cargos que un comercio puede definir para cobrarlos sobre una suscripción por
encima de su plan base, con su creación, consulta, edición, baja y listado.

## ADDED Requirements

### Requirement: Cliente dedicado accesible desde la fachada

El SDK SHALL exponer las operaciones del recurso de ítems adicionales mediante un
cliente propio, accesible como una propiedad más de la fachada `Flow`, con la
misma configuración de credenciales y entorno que el resto de los clientes.

#### Scenario: Cliente disponible en la fachada

- **WHEN** un integrador construye la fachada `Flow`
- **THEN** dispone del cliente de ítems adicionales como una propiedad más

#### Scenario: Tipos disponibles para el consumidor

- **WHEN** un consumidor importa el paquete
- **THEN** el cliente y sus tipos públicos están disponibles en la superficie
  exportada

### Requirement: Creación de un ítem adicional

El SDK SHALL permitir crear un ítem adicional exigiendo su nombre, su moneda y su
monto, y SHALL devolver el ítem creado tipado.

#### Scenario: Ítem creado

- **WHEN** se crea un ítem adicional con nombre, moneda y monto
- **THEN** el cuerpo enviado contiene `apiKey`, `s` y esos tres datos
- **AND** se devuelve el ítem con su identificador

### Requirement: Consulta y listado de ítems adicionales

El SDK SHALL permitir consultar un ítem adicional por su identificador y listar
los ítems del comercio con filtros opcionales de paginación, filtro de texto y
estado, enviando `apiKey` y la firma `s` en la query string.

#### Scenario: Consulta de un ítem

- **WHEN** se consulta un ítem adicional por su identificador
- **THEN** la query enviada contiene `apiKey`, el identificador del ítem y `s`

#### Scenario: Listado con filtros

- **WHEN** se listan los ítems adicionales indicando paginación y estado
- **THEN** esos filtros viajan en la query y se devuelve una lista paginada

### Requirement: Edición y baja de un ítem adicional

El SDK SHALL permitir editar un ítem adicional —exigiendo su identificador y
aceptando como opcionales el nombre, el monto y el tipo de cambio— y darlo de
baja exigiendo su identificador y el tipo de cambio.

#### Scenario: Ítem editado

- **WHEN** se edita un ítem adicional cambiando su monto
- **THEN** el cuerpo enviado contiene `apiKey`, `s`, el identificador y el nuevo
  monto

#### Scenario: Ítem dado de baja

- **WHEN** se da de baja un ítem adicional
- **THEN** el cuerpo enviado contiene `apiKey`, `s`, el identificador y el tipo
  de cambio
