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
cp .env.example .env   # ajustar DB_USER / DB_PASSWORD
npm install
npm start
```

Abrir http://localhost:3000. Express sirve también `frontend/`. Si el frontend se abre con
Live Server u otro servidor, consume la API en `http://localhost:3000` (CORS habilitado).

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Body `{ "usuario", "password" }`. Valida con `bcrypt.compare` y devuelve `{ usuario: { id_usuario, nombre_usuario, rol } }` (401 si no coincide). |
| `GET` | `/api/dashboard` | KPIs (ventas de hoy, pedidos activos, productos con `stock <= stock_minimo`, utilidad neta del mes = ventas − egresos) y los 10 pedidos más recientes. |

"Hoy" y "el mes" se calculan en la zona horaria `DB_TIMEZONE` (por defecto `-05:00`).
