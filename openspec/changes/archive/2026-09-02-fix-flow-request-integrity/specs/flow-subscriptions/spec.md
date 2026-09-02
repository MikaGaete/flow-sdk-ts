## Purpose

Cubre las operaciones del recurso `subscription` de Flow, con las que un comercio
suscribe a un cliente a un plan y administra el ciclo de vida de esa suscripción:
periodo de prueba, cupones de descuento y cancelación.

## ADDED Requirements

### Requirement: El listado de suscripciones se hace por plan

El SDK SHALL exigir el identificador del plan para listar suscripciones, ya que
Flow lo declara obligatorio en esa operación, y SHALL aceptar los filtros de
paginación como parámetros opcionales adicionales.

#### Scenario: Listado de las suscripciones de un plan

- **WHEN** se listan las suscripciones indicando el identificador del plan
- **THEN** la query enviada contiene `planId`, `apiKey` y `s`

#### Scenario: La documentación refleja el parámetro obligatorio

- **WHEN** un integrador consulta la documentación de este listado
- **THEN** ésta indica que el identificador del plan es obligatorio y no puede
  invocarse sólo con filtros

### Requirement: La cancelación al final del periodo es opcional

El SDK SHALL tratar como opcional la indicación de cancelar al final del periodo,
tal como Flow la declara, aplicando el comportamiento por defecto de Flow cuando
se omita.

#### Scenario: Cancelación sin indicar el momento

- **WHEN** se cancela una suscripción sin indicar si debe cancelarse al final del
  periodo
- **THEN** la petición se envía sin ese parámetro y sin error de validación

#### Scenario: Cancelación al final del periodo

- **WHEN** se cancela una suscripción indicando que sea al final del periodo
- **THEN** el valor viaja en el cuerpo y participa de la firma
