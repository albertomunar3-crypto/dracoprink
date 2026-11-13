-- =========================================================
-- DracoPrink - Base de datos del sistema de gestión
-- Pizzería y comidas rápidas
--
-- Usuarios de prueba (contraseñas almacenadas con bcrypt):
--   admin    / 1234       -> Administrador
--   cajero1  / cajero123  -> Cajero
--   cocina1  / cocina123  -> Cocinero
--   domi1    / domi123    -> Domiciliario
--   mesero1  / mesero123  -> Mesero
-- =========================================================

CREATE DATABASE IF NOT EXISTS dracoprink_bd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dracoprink_bd;

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(100) UNIQUE,
    direccion VARCHAR(150) NOT NULL
);

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'cajero'
);

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL
);

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    descripcion TEXT,
    id_categoria INT,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    fecha_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_entrega ENUM('Mesa', 'Domicilio', 'Para llevar') NOT NULL DEFAULT 'Domicilio',
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado ENUM('En cocina', 'En camino', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'En cocina',
    id_cliente INT,
    id_usuario INT,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE detalle_pedido (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL UNIQUE,
    fecha_venta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metodo_pago ENUM('Efectivo', 'Nequi', 'Daviplata', 'Tarjeta') NOT NULL,
    monto_pagado DECIMAL(10,2) NOT NULL,
    id_usuario INT,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE egresos (
    id_egreso INT AUTO_INCREMENT PRIMARY KEY,
    fecha_egreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concepto VARCHAR(150) NOT NULL,
    categoria_gasto ENUM('Insumos', 'Servicios', 'Nomina', 'Domicilios', 'Otros') NOT NULL DEFAULT 'Insumos',
    monto DECIMAL(10,2) NOT NULL,
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- =========================================================
-- DATOS DE PRUEBA
-- =========================================================

INSERT INTO clientes (id_cliente, nombre, apellido, telefono, correo, direccion) VALUES
(1, 'Valentina', 'Vargas', '3104567890', 'valentina.vargas@gmail.com', 'Calle 140 #11-45'),
(2, 'Carlos', 'Mendoza', '3112345678', 'carlos.mendoza@gmail.com', 'Carrera 7 #72-10'),
(3, 'Andrés', 'López', '3209876543', 'andres.lopez@hotmail.com', 'Av. Boyacá #53-12'),
(4, 'Laura', 'Gómez', '3156781234', 'laura.gomez@gmail.com', 'Calle 80 #24-31'),
(5, 'Juan', 'Rodríguez', '3001237788', 'juan.rodriguez@outlook.com', 'Carrera 15 #93-60'),
(6, 'Mariana', 'Torres', '3184442211', 'mariana.torres@gmail.com', 'Calle 26 #68-91');

INSERT INTO usuarios (id_usuario, nombre_usuario, contrasena, rol) VALUES
(1, 'admin',   '$2y$10$HefTWVj8QdLqh7Zr1UReT.QfEs/N73tU946EIZ90nNZS8KjxfYW7.', 'Administrador'),
(2, 'cajero1', '$2y$10$Z2nD9Bgmcyx.5kIvX4YD4OFlj0H0GbG1Qym8AbISvv0l6KQRxOJ8q', 'Cajero'),
(3, 'cocina1', '$2y$10$uG7NdhKJPpfH9/LagVETzeucCrCytHghZWcNNaaQO6kTaDwL1Qeee', 'Cocinero'),
(4, 'domi1',   '$2y$10$k3m1aZuWcCBrB6E5gdbDb.n.0NXduxpgt5.rNzk33tsZfUVd2hGo.', 'Domiciliario'),
(5, 'mesero1', '$2y$10$X2rg2mX0pPD3fADCkk8Tve73uoZXz4X5pzpW7NyVfo.ckTeifUDr6', 'Mesero');

INSERT INTO categorias (id_categoria, nombre_categoria) VALUES
(1, 'Pizzas'),
(2, 'Hamburguesas'),
(3, 'Perros calientes'),
(4, 'Bebidas'),
(5, 'Acompañamientos y postres');

INSERT INTO productos (id_producto, nombre_producto, precio, stock, stock_minimo, descripcion, id_categoria) VALUES
(1,  'Pizza Hawaiana Mediana',     32000.00, 20,  5, 'Jamón, piña y queso mozzarella. 8 porciones.', 1),
(2,  'Pizza Pepperoni Familiar',   45000.00, 15,  5, 'Pepperoni y doble queso mozzarella. 12 porciones.', 1),
(3,  'Pizza Mexicana Personal',    18000.00,  3,  5, 'Carne molida, jalapeños, maíz y nachos. 4 porciones.', 1),
(4,  'Hamburguesa Clásica',        18000.00, 25,  5, 'Carne de res 150 g, queso, lechuga, tomate y salsas.', 2),
(5,  'Hamburguesa Doble Carne',    26000.00, 12,  5, 'Doble carne de res, doble queso cheddar y tocineta.', 2),
(6,  'Perro Caliente Especial',    14000.00, 30,  5, 'Salchicha americana, queso gratinado, papa ripio y salsas.', 3),
(7,  'Gaseosa 1.5 L',               7000.00, 40, 10, 'Gaseosa sabor a elección.', 4),
(8,  'Jugo Natural',                6000.00,  4,  8, 'Jugo en agua o leche: mora, lulo o maracuyá.', 4),
(9,  'Papas a la Francesa',         8000.00, 35,  5, 'Porción de papas fritas con salsa de la casa.', 5),
(10, 'Brownie con Helado',          9000.00, 10,  5, 'Brownie de chocolate con bola de helado de vainilla.', 5);

INSERT INTO pedidos (id_pedido, fecha_pedido, tipo_entrega, total, estado, id_cliente, id_usuario) VALUES
(1, '2026-11-10 12:35:00', 'Domicilio',   39000.00, 'Entregado',  3, 2),
(2, '2026-11-10 19:10:00', 'Mesa',        52000.00, 'Entregado',  4, 5),
(3, '2026-11-11 20:05:00', 'Domicilio',   59000.00, 'Entregado',  5, 2),
(4, '2026-11-12 13:20:00', 'Para llevar', 60000.00, 'Entregado',  6, 2),
(5, '2026-11-13 12:15:00', 'Mesa',        35000.00, 'Entregado',  1, 1),
(6, '2026-11-13 18:40:00', 'Domicilio',   45000.00, 'En camino',  1, 2),
(7, '2026-11-13 19:05:00', 'Domicilio',   62000.00, 'En cocina',  2, 2),
(8, '2026-11-13 19:25:00', 'Para llevar', 36000.00, 'Cancelado',  4, 2);

INSERT INTO detalle_pedido (id_detalle, id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES
(1,  1, 1,  1, 32000.00, 32000.00),
(2,  1, 7,  1,  7000.00,  7000.00),
(3,  2, 4,  2, 18000.00, 36000.00),
(4,  2, 9,  2,  8000.00, 16000.00),
(5,  3, 2,  1, 45000.00, 45000.00),
(6,  3, 7,  2,  7000.00, 14000.00),
(7,  4, 6,  3, 14000.00, 42000.00),
(8,  4, 8,  3,  6000.00, 18000.00),
(9,  5, 5,  1, 26000.00, 26000.00),
(10, 5, 10, 1,  9000.00,  9000.00),
(11, 6, 2,  1, 45000.00, 45000.00),
(12, 7, 2,  1, 45000.00, 45000.00),
(13, 7, 9,  1,  8000.00,  8000.00),
(14, 7, 10, 1,  9000.00,  9000.00),
(15, 8, 3,  2, 18000.00, 36000.00);

INSERT INTO ventas (id_venta, id_pedido, fecha_venta, metodo_pago, monto_pagado, id_usuario) VALUES
(1, 1, '2026-11-10 13:10:00', 'Efectivo',  39000.00, 2),
(2, 2, '2026-11-10 19:55:00', 'Nequi',     52000.00, 2),
(3, 3, '2026-11-11 20:45:00', 'Daviplata', 59000.00, 2),
(4, 4, '2026-11-12 13:35:00', 'Tarjeta',   60000.00, 2),
(5, 5, '2026-11-13 12:50:00', 'Nequi',     35000.00, 1);

INSERT INTO egresos (id_egreso, fecha_egreso, concepto, categoria_gasto, monto, id_usuario) VALUES
(1, '2026-11-09 08:30:00', 'Compra de queso mozzarella (10 kg)',   'Insumos',    180000.00, 1),
(2, '2026-11-10 09:00:00', 'Pago factura de energía',              'Servicios',  250000.00, 1),
(3, '2026-11-11 08:45:00', 'Compra de harina, salsa y pepperoni',  'Insumos',    210000.00, 1),
(4, '2026-11-12 18:00:00', 'Gasolina moto de domicilios',          'Domicilios',  60000.00, 2),
(5, '2026-11-13 10:15:00', 'Cajas de cartón para pizza (100 und)', 'Otros',       90000.00, 1),
(6, '2026-11-13 17:00:00', 'Pago quincena personal de cocina',     'Nomina',     650000.00, 1);
