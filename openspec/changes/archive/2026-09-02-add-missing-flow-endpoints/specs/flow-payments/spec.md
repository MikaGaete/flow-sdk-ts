## ADDED Requirements

### Requirement: Cobro por email

El SDK SHALL permitir generar un cobro por email, con el que Flow envía al
pagador un correo con la información de la orden y su enlace de pago. La
operación SHALL exigir la orden del comercio, el asunto, el monto, el correo del
pagador, la URL de confirmación y la URL de retorno, y SHALL aceptar como
opcionales la moneda, los reenvíos de persistencia, los datos opcionales, los
tiempos de expiración, el comercio asociado y la moneda de pago.

#### Scenario: Cobro por email generado

- **WHEN** se genera un cobro por email con sus parámetros obligatorios
- **THEN** el cuerpo enviado contiene `apiKey`, la firma `s` y esos parámetros
- **AND** se devuelve la URL y el token con los que se forma el enlace de pago

#### Scenario: Reenvíos de persistencia

- **WHEN** se genera un cobro por email indicando cada cuántos días y cuántas
  veces reenviar la notificación si la orden sigue impaga
- **THEN** esos parámetros viajan en el cuerpo y participan de la firma

#### Scenario: La documentación del SDK deja de prometer lo que no ofrece

- **WHEN** un integrador lee la descripción del cliente de pagos en el README
- **THEN** la mención a los cobros por email corresponde a un método que existe

### Requirement: Listado diario de pagos

El SDK SHALL permitir obtener la lista paginada de pagos recibidos en un día,
exigiendo la fecha en formato `yyyy-mm-dd` y aceptando el registro de inicio y el
número de registros por página como opcionales.

#### Scenario: Pagos de un día

- **WHEN** se solicitan los pagos recibidos en una fecha
- **THEN** la query enviada contiene `apiKey`, `s` y la fecha
- **AND** se devuelve una lista paginada con su total y su indicador de más
  páginas

#### Scenario: Paginación explícita

- **WHEN** se solicitan los pagos de un día indicando el registro de inicio y el
  tamaño de página
- **THEN** ambos parámetros viajan en la query

### Requirement: Listado diario de transacciones

El SDK SHALL permitir obtener la lista paginada de transacciones realizadas en un
día, como operación distinta del listado de pagos, con los mismos parámetros de
fecha y paginación.

#### Scenario: Transacciones de un día

- **WHEN** se solicitan las transacciones realizadas en una fecha
- **THEN** se devuelve una lista paginada de transacciones
- **AND** la petición se dirige a una operación distinta de la del listado de
  pagos
