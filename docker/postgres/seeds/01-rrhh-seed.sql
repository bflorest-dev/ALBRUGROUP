INSERT INTO empresa_contratista (id, nombre, activo)
VALUES
    (1, 'Albru', TRUE),
    (2, 'Runa', TRUE)
ON CONFLICT (id) DO UPDATE
SET nombre = EXCLUDED.nombre,
    activo = EXCLUDED.activo;

SELECT setval(
    pg_get_serial_sequence('empresa_contratista', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM empresa_contratista), 1),
    TRUE
);

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
    lista_negra
)
OVERRIDING SYSTEM VALUE
VALUES (
    1,
    'Edinson',
    'Vitterio',
    'DNI',
    '75413802',
    'PERUANO',
    DATE '1999-03-06',
    'SOLTERO',
    FALSE,
    '943763301',
    'jevbxx@gmail.com',
    '943763301',
    'admin@albru.admin.pe',
    'COMPUTRABAJO',
    'CALLAO',
    'Prolongacion Centenario 07046',
    'BCP',
    '12345678901',
    '00212345678901234567',
    TRUE,
    NULL,
    NULL,
    1,
    'ACTIVO',
    'ALBRU',
    FALSE
)
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
    lista_negra = EXCLUDED.lista_negra;

SELECT setval(
    pg_get_serial_sequence('empleados', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM empleados), 1),
    TRUE
);
