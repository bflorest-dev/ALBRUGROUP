CREATE EXTENSION IF NOT EXISTS dblink;

DO $$
DECLARE
    usuarios_sin_fecha INTEGER;
BEGIN
    UPDATE usuarios u
    SET fecha_ingreso_empleado = contratos.fecha_ingreso
    FROM dblink(
        'dbname=rrhh_db',
        $sql$
            SELECT empleado_id, MIN(fecha_contratacion)::date AS fecha_ingreso
            FROM contrato
            WHERE empleado_id IS NOT NULL
              AND fecha_contratacion IS NOT NULL
            GROUP BY empleado_id
        $sql$
    ) AS contratos(empleado_id BIGINT, fecha_ingreso DATE)
    WHERE u.empleado_id = contratos.empleado_id
      AND u.fecha_ingreso_empleado IS NULL;

    SELECT COUNT(DISTINCT u.id)
    INTO usuarios_sin_fecha
    FROM usuarios u
    JOIN usuario_rol ur ON ur.usuario_id = u.id
    JOIN roles r ON r.id = ur.rol_id
    JOIN rol_permiso rp ON rp.rol_id = r.id
    JOIN permisos p ON p.id = rp.permiso_id
    WHERE u.activo IS TRUE
      AND u.empleado_id IS NOT NULL
      AND u.fecha_ingreso_empleado IS NULL
      AND r.nombre <> 'ADMINISTRADOR'
      AND p.nombre IN (
          'READ_DASHBOARD_VENTA',
          'READ_DASHBOARD_FUNNEL',
          'READ_DASHBOARD_FINANCIERO',
          'READ_LEADS_DIARIOS',
          'READ_LEADS_GTR',
          'READ_LEADS_SUPERVISOR_VENTAS_RESUMEN'
      );

    IF usuarios_sin_fecha > 0 THEN
        RAISE EXCEPTION
            'Backfill incompleto: % usuarios activos con permisos de metricas no tienen fecha_ingreso_empleado',
            usuarios_sin_fecha;
    END IF;
END $$;
