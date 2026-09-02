## ADDED Requirements

### Requirement: Ítems adicionales sobre una suscripción

El SDK SHALL permitir agregar, actualizar la cantidad y quitar un ítem adicional
sobre una suscripción concreta. Al agregar, la cantidad SHALL ser opcional y su
omisión SHALL significar una unidad; al actualizar, la cantidad SHALL ser
obligatoria. En ambos casos la cantidad admitida va de 1 a 999.

#### Scenario: Ítem agregado sin cantidad

- **WHEN** se agrega un ítem adicional a una suscripción sin indicar cantidad
- **THEN** el cuerpo enviado contiene `apiKey`, `s`, el identificador de la
  suscripción y el del ítem, sin el parámetro de cantidad
- **AND** Flow aplica una unidad

#### Scenario: Ítem agregado con cantidad

- **WHEN** se agrega un ítem adicional indicando una cantidad entre 1 y 999
- **THEN** la cantidad viaja en el cuerpo y participa de la firma

#### Scenario: Cantidad actualizada

- **WHEN** se actualiza la cantidad de un ítem adicional de una suscripción
- **THEN** la petición se envía con el identificador de la suscripción, el del
  ítem y la nueva cantidad

#### Scenario: Ítem quitado

- **WHEN** se quita un ítem adicional de una suscripción
- **THEN** la petición se envía con el identificador de la suscripción y el del
  ítem, y se devuelve el resultado de la baja

### Requirement: Cambio de plan de una suscripción

El SDK SHALL permitir cambiar el plan de una suscripción existente, indicando
opcionalmente la fecha de inicio del nuevo plan; previsualizar el efecto de ese
cambio sin aplicarlo; y cancelar un cambio de plan ya programado.

#### Scenario: Cambio de plan aplicado

- **WHEN** se cambia el plan de una suscripción
- **THEN** el cuerpo enviado contiene `apiKey`, `s`, el identificador de la
  suscripción y el del nuevo plan
- **AND** se devuelve el resultado del cambio

#### Scenario: Cambio de plan programado para una fecha

- **WHEN** se cambia el plan indicando la fecha de inicio del nuevo plan
- **THEN** esa fecha viaja en el cuerpo y participa de la firma

#### Scenario: Previsualización sin efecto

- **WHEN** se previsualiza un cambio de plan
- **THEN** se devuelve el efecto estimado del cambio
- **AND** la suscripción no se modifica

#### Scenario: Cambio de plan programado cancelado

- **WHEN** se cancela un cambio de plan aún no aplicado
- **THEN** la petición se envía con el identificador de la suscripción y la
  suscripción conserva su plan vigente
