## Purpose

Cubre las operaciones del recurso `merchant` de Flow, con las que un comercio
integrador administra los comercios asociados que operan bajo su cuenta.

## ADDED Requirements

### Requirement: Alta, edición y baja de comercios asociados incluyen `apiKey`

El SDK SHALL enviar `apiKey` en el cuerpo de `POST /merchant/create`,
`POST /merchant/edit` y `POST /merchant/delete`, además de la firma `s`, tal como
Flow lo exige para estas operaciones.

#### Scenario: Crear un comercio asociado

- **WHEN** se crea un comercio asociado con sus datos (`id`, `name`, `url`)
- **THEN** el cuerpo enviado a `POST /merchant/create` contiene `apiKey`, `s` y
  esos datos

#### Scenario: Editar un comercio asociado

- **WHEN** se edita un comercio asociado
- **THEN** el cuerpo enviado a `POST /merchant/edit` contiene `apiKey`, `s` y los
  datos a actualizar

#### Scenario: Eliminar un comercio asociado

- **WHEN** se elimina un comercio asociado por su identificador
- **THEN** el cuerpo enviado a `POST /merchant/delete` contiene `apiKey`, `s` y el
  identificador

### Requirement: Consulta y listado de comercios asociados

El SDK SHALL permitir obtener un comercio asociado por su identificador
(`GET /merchant/get`) y listar los comercios asociados con filtros
(`GET /merchant/list`), enviando en ambos casos `apiKey` y `s` en la query
string.

#### Scenario: Obtener un comercio asociado

- **WHEN** se consulta un comercio asociado por su identificador
- **THEN** se devuelven sus datos y la query enviada contiene `apiKey`, `s` y el
  identificador
