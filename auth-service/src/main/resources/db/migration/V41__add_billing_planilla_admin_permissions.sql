-- Permisos de Billing para administrar planillas mensuales.

INSERT INTO permisos (nombre, descripcion, recurso, accion)
VALUES
    ('READ_PLANILLAS', 'Puede consultar planillas, matriz activa y ajustes de planilla', 'PLANILLA', 'READ'),
    ('CALCULATE_PLANILLAS', 'Puede generar o recalcular planillas mensuales en revision', 'PLANILLA', 'CALCULATE'),
    ('APPROVE_PLANILLAS', 'Puede aprobar planillas mensuales', 'PLANILLA', 'APPROVE'),
    ('MANAGE_PLANILLA_MATRIX', 'Puede crear nuevas versiones de la matriz de calculo de planilla', 'PLANILLA_MATRIZ', 'MANAGE'),
    ('MANAGE_PLANILLA_ADJUSTMENTS', 'Puede registrar adelantos y bonos adicionales de planilla', 'PLANILLA_AJUSTE', 'MANAGE')
ON CONFLICT (nombre) DO UPDATE
SET descripcion = EXCLUDED.descripcion,
    recurso = EXCLUDED.recurso,
    accion = EXCLUDED.accion;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE nombre = 'ADMINISTRADOR') THEN
        RAISE EXCEPTION 'No existe el rol ADMINISTRADOR para asignar permisos de planilla';
    END IF;
END $$;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos p
WHERE r.nombre = 'ADMINISTRADOR'
  AND p.nombre IN (
      'READ_PLANILLAS',
      'CALCULATE_PLANILLAS',
      'APPROVE_PLANILLAS',
      'MANAGE_PLANILLA_MATRIX',
      'MANAGE_PLANILLA_ADJUSTMENTS'
  )
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DO $$
DECLARE
    permisos_esperados integer := 5;
    permisos_creados integer;
    permisos_asignados integer;
BEGIN
    SELECT COUNT(*)
    INTO permisos_creados
    FROM permisos
    WHERE nombre IN (
        'READ_PLANILLAS',
        'CALCULATE_PLANILLAS',
        'APPROVE_PLANILLAS',
        'MANAGE_PLANILLA_MATRIX',
        'MANAGE_PLANILLA_ADJUSTMENTS'
    );

    IF permisos_creados <> permisos_esperados THEN
        RAISE EXCEPTION 'No se crearon todos los permisos de planilla. Esperados %, encontrados %',
            permisos_esperados, permisos_creados;
    END IF;

    SELECT COUNT(*)
    INTO permisos_asignados
    FROM rol_permiso rp
    JOIN roles r ON r.id = rp.rol_id
    JOIN permisos p ON p.id = rp.permiso_id
    WHERE r.nombre = 'ADMINISTRADOR'
      AND p.nombre IN (
          'READ_PLANILLAS',
          'CALCULATE_PLANILLAS',
          'APPROVE_PLANILLAS',
          'MANAGE_PLANILLA_MATRIX',
          'MANAGE_PLANILLA_ADJUSTMENTS'
      );

    IF permisos_asignados <> permisos_esperados THEN
        RAISE EXCEPTION 'No se asignaron todos los permisos de planilla a ADMINISTRADOR. Esperados %, asignados %',
            permisos_esperados, permisos_asignados;
    END IF;
END $$;
