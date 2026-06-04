INSERT INTO empresa_contratista (nombre, activo, created_at, updated_at)
SELECT 'Albru', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM empresa_contratista WHERE LOWER(nombre) = LOWER('Albru')
);

CREATE TEMP TABLE seed_ojt_empleados (
    empleado_id BIGINT,
    contrato_id BIGINT,
    nombres TEXT,
    apellidos TEXT,
    numero_documento TEXT,
    correo_personal TEXT,
    celular_personal TEXT,
    fecha_nacimiento DATE,
    direccion TEXT,
    cuenta_bancaria TEXT,
    cuenta_interbancaria TEXT
);

INSERT INTO seed_ojt_empleados (
    empleado_id,
    contrato_id,
    nombres,
    apellidos,
    numero_documento,
    correo_personal,
    celular_personal,
    fecha_nacimiento,
    direccion,
    cuenta_bancaria,
    cuenta_interbancaria
)
SELECT
    900000 + n,
    920000 + n,
    'OJT',
    LPAD(n::TEXT, 2, '0'),
    (70000000 + n)::TEXT,
    'OJT' || LPAD(n::TEXT, 2, '0') || '@gmail.com',
    (900000000 + n)::TEXT,
    DATE '2000-01-01' + (n - 1),
    'Direccion OJT ' || LPAD(n::TEXT, 2, '0'),
    LPAD((12345900000 + n)::TEXT, 11, '0'),
    '002' || LPAD((12345900000000000 + n)::TEXT, 17, '0')
FROM generate_series(1, 40) AS gs(n);

INSERT INTO empleados (
    id,
    nombres,
    apellidos,
    tipo_documento,
    numero_documento,
    nacionalidad,
    fecha_nacimiento,
    estado_civil,
    tiene_hijos,
    celular_personal,
    correo_personal,
    celular_corporativo,
    correo_corporativo,
    origen,
    distrito,
    direccion,
    banco,
    cuenta_bancaria,
    cuenta_interbancaria,
    cuenta_propia,
    parentesco,
    celular_transferencia,
    empresa_contratista_id,
    estado_operativo,
    compania,
    lista_negra,
    created_at,
    updated_at
)
OVERRIDING SYSTEM VALUE
SELECT
    so.empleado_id,
    so.nombres,
    so.apellidos,
    'DNI',
    so.numero_documento,
    'PERUANO',
    so.fecha_nacimiento,
    'SOLTERO',
    FALSE,
    so.celular_personal,
    so.correo_personal,
    NULL,
    NULL,
    'COMPUTRABAJO',
    'CALLAO',
    so.direccion,
    'BCP',
    so.cuenta_bancaria,
    so.cuenta_interbancaria,
    TRUE,
    NULL,
    NULL,
    ec.id,
    'ACTIVO',
    'ALBRU',
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM seed_ojt_empleados so
CROSS JOIN LATERAL (
    SELECT id
    FROM empresa_contratista
    WHERE LOWER(nombre) = LOWER('Albru')
    ORDER BY id
    LIMIT 1
) ec
ON CONFLICT (id) DO UPDATE
SET nombres = EXCLUDED.nombres,
    apellidos = EXCLUDED.apellidos,
    tipo_documento = EXCLUDED.tipo_documento,
    numero_documento = EXCLUDED.numero_documento,
    nacionalidad = EXCLUDED.nacionalidad,
    fecha_nacimiento = EXCLUDED.fecha_nacimiento,
    estado_civil = EXCLUDED.estado_civil,
    tiene_hijos = EXCLUDED.tiene_hijos,
    celular_personal = EXCLUDED.celular_personal,
    correo_personal = EXCLUDED.correo_personal,
    celular_corporativo = EXCLUDED.celular_corporativo,
    correo_corporativo = EXCLUDED.correo_corporativo,
    origen = EXCLUDED.origen,
    distrito = EXCLUDED.distrito,
    direccion = EXCLUDED.direccion,
    banco = EXCLUDED.banco,
    cuenta_bancaria = EXCLUDED.cuenta_bancaria,
    cuenta_interbancaria = EXCLUDED.cuenta_interbancaria,
    cuenta_propia = EXCLUDED.cuenta_propia,
    parentesco = EXCLUDED.parentesco,
    celular_transferencia = EXCLUDED.celular_transferencia,
    empresa_contratista_id = EXCLUDED.empresa_contratista_id,
    estado_operativo = EXCLUDED.estado_operativo,
    compania = EXCLUDED.compania,
    lista_negra = EXCLUDED.lista_negra,
    created_at = COALESCE(empleados.created_at, EXCLUDED.created_at),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO contrato (
    id,
    empleado_id,
    puesto_trabajo,
    regimen,
    modalidad,
    seguro_salud,
    sistema_pensiones,
    sueldo_base,
    fecha_contratacion,
    fecha_fin_contrato,
    created_at,
    updated_at
)
OVERRIDING SYSTEM VALUE
SELECT
    contrato_id,
    empleado_id,
    'OJT',
    'PLANILLA',
    'FULL_TIME',
    'ESSALUD',
    'ONP',
    1130.00,
    DATE '2026-06-01',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM seed_ojt_empleados
ON CONFLICT (id) DO UPDATE
SET empleado_id = EXCLUDED.empleado_id,
    puesto_trabajo = EXCLUDED.puesto_trabajo,
    regimen = EXCLUDED.regimen,
    modalidad = EXCLUDED.modalidad,
    seguro_salud = EXCLUDED.seguro_salud,
    sistema_pensiones = EXCLUDED.sistema_pensiones,
    sueldo_base = EXCLUDED.sueldo_base,
    fecha_contratacion = EXCLUDED.fecha_contratacion,
    fecha_fin_contrato = EXCLUDED.fecha_fin_contrato,
    created_at = COALESCE(contrato.created_at, EXCLUDED.created_at),
    updated_at = CURRENT_TIMESTAMP;

SELECT setval(
    pg_get_serial_sequence('empleados', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM empleados), 1),
    TRUE
);

SELECT setval(
    pg_get_serial_sequence('contrato', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM contrato), 1),
    TRUE
);
