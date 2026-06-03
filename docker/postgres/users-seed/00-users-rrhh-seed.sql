CREATE TEMP TABLE seed_users (
    empleado_id BIGINT,
    usuario_id BIGINT,
    contrato_id BIGINT,
    horario_id BIGINT,
    nombres TEXT,
    apellidos TEXT,
    puesto_trabajo TEXT,
    numero_documento TEXT,
    correo_personal TEXT,
    username TEXT,
    celular_personal TEXT,
    fecha_nacimiento DATE,
    direccion TEXT,
    cuenta_bancaria TEXT,
    cuenta_interbancaria TEXT,
    hora_entrada TIME,
    hora_salida TIME,
    inicio_almuerzo TIME,
    fin_almuerzo TIME
);

\copy seed_users FROM '/seeds/users-seed.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

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
    su.empleado_id,
    su.nombres,
    su.apellidos,
    'DNI',
    su.numero_documento,
    'PERUANO',
    su.fecha_nacimiento,
    'SOLTERO',
    FALSE,
    su.celular_personal,
    su.correo_personal,
    NULL,
    NULL,
    'COMPUTRABAJO',
    'CALLAO',
    su.direccion,
    'BCP',
    su.cuenta_bancaria,
    su.cuenta_interbancaria,
    TRUE,
    NULL,
    NULL,
    1,
    'ACTIVO',
    'ALBRU',
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM seed_users su
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
    su.contrato_id,
    su.empleado_id,
    su.puesto_trabajo,
    'PLANILLA',
    'FULL_TIME',
    'ESSALUD',
    'ONP',
    1130.00,
    DATE '2026-05-01',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM seed_users su
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
