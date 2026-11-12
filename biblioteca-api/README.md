# API de biblioteca

API REST para gestionar libros con TypeScript, Express y MongoDB. El código está separado en modelo, rutas y controladores.

## Cómo ejecutarla

Necesitás Node.js y MongoDB funcionando. Desde esta carpeta (si ya tenés `.env`, salteá la segunda línea):

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

En `.env` podés cambiar el puerto y la conexión a MongoDB. El ejemplo usa `http://localhost:3000` y la base `biblioteca_api`.

## Libros

Cada libro tiene `title` y `author` obligatorios. `publishedYear` y `genre` son opcionales. `available` vale `true` si no lo enviás. El título no se puede repetir.

| Método | Ruta | Acción |
| --- | --- | --- |
| GET | `/books` | Listar libros |
| GET | `/books/:id` | Ver un libro |
| POST | `/books` | Crear un libro |
| PATCH | `/books/:id` | Modificar un libro |
| DELETE | `/books/:id` | Borrar un libro |

Ejemplo de JSON para `POST /books`:

```json
{"title":"El principito","author":"Antoine de Saint-Exupéry","publishedYear":1943}
```

Para revisar los tipos y correr las pruebas:

```powershell
npm run typecheck
npm test
```
