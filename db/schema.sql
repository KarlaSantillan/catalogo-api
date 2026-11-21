-- =============================================================
-- Catálogo de productos y favoritos - Esquema PostgreSQL
-- Es idempotente: se puede ejecutar varias veces sin perder datos.
-- Ejecución: npm run db:init   (o: psql -d catalogo_db -f db/schema.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM(nombre)) > 0),
  correo         VARCHAR(150) NOT NULL,
  password_hash  VARCHAR(100) NOT NULL,
  rol            VARCHAR(20)  NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT usuarios_correo_unico UNIQUE (correo),
  -- El correo siempre se guarda en minúsculas para que la unicidad no dependa de mayúsculas.
  CONSTRAINT usuarios_correo_minusculas CHECK (correo = LOWER(correo))
);

CREATE TABLE IF NOT EXISTS productos (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(120)  NOT NULL CHECK (LENGTH(TRIM(nombre)) > 0),
  descripcion     VARCHAR(1000) NOT NULL CHECK (LENGTH(TRIM(descripcion)) > 0),
  categoria       VARCHAR(60)   NOT NULL CHECK (LENGTH(TRIM(categoria)) > 0),
  precio          NUMERIC(10,2) NOT NULL CHECK (precio > 0),
  creado_en       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (LOWER(categoria));

-- Relación usuario-producto. La clave primaria compuesta impide duplicados.
-- ON DELETE CASCADE: al eliminar un producto (o un usuario) se eliminan sus favoritos,
-- de modo que nunca quedan favoritos apuntando a registros inexistentes.
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id   INTEGER     NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  producto_id  INTEGER     NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_producto ON favoritos (producto_id);

-- -------------------------------------------------------------
-- Datos de ejemplo (ficticios). Solo se insertan si la tabla está vacía.
-- -------------------------------------------------------------
INSERT INTO productos (nombre, descripcion, categoria, precio)
SELECT * FROM (VALUES
  ('Audífonos inalámbricos Nova', 'Audífonos Bluetooth con cancelación de ruido y 30 horas de batería.', 'Tecnologia', 59.90),
  ('Teclado mecánico Orion',      'Teclado mecánico compacto con switches rojos e iluminación RGB.',      'Tecnologia', 74.50),
  ('Mochila urbana Andes',        'Mochila impermeable de 25 litros con compartimento para laptop.',      'Accesorios', 39.99),
  ('Botella térmica Cumbre',      'Botella de acero inoxidable de 750 ml que mantiene la temperatura.',   'Hogar',      18.75),
  ('Lámpara de escritorio Lumen', 'Lámpara LED regulable con puerto USB de carga.',                       'Hogar',      27.30),
  ('Libro: Introducción a APIs',  'Guía práctica ficticia sobre diseño de APIs REST.',                    'Libros',     22.00)
) AS ejemplo(nombre, descripcion, categoria, precio)
WHERE NOT EXISTS (SELECT 1 FROM productos);
