## Purpose

Define el contrato compartido con el que el SDK construye, firma y envía toda
petición a la API de Flow, y cómo propaga los errores de validación y de HTTP,
de modo que cada cliente de recurso se comporte de forma idéntica.

## Requirements

### Requirement: Toda petición envía `apiKey` y su firma

El SDK SHALL incluir tanto `apiKey` como la firma `s` en los datos efectivamente
enviados a Flow —en el cuerpo `application/x-www-form-urlencoded` para POST y en
la query string para GET— además de incluir `apiKey` en la entrada del cálculo
de la firma.

#### Scenario: Petición POST

- **WHEN** un cliente invoca cualquier operación de escritura de Flow
- **THEN** el cuerpo enviado contiene `apiKey`, la firma `s` y los parámetros
  propios de la operación

#### Scenario: Petición GET

- **WHEN** un cliente invoca cualquier operación de lectura de Flow
- **THEN** la query string enviada contiene `apiKey`, la firma `s` y los
  parámetros propios de la operación

### Requirement: Cada operación usa la ruta y el verbo que Flow declara

El SDK SHALL invocar cada operación con la ruta exacta y el método HTTP que Flow
declara para ella, enviando los parámetros en el cuerpo cuando la operación es
POST y en la query string cuando es GET.

#### Scenario: Operación declarada como POST

- **WHEN** el SDK invoca una operación que Flow declara POST
- **THEN** la petición se envía con método POST y los parámetros en el cuerpo
  `application/x-www-form-urlencoded`, no en la query string

#### Scenario: Ruta con una grafía inesperada

- **WHEN** la ruta que Flow declara contiene una errata o una grafía que no
  coincide con el nombre del método del SDK
- **THEN** el SDK usa la ruta tal como Flow la declara, no la grafía "correcta"

#### Scenario: Parámetro obligatorio de la operación

- **WHEN** Flow declara un parámetro como obligatorio para una operación
- **THEN** el SDK lo acepta en la entrada del método y lo envía en cada llamada

### Requirement: La firma cubre los parámetros enviados, excluyendo `s`

El SDK SHALL calcular la firma como un HMAC-SHA256 en hexadecimal, sobre la
concatenación de nombre y valor de los parámetros ordenados alfabéticamente,
excluyendo el propio parámetro `s`, usando el secreto del comercio como clave.

#### Scenario: Firma reproducible

- **WHEN** se firma un conjunto conocido de parámetros con un secreto conocido
- **THEN** el resultado es el digest hexadecimal HMAC-SHA256 esperado, y no
  varía con el orden en que se hayan declarado los parámetros

#### Scenario: `s` no participa de su propia firma

- **WHEN** el conjunto de parámetros a firmar ya contiene una clave `s`
- **THEN** esa clave se omite del texto firmado

### Requirement: Los parámetros omitidos no se firman ni se envían

El SDK SHALL descartar todo parámetro cuyo valor sea `undefined` o `null` antes
de firmar y antes de serializar, de modo que un campo opcional omitido no
aparezca en la firma ni viaje a Flow como la cadena literal `"undefined"`.

#### Scenario: Campo opcional omitido

- **WHEN** una operación recibe un objeto de parámetros con un campo opcional en
  `undefined`
- **THEN** ese campo no aparece en el cuerpo ni en la query enviada
- **AND** la firma se calcula como si el campo nunca hubiese existido

### Requirement: La firma y la serialización aceptan los mismos parámetros

El SDK SHALL admitir el mismo conjunto de tipos de valor (`string`, `number`,
`boolean`) tanto al firmar como al serializar, de modo que un mismo objeto de
parámetros pueda pasarse a ambas operaciones sin conversiones intermedias.

#### Scenario: Parámetro booleano

- **WHEN** una operación incluye un parámetro de valor booleano
- **THEN** se firma y se envía con la misma representación textual, sin error de
  tipos

### Requirement: Los valores se codifican para la URL

El SDK SHALL codificar los valores de los parámetros al construir la query
string, de modo que caracteres como `&`, `=`, `+`, `%` o espacios no alteren la
estructura de la URL ni el valor recibido por Flow.

#### Scenario: Identificador con caracteres reservados

- **WHEN** una operación de lectura recibe un identificador que contiene `&` o un
  espacio
- **THEN** la URL resultante transporta ese identificador codificado y Flow lo
  recibe como un único parámetro con su valor íntegro

### Requirement: Los errores se propagan tipados

El SDK SHALL señalar un fallo de validación de parámetros con un error propio del
SDK, distinto del error de transporte HTTP, y SHALL exponer públicamente ambos
tipos de error para que el consumidor pueda distinguirlos.

#### Scenario: Parámetros inválidos

- **WHEN** una operación recibe parámetros que no cumplen su esquema
- **THEN** se lanza el error de validación del SDK y no se realiza ninguna
  petición de red

#### Scenario: Respuesta HTTP no exitosa

- **WHEN** Flow responde con un código de estado fuera del rango 2xx
- **THEN** se lanza el error HTTP del SDK, con el mensaje y el código devueltos
  por Flow y la URL invocada

#### Scenario: Tipos de error disponibles para el consumidor

- **WHEN** un consumidor importa el paquete
- **THEN** ambos tipos de error están disponibles en la superficie pública para
  usarlos en comprobaciones `instanceof`
