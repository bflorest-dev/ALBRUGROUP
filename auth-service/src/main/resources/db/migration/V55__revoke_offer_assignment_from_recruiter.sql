-- V55: la asociacion de ofertas laborales queda reservada a SUPERVISOR_RECLUTAMIENTO.
-- RECLUTADOR conserva la gestion operativa, pero no puede modificar la oferta de una postulacion.

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'RECLUTADOR') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol RECLUTADOR';
    END IF;

    IF (SELECT COUNT(*) FROM roles WHERE nombre = 'SUPERVISOR_RECLUTAMIENTO') <> 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente un rol SUPERVISOR_RECLUTAMIENTO';
    END IF;

    IF (SELECT COUNT(*)
        FROM permisos
        WHERE nombre = 'ASSIGN_OFERTA_POSTULACION'
          AND recurso = 'POSTULACION'
          AND accion = 'ASSIGN_OFFER') <> 1 THEN
        RAISE EXCEPTION 'No se encontro el permiso canonico de asociacion de oferta';
    END IF;
END $$;

DELETE FROM rol_permiso
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'RECLUTADOR')
  AND permiso_id = (
      SELECT id
      FROM permisos
      WHERE nombre = 'ASSIGN_OFERTA_POSTULACION'
        AND recurso = 'POSTULACION'
        AND accion = 'ASSIGN_OFFER'
  );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'RECLUTADOR'
          AND p.nombre = 'ASSIGN_OFERTA_POSTULACION'
          AND p.recurso = 'POSTULACION'
          AND p.accion = 'ASSIGN_OFFER'
    ) THEN
        RAISE EXCEPTION 'RECLUTADOR conserva el permiso de asociar ofertas laborales';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM roles r
        JOIN rol_permiso rp ON rp.rol_id = r.id
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE r.nombre = 'SUPERVISOR_RECLUTAMIENTO'
          AND p.nombre = 'ASSIGN_OFERTA_POSTULACION'
          AND p.recurso = 'POSTULACION'
          AND p.accion = 'ASSIGN_OFFER'
    ) THEN
        RAISE EXCEPTION 'SUPERVISOR_RECLUTAMIENTO no tiene el permiso de asociar ofertas laborales';
    END IF;
END $$;
