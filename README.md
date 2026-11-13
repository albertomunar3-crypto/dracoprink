# DracoPrink

Sistema web de gestión para pizzería y comidas rápidas.

## Estructura

```
dracoprink/
├── database.sql          # Esquema MySQL + datos de prueba
├── backend/              # API Node.js + Express
│   ├── server.js
│   ├── config/db.js
│   ├── routes/
│   ├── controllers/
│   ├── middlewares/      # Token JWT y límite de intentos de login
│   └── .env.example
└── frontend/
    ├── index.html        # Inicio de sesión
    ├── dashboard.html    # Panel de gestión
    ├── css/
    │   ├── login.css
    │   └── dashboard.css
    ├── js/
    │   ├── api.js        # URL de la API y sesión (localStorage)
    │   ├── script.js     # Login
    │   └── dashboard.js  # Carga de KPIs y pedidos
    └── img/
        └── logo.png
```

## Base de datos

```bash
mysql -u root -p < database.sql
```

Crea la base `dracoprink_bd` con datos de prueba. Usuario administrador: `admin` / `1234`
(las contraseñas se guardan con hash bcrypt; ver cabecera de `database.sql`).

## Backend

Requiere Node.js 18+ y MySQL 8.0 con `database.sql` importado.

```bash
cd backend
cp .env.example .env   # ajustar DB_USER / DB_PASSWORD y definir JWT_SECRET
npm install
npm start
```

Abrir http://localhost:3000. Express sirve también `frontend/` (la API se consume en el mismo origen,
sea cual sea `PORT`). Si el frontend se abre como archivo o con
Live Server (puertos 5500/5501), consume la API en `http://localhost:3000` (CORS habilitado).

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Pública. Body `{ "usuario", "password" }`. Valida con `bcrypt.compare` y devuelve `{ token, usuario: { id_usuario, nombre_usuario, rol } }` (401 si no coincide, 429 tras demasiados intentos fallidos). |
| `GET` | `/api/dashboard` | Requiere `Authorization: Bearer <token>`. KPIs (ventas de hoy, pedidos activos, productos con `stock <= stock_minimo`, utilidad neta del mes = ventas − egresos) y los 10 pedidos más recientes. |

### Seguridad

- Todas las rutas de `/api` excepto `/api/auth/login` pasan por `middlewares/auth.middleware.js`, que exige un JWT válido (401 si falta, es inválido o expiró). El servidor no arranca sin una `JWT_SECRET` propia; el token dura `JWT_EXPIRES_IN` (por defecto `8h`).
- `middlewares/rateLimit.middleware.js` bloquea el login por IP tras `LOGIN_MAX_INTENTOS` intentos fallidos (por defecto 5) durante `LOGIN_VENTANA_MINUTOS` (por defecto 15). Los logins exitosos no cuentan.
- El frontend guarda `{ token, usuario }` en `localStorage`; si la API responde 401, borra la sesión y vuelve al login.

"Hoy" y "el mes" se calculan en la zona horaria `DB_TIMEZONE` (por defecto `-05:00`).
