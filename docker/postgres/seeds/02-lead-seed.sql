CREATE TEMP TABLE seed_departamentos_raw (
    codigo TEXT,
    nombre TEXT
);

CREATE TEMP TABLE seed_provincias_raw (
    codigo TEXT,
    nombre TEXT,
    codigo_departamento TEXT
);

CREATE TEMP TABLE seed_distritos_raw (
    codigo TEXT,
    nombre TEXT,
    codigo_provincia TEXT,
    codigo_departamento TEXT
);

\copy seed_departamentos_raw (codigo, nombre) FROM '/seed-data/ubigeo/ubigeo_peru_2016_departamentos.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
\copy seed_provincias_raw (codigo, nombre, codigo_departamento) FROM '/seed-data/ubigeo/ubigeo_peru_2016_provincias.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
\copy seed_distritos_raw (codigo, nombre, codigo_provincia, codigo_departamento) FROM '/seed-data/ubigeo/ubigeo_peru_2016_distritos.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

INSERT INTO departamento (codigo, nombre)
SELECT TRIM(codigo), TRIM(nombre)
FROM seed_departamentos_raw
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre;

INSERT INTO provincia (codigo, nombre, departamento_id)
SELECT
    TRIM(p.codigo),
    TRIM(p.nombre),
    d.id
FROM seed_provincias_raw p
JOIN departamento d ON d.codigo = TRIM(p.codigo_departamento)
ON CONFLICT (departamento_id, codigo) DO UPDATE
SET nombre = EXCLUDED.nombre;

INSERT INTO distrito (codigo, nombre, provincia_id, departamento_id)
SELECT
    TRIM(di.codigo),
    TRIM(di.nombre),
    pr.id,
    de.id
FROM seed_distritos_raw di
JOIN departamento de ON de.codigo = TRIM(di.codigo_departamento)
JOIN provincia pr
  ON pr.codigo = TRIM(di.codigo_provincia)
 AND pr.departamento_id = de.id
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    provincia_id = EXCLUDED.provincia_id,
    departamento_id = EXCLUDED.departamento_id;

CREATE TEMP TABLE seed_tipificacion (
    etapa TEXT,
    codigo TEXT,
    descripcion TEXT,
    orden INTEGER,
    activo BOOLEAN
);

INSERT INTO seed_tipificacion (etapa, codigo, descripcion, orden, activo) VALUES
('PREVENTA', 'SIN_CONTACTO', 'No se logra la comunicacion', 1, TRUE),
('PREVENTA', 'SEGUIMIENTO', 'Cliente en seguimiento comercial', 2, TRUE),
('PREVENTA', 'AGENDADO', 'Contacto reagendado para una fecha futura', 3, TRUE),
('PREVENTA', 'RECHAZADO', 'Operacion descartada en preventa', 4, TRUE),
('PREVENTA', 'REITERADO', 'Lead repetido o duplicado', 5, TRUE),
('PREVENTA', 'SIN_FACILIDADES', 'Operacion inviable por restricciones del servicio', 6, TRUE),
('PREVENTA', 'SCORE_PREVENTA', 'Validacion de score previa a la venta', 7, TRUE),
('PREVENTA', 'PREVENTA_COMPLETA', 'Gestion de preventa finalizada', 8, TRUE),
('PREVENTA', 'LISTA_NEGRA', 'Lead restringido por lista negra', 9, TRUE);

INSERT INTO tipificacion (etapa, codigo, descripcion, orden, activo)
SELECT etapa, codigo, descripcion, orden, activo
FROM seed_tipificacion
ON CONFLICT (etapa, codigo) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    orden = EXCLUDED.orden,
    activo = EXCLUDED.activo;

CREATE TEMP TABLE seed_subtipificacion (
    etapa TEXT,
    tipificacion_codigo TEXT,
    codigo TEXT,
    descripcion TEXT,
    orden INTEGER,
    etapa_cambio TEXT,
    activo BOOLEAN
);

INSERT INTO seed_subtipificacion (etapa, tipificacion_codigo, codigo, descripcion, orden, etapa_cambio, activo) VALUES
('PREVENTA', 'SIN_CONTACTO', 'NO_CONTESTA', 'No responde llamadas o chat', 1, NULL, TRUE),
('PREVENTA', 'SIN_CONTACTO', 'NUMERO_EQUIVOCADO', 'Numero invalido o incorrecto', 2, NULL, TRUE),
('PREVENTA', 'SIN_CONTACTO', 'FUERA_DE_SERVICIO', 'Numero sin servicio de red', 3, NULL, TRUE),
('PREVENTA', 'SIN_CONTACTO', 'BUZON_DE_VOZ', 'Numero desvia llamadas al buzon de voz', 4, NULL, TRUE),
('PREVENTA', 'SEGUIMIENTO', 'SOLO_INFORMACION', 'Solicita llamar luego', 1, NULL, TRUE),
('PREVENTA', 'SEGUIMIENTO', 'SEGUIMIENTO', 'Seguimiento pendiente de cierre', 2, NULL, TRUE),
('PREVENTA', 'SEGUIMIENTO', 'GESTION_CHAT', 'Seguimiento en curso por chat', 3, NULL, TRUE),
('PREVENTA', 'SEGUIMIENTO', 'LLAMADA_INTERRUMPIDA', 'Contacto interrumpido durante la llamada', 4, NULL, TRUE),
('PREVENTA', 'AGENDADO', 'FIN_DE_MES', 'Solicita retomar el contacto a fin de mes', 1, NULL, TRUE),
('PREVENTA', 'AGENDADO', 'CONSULTARA_CON_FAMILIAR', 'Debe validar la decision con un familiar', 2, NULL, TRUE),
('PREVENTA', 'AGENDADO', 'AGENDADO', 'Comunicacion reagendada con el cliente', 3, NULL, TRUE),
('PREVENTA', 'RECHAZADO', 'ZONA_FRAUDE', 'Zona observada por validacion de fraude', 1, NULL, TRUE),
('PREVENTA', 'RECHAZADO', 'VC_DESAPROBADA', 'Validacion comercial desaprobada', 2, NULL, TRUE),
('PREVENTA', 'RECHAZADO', 'NO_DESEA', 'Cliente no desea continuar con la oferta', 3, NULL, TRUE),
('PREVENTA', 'RECHAZADO', 'NO_CALIFICA', 'Cliente no cumple las condiciones comerciales', 4, NULL, TRUE),
('PREVENTA', 'RECHAZADO', 'CON_PROGRAMACION', 'Cliente ya cuenta con una programacion previa', 5, NULL, TRUE),
('PREVENTA', 'REITERADO', 'ND_PUBLICIDAD', 'Lead duplicado por origen publicitario', 1, NULL, TRUE),
('PREVENTA', 'REITERADO', 'DOBLE_CLICK', 'Registro duplicado por doble envio del cliente', 2, NULL, TRUE),
('PREVENTA', 'SIN_FACILIDADES', 'SIN_CTO', 'No cuenta con condiciones tecnicas para instalar', 1, NULL, TRUE),
('PREVENTA', 'SIN_FACILIDADES', 'SIN_COBERTURA', 'La direccion no tiene cobertura disponible', 2, NULL, TRUE),
('PREVENTA', 'SIN_FACILIDADES', 'SERVICIO_ACTIVO', 'La direccion ya tiene un servicio activo', 3, NULL, TRUE),
('PREVENTA', 'SIN_FACILIDADES', 'EDIFICIO_SIN_LIBERAR', 'El edificio aun no esta liberado para instalacion', 4, NULL, TRUE),
('PREVENTA', 'SCORE_PREVENTA', 'PREVENTA_INCOMPLETA', 'Score validado en etapa de preventa', 1, NULL, TRUE),
('PREVENTA', 'SCORE_PREVENTA', 'PDTE_SCORE', 'Validacion de score pendiente', 2, NULL, TRUE),
('PREVENTA', 'PREVENTA_COMPLETA', 'VENTA_CERRADA', 'Venta cerrada en la gestion actual', 1, 'VENTA', TRUE),
('PREVENTA', 'PREVENTA_COMPLETA', 'VC_SIGUIENTE_MES', 'Venta proyectada para el siguiente mes', 2, NULL, TRUE),
('PREVENTA', 'LISTA_NEGRA', 'BLACKLIST', 'Lead bloqueado por politica de blacklist', 1, NULL, TRUE);

INSERT INTO subtipificacion (tipificacion_id, codigo, descripcion, orden, etapa_cambio, activo)
SELECT
    t.id,
    s.codigo,
    s.descripcion,
    s.orden,
    s.etapa_cambio,
    s.activo
FROM seed_subtipificacion s
JOIN tipificacion t
  ON t.etapa = s.etapa
 AND t.codigo = s.tipificacion_codigo
ON CONFLICT (tipificacion_id, codigo) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    orden = EXCLUDED.orden,
    etapa_cambio = EXCLUDED.etapa_cambio,
    activo = EXCLUDED.activo;

CREATE TEMP TABLE seed_proveedor (
    nombre TEXT,
    cortes_facturacion INTEGER[],
    meses_permanencia INTEGER,
    activo BOOLEAN
);

INSERT INTO seed_proveedor (nombre, cortes_facturacion, meses_permanencia, activo) VALUES
('WIN', ARRAY[1, 2, 15, 25], 3, TRUE),
('CLARO', ARRAY[1, 2, 15, 25], 5, TRUE),
('MIFIBRA', ARRAY[1, 2, 15, 25], 3, TRUE),
('PERUFIBRA', ARRAY[1, 2, 15, 25], 3, TRUE);

UPDATE proveedor p
SET meses_permanencia = s.meses_permanencia,
    activo = s.activo,
    created_at = COALESCE(p.created_at, CURRENT_TIMESTAMP)
FROM seed_proveedor s
WHERE UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.nombre));

INSERT INTO proveedor (nombre, meses_permanencia, activo, created_at)
SELECT s.nombre, s.meses_permanencia, s.activo, CURRENT_TIMESTAMP
FROM seed_proveedor s
WHERE NOT EXISTS (
    SELECT 1
    FROM proveedor p
    WHERE UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.nombre))
);

DELETE FROM proveedor_corte_facturacion pcf
USING proveedor p, seed_proveedor s
WHERE pcf.id_proveedor = p.id
  AND UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.nombre));

INSERT INTO proveedor_corte_facturacion (id_proveedor, dia_corte)
SELECT p.id, corte.dia_corte
FROM seed_proveedor s
JOIN proveedor p ON UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.nombre))
CROSS JOIN LATERAL unnest(COALESCE(s.cortes_facturacion, ARRAY[]::INTEGER[])) AS corte(dia_corte);

CREATE TEMP TABLE seed_cuenta_publicitaria (
    numero_cuenta TEXT,
    nombre_cuenta TEXT,
    activo BOOLEAN
);

INSERT INTO seed_cuenta_publicitaria (numero_cuenta, nombre_cuenta, activo) VALUES
('1822236612034217', 'Runa Contact Center', TRUE),
('1030035362376438', 'Internet Fibra Optica', TRUE),
('708788522032129', 'DISTRIBUIDOR AUTORIZADO', TRUE),
('1587625665850135', 'ALBRU 2', TRUE);

INSERT INTO cuenta_publicitaria (numero_cuenta, nombre_cuenta, activo)
SELECT s.numero_cuenta, s.nombre_cuenta, s.activo
FROM seed_cuenta_publicitaria s
WHERE NOT EXISTS (
    SELECT 1
    FROM cuenta_publicitaria cp
    WHERE TRIM(cp.numero_cuenta) = TRIM(s.numero_cuenta)
);

CREATE TEMP TABLE seed_campana (
    nombre TEXT,
    prefijo TEXT,
    numero_whats_app TEXT,
    numero_cuenta TEXT,
    proveedor_nombre TEXT,
    activo BOOLEAN
);

INSERT INTO seed_campana (nombre, prefijo, numero_whats_app, numero_cuenta, proveedor_nombre, activo) VALUES
('Win4 - 100% Fibra Optica', '+51', '905749473', '1822236612034217', 'WIN', TRUE),
('Win1 - Satisfaccion al cliente', '+51', '905749473', '1822236612034217', 'WIN', FALSE),
('Win6 - Internet Winners', '+51', '905749473', '1822236612034217', 'WIN', FALSE),
('Win2 - Internet Hogar', '+51', '905749473', '1030035362376438', 'WIN', FALSE),
('Prueba Ventas Win9 - Win10', '+51', '905749473', '708788522032129', 'WIN', FALSE),
('CLARO12 - CAMPANA CLARO', '+51', '987654321', '1587625665850135', 'CLARO', FALSE);

INSERT INTO campana (nombre, prefijo, numero_whats_app, id_cuenta_publicitaria, id_proveedor, activo)
SELECT
    s.nombre,
    s.prefijo,
    s.numero_whats_app,
    cp.id,
    p.id,
    s.activo
FROM seed_campana s
JOIN cuenta_publicitaria cp ON TRIM(cp.numero_cuenta) = TRIM(s.numero_cuenta)
JOIN proveedor p ON UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.proveedor_nombre))
WHERE NOT EXISTS (
    SELECT 1
    FROM campana c
    WHERE UPPER(TRIM(c.nombre)) = UPPER(TRIM(s.nombre))
);

CREATE TEMP TABLE seed_adicional (
    proveedor_nombre TEXT,
    nombre TEXT,
    precio_unitario NUMERIC(10,2),
    activo BOOLEAN
);

INSERT INTO seed_adicional (proveedor_nombre, nombre, precio_unitario, activo) VALUES
('WIN', 'Wifi Mesh', 9.90, TRUE),
('WIN', 'WinBox', 15.00, TRUE),
('MIFIBRA', 'Mesh', 5.00, TRUE),
('CLARO', 'Repetidor - Fibra', 10.00, TRUE),
('CLARO', 'Repetidor - HFC', 15.00, TRUE),
('CLARO', 'Decodificador - Fibra', 10.00, TRUE),
('CLARO', 'Decodificador - HFC', 10.00, TRUE),
('PERUFIBRA', 'Repetidor - Fibra', 10.00, TRUE),
('PERUFIBRA', 'Repetidor - HFC', 10.00, TRUE);

INSERT INTO adicional (nombre, precio_unitario, id_proveedor, activo)
SELECT
    s.nombre,
    s.precio_unitario,
    p.id,
    s.activo
FROM seed_adicional s
JOIN proveedor p ON UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.proveedor_nombre))
WHERE NOT EXISTS (
    SELECT 1
    FROM adicional a
    WHERE a.id_proveedor = p.id
      AND UPPER(TRIM(a.nombre)) = UPPER(TRIM(s.nombre))
);

CREATE TEMP TABLE seed_internet (
    proveedor_nombre TEXT,
    velocidad INTEGER,
    unidad TEXT,
    tecnologia TEXT,
    activo BOOLEAN
);

INSERT INTO seed_internet (proveedor_nombre, velocidad, unidad, tecnologia, activo) VALUES
('MIFIBRA', 500, 'MBPS', 'FTTH', TRUE),
('MIFIBRA', 1500, 'MBPS', 'FTTH', TRUE),
('MIFIBRA', 2500, 'MBPS', 'FTTH', TRUE),
('MIFIBRA', 5000, 'MBPS', 'FTTH', TRUE);

INSERT INTO internet (velocidad, unidad, tecnologia, id_proveedor, activo)
SELECT
    s.velocidad,
    s.unidad,
    s.tecnologia,
    p.id,
    s.activo
FROM seed_internet s
JOIN proveedor p ON UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.proveedor_nombre))
WHERE NOT EXISTS (
    SELECT 1
    FROM internet i
    WHERE i.id_proveedor = p.id
      AND i.velocidad = s.velocidad
      AND i.unidad = s.unidad
      AND i.tecnologia = s.tecnologia
);

CREATE TEMP TABLE seed_television (
    proveedor_nombre TEXT,
    nombre TEXT,
    cantidad_canales INTEGER,
    activo BOOLEAN
);

INSERT INTO seed_television (proveedor_nombre, nombre, cantidad_canales, activo) VALUES
('MIFIBRA', 'TV GO + L1 MAX', 80, TRUE);

INSERT INTO television (nombre, cantidad_canales, id_proveedor, activo)
SELECT
    s.nombre,
    s.cantidad_canales,
    p.id,
    s.activo
FROM seed_television s
JOIN proveedor p ON UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.proveedor_nombre))
WHERE NOT EXISTS (
    SELECT 1
    FROM television t
    WHERE t.id_proveedor = p.id
      AND UPPER(TRIM(t.nombre)) = UPPER(TRIM(s.nombre))
      AND t.cantidad_canales = s.cantidad_canales
);

CREATE TEMP TABLE seed_plan (
    proveedor_nombre TEXT,
    nombre TEXT,
    precio NUMERIC(10,2),
    precio_promocional NUMERIC(10,2),
    meses_promocion_precio INTEGER,
    vigencia_desde DATE,
    vigencia_hasta DATE,
    internet_velocidad INTEGER,
    television_nombre TEXT,
    telefono_descripcion TEXT,
    velocidad_promocional INTEGER,
    meses_promocion_velocidad INTEGER,
    activo BOOLEAN
);

INSERT INTO seed_plan (
    proveedor_nombre,
    nombre,
    precio,
    precio_promocional,
    meses_promocion_precio,
    vigencia_desde,
    vigencia_hasta,
    internet_velocidad,
    television_nombre,
    telefono_descripcion,
    velocidad_promocional,
    meses_promocion_velocidad,
    activo
) VALUES
('MIFIBRA', 'Plan Internet', 80.00, 59.90, 4, DATE '2026-04-01', NULL, 500, NULL, NULL, 1000, 6, TRUE),
('MIFIBRA', 'Plan Internet', 99.90, 59.90, 4, DATE '2026-04-01', NULL, 1500, NULL, NULL, 2000, 6, TRUE),
('MIFIBRA', 'Plan Internet', 129.90, 69.90, 4, DATE '2026-04-01', NULL, 2500, 'TV GO + L1 MAX', NULL, 3000, 12, TRUE),
('MIFIBRA', 'Plan Internet', 189.90, 99.90, 4, DATE '2026-04-01', NULL, 5000, 'TV GO + L1 MAX', NULL, NULL, NULL, TRUE);

INSERT INTO plan (
    id_proveedor,
    nombre,
    precio,
    precio_promocional,
    meses_promocion_precio,
    vigencia_desde,
    vigencia_hasta,
    id_internet,
    id_television,
    id_telefono,
    velocidad_promocional,
    meses_promocion_velocidad,
    id_zona,
    activo
)
SELECT
    p.id,
    s.nombre,
    s.precio,
    s.precio_promocional,
    s.meses_promocion_precio,
    s.vigencia_desde,
    s.vigencia_hasta,
    i.id,
    tv.id,
    tel.id,
    s.velocidad_promocional,
    s.meses_promocion_velocidad,
    NULL,
    s.activo
FROM seed_plan s
JOIN proveedor p ON UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.proveedor_nombre))
LEFT JOIN internet i
    ON i.id_proveedor = p.id
   AND i.velocidad = s.internet_velocidad
LEFT JOIN television tv
    ON tv.id_proveedor = p.id
   AND UPPER(TRIM(tv.nombre)) = UPPER(TRIM(s.television_nombre))
LEFT JOIN telefono tel
    ON tel.id_proveedor = p.id
   AND UPPER(TRIM(tel.descripcion)) = UPPER(TRIM(s.telefono_descripcion))
WHERE NOT EXISTS (
    SELECT 1
    FROM plan pl
    WHERE pl.id_proveedor = p.id
      AND UPPER(TRIM(pl.nombre)) = UPPER(TRIM(s.nombre))
      AND pl.precio = s.precio
      AND (
            (pl.id_internet IS NULL AND s.internet_velocidad IS NULL)
            OR EXISTS (
                SELECT 1
                FROM internet ix
                WHERE ix.id = pl.id_internet
                  AND ix.velocidad = s.internet_velocidad
            )
      )
      AND (
            (pl.id_television IS NULL AND s.television_nombre IS NULL)
            OR EXISTS (
                SELECT 1
                FROM television tx
                WHERE tx.id = pl.id_television
                  AND UPPER(TRIM(tx.nombre)) = UPPER(TRIM(s.television_nombre))
            )
      )
      AND (
            (pl.id_telefono IS NULL AND s.telefono_descripcion IS NULL)
            OR EXISTS (
                SELECT 1
                FROM telefono telx
                WHERE telx.id = pl.id_telefono
                  AND UPPER(TRIM(telx.descripcion)) = UPPER(TRIM(s.telefono_descripcion))
            )
      )
);

CREATE TEMP TABLE seed_plan_adicional (
    proveedor_nombre TEXT,
    plan_nombre TEXT,
    plan_precio NUMERIC(10,2),
    internet_velocidad INTEGER,
    television_nombre TEXT,
    adicional_nombre TEXT,
    cantidad_incluida INTEGER,
    permite_compra_adicional BOOLEAN,
    cantidad_maxima_adicional INTEGER,
    activo BOOLEAN
);

INSERT INTO seed_plan_adicional (
    proveedor_nombre,
    plan_nombre,
    plan_precio,
    internet_velocidad,
    television_nombre,
    adicional_nombre,
    cantidad_incluida,
    permite_compra_adicional,
    cantidad_maxima_adicional,
    activo
) VALUES
('MIFIBRA', 'Plan Internet', 80.00, 500, NULL, 'Mesh', 1, TRUE, 3, TRUE),
('MIFIBRA', 'Plan Internet', 99.90, 1500, NULL, 'Mesh', 1, TRUE, 3, TRUE),
('MIFIBRA', 'Plan Internet', 129.90, 2500, 'TV GO + L1 MAX', 'Mesh', 1, TRUE, 3, TRUE),
('MIFIBRA', 'Plan Internet', 189.90, 5000, 'TV GO + L1 MAX', 'Mesh', 1, TRUE, 3, TRUE);

INSERT INTO plan_adicional (
    id_plan,
    id_adicional,
    cantidad_incluida,
    permite_compra_adicional,
    cantidad_maxima_adicional,
    activo
)
SELECT
    pl.id,
    a.id,
    s.cantidad_incluida,
    s.permite_compra_adicional,
    s.cantidad_maxima_adicional,
    s.activo
FROM seed_plan_adicional s
JOIN proveedor p ON UPPER(TRIM(p.nombre)) = UPPER(TRIM(s.proveedor_nombre))
JOIN adicional a
    ON a.id_proveedor = p.id
   AND UPPER(TRIM(a.nombre)) = UPPER(TRIM(s.adicional_nombre))
JOIN plan pl
    ON pl.id_proveedor = p.id
   AND UPPER(TRIM(pl.nombre)) = UPPER(TRIM(s.plan_nombre))
   AND pl.precio = s.plan_precio
LEFT JOIN internet i ON i.id = pl.id_internet
LEFT JOIN television tv ON tv.id = pl.id_television
WHERE (
        (i.id IS NULL AND s.internet_velocidad IS NULL)
        OR i.velocidad = s.internet_velocidad
      )
  AND (
        (tv.id IS NULL AND s.television_nombre IS NULL)
        OR UPPER(TRIM(tv.nombre)) = UPPER(TRIM(s.television_nombre))
      )
  AND NOT EXISTS (
        SELECT 1
        FROM plan_adicional pa
        WHERE pa.id_plan = pl.id
          AND pa.id_adicional = a.id
  );
