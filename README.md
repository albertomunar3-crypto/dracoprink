# DracoPrink

Sistema web de gestión para pizzería y comidas rápidas.

## Estructura

```
dracoprink/
├── database.sql          # Esquema MySQL + datos de prueba
├── backend/              # API / lógica del servidor
└── frontend/
    ├── index.html        # Inicio de sesión
    ├── dashboard.html    # Panel de gestión
    ├── css/
    │   ├── login.css
    │   └── dashboard.css
    ├── js/
    │   └── script.js
    └── img/
        └── logo.png
```

## Base de datos

```bash
mysql -u root -p < database.sql
```

Crea la base `dracoprink_bd` con datos de prueba. Usuario administrador: `admin` / `1234`
(las contraseñas se guardan con hash bcrypt; ver cabecera de `database.sql`).
