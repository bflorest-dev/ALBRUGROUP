-- Fase 2 (cutover): BACKOFFICE y POSTVENTA ya NO se particionan por equipo sino por PROVEEDOR
-- (ver lead-service: tabla usuario_proveedor + proveedorFilter). Se retira su membresía de equipo.
--
-- Salvaguarda: NO se tocan usuarios que ADEMÁS tengan un rol de equipo (GTR/ventas/OJT), para no
-- romper el scope por equipo de su otro rol. Coincide con validarMembresia en EquipoService.
-- Idempotente: si ya no hay filas, no hace nada.
DELETE FROM usuario_equipo
WHERE usuario_id IN (
        SELECT ur.usuario_id
        FROM usuario_rol ur
        JOIN roles r ON r.id = ur.rol_id
        WHERE r.nombre IN ('ASESOR_BACKOFFICE', 'SUPERVISOR_BACKOFFICE', 'ASESOR_POSTVENTA', 'SUPERVISOR_POSTVENTA')
    )
  AND usuario_id NOT IN (
        SELECT ur.usuario_id
        FROM usuario_rol ur
        JOIN roles r ON r.id = ur.rol_id
        WHERE r.nombre IN ('ASESOR_GTR', 'SUPERVISOR_GTR', 'ASESOR_VENTAS', 'SUPERVISOR_VENTAS', 'OJT')
    );
