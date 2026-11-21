# API REST: catálogo de productos y favoritos

API desarrollada con **Node.js + Express + PostgreSQL** que gestiona un catálogo público de productos y la lista de favoritos personal de cada usuario. Usa **autenticación con JWT** y **autorización por roles** (`usuario` y `admin`).

## Integrantes

| Integrante | Usuario de GitHub | Aportes principales |
|---|---|---|
| Karla Santillan | @KarlaSantillan | Base de datos (esquema SQL y datos de ejemplo), capa de acceso a datos, CRUD de productos, validaciones, README |
| Leo Moyota | @Leomoyotam | Registro e inicio de sesión, JWT, middlewares de autenticación y roles, favoritos, colección de Postman |

## Propósito

- Consultar el catálogo sin iniciar sesión, con filtro por categoría.
- Permitir que solo el administrador cree, actualice y elimine productos.
- Permitir que cada usuario autenticado gestione **únicamente sus propios** favoritos.

## Elección de base de datos

Elegimos **PostgreSQL** porque los datos son relacionales (usuarios ↔ favoritos ↔ productos) y la base de datos garantiza por sí misma las reglas clave:

- `UNIQUE (correo)`: no se repiten correos.
- `CHECK (precio > 0)`: no se guardan precios inválidos aunque falle la validación de la API.
- `PRIMARY KEY (usuario_id, producto_id)` en `favoritos`: no hay favoritos duplicados.
- `FOREIGN KEY ... ON DELETE CASCADE`: no hay favoritos que apunten a productos inexistentes.

Todas las consultas son **parametrizadas** (`$1, $2, ...`) para evitar inyección SQL.

## Estructura del proyecto

```
catalogo-api/
├── db/schema.sql                 # Tablas, restricciones y 6 productos de ejemplo
├── scripts/
│   ├── init-db.js                # npm run db:init
│   ├── crear-admin.js            # npm run crear-admin
│   └── generar-token-vencido.js  # npm run token:vencido (para la prueba de 401)
├── src/
│   ├── server.js                 # Punto de entrada
│   ├── app.js                    # Configuración de Express y rutas
│   ├── config/                   # Variables de entorno y conexión a PostgreSQL
│   ├── routes/                   # Definición de rutas y permisos
│   ├── controllers/              # Lógica de cada endpoint
│   ├── models/                   # Acceso a datos (consultas SQL)
│   ├── middlewares/              # JWT, roles y manejo de errores
│   └── utils/                    # Validaciones y clase HttpError
├── postman/
│   ├── Catalogo.postman_collection.json
│   └── Catalogo.postman_environment.json   # Sin secretos
├── .env.example
└── package.json / package-lock.json
```

Flujo de una petición: **Postman → ruta (`routes/`) → middlewares (`verificarToken`, `requerirRol`) → controlador (`controllers/`) → modelo (`models/`) → PostgreSQL → respuesta JSON**.

## Modelo de datos

| Tabla | Campos |
|---|---|
| `usuarios` | `id`, `nombre`, `correo` (único, en minúsculas), `password_hash` (bcrypt), `rol` (`usuario` \| `admin`), `creado_en` |
| `productos` | `id`, `nombre`, `descripcion`, `categoria`, `precio` (> 0), `creado_en`, `actualizado_en` |
| `favoritos` | `usuario_id` → usuarios, `producto_id` → productos, `creado_en`; clave primaria compuesta |

**Al eliminar un producto** se eliminan automáticamente sus favoritos (`ON DELETE CASCADE`). Así los datos quedan consistentes y ningún usuario ve un favorito que ya no existe.

## Requisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior
- Postman (para las pruebas)

## Instalación

```bash
git clone https://github.com/KarlaSantillan/catalogo-api.git
cd catalogo-api
npm install
cp .env.example .env        # En Windows: copy .env.example .env
```

Crear la base de datos (una sola vez):

```bash
psql -U postgres -c "CREATE DATABASE catalogo_db;"
```

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Conexión a PostgreSQL | `localhost`, `5432`, `catalogo_db`, `postgres`, *(tu clave)* |
| `DATABASE_URL` | Alternativa a las variables PG* | `postgresql://usuario:clave@localhost:5432/catalogo_db` |
| `JWT_SECRET` | Secreto para firmar los tokens (mínimo 32 caracteres) | *(cadena aleatoria)* |
| `JWT_EXPIRES_IN` | Vigencia del token | `1h` |
| `ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Datos del administrador inicial | `Administrador`, `admin@catalogo.local`, *(tu clave)* |

Generar un `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Inicialización de datos y del administrador

```bash
npm run db:init       # Crea las tablas e inserta 6 productos de ejemplo (ficticios)
npm run crear-admin   # Crea o actualiza el administrador con ADMIN_EMAIL y ADMIN_PASSWORD
```

El **registro público siempre crea usuarios con rol `usuario`**: si el cliente envía `"rol": "admin"`, el servidor lo ignora. La única forma de obtener el rol `admin` es este script local, que lee los datos de `.env`.

## Ejecución

```bash
npm start      # Producción
npm run dev    # Desarrollo (se reinicia al guardar cambios)
```

La API queda en `http://localhost:3000/api`. Prueba rápida: `GET http://localhost:3000/api/salud`.

## Rutas

Todas las respuestas son JSON. Éxito: `{ "ok": true, "data": ... }`. Error: `{ "ok": false, "error": { "codigo", "mensaje", "detalles?" } }`.
Las rutas protegidas requieren el encabezado `Authorization: Bearer <token>`.

| Método y ruta | Acceso | Cuerpo | Respuesta exitosa |
|---|---|---|---|
| `POST /api/auth/registro` | Público | `{ "nombre", "correo", "password" }` | `201` usuario creado (sin contraseña) |
| `POST /api/auth/login` | Público | `{ "correo", "password" }` | `200` `{ token, tipo, expiraEn, usuario }` |
| `GET /api/productos?categoria=Hogar` | Público | — | `200` `{ total, data: [...] }` |
| `GET /api/productos/:id` | Público | — | `200` producto |
| `POST /api/productos` | Admin | `{ "nombre", "descripcion", "categoria", "precio" }` | `201` producto creado |
| `PUT /api/productos/:id` | Admin | Los 4 campos (reemplazo completo) | `200` producto actualizado |
| `DELETE /api/productos/:id` | Admin | — | `204` sin cuerpo |
| `GET /api/favoritos` | Autenticado | — | `200` favoritos del usuario del token |
| `POST /api/favoritos` | Autenticado | `{ "productoId": 3 }` | `201` producto agregado |
| `DELETE /api/favoritos/:productoId` | Autenticado | — | `204` sin cuerpo |

### Ejemplos

`POST /api/auth/login`

```json
{ "correo": "usuario.a@ejemplo.com", "password": "ClaveSegura123" }
```

```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "tipo": "Bearer",
    "expiraEn": "1h",
    "usuario": { "id": 2, "nombre": "Usuario A", "correo": "usuario.a@ejemplo.com", "rol": "usuario" }
  }
}
```

`POST /api/productos` con precio inválido → `422`

```json
{ "ok": false, "error": { "codigo": "PRECIO_INVALIDO", "mensaje": "El precio debe ser mayor que cero.", "detalles": { "campo": "precio" } } }
```

### Códigos de estado y criterio

| Código | Cuándo |
|---|---|
| `200` | Consulta o actualización exitosa |
| `201` | Creación exitosa (registro, producto, favorito) |
| `204` | Eliminación exitosa (producto o favorito) |
| `400` | **Petición mal formada**: JSON inválido, faltan campos obligatorios o están vacíos, tipo de dato incorrecto (p. ej. precio `"diez"`), id que no es entero positivo |
| `401` | Sin token, token con firma inválida, token vencido o credenciales incorrectas |
| `403` | Usuario autenticado sin el rol necesario (rol `usuario` intentando modificar el catálogo) |
| `404` | Producto inexistente, favorito que no está en la lista del usuario o ruta inexistente |
| `409` | Correo ya registrado o producto ya agregado a favoritos |
| `422` | **Petición bien formada pero con un valor que viola una regla**: correo con formato inválido, contraseña de menos de 8 caracteres, precio ≤ 0 |
| `500` | Error inesperado; se responde un mensaje genérico sin detalles internos |

### Seguridad aplicada

- Contraseñas guardadas con **bcrypt**; nunca se devuelven ni la contraseña ni su hash.
- El JWT se firma con HS256 y vence según `JWT_EXPIRES_IN`. Antes de cada ruta protegida se verifican la **firma y la expiración** y se confirma que el usuario siga existiendo.
- En favoritos, la identidad sale **solo del token verificado**; cualquier `usuarioId` enviado por el cliente se ignora.
- Si B intenta borrar un favorito de A, recibe `404`: la consulta filtra por el id del token, así que no puede tocar datos ajenos ni saber si existen.
- Lista blanca de campos: solo se aceptan los campos definidos en las validaciones.
- Mismo mensaje para "correo inexistente" y "contraseña incorrecta", para no revelar qué correos están registrados.

## Pruebas con Postman

1. Iniciar la API (`npm start`) con la base de datos inicializada y el administrador creado.
2. En Postman: **Import** → `postman/Catalogo.postman_collection.json` y `postman/Catalogo.postman_environment.json`.
3. Seleccionar el entorno **Catálogo - Local** y completar en la columna **Current value** (no se exporta):
   - `admin_password`: la misma clave de `ADMIN_PASSWORD` del `.env`.
   - `token_vencido`: ejecutar `npm run token:vencido` y pegar el token que imprime.
4. Ejecutar con **Run collection** las carpetas **1 a 7** en orden.
5. Detener el servidor (`Ctrl + C`), volver a iniciarlo con `npm start` y ejecutar la carpeta **8. Persistencia - DESPUÉS de reiniciar**.

Los correos de los usuarios A y B se generan con la hora actual, así que la colección puede ejecutarse varias veces sin chocar con datos anteriores.

| Carpeta | Qué demuestra |
|---|---|
| 1. Autenticación | Registro y login correctos, correo duplicado (409), correo inválido (422), campos vacíos (400), credenciales incorrectas (401), intento de registrarse como admin |
| 2. Productos - consulta pública | Listado, filtro por categoría, producto existente, inexistente (404), id inválido (400) |
| 3. Productos - CRUD administrador | Crear (201), consultar, actualizar (200), precio cero/negativo (422), precio no numérico y campos vacíos (400) |
| 4. Seguridad | Sin token, token vencido y token alterado (401); rol usuario modificando el catálogo (403) |
| 5. Favoritos y aislamiento A/B | Agregar (201), duplicado (409), inexistente (404), B no ve ni borra los favoritos de A, el de A permanece, A lo quita (204) |
| 6. Eliminar producto y consistencia | El admin borra un producto que estaba en favoritos y estos desaparecen (cascada) |
| 7 y 8. Persistencia | Datos creados antes del reinicio siguen disponibles después |

## Recursos y herramientas de apoyo

- Documentación oficial de [Express](https://expressjs.com/), [node-postgres](https://node-postgres.com/), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) y [bcryptjs](https://github.com/dcodeIO/bcrypt.js).
- Documentación de PostgreSQL sobre restricciones y `ON DELETE CASCADE`.
- Asistente de IA como apoyo para estructurar el proyecto y la colección de pruebas; el código fue revisado, probado y explicado en video por los integrantes.
